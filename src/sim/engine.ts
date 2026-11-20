import {idle} from './types.js'
import type {Controls,DrifterState,Entity,GameEvent,Lantern,Night,Player,Pos,Scenario,ShadeState,Tuning} from './types.js'
import {maps,distance,direction,ground,slide} from './maps.js'
import {mulberry32} from './rng.js'
const order=new Intl.Collator('en',{numeric:true})
const round=(v:number)=>Math.round(v*1000)/1000||0
const coords=(p:Pos)=>p.map(round)
const clone=(p:Pos):Pos=>[...p]
type Mote=Entity & {kind:'random'|'dropped',expires:number}
type Shade=Entity & {state:ShadeState,until:number,push:number,dir:[number,number]}
type Drifter=Entity & {state:DrifterState,until:number,stolen:number}
export class Game{
  tick=0; simTick=0; score=0
  state:'playing'|'paused'|'won'|'lost'='playing'
  events:GameEvent[]=[]
  player:Player; lanterns:Lantern[]; motes:Mote[]=[]; shades:Shade[]=[]; drifters:Drifter[]=[]
  charms:(Entity & {ready:number})[]
  map; wind={active:false,dir_deg:0}; windWarning=false
  vel:Pos=[0,0,0]; grounded=false; facing:[number,number]=[0,1]
  invuln=0; dashCd=0; pulseCd=0; charmTicks=0; dashLeft=0; fallWait=0; jumped=false
  private prior=idle(); private random; private duration
  private suspendedY:number|null=null
  private excluded=new Set<Shade>()
  private dashDir:[number,number]=[0,1]; private launched:Pos|null=null
  private ids={M:0,S:0,D:0}
  constructor(readonly t:Tuning,seed=42,private scenario:Scenario={},readonly night:Night=1){
    this.map=maps[night];this.random=mulberry32(seed)
    this.duration=scenario.time_left_s??t[`night${night}_duration_s`]
    const p=scenario.player
    this.player={pos:clone(p?.pos??this.map.spawn),flames:p?.flames??t.flames,carried:p?.carried??0}
    const [x,y,z]=this.player.pos
    this.grounded=Math.abs(y-ground(night,x,z))<1e-6
    this.invuln=p?.invuln_ticks??0;this.dashCd=p?.dash_cd_ticks??0;this.pulseCd=p?.pulse_cd_ticks??0;this.charmTicks=p?.charm_ticks??0
    this.lanterns=this.map.lamps.map((pos,i)=>{
      const id='L'+(i+1),l=scenario.lanterns?.find(l=>l.id===id),lit=!!l?.lit||l?.deposited===t.lantern_cost
      return {id,pos:clone(l?.pos??pos),lit,deposited:lit?t.lantern_cost:l?.deposited??0}
    })
    for(const pos of scenario.motes??[])this.mote(pos)
    if(!scenario.motes&&scenario.random_motes!==false)for(let i=0;i<20;i++)this.spawnMote()
    for(const s of scenario.shades??[])this.shades.push({id:s.id??this.id('S'),pos:clone(s.pos),state:s.state??'wander',until:s.state_ticks_left??0,push:0,dir:[1,0]})
    for(const d of scenario.drifters??[])this.drifters.push({id:d.id??this.id('D'),pos:clone(d.pos),state:d.state??'idle',until:d.state_ticks_left??240,stolen:d.stolen??0})
    this.charms=(scenario.charms??this.map.charms.map((pos,i)=>({id:'C'+(i+1),pos}))).map(c=>{
      const def=this.map.charms[Number(c.id.slice(1))-1]
      return {id:c.id,pos:clone(c.pos??def),ready:'available' in c && c.available===false?(c.respawn_ticks??Math.round((c.respawn_s??45)*60)):0}
    })
    this.emit('night_start',{night})
  }
  get timeLeft(){return Math.max(0,round(this.duration-this.simTick/60))}
  private id(prefix:'S'|'D'|'M'){
    let id:string
    const reserved=prefix==='S'?this.scenario.shades:prefix==='D'?this.scenario.drifters:[]
    do{id=prefix+(++this.ids[prefix])}while(reserved?.some(e=>e.id===id))
    return id
  }
  private emit(name:string,data:Record<string,unknown>={}){this.events.push({type:'event',tick:this.tick,name,data})}
  private pick<T>(list:T[]){return list[Math.floor(this.random()*list.length)]}
  private mote(pos:Pos,dropped=false){this.motes.push({id:this.id('M'),pos:clone(pos),kind:dropped?'dropped':'random',expires:dropped?this.simTick+480:Infinity})}
  private spawnMote(){
    if(this.motes.length>=30)return
    const pos=this.pick(this.map.motes.filter(p=>!this.motes.some(m=>distance(m.pos,p)<.001)))
    if(pos)this.mote(pos)
  }
  private drops(center:Pos,n:number){
    for(let i=0;i<n;i++){
      const a=this.random()*2*Math.PI,r=1.5+this.random(),x=center[0]+r*Math.cos(a),z=center[2]+r*Math.sin(a),h=ground(this.night,x,z)
      this.mote([x,Number.isFinite(h)?h:center[1],z],true)
    }
  }
  nearestLamp(){
    const p=this.player.pos
    return this.lanterns.filter(l=>!l.lit).sort((a,b)=>distance(a.pos,p)-distance(b.pos,p)||a.id.localeCompare(b.id))[0]
  }
  interactLamp(){
    const p=this.player.pos
    return this.lanterns.filter(l=>!l.lit&&Math.abs(l.pos[1]-p[1])<=1.5&&distance(l.pos,p)<=this.t.interact_radius)
      .sort((a,b)=>distance(a.pos,p)-distance(b.pos,p)||a.id.localeCompare(b.id))[0]
  }
  private move(input:Controls,jump:boolean,dash:boolean){
    const {pos}=this.player
    if(!this.dashLeft&&this.suspendedY!==null){this.vel[1]=this.suspendedY;this.suspendedY=null}
    const [mx,mz]=input.move,a=input.cam_yaw_deg*Math.PI/180,len=Math.hypot(mx,mz)
    if(len)this.facing=[(mx*Math.cos(a)+mz*Math.sin(a))/len,(mz*Math.cos(a)-mx*Math.sin(a))/len]
    const pad=this.grounded&&this.map.pads.find(p=>distance(p.pos,pos)<=1&&Math.abs(p.pos[1]-pos[1])<.05)
    if(pad){this.launched=pad.velocity;this.vel[1]=pad.velocity[1];this.grounded=false}
    else if(jump&&this.grounded){this.vel[1]=7;this.grounded=false;this.jumped=true}
    if(dash&&!this.dashLeft&&(!this.dashCd||this.charmTicks)){
      this.suspendedY=this.vel[1];this.dashLeft=12;this.dashCd=90;this.dashDir=[...this.facing];this.emit('dash')
    }
    const speed=(this.charmTicks?7.2:this.t.player_speed)*Math.min(1,len)
    const dashing=this.dashLeft>0
    this.vel[0]=dashing?this.t.dash_speed*this.dashDir[0]:this.launched?.[0]??speed*this.facing[0]
    this.vel[2]=dashing?this.t.dash_speed*this.dashDir[1]:this.launched?.[2]??speed*this.facing[1]
    if(this.wind.active){const w=this.wind.dir_deg*Math.PI/180;this.vel[0]+=2*Math.cos(w);this.vel[2]+=2*Math.sin(w)}
    slide(this.night,pos,this.vel[0]/60,this.vel[2]/60)
    const h=ground(this.night,pos[0],pos[2])
    if(dashing){this.dashLeft--;this.vel[1]=0;this.grounded=Math.abs(pos[1]-h)<1e-6}
    else{
      this.vel[1]-=20/60
      pos[1]+=this.vel[1]/60
      if(pos[1]<=h || (this.grounded&&pos[1]-h<.15)){
        pos[1]=h;this.vel[1]=0;this.grounded=true;this.launched=null
      }else this.grounded=false
    }
    if(pos[1]<-10){
      const lost=this.player.carried
      this.player.carried=0;this.player.flames--;this.fallWait=60;this.suspendedY=null;this.dashLeft=0;this.launched=null
      this.emit('player_hit',{by:'fall',flames:this.player.flames,dropped:0,lost})
    }
  }
  private pickups(interact:boolean){
    const {player:p,t}=this
    const near=(pos:Pos)=>distance(pos,p.pos)<=t.pickup_radius&&Math.abs(pos[1]-p.pos[1])<=1.5
    this.motes=this.motes.filter(m=>{
      if(p.carried>=t.carry_capacity||!near(m.pos))return true
      this.emit('mote_picked',{carried:++p.carried});return false
    })
    for(const c of this.charms)if(c.ready<=this.simTick&&near(c.pos)){
      c.ready=this.simTick+2700;this.charmTicks=600;this.emit('charm_picked',{charm_id:c.id,charm_ticks:600})
    }
    const l=interact&&p.carried&&this.interactLamp()
    if(l){
      const amount=Math.min(p.carried,t.lantern_cost-l.deposited)
      p.carried-=amount;l.deposited+=amount;this.score+=amount*t.score.per_mote
      this.emit('deposit',{lantern_id:l.id,amount,deposited:l.deposited})
      if(l.deposited===t.lantern_cost){l.lit=true;this.score+=t.score.per_lantern;this.emit('lantern_lit',{lantern_id:l.id})}
    }
  }
  private protect(s:Shade){
    for(const l of this.lanterns)if(l.lit&&distance(s.pos,l.pos)<this.t.safe_radius){
      this.excluded.add(s)
      const [x,z]=direction(l.pos,s.pos)
      s.pos[0]=l.pos[0]+this.t.safe_radius*x;s.pos[2]=l.pos[2]+this.t.safe_radius*z
    }
  }
  private pulse(){
    const {player:p,t}=this
    if(p.carried<t.pulse_cost||this.pulseCd)return
    p.carried-=t.pulse_cost;this.pulseCd=t.pulse_cooldown_s*60
    const near=(e:Entity)=>Math.hypot(e.pos[0]-p.pos[0],e.pos[1]-p.pos[1]-.8,e.pos[2]-p.pos[2])<=t.pulse_radius
    const targets=this.shades.filter(near)
    for(const s of targets){s.state='stunned';s.until=this.simTick+120;s.push=15;s.dir=direction(p.pos,s.pos)}
    this.score+=targets.length*t.score.per_stun;this.emit('pulse',{stunned_ids:targets.map(s=>s.id)})
    for(const d of this.drifters.filter(near)){
      if(d.state==='chase'){d.state='flee';d.until=this.simTick+240}
      else if(d.state==='flee'&&d.stolen){this.drops(d.pos,d.stolen);this.emit('drifter_drop',{drifter_id:d.id,amount:d.stolen});d.stolen=0;d.until=this.simTick+120}
    }
  }
  private enemies(){
    const p=this.player.pos
    for(const s of this.shades){
      const d=distance(p,s.pos)
      if(s.state==='wander'&&d<=12)s.state='chase'
      else if(s.state==='chase'&&d>18)s.state='wander'
      let speed=0,dir=s.dir
      if(s.state==='stunned'&&s.push>0){speed=4*60/15;s.push--}
      if(s.state==='recoil')speed=2
      if(s.state==='wander'){speed=1;dir=[Math.cos(this.simTick/180),Math.sin(this.simTick/180)]}
      if(s.state==='chase'){speed=Math.min(d*60,this.night===3?4.5:this.t.shade_speed);dir=direction(s.pos,p)}
      const dx=dir[0]*speed/60,dz=dir[1]*speed/60
      const old=ground(this.night,s.pos[0],s.pos[2]),h=ground(this.night,s.pos[0]+dx,s.pos[2]+dz)
      if(Number.isFinite(h)){slide(this.night,s.pos,dx,dz);const next=ground(this.night,s.pos[0],s.pos[2]);if(Number.isFinite(old))s.pos[1]+=next-old}
      this.protect(s)
    }
    for(const d of this.drifters){
      const range=distance(d.pos,p)
      if(d.state!=='flee')d.state=this.player.carried>=5&&range<=15?'chase':'idle'
      const dir=d.state==='idle'?[Math.cos(this.simTick/60),Math.sin(this.simTick/60)]:d.state==='flee'?direction(p,d.pos):direction(d.pos,p)
      const speed=d.state==='idle'?2:7
      d.pos[0]+=dir[0]*speed/60;d.pos[2]+=dir[1]*speed/60
    }
  }
  private contacts(){
    const p=this.player
    for(const d of this.drifters)if(d.state!=='flee'&&distance(d.pos,p.pos)<=1.2&&p.carried){
      d.stolen=Math.min(3,p.carried);p.carried-=d.stolen;d.state='flee';d.until=this.simTick+240
      this.emit('drifter_steal',{drifter_id:d.id,amount:d.stolen,carried:p.carried})
    }
    if(this.invuln||this.lanterns.some(l=>l.lit&&distance(l.pos,p.pos)<=this.t.safe_radius))return
    for(const s of this.shades)if(!this.excluded.has(s)&&(s.state==='chase'||s.state==='wander')&&distance(s.pos,p.pos)<=this.t.shade_hit_radius&&Math.abs(s.pos[1]-p.pos[1])<=1.5){
      const dropped=Math.floor(p.carried*this.t.hit_drop_ratio)
      p.flames--;p.carried-=dropped;this.drops(p.pos,dropped);this.invuln=90
      s.state='recoil';s.dir=direction(p.pos,s.pos);s.until=this.simTick+61
      this.emit('player_hit',{by:'shade',flames:p.flames,dropped});break
    }
  }
  private spawn(){
    const k=this.simTick
    if(this.scenario.random_motes!==false&&k%240===0)this.spawnMote()
    if(this.scenario.random_shades!==false&&k>=300&&(k-300)%this.map.interval===0){
      for(let i=0;i<(k===300?2:1)&&this.shades.length<this.map.limit;i++){
        const pos=this.pick(this.map.mist.filter(p=>distance(p,this.player.pos)>=15&&!this.shades.some(s=>distance(s.pos,p)<1)))
        if(!pos)break
        const id=this.id('S')
        this.shades.push({id,pos:[pos[0],pos[1]+.8,pos[2]],state:'spawning',until:k+1,push:0,dir:[1,0]})
        this.emit('shade_spawned',{id})
      }
    }
    if(this.night>1&&this.scenario.random_drifters!==false&&k%1200===0&&this.drifters.length<2){
      const p=this.pick(this.map.mist)
      this.drifters.push({id:this.id('D'),pos:[p[0],p[1]+.8,p[2]],state:'idle',until:0,stolen:0})
    }
  }
  releaseControls(){this.prior=idle()}
  step(frame:Partial<Controls>={}){
    this.events=[];this.jumped=false;this.excluded.clear()
    if(this.state==='won'||this.state==='lost')return
    this.tick++
    const input={...this.prior,...frame},prev=this.prior
    this.prior=input
    const edge=(k:'pause'|'jump'|'dash'|'pulse'|'interact')=>input[k]&&!prev[k]
    if(edge('pause')){this.state=this.state==='paused'?'playing':'paused';this.emit(this.state==='paused'?'paused':'resumed')}
    if(this.state==='paused')return
    this.simTick++
    this.invuln=Math.max(0,this.invuln-1);this.dashCd=Math.max(0,this.dashCd-1);this.pulseCd=Math.max(0,this.pulseCd-1);this.charmTicks=Math.max(0,this.charmTicks-1)
    this.motes=this.motes.filter(m=>m.expires>this.simTick)
    this.drifters=this.drifters.filter(d=>d.state!=='removed'&&(d.state!=='flee'||d.until>this.simTick))
    for(const s of this.shades)if(!['wander','chase'].includes(s.state)&&s.until<=this.simTick)s.state='wander'
    const cycle=this.simTick%1800
    if(this.night===3&&this.scenario.wind_enabled!==false){
      this.windWarning=cycle>=1680
      if(cycle===1680)this.wind.dir_deg=Math.floor(this.random()*360)
      this.wind.active=this.simTick>=1800&&cycle<300
    }
    if(this.fallWait){
      if(--this.fallWait===0){this.player.pos=clone(this.map.spawn);this.vel=[0,0,0];this.grounded=true;this.invuln=90}
    }else this.move(input,edge('jump'),edge('dash'))
    if(!this.fallWait)this.pickups(edge('interact'))
    for(const s of this.shades)this.protect(s)
    if(!this.fallWait&&edge('pulse'))this.pulse()
    this.enemies()
    const compare=(a:Entity,b:Entity)=>order.compare(a.id,b.id)
    this.shades.sort(compare);this.drifters.sort(compare)
    if(!this.fallWait)this.contacts()
    this.spawn()
    const reason=this.player.flames<=0?'no_flames':this.lanterns.every(l=>l.lit)?'all_lit':this.timeLeft<=0?'dawn':null
    if(reason){
      this.state=reason==='all_lit'?'won':'lost'
      if(this.state==='won')this.score+=Math.floor(this.timeLeft)*this.t.score.per_second_left+this.player.flames*this.t.score.per_flame_left
      this.emit('game_over',{result:this.state,reason})
    }
  }
  snapshot(){
    const entity=(e:Entity)=>({id:e.id,pos:coords(e.pos)})
    return {type:'snapshot',tick:this.tick,sim_tick:this.simTick,night:this.night,state:this.state,time_left_s:this.timeLeft,score:this.score,wind:{...this.wind},
      player:{...this.player,pos:coords(this.player.pos),vel:coords(this.vel),grounded:this.grounded,invuln:this.invuln>0,dash_cd_s:this.charmTicks?0:round(this.dashCd/60),pulse_cd_s:round(this.pulseCd/60),charm_s:round(this.charmTicks/60)},
      lanterns:this.lanterns.map(l=>({...l,...entity(l)})),motes_active:this.motes.length,
      motes:this.motes.map(m=>({...entity(m),kind:m.kind,ttl_s:m.kind==='random'?null:round((m.expires-this.simTick)/60)})),
      shades:this.shades.map(s=>({...entity(s),state:s.state})),drifters:this.drifters.map(d=>({...entity(d),state:d.state,stolen:d.stolen})),
      charms:this.charms.map(c=>({id:c.id,available:c.ready<=this.simTick,respawn_s:round(Math.max(0,c.ready-this.simTick)/60)}))}
  }
}
