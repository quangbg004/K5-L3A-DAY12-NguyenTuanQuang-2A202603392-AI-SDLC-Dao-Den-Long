import {expect,it} from 'vitest'
import {Game} from '../../src/sim/engine.js'
import type {Scenario} from '../../src/sim/types.js'
import contract from '../../game.contract.json'
const isolated:Scenario={random_motes:false,random_shades:false,random_drifters:false,wind_enabled:false}
const run=(g:Game,n:number)=>{for(let i=0;i<n;i++)g.step()}
it('starts with distinct motes, spawns after contacts at exact simulation ticks',()=>{
  for(const night of [1,2,3] as const){
    const g=new Game(contract.tuning,42,{wind_enabled:false,player:{invuln_ticks:1800}},night)
    expect(new Set(g.motes.map(m=>String(m.pos))).size).toBe(20)
    run(g,239);const count=g.motes.length;g.step();expect(g.motes.length).toBe(count+1)
    run(g,59);expect(g.shades).toHaveLength(0);g.step()
    expect(g.shades.map(s=>s.state)).toEqual(['spawning','spawning'])
    expect(g.shades.every(s=>Math.hypot(s.pos[0]-g.player.pos[0],s.pos[2]-g.player.pos[2])>=15)).toBe(true)
    run(g,g.map.interval);expect(g.shades).toHaveLength(3)
    run(g,1200-g.simTick);expect(g.drifters.length).toBe(night>1?1:0)
  }
})
it('prioritises death even with lit lamps, and victory over dawn on last deposit',()=>{
  const lamps=[1,2,3,4,5].map(i=>({id:'L'+i,lit:true}))
  const lost=new Game(contract.tuning,1,{...isolated,lanterns:lamps,player:{flames:0}})
  lost.step();expect(lost.events.at(-1)?.data.reason).toBe('no_flames')
  const won=new Game(contract.tuning,1,{...isolated,time_left_s:1/60,player:{carried:10},lanterns:[{id:'L1',pos:[0,0,0]},...lamps.slice(1)]})
  won.step({interact:true});expect(won.state).toBe('won');expect(won.score).toBe(1046)
})
it('selects smaller lamp id on a distance tie and checks pickup height',()=>{
  const g=new Game(contract.tuning,1,{...isolated,lanterns:[{id:'L2',pos:[1,0,0]},{id:'L1',pos:[-1,0,0]}],motes:[[0,1.5,0],[0,1.501,0]]})
  g.step({interact:true});expect(g.score).toBe(5);expect(g.lanterns[0].deposited).toBe(1);expect(g.motes.length).toBe(1)
})
it('pushes over fifteen steps and dash grants no invulnerability',()=>{
  const g=new Game(contract.tuning,1,{...isolated,player:{carried:3},shades:[{id:'S1',pos:[0,.8,0]}]})
  g.step({pulse:true});expect(g.shades[0].pos[0]).toBeCloseTo(4/15)
  run(g,14);expect(g.shades[0].pos[0]).toBeCloseTo(4)
  const hit=new Game(contract.tuning,1,{...isolated,shades:[{pos:[0,0,.3]}]})
  hit.step({dash:true});expect(hit.player.flames).toBe(2)
})
it('drifter steals first even during invulnerability; a chase pulse prevents theft',()=>{
  const scene:Scenario={...isolated,player:{carried:8},shades:[{pos:[0,.8,0]}],drifters:[{pos:[0,.8,0],state:'chase'}]}
  const g=new Game(contract.tuning,1,scene,2)
  g.step();expect(g.events.map(e=>e.name)).toEqual(['drifter_steal','player_hit'])
  expect(g.motes.length).toBe(2)
  g.step({move:[1,0]});run(g,15);g.step({move:[0,0]});g.invuln=500;run(g,480);expect(g.motes.filter(m=>m.expires===481)).toHaveLength(0)
  const pulsed=new Game(contract.tuning,1,scene,2)
  pulsed.step({pulse:true});expect(pulsed.drifters[0].state).toBe('flee');expect(pulsed.drifters[0].stolen).toBe(0)
})
it('expires and respawns the charm, restores full dash cooldown rules',()=>{
  const g=new Game(contract.tuning,1,{...isolated,player:{pos:[35,0,0]}},2)
  g.step();expect(g.charmTicks).toBe(600)
  g.step({move:[1,0]});expect(g.vel[0]).toBeCloseTo(7.2)
  g.step({move:[0,0]});run(g,598);expect(g.charmTicks).toBe(0)
  g.step({move:[1,0]});expect(g.vel[0]).toBe(6)
  run(g,2699-g.simTick);expect(g.snapshot().charms[0].available).toBe(false)
  g.step({move:[0,0]});g.step();expect(g.snapshot().charms[0].available).toBe(true)
})
