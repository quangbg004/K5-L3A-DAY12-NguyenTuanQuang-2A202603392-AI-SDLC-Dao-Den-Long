import {chromium} from 'playwright'
import {createServer,preview} from 'vite'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'

const dir='docs/proof/phase-3'
mkdirSync(dir,{recursive:true})
const prod=await preview({configFile:false,preview:{port:0,host:'127.0.0.1'}})
const dev=await createServer({configFile:false,server:{port:0,host:'127.0.0.1'},logLevel:'error'})
await dev.listen()
const address=s=>'http://127.0.0.1:'+s.httpServer.address().port
let browser
try{
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,args:['--enable-unsafe-swiftshader']})
  const page=await browser.newPage({viewport:{width:1280,height:720}})
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const button=name=>page.getByRole('button',{name,exact:true}).click()
  const shot=name=>page.screenshot({path:dir+'/'+name+'.png'})

  await page.goto(address(prod))
  await button('Cài đặt')
  await page.getByLabel('Bảng màu dễ phân biệt').check()
  await shot('settings')
  await page.reload()
  await button('Cài đặt')
  assert.equal(await page.getByLabel('Bảng màu dễ phân biệt').isChecked(),true)
  await button('Quay lại')
  const samples=[]
  for(const [i,name] of ['Đảo Bến','Đảo Cau','Đảo Chuông'].entries()){
    const night=i+1
    await button('Chọn Đêm');await button('Đêm '+night+' · '+name);await button('Vào Đêm '+night)
    await page.waitForFunction(()=>document.querySelector('#bag').textContent==='0 / 10')
    const measured=await page.evaluate(()=>new Promise(resolve=>{
      let first,frames=0
      function sample(t){
        first??=t
        if(t-first>=5000){resolve({frames,ms:t-first,fps:frames*1000/(t-first)});return}
        frames++;requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    }))
    samples.push({night,...measured})
    await page.keyboard.press('p');await button('Về menu')
  }
  const renderer=await page.locator('canvas').evaluate(canvas=>{
    const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info')
    return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)
  })
  const fps={viewport:[1280,720],renderer,samples}
  writeFileSync(dir+'/fps.json',JSON.stringify(fps,null,2)+'\n')
  assert(samples.every(s=>s.fps>=30))
  console.log(JSON.stringify(fps))

  // Stage a late-night scene on the test server using the original game engine.
  await page.route('**/src/sim/engine.ts*',async route=>{
    if(new URL(route.request().url()).searchParams.has('real'))return route.continue()
    await route.fulfill({contentType:'application/javascript',body:`
      import { Game as Real } from '/src/sim/engine.ts?real'
      export class Game extends Real {
        constructor(t,seed,scenario={},night=1){
          super(t,seed,{time_left_s:3,random_shades:false,random_motes:false,
            player:{carried:7,successful_lights:2},
            lanterns:[
              {id:'L1',pos:[0,0,-8],lit:true,fuel:25},
              {id:'L2',pos:[-4,0,-5]},
              {id:'L3',pos:[6,0,-12],lit:true,fuel:60},
              {id:'L4',pos:[-6,0,-12],lit:true,fuel:80}
            ],shades:[{id:'S1',pos:[-1,.8,-8],state:'drain',target_lantern_id:'L1'}]},night)
          window.proofGame=this
        }
      }`})
  })
  await page.goto(address(dev));await button('Cài đặt')
  await page.getByLabel('Bảng màu dễ phân biệt').check()
  await button('Quay lại');await button('Bắt đầu hành trình');await button('Vào Đêm 1')
  assert.equal(await page.locator('#bag').textContent(),'7 / 14')
  assert.match(await page.locator('#time').textContent(),/^⚠/)
  assert.equal(await page.locator('#time').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)')
  await page.waitForFunction(()=>window.proofGame.simTick%60<15)
  await shot('drain-bright')
  await page.waitForFunction(()=>window.proofGame.simTick%60>=30)
  await shot('drain-dim')
  assert.equal(await page.evaluate(()=>window.proofGame.shades[0].state),'drain')
  await page.getByRole('heading',{name:'Đảo đã sáng'}).waitFor()
  assert.equal(await page.evaluate(()=>window.proofGame.events.at(-1).data.reason),'dawn_survived')
  await shot('dawn')
  assert.deepEqual(errors,[])
  console.log('Palette persistence, HUD capacity, drain, low-fuel blink and dawn verified.')
}finally{
  await browser?.close();await dev.close();await new Promise(resolve=>prod.httpServer.close(resolve))
}
