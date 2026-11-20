import {it,expect,afterAll} from 'vitest'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,existsSync,readFileSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
const dir=mkdtempSync(join(tmpdir(),'three-nights-'))
afterAll(()=>rmSync(dir,{recursive:true,force:true}))
function replay(name:string,night:number,ticks:number,every=1){
  const path='tests/scenarios/'+name,out=join(dir,'out.jsonl')
  const args=['dist-sim/headless.js','--seed','42','--night',String(night),'--scenario',path+'.json','--ticks',String(ticks),'--snapshot-every',String(every),'--out',out]
  if(existsSync(path+'-inputs.json'))args.push('--inputs',path+'-inputs.json')
  const result=spawnSync(process.execPath,args,{encoding:'utf8'})
  expect(result.stderr).toBe('');expect(result.status).toBe(0)
  const rows=readFileSync(out,'utf8').trim().split('\n').map(s=>JSON.parse(s))
  return {at:(k:number)=>rows.find(r=>r.type==='snapshot'&&r.tick===k),events:(name:string)=>rows.filter(r=>r.name===name),end:rows.at(-1)}
}
it('dash lasts 12 steps, cooldown starts on activation and midair height is fixed',()=>{
  const ground=replay('dash',1,104)
  expect(ground.events('dash').map(e=>e.tick)).toEqual([1,92])
  expect(ground.at(12).player.pos).toEqual([0,0,2.8])
  expect(ground.at(13).player.pos).toEqual([0,0,2.8])
  const air=replay('air-dash',1,13)
  expect(air.at(12).player.pos[1]).toBe(3)
  expect(air.at(13).player.pos[1]).toBeLessThan(3)
})
it('fall bypasses invulnerability, costs all motes and respawns after 60 steps',()=>{
  const r=replay('fall',1,64),hit=r.events('player_hit')
  expect(hit).toHaveLength(1)
  expect(hit[0].data).toEqual({by:'fall',flames:2,lost:8,dropped:0})
  expect(r.at(hit[0].tick+60).player).toMatchObject({pos:[0,0,0],vel:[0,0,0],invuln:true})
})
it('freezes simulation time while paused and resumes on a fresh press',()=>{
  const r=replay('pause',1,34)
  expect(r.at(32)).toMatchObject({state:'paused',sim_tick:1,time_left_s:r.at(1).time_left_s})
  expect(r.at(33).sim_tick).toBe(2)
  expect(r.events('paused')).toHaveLength(1);expect(r.events('resumed')).toHaveLength(1)
})
it('crosses the bridge and launches to the second island',()=>{
  expect(replay('night2-bridge',2,200).at(200).player.pos).toEqual([48.4,0,0])
  const r=replay('night2-pad',2,90)
  expect(r.at(20).player.pos[1]).toBeGreaterThan(3)
  expect(r.at(90).player.grounded).toBe(true);expect(r.at(90).player.pos[0]).toBeGreaterThan(45)
})
it('resolves charm, theft and pulse drop in order; charm permits a second dash',()=>{
  const r=replay('night2-drifter-charm',2,124)
  expect(r.at(1).player.charm_s).toBe(10)
  expect(r.at(1).charms[0]).toMatchObject({available:false,respawn_s:45})
  expect(r.events('drifter_steal')[0].data.amount).toBe(3)
  expect(r.events('drifter_drop')[0].data.amount).toBe(3)
  expect(r.at(2).motes.filter((m:{kind:string})=>m.kind==='dropped')).toHaveLength(3)
  expect(r.at(122).drifters).toHaveLength(0)
  expect(r.events('dash').map(e=>e.tick)).toEqual([2,14])
})
it('uses ramp, jump pad, tower collision and timed wind on night three',()=>{
  expect(replay('night3-ramp',3,65).at(65).player.pos[1]).toBe(3)
  const p=replay('night3-pad',3,85).at(85).player
  expect(p.pos[1]).toBe(6);expect(p.pos[2]).toBeGreaterThanOrEqual(2)
  const r=replay('night3-wind',3,2100,100)
  expect(r.at(1800).wind.active).toBe(true);expect(r.at(2100).wind.active).toBe(false)
  expect(Math.hypot(r.at(2100).player.pos[0]-34,r.at(2100).player.pos[2])).toBeCloseTo(10,2)
})
it('finishes the full 21600-tick CLI benchmark within 30 seconds',()=>{
  const start=performance.now()
  expect(replay('perf',3,21600,60).end).toMatchObject({ticks:21600,state:'lost'})
  expect(performance.now()-start).toBeLessThan(30000)
},31000)
