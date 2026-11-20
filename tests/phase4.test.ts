import {it,expect,afterAll} from 'vitest'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Game} from '../src/sim/engine.js'
import contract from '../game.contract.json'
const dir=mkdtempSync(join(tmpdir(),'release-test-'))
afterAll(()=>rmSync(dir,{recursive:true,force:true}))
it('keeps the standard benchmark population, player and fuel throughout',()=>{
 const g=Game.createBench(contract.tuning,42)
 expect(g.shades).toHaveLength(200);expect(g.motes).toHaveLength(100)
 const first=[...g.shades[0].pos]
 for(let i=0;i<301;i++)g.step({move:[1,1],pulse:true})
 expect(g.shades[0].pos).not.toEqual(first)
 expect(g.shades.every(s=>s.state==='wander')).toBe(true)
 expect(g.player).toMatchObject({pos:[0,0,0],flames:3,carried:0})
 expect(g.shades).toHaveLength(200);expect(g.motes).toHaveLength(100)
 expect(g.lanterns.map(l=>l.fuel60)).toEqual([6000,6000,6000,0,0])
})
it('completes ten seeded nights in one process within the RSS budget',()=>{
 const out=join(dir,'soak.json'),r=spawnSync(process.execPath,['dist-sim/soak.js','--seed','7','--nights','10','--out',out])
 expect(r.status).toBe(0)
 const b=JSON.parse(readFileSync(out,'utf8'))
 expect(b.results).toHaveLength(10);expect(b.crashes).toBe(0)
 expect(b.mem_end_mb).toBeLessThanOrEqual(1.2*b.mem_start_mb)
})
it('retains ten ranked entries and exports exactly those rows from another process',async()=>{
 const old=process.env.DAO_DEN_LONG_DATA_DIR
 process.env.DAO_DEN_LONG_DATA_DIR=dir
 try{
 const {save}=await import('../src/sim/leaderboard.js')
 expect(()=>save({name:'x',score:4,nights_won:1,seed:7})).toThrow()
 for(let i=0;i<12;i++)save({name:'Mây_'+i,score:Math.floor(i/2),nights_won:2,seed:7})
 const out=join(dir,'export.json')
 expect(spawnSync(process.execPath,['dist-sim/launcher.js','--export-leaderboard',out]).status).toBe(0)
 const {entries}=JSON.parse(readFileSync(out,'utf8'));expect(entries).toHaveLength(10)
 expect(entries.slice(0,2).map((e:{name:string})=>e.name)).toEqual(['Mây_10','Mây_11'])
 expect(new Date(entries[0].achieved_at).toISOString()).toBe(entries[0].achieved_at)
 }finally{if(old===undefined)delete process.env.DAO_DEN_LONG_DATA_DIR;else process.env.DAO_DEN_LONG_DATA_DIR=old}
})
