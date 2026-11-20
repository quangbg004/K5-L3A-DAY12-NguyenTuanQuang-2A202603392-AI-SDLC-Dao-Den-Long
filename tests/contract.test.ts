import {expect,it,afterAll} from 'vitest'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const dir=mkdtempSync(join(tmpdir(),'lantern-'))
afterAll(()=>rmSync(dir,{recursive:true,force:true}))
function run(args:string[]){
  return spawnSync(process.execPath,['dist-sim/headless.js','--seed','42','--night','1','--out',join(dir,'result'),...args],{encoding:'utf8'})
}
const scenarios=[
  ['pickup',1,Array(10).fill('mote_picked'),0],
  ['deposit',6,['deposit','mote_picked','deposit','lantern_lit'],150],
  ['pulse',121,['pulse'],5],['hit',120,['player_hit','player_hit'],0],['safe',120,[],0],
  ['win',10,['deposit','lantern_lit'],150],['loss',10,['player_hit','game_over'],0],
  ['dawn',10,['game_over'],0]
] as const
it.each(scenarios)('%s follows its contract',(name,ticks,expected,score)=>{
  const path='tests/scenarios/'+name
  const args=['--ticks',String(ticks),'--snapshot-every','1','--scenario',path+'.json']
  if(['deposit','pulse','win'].includes(name)) args.push('--inputs',path+'-inputs.json')
  expect(run(args).status).toBe(0)
  const rows=readFileSync(join(dir,'result'),'utf8').trim().split('\n').map(s=>JSON.parse(s))
  const events=rows.filter(r=>r.type==='event'&&r.name!=='night_start')
  expect(rows[0]).toMatchObject({type:'snapshot',tick:0,sim_tick:0,score:0})
  expect(events.map(e=>e.name)).toEqual(expected)
  const end=rows.at(-1)
  expect(end).toMatchObject({type:'end',score,ticks:({loss:1,dawn:3} as Record<string,number>)[name]??ticks})
  if(name==='win')expect(end.state).toBe('playing')
  const last=rows.at(-2)
  if(name==='dawn'||name==='loss') expect(events.at(-1).data.reason).toBe({loss:'no_flames',dawn:'dawn'}[name])
  if(name==='hit') expect(events.map(e=>[e.tick,e.data.dropped])).toEqual([[1,2],[91,1]])
  if(name==='safe') expect(Math.hypot(last.shades[0].pos[0],last.shades[0].pos[2])).toBeGreaterThan(5)
  if(name==='pulse'){
    expect(events[0].data.stunned_ids).toEqual(['ink'])
    expect(rows.find(r=>r.type==='snapshot'&&r.tick===120).shades.find((s:{id:string})=>s.id==='ink')).toMatchObject({pos:[9,.8,0],state:'stunned'})
    expect(last.shades.find((s:{id:string})=>s.id==='ink').state).toBe('chase')
  }
})
it('repeats seeded output byte for byte',()=>{
  const args=['--ticks','1501']
  expect(run(args).status).toBe(0)
  const bytes=readFileSync(join(dir,'result'))
  expect(run(args).status).toBe(0)
  expect(readFileSync(join(dir,'result')).equals(bytes)).toBe(true)
})
it.each([['inputs','{'],['scenario','{"shades":[{}]}'],['inputs','{"frames":[{"tick":0},{"tick":0}]}']])('rejects invalid %s',(kind,data)=>{
  const path=join(dir,'bad.json')
  writeFileSync(path,data)
  const r=run(['--ticks','1','--'+kind,path])
  expect(r.status).toBe(2)
  expect(r.stderr.trim()).toBeTruthy()
})
