import {readFileSync,writeFileSync} from 'node:fs'
import {Game} from './engine.js'
import {mulberry32} from './rng.js'
import {measurementArgs} from './options.js'
import type {Night} from './types.js'
const args=measurementArgs('nights',10,7,'soak.json')
const tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url),'utf8')).tuning
const start=performance.now(),results:string[]=[]
const rss=()=>process.memoryUsage().rss/1048576
let mem_start_mb=0,crashes=0
function simulate(i:number){
  const seed=args.seed+i,g=new Game(tuning,seed,{},(i%3+1) as Night),rng=mulberry32(seed)
  if(i===0)mem_start_mb=rss()
  let move:[number,number]=[0,0]
  while(g.state==='playing'){
    if(g.tick%30===0){const angle=rng()*2*Math.PI;move=[Math.cos(angle),Math.sin(angle)]}
    g.step({move,jump:rng()<.05,dash:rng()<.03,pulse:rng()<.02,interact:rng()<.1})
  }
  return g.state
}
for(let i=0;i<args.count;i++){try{results.push(simulate(i))}catch(error){crashes++;console.error(error)}}
const summary={nights:args.count,crashes,results,mem_start_mb,mem_end_mb:rss(),duration_s:(performance.now()-start)/1000}
writeFileSync(args.out,JSON.stringify(summary,null,2)+'\n')
if(crashes)process.exitCode=1
