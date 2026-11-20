import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {gunzipSync} from 'node:zlib'
const output='docs/proof/phase-2'
mkdirSync(output,{recursive:true})
function replay(name,night,ticks,out,period){
  const path='tests/scenarios/'+name
  const args=['dist-sim/headless.js','--seed','42','--night',String(night),'--scenario',path+'.json','--ticks',String(ticks),'--snapshot-every',String(period),'--out',out]
  if(existsSync(path+'-inputs.json'))args.push('--inputs',path+'-inputs.json')
  const start=performance.now(),r=spawnSync(process.execPath,args,{encoding:'utf8'})
  assert.equal(r.status,0,r.stderr)
  const ms=performance.now()-start,bytes=readFileSync(out)
  return {ms,sha256:createHash('sha256').update(bytes).digest('hex'),end:JSON.parse(bytes.toString().trim().split('\n').at(-1))}
}
for(const [name,night,ticks,period] of [
  ['pickup',1,1,1],['deposit',1,6,1],['pulse',1,121,15],['hit',1,120,30],['safe',1,120,30],['win',1,10,1],['loss',1,10,1],['dawn',1,10,1],
  ['dash',1,104,6],['air-dash',1,13,3],['fall',1,64,2],['pause',1,34,4],['night2-bridge',2,200,20],['night2-pad',2,90,10],
  ['night2-drifter-charm',2,124,2],['night3-pad',3,85,5],['night3-ramp',3,65,5],['night3-wind',3,2100,100]
])replay(name,night,ticks,output+'/'+name+'.jsonl',period)
const trials=[1,2].map(i=>replay('perf',3,21600,'dist-sim/benchmark-'+i+'.jsonl',10))
assert.equal(trials[0].sha256,trials[1].sha256)
for(const trial of trials){assert.equal(trial.end.ticks,21600);assert(trial.ms<=30000)}
const result={node:process.version,platform:process.platform,night:3,seed:42,snapshot_every:10,trials}
writeFileSync(output+'/headless.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result))
const campaign=[]
for(const night of [1,2,3]){
  const inputs='dist-sim/travel-'+night+'.json',out='dist-sim/travel-'+night+'.jsonl'
  writeFileSync(inputs,gunzipSync(readFileSync(output+'/night-'+night+'-inputs.json.gz')))
  const r=spawnSync(process.execPath,['dist-sim/headless.js','--seed','42','--night',String(night),'--inputs',inputs,
    '--ticks','21600','--snapshot-every','600','--out',out],{encoding:'utf8'})
  assert.equal(r.status,0,r.stderr)
  const rows=readFileSync(out,'utf8').trim().split('\n').map(s=>JSON.parse(s))
  const end=rows.at(-1),lit=rows.filter(e=>e.name==='lantern_lit')
  assert.equal(end.state,'won');assert.equal(lit.length,night+4)
  campaign.push({night,end,lit})
}
writeFileSync(output+'/campaign.json',JSON.stringify(campaign,null,2)+'\n')
console.log('Three default nights won:',campaign.map(r=>r.end.score).join(' + '),'=',campaign.reduce((total,r)=>total+r.end.score,0))
