import {expect,it,afterAll} from 'vitest'
import {spawnSync} from 'node:child_process'
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Game} from '../src/sim/engine.js'
import type {Scenario} from '../src/sim/types.js'
import contract from '../game.contract.json'

const dir=mkdtempSync(join(tmpdir(),'phase3-'))
afterAll(()=>rmSync(dir,{recursive:true,force:true}))
function replay(name:string,ticks:number){
  const proof=process.env.PHASE3_PROOF
  if(proof)mkdirSync(proof,{recursive:true})
  const path='tests/scenarios/'+name,out=join(proof||dir,name+'.jsonl')
  const args=['dist-sim/headless.js','--seed','42','--night','1','--ticks',String(ticks),'--snapshot-every','1','--scenario',path+'.json','--out',out]
  if(existsSync(path+'-inputs.json'))args.push('--inputs',path+'-inputs.json')
  const run=spawnSync(process.execPath,args,{encoding:'utf8'})
  expect(run.status,run.stderr).toBe(0)
  const rows=readFileSync(out,'utf8').trim().split('\n').map(s=>JSON.parse(s))
  return {at:(tick:number)=>rows.find(r=>r.tick===tick&&r.type==='snapshot'),events:(name:string)=>rows.filter(r=>r.name===name),end:rows.at(-1)}
}
it('expires at exactly tick 60, then relights for five motes on the same tick',()=>{
  const r=replay('fuel-decay-out-relight',60)
  expect(r.at(0).player.capacity).toBe(10)
  expect(r.at(59).lanterns[0].lit).toBe(true)
  expect(r.events('lantern_out')[0].tick).toBe(60)
  expect(r.events('deposit')[0].data.amount).toBe(5)
  expect(r.events('lantern_lit')[0].data.relight).toBe(true)
  expect(r.at(60).lanterns[0]).toMatchObject({fuel:100,relit_count:1,ever_lit:true})
  expect(r.at(60).player.capacity).toBe(12)
  expect(r.end.score).toBe(65)
})
it('refuels the lowest ID in a tie and restores the safe radius immediately',()=>{
  const r=replay('refuel-and-safe-push',1)
  expect(r.events('refuel')[0].data).toEqual({lantern_id:'L1',amount:8,fuel:100})
  expect(r.at(1).shades[0].pos[0]).toBe(6)
  expect(r.at(1).player).toMatchObject({flames:3,carried:2})
  expect(r.end.score).toBe(40)
})
it('stacks two drains, records them every 60 ticks, and scores a stun of a drainer',()=>{
  const r=replay('shade-drain-and-pulse',101)
  expect(r.at(60).lanterns[0].fuel).toBe(18)
  expect(r.events('fuel_drain').map(e=>e.tick)).toEqual([60,60])
  const g=new Game(contract.tuning,42,{random_shades:false,random_motes:false,player:{carried:3},
    lanterns:[{id:'L1',pos:[0,0,0],lit:true,fuel:29}],
    shades:[{pos:[1,.8,0],state:'drain',target_lantern_id:'L1'}]})
  g.step({pulse:true})
  expect(g.score).toBe(15)
  expect(g.shades[0].state).toBe('stunned')
})
it('wins on the final tick with fuel and flame bonuses',()=>{
  const r=replay('dawn-survived',60)
  expect(r.at(59).state).toBe('playing')
  expect(r.events('game_over')[0].data.reason).toBe('dawn_survived')
  expect(r.end).toMatchObject({state:'won',score:417})
})
it('caps capacity at twenty even after relighting',()=>{
  const r=replay('capacity-cap',1)
  expect(r.at(0).player).toMatchObject({capacity:20,carried:20})
  expect(r.at(1).player).toMatchObject({capacity:20,carried:15})
})
const isolated:Scenario={random_shades:false,random_motes:false,random_drifters:false}
it('checks the threshold in all nights and gives no_flames priority',()=>{
  for(const [night,need] of [[1,3],[2,4],[3,5]] as const){
    for(const [delta,flames,reason] of [[0,3,'dawn_survived'],[-1,3,'dawn'],[0,0,'no_flames']] as const){
      const g=new Game(contract.tuning,42,{...isolated,time_left_s:1/60,player:{flames},
        lanterns:Array.from({length:need+delta},(_,i)=>({id:'L'+(i+1),lit:true}))},night)
      g.step();expect(g.events.at(-1)?.data.reason).toBe(reason)
    }
  }
})
it('checks exact safety boundary before and after one fuel tick',()=>{
  const g=new Game(contract.tuning,42,{...isolated,lanterns:[{id:'L1',lit:true,fuel:30,pos:[20,0,0]}],shades:[{pos:[21.9,.8,0]}]})
  expect(g.isSafe(g.lanterns[0])).toBe(true)
  g.step()
  expect(g.isSafe(g.lanterns[0])).toBe(false)
  expect(g.shades[0].state).toBe('drain')
})
it('rejects invalid fuel, capacity, and drain target in the CLI',()=>{
  const path=join(dir,'invalid.json')
  for(const fixture of [{lanterns:[{id:'L1',fuel:-1}]},{player:{successful_lights:-1}},{shades:[{pos:[1,0,0],target_lantern_id:'L7'}]}]){
    writeFileSync(path,JSON.stringify(fixture))
    const r=spawnSync(process.execPath,['dist-sim/headless.js','--seed','42','--night','1','--ticks','1','--scenario',path,'--out',join(dir,'bad')])
    expect(r.status).toBe(2)
  }
})
