import {it,expect} from 'vitest'
import {Game} from '../../src/sim/engine.js'
import contract from '../../game.contract.json'
it('rotates and normalizes movement, preserves partial frames and jumps on press',()=>{
  const g=new Game(contract.tuning,1,{random_motes:false,random_shades:false})
  g.step({move:[1,1],cam_yaw_deg:90,jump:true})
  expect(g.player.pos[1]).toBeGreaterThan(0)
  for(let i=1;i<60;i++)g.step()
  expect(g.player.pos[0]).toBeCloseTo(7/Math.sqrt(2))
  expect(g.player.pos[2]).toBeCloseTo(-7/Math.sqrt(2))
  expect(g.player.pos[1]).toBe(0)
})
