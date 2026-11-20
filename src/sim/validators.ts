import type {Frame,Night,Scenario,Tuning} from './types.js'
function check(ok:unknown,label:string):asserts ok {
  if(!ok) throw new Error('Invalid '+label)
}
const finite=(x:unknown):x is number=>typeof x==='number' && Number.isFinite(x)
const count=(x:unknown,max=Number.MAX_SAFE_INTEGER)=>finite(x)&&Number.isSafeInteger(x)&&x>=0&&x<=max
const vector=(x:unknown,n:number)=>Array.isArray(x)&&x.length===n&&x.every(finite)
function object(x:unknown,keys:string[]):asserts x is Record<string,unknown>{
  check(x && typeof x==='object' && !Array.isArray(x) && Object.keys(x).every(k=>keys.includes(k)),'object fields')
}
export function inputs(x:unknown):Frame[]{
  object(x,['frames'])
  check(Array.isArray(x.frames),'frames')
  let last=-1
  for(const f of x.frames){
    object(f,['tick','move','cam_yaw_deg','pulse','jump','interact','dash','pause'])
    check(count(f.tick)&&Number(f.tick)>last,'tick order')
    last=Number(f.tick)
    if('move' in f) check(vector(f.move,2)&&(f.move as number[]).every(n=>Math.abs(n)<=1),'move')
    if('cam_yaw_deg' in f) check(finite(f.cam_yaw_deg),'yaw')
    for(const k of ['pulse','jump','interact','dash','pause']) if(k in f) check(typeof f[k]==='boolean',k)
  }
  return x.frames as Frame[]
}
export function scenario(x:unknown,t:Tuning,night:Night=1):Scenario{
  object(x,['player','lanterns','motes','shades','random_shades','random_motes','time_left_s','drifters','charms','random_drifters','wind_enabled'])
  for(const k of ['random_shades','random_motes','random_drifters','wind_enabled']) if(k in x) check(typeof x[k]==='boolean',k)
  if('time_left_s' in x) check(finite(x.time_left_s)&&x.time_left_s>=0,'time_left_s')
  if('player' in x){
    const p=x.player
    const timers=['invuln_ticks','dash_cd_ticks','pulse_cd_ticks','charm_ticks']
    object(p,['pos','flames','carried',...timers])
    for(const k of timers) if(k in p) check(count(p[k]),k)
    if('pos' in p) check(vector(p.pos,3),'player.pos')
    if('carried' in p) check(count(p.carried,t.carry_capacity),'carried')
    if('flames' in p) check(count(p.flames,t.flames),'flames')
  }
  if('motes' in x) check(Array.isArray(x.motes)&&x.motes.every(p=>vector(p,3)),'motes')
  for(const k of ['shades','lanterns','drifters','charms']){
    if(!(k in x)) continue
    const list=x[k], ids=new Set<string>()
    check(Array.isArray(list),k)
    for(const e of list){
      const fields:Record<string,string[]>={shades:['state','state_ticks_left'],drifters:['state','state_ticks_left','stolen'],lanterns:['deposited','lit'],charms:['available','respawn_ticks','respawn_s']}
      object(e,['id','pos',...fields[k]])
      if('state' in e) check((k==='shades'?['spawning','wander','chase','recoil','stunned']:['idle','chase','flee','removed']).includes(String(e.state)),'state')
      for(const key of ['state_ticks_left','respawn_ticks','stolen'])if(key in e)check(count(e[key]),key)
      if('available' in e)check(typeof e.available==='boolean','available')
      if('respawn_s' in e)check(finite(e.respawn_s)&&e.respawn_s>=0,'respawn_s')
      if(k==='charms')check(typeof e.id==='string' && (vector(e.pos,3)||['C1','C2'].slice(0,night-1).includes(e.id)),'charm position')
      if('pos' in e || k==='shades'||k==='drifters') check(vector(e.pos,3),k+'.pos')
      if('id' in e || k==='lanterns'){
        check(typeof e.id==='string' && e.id.length && !ids.has(e.id),k+'.id')
        ids.add(e.id)
      }
      if(k==='lanterns'){
        check(/^L[1-7]$/.test(String(e.id))&&Number(String(e.id).slice(1))<=night+4,'lantern id')
        if('lit' in e) check(typeof e.lit==='boolean','lit')
        if('deposited' in e) check(count(e.deposited,t.lantern_cost),'deposited')
      }
    }
  }
  return x as Scenario
}
