import {chromium} from 'playwright'
import {createServer,preview} from 'vite'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
const dir='docs/proof/phase-2'
mkdirSync(dir,{recursive:true})
const prod=await preview({configFile:false,preview:{port:0,host:'127.0.0.1'}})
const dev=await createServer({configFile:false,server:{port:0,host:'127.0.0.1'},logLevel:'error'})
await dev.listen()
const addr=s=>'http://127.0.0.1:'+s.httpServer.address().port
let browser
try{
  browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,args:['--enable-unsafe-swiftshader']})
  const page=await browser.newPage({viewport:{width:1280,height:720}})
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  const button=name=>page.getByRole('button',{name,exact:true}).click()
  const shot=name=>page.screenshot({path:dir+'/'+name+'.png'})
  await page.goto(addr(prod))
  await shot('menu')
  await button('Cài đặt')
  const set=async(id,v)=>page.locator('#'+id).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input'))},String(v))
  await set('volume',32);await set('sensitivity',1.6);await shot('settings')
  await page.reload();await button('Cài đặt')
  assert.equal(await page.locator('#volume').inputValue(),'32')
  assert.equal(await page.locator('#sensitivity').inputValue(),'1.6')
  await button('Quay lại')
  const fps=[]
  for(const [i,name] of ['Đảo Bến','Đảo Cau','Đảo Chuông'].entries()){
    const n=i+1
    await button('Chọn Đêm');await button('Đêm '+n+' · '+name)
    await shot(n===1?'intro':'intro-'+n)
    await button('Vào Đêm '+n)
    await page.waitForFunction(()=>document.querySelector('#time').textContent.includes(':'))
    await shot('night-'+n)
    const measure=await page.evaluate(()=>new Promise(resolve=>{
      let frames=0,start
      function count(t){
        start??=t
        if(t-start>=5000){resolve({frames,ms:t-start,fps:frames*1000/(t-start)});return}
        frames++;requestAnimationFrame(count)
      }
      requestAnimationFrame(count)
    }))
    fps.push({night:n,...measure})
    if(n===1){
      await page.keyboard.down('ArrowLeft');await page.waitForSelector('#arrow:visible');await page.keyboard.up('ArrowLeft');await shot('direction')
    }
    await page.keyboard.press('p')
    await page.getByRole('button',{name:'Tiếp tục'}).waitFor()
    if(n===1){await shot('pause');await button('Tiếp tục');await page.keyboard.press('Shift');await page.keyboard.press('Space');await page.keyboard.press('Escape')}
    await button('Về menu')
  }
  const renderer=await page.locator('canvas').evaluate(el=>{
    const gl=el.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info')
    return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)
  })
  const measurement={viewport:[1280,720],renderer,fps}
  console.log(JSON.stringify(measurement));writeFileSync(dir+'/fps.json',JSON.stringify(measurement,null,2)+'\n')
  // Only this test origin injects starting scenarios. The production build above is unmodified.
  let fixture='campaign'
  await page.route('**/src/sim/engine.ts*',async route=>{
    const url=new URL(route.request().url())
    if(url.searchParams.has('real'))return route.continue()
    await route.fulfill({contentType:'application/javascript',body:`
      import {Game as Real} from '/src/sim/engine.ts?real'
      import {maps} from '/src/sim/maps.ts'
      export class Game extends Real{
        constructor(t,seed,scenario={},n=1){
          const finish={player:{pos:maps[n].lamps[0],carried:10},time_left_s:20,random_shades:false,
            lanterns:maps[n].lamps.slice(1).map((pos,i)=>({id:'L'+(i+2),lit:true}))}
          const lose={random_shades:false,time_left_s:1}
          super(t,seed,${JSON.stringify(fixture)}==='campaign'?finish:lose,n)
        }
      }`})
  })
  await page.goto(addr(dev));await button('Bắt đầu hành trình')
  let sum=0
  for(let n=1;n<=3;n++){
    await button('Vào Đêm '+n)
    await page.waitForFunction(()=>document.querySelector('#prompt').textContent.includes('Nạp ánh sáng'))
    assert.equal(await page.locator('#time').getAttribute('class'),'urgent')
    if(n===1)await shot('deposit-countdown')
    await page.keyboard.press('e')
    if(n<3){
      await page.getByRole('button',{name:'Sang Đêm '+(n+1)}).waitFor()
      sum+=Number((await page.locator('#story').innerText()).split(' · ')[1])
      await button('Sang Đêm '+(n+1))
    }else{
      await page.getByRole('heading',{name:'Bình Minh'}).waitFor()
      const total=Number((await page.locator('#story').innerText()).split(' · ')[1])
      assert(total>sum+300&&total<=sum+390);await shot('dawn')
    }
  }
  fixture='loss';await page.reload();await button('Chọn Đêm');await button('Đêm 2 · Đảo Cau');await button('Vào Đêm 2')
  await button('Chơi lại Đêm')
  await page.waitForFunction(()=>document.querySelector('#lamps').textContent.endsWith('/ 6'))
  assert.equal(await page.locator('#life').textContent(),'♥♥♥')
  assert.deepEqual(errors,[])
  assert(fps.every(sample=>sample.fps>=30),'Average FPS must reach 30 for every night')
  console.log('Browser checks passed: three maps, pause/resume, persisted settings, timed HUD, campaign score and night restart.')
}finally{
  await browser?.close();await dev.close();await new Promise(resolve=>prod.httpServer.close(resolve))
}
