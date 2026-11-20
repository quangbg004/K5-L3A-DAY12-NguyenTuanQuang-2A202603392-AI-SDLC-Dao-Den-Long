import {chromium} from 'playwright'
import {arch,platform,release} from 'node:os'
import {writeFileSync} from 'node:fs'
import {once} from 'node:events'
import type {AddressInfo} from 'node:net'
import {measurementArgs} from './options.js'
import {serve} from './server.js'
const args=measurementArgs('duration',30,42,'bench.json')
const server=serve(0)
await once(server,'listening')
let browser
try{
  const options={headless:false,args:['--disable-frame-rate-limit','--disable-gpu-vsync','--window-size=1280,720']}
  try{browser=await chromium.launch({...options,channel:process.env.BROWSER_CHANNEL})}
  catch(error){if(process.env.BROWSER_CHANNEL)throw error;browser=await chromium.launch({...options,channel:process.platform==='win32'?'msedge':'chrome'})}
  const page=await browser.newPage({viewport:{width:1280,height:720}})
  await page.goto('http://127.0.0.1:'+(server.address() as AddressInfo).port+'/?bench=1&seed='+args.seed+'&duration='+args.count)
  await page.waitForFunction(()=>'benchDone' in window,undefined,{timeout:(args.count+35)*1000})
  const result=await page.evaluate(()=>({first:(window as any).benchFirst,metrics:(window as any).benchDone}))
  const report={contract_version:'1.3',...result.metrics,load_ms:Math.round(result.first-performance.timeOrigin),peak_mem_mb:null,vsync_off:true,os:[platform(),release(),arch()].join(' ')}
  writeFileSync(args.out,JSON.stringify(report,null,2)+'\n')
}finally{await browser?.close();server.close()}
