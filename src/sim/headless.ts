import {openSync,closeSync,readFileSync,writeSync} from 'node:fs'
import {parseArgs} from 'node:util'
import {Game} from './engine.js'
import {inputs,scenario} from './validators.js'
import type {Tuning,Night} from './types.js'
function integer(value:string|undefined,min:number,label:string){
  if(!value || !/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value)<min)
    throw new Error('Invalid '+label)
  return Number(value)
}
try {
  const {values:v}=parseArgs({options:{seed:{type:'string'},night:{type:'string'},ticks:{type:'string'},out:{type:'string'},
    scenario:{type:'string'},inputs:{type:'string'},'snapshot-every':{type:'string',default:'10'}}})
  if(!['1','2','3'].includes(v.night??'')){process.exitCode=2;throw new Error('Invalid night')}
  if(!v.out)throw new Error('Missing --out')
  const night=Number(v.night) as Night
  const seed=integer(v.seed,-Number.MAX_SAFE_INTEGER,'seed')
  const steps=integer(v.ticks,0,'ticks'), every=integer(v['snapshot-every'],1,'snapshot-every')
  const t:Tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url),'utf8')).tuning
  const read=(path:string)=>JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,''))
  const [world,frames]=(()=>{
    try {return [v.scenario?scenario(read(v.scenario),t,night):{},v.inputs?inputs(read(v.inputs)):[]] as const}
    catch(error){process.exitCode=2;throw error}
  })()
  const game=new Game(t,seed,world,night), fd=openSync(v.out,'w')
  try {
    const write=(record:unknown)=>writeSync(fd,JSON.stringify(record)+'\n')
    write(game.snapshot())
    for(const e of game.events)write(e)
    let cursor=0
    while(game.tick<steps && (game.state==='playing'||game.state==='paused')){
      const frame=frames[cursor]?.tick===game.tick?frames[cursor++]:undefined
      game.step(frame)
      for(const event of game.events) write(event)
      if(game.tick%every===0) write(game.snapshot())
    }
    write({type:'end',ticks:game.tick,state:game.state,score:game.score})
  } finally {closeSync(fd)}
} catch(error){console.error(error instanceof Error?error.message:error);process.exitCode??=1}
