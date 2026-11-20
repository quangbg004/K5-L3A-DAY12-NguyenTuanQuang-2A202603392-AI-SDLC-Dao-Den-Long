import {idle} from './types.js'
import type {Controls, Entity, GameEvent, Lantern, Player, Pos, Scenario, Tuning} from './types.js'
import {mulberry32} from './rng.js'

const distance = (a:Pos,b:Pos) => Math.hypot(a[0]-b[0],a[2]-b[2])
const round = (v:number) => Math.round(v*1000)/1000 || 0
const position = (pos:Pos) => pos.map(round)
function away(pos:Pos, center:Pos, radius:number) {
  const d = distance(pos,center)
  pos[0] = center[0] + radius*(d ? (pos[0]-center[0])/d : 1)
  pos[2] = center[2] + radius*(d ? (pos[2]-center[2])/d : 0)
}
export class Game {
  tick = 0
  score = 0
  state:'playing'|'won'|'lost' = 'playing'
  readonly player:Player
  readonly lanterns:Lantern[]
  motes:Entity[] = []
  shades:(Entity & {until:number,state:string})[] = []
  events:GameEvent[] = []
  private previous = idle()
  private velocity = 0
  private hurtUntil = 0
  private pulseUntil = 0
  private moteId = 0
  private shadeId = 0
  private random:()=>number
  private duration:number
  constructor(readonly t:Tuning, seed=42, private scenario:Scenario={}) {
    this.random = mulberry32(seed)
    this.duration = scenario.time_left_s ?? t.night1_duration_s
    const p = scenario.player
    this.player = {pos:[...(p?.pos ?? [0,0,0] as Pos)], flames:p?.flames ?? t.flames, carried:p?.carried ?? 0}
    this.lanterns = Array.from({length:t.lantern_count_night1},(_,i)=>{
      const angle = 2*Math.PI*i/t.lantern_count_night1
      const id = 'L'+(i+1)
      const l = scenario.lanterns?.find(item=>item.id===id)
      const lit = l?.lit === true || l?.deposited === t.lantern_cost
      return {id,pos:l?.pos ?? [22*Math.cos(angle),0,22*Math.sin(angle)],lit,deposited:lit?t.lantern_cost:l?.deposited??0}
    })
    for (const pos of scenario.motes ?? []) this.addMote([...pos])
    if (!scenario.motes && scenario.random_motes!==false)
      for (let i=0;i<20;i++) this.addMote(this.randomPos())
    for (const s of scenario.shades ?? []) this.addShade([...s.pos],s.id)
    if (!scenario.shades && scenario.random_shades!==false)
      for (let i=0;i<2;i++) this.addShade(this.randomPos(32))
  }
  get timeLeft(){return Math.max(0,round(this.duration-this.tick/60))}
  private randomPos(radius?:number):Pos {
    const a = this.random()*Math.PI*2
    const r = radius ?? 33*Math.sqrt(this.random())
    return [r*Math.cos(a),0,r*Math.sin(a)]
  }
  private addMote(pos:Pos){this.motes.push({id:'M'+ ++this.moteId,pos})}
  private addShade(pos:Pos,id?:string){
    while(!id){
      const next='S'+ ++this.shadeId
      if(!this.scenario.shades?.some(s=>s.id===next)) id=next
    }
    this.shades.push({id,pos,state:'chase',until:0})
    return id
  }
  private emit(name:string,data:Record<string,unknown>){this.events.push({type:'event',tick:this.tick,name,data})}
  step(frame:Partial<Controls>={}) {
    this.events=[]
    if(this.state!=='playing') return
    this.tick++
    const input={...this.previous,...frame}
    const edge=(key:'pulse'|'jump'|'interact')=>input[key]&&!this.previous[key]
    const {player:p,t}=this
    const [x,z]=input.move, a=input.cam_yaw_deg*Math.PI/180
    const stride=t.player_speed/60/Math.max(1,Math.hypot(x,z))
    p.pos[0]+=(x*Math.cos(a)+z*Math.sin(a))*stride
    p.pos[2]+=(z*Math.cos(a)-x*Math.sin(a))*stride
    if(distance(p.pos,[0,0,0])>36) away(p.pos,[0,0,0],36)
    if(edge('jump') && p.pos[1]===0) this.velocity=7
    this.velocity-=18/60
    p.pos[1]=Math.max(0,p.pos[1]+this.velocity/60)
    if(p.pos[1]===0) this.velocity=0
    this.motes=this.motes.filter(m=>{
      if(p.carried>=t.carry_capacity || distance(m.pos,p.pos)>t.pickup_radius) return true
      this.score+=t.score.per_mote
      this.emit('mote_picked',{carried:++p.carried})
      return false
    })
    if(edge('interact') && p.carried){
      const lamp=this.lanterns.filter(l=>!l.lit && distance(l.pos,p.pos)<=t.interact_radius)
        .sort((l,r)=>distance(l.pos,p.pos)-distance(r.pos,p.pos))[0]
      if(lamp){
        const amount=Math.min(p.carried,t.lantern_cost-lamp.deposited)
        p.carried-=amount
        lamp.deposited+=amount
        this.emit('deposit',{lantern_id:lamp.id,amount,deposited:lamp.deposited})
        if(lamp.deposited===t.lantern_cost){
          lamp.lit=true
          this.score+=t.score.per_lantern
          this.emit('lantern_lit',{lantern_id:lamp.id})
        }
      }
    }
    if(edge('pulse') && this.tick>=this.pulseUntil && p.carried>=t.pulse_cost){
      const ids:string[]=[]
      p.carried-=t.pulse_cost
      this.pulseUntil=this.tick+60*t.pulse_cooldown_s
      for(const s of this.shades){
        const d=distance(s.pos,p.pos)
        if(d>t.pulse_radius) continue
        s.until=this.tick+60*t.pulse_stun_s
        away(s.pos,p.pos,d+t.pulse_push_m)
        ids.push(s.id)
      }
      this.score+=ids.length*t.score.per_stun
      this.emit('pulse',{stunned_ids:ids})
    }
    this.updateShades()
    if(this.scenario.random_motes!==false && this.tick%120===0 && this.motes.length<20) this.addMote(this.randomPos())
    if(this.scenario.random_shades!==false && this.tick%1500===0 && this.shades.length<5)
      this.emit('shade_spawned',{id:this.addShade(this.randomPos(32))})
    this.previous=input
    const won=this.lanterns.every(l=>l.lit)
    if(won || p.flames<=0 || this.timeLeft<=0){
      this.state=won?'won':'lost'
      if(won) this.score+=Math.floor(this.timeLeft)*t.score.per_second_left+p.flames*t.score.per_flame_left
      this.emit('game_over',{result:this.state,reason:won?'all_lit':p.flames<=0?'no_flames':'dawn'})
    }
  }
  private updateShades(){
    const {player:p,t}=this
    const safe=this.lanterns.filter(l=>l.lit)
    for(const s of this.shades){
      s.state=this.tick<s.until?'stunned':'chase'
      const d=distance(s.pos,p.pos)
      if(s.state==='chase' && d>0) away(s.pos,p.pos,Math.max(0,d-t.shade_speed/60))
      for(const lamp of safe)
        if(distance(s.pos,lamp.pos)<=t.safe_radius) away(s.pos,lamp.pos,t.safe_radius+0.001)
      if(s.state==='stunned'||this.tick<this.hurtUntil||distance(s.pos,p.pos)>t.shade_hit_radius||
        safe.some(l=>distance(l.pos,p.pos)<=t.safe_radius)) continue
      this.hurtUntil=this.tick+t.invuln_s*60
      const dropped=Math.floor(p.carried*t.hit_drop_ratio)
      p.carried-=dropped
      p.flames--
      for(let i=0;i<dropped;i++){
        const pos:Pos=[...s.pos]
        away(pos,p.pos,t.pickup_radius+1+i*0.3)
        this.addMote(pos)
      }
      this.emit('player_hit',{by:'shade',flames:p.flames,dropped})
    }
  }
  snapshot(){
    const entity=(e:Entity)=>({id:e.id,pos:position(e.pos)})
    return {type:'snapshot',tick:this.tick,sim_tick:this.tick,state:this.state,time_left_s:this.timeLeft,score:this.score,
      player:{...this.player,pos:position(this.player.pos)},lanterns:this.lanterns.map(l=>({...l,...entity(l)})),
      shades:this.shades.map(s=>({...entity(s),state:s.state})),motes_active:this.motes.length,motes:this.motes.map(entity)}
  }
}
