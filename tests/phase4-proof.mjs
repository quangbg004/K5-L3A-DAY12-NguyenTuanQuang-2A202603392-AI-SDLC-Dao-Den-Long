import {chromium} from 'playwright'
import {createServer} from 'vite'
import {once} from 'node:events'
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import assert from 'node:assert/strict'
const tmp=mkdtempSync(join(tmpdir(),'lantern-proof-')),dir='docs/proof/phase-4'
mkdirSync(dir,{recursive:true});process.env.DAO_DEN_LONG_DATA_DIR=tmp
const {serve}=await import('../dist-sim/server.js')
let server=serve(0);await once(server,'listening')
const port=server.address().port,base='http://127.0.0.1:'+port
const dev=await createServer({server:{host:'127.0.0.1',port:0,proxy:{'/api':{target:base,changeOrigin:true,headers:{origin:base}}}},logLevel:'error'})
await dev.listen()
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined})
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const click=name=>page.getByRole('button',{name,exact:true}).click()
 const shot=name=>page.screenshot({path:dir+'/'+name+'.png'})
 const frames=[]
 async function record(seconds){
   if(!process.env.DEMO)return
   const end=performance.now()+seconds*1000
   do{
     const path=join(tmp,'frame-'+frames.length+'.jpg'),start=performance.now()
     await page.screenshot({path,type:'jpeg',quality:83})
     await page.waitForTimeout(80);frames.push({path,duration:(performance.now()-start)/1000})
   }while(performance.now()<end)
 }
 await page.goto(base);await record(1);await click('Cài đặt')
 await click('Nhảy · Space');await page.keyboard.press('w')
 await page.getByText('Phím đang được sử dụng.',{exact:false}).waitFor()
 await page.keyboard.press('j')
 await page.getByLabel('Giảm chuyển động').check();await page.getByLabel('Chữ lớn (×1.25)').check()
 await page.reload();await click('Cài đặt')
 assert(await page.getByRole('button',{name:'Nhảy · J'}).isVisible())
 assert(await page.getByLabel('Giảm chuyển động').isChecked())
 assert(await page.getByLabel('Chữ lớn (×1.25)').isChecked())
 assert.equal(await page.locator('fieldset button').first().evaluate(b=>getComputedStyle(b).fontSize),'22.5px')
 await shot('settings');await record(1);await click('Khôi phục mặc định')
 await page.getByLabel('Chữ lớn (×1.25)').uncheck()
 await click('Quay lại');await click('Bắt đầu hành trình');await click('Vào Đêm 1')
 await page.keyboard.down('w');await page.keyboard.press('Space');await record(2);await page.keyboard.press('Shift');await record(1);await page.keyboard.up('w')
 await page.waitForFunction(()=>document.querySelector('#captions').textContent.includes('Bóng Mực'))
 assert(await page.locator('#arrow').isVisible());await shot('playing');await record(1)
 assert(await page.evaluate(()=>Array.from(document.querySelectorAll('#hud *')).every(el=>!el.getClientRects().length||!el.textContent.trim()||parseFloat(getComputedStyle(el).fontSize)>=18)))
 await page.route('**/src/sim/engine.ts*',async route=>{
   if(route.request().url().includes('real='))return route.continue()
   await route.fulfill({contentType:'application/javascript',body:`
    import {Game as Real} from '/src/sim/engine.ts?real=1'
    export class Game extends Real {
     constructor(t,seed,s,n=1){super(t,seed,{time_left_s:30,random_shades:false,lanterns:[{id:'L1',lit:true,fuel:10}]},n);this.simTick=1679}
    }`})
 })
 await page.goto('http://127.0.0.1:'+dev.httpServer.address().port);await click('Chọn Đêm');await click('Đêm 3 · Đảo Chuông');await click('Vào Đêm 3')
 await page.waitForFunction(()=>{const s=document.querySelector('#captions').textContent;return s.includes('Gió mạnh')&&s.includes('Còn')&&s.includes('L1')})
 await shot('captions')
 await page.getByLabel('Tên người chơi').fill('Mây_04');await click('Lưu điểm');await page.getByText('Đã lưu 0 điểm.').waitFor()
 await click('Về menu');await click('Bảng xếp hạng');await page.getByRole('cell',{name:'Mây_04'}).waitFor()
 await shot('leaderboard');await record(1)
 await new Promise(resolve=>server.close(resolve));server=serve(port);await once(server,'listening')
 const {entries}=await (await fetch(base+'/api/leaderboard')).json()
 const out=join(tmp,'export.json');execFileSync(process.execPath,['dist-sim/launcher.js','--export-leaderboard',out])
 assert.deepEqual(JSON.parse(readFileSync(out)).entries,entries);assert.equal(entries[0].name,'Mây_04')
 if(process.env.DEMO){
   const trace=join(tmp,'headless.jsonl')
   execFileSync(process.execPath,['dist-sim/headless.js','--seed','42','--night','1','--ticks','60','--scenario','tests/scenarios/dawn-survived.json','--out',trace])
   const panels=[
    ['Build · Vitest · Headless',readFileSync(dir+'/verify.log','utf8').split('Test Files').at(-1).trim()+'\n\n'+readFileSync(trace,'utf8').trim().split('\n').filter(s=>s.includes('game_over')||s.includes('"type":"end"')).join('\n')],
    ['Benchmark · 1280 × 720',readFileSync('bench.json','utf8')],['Soak · 10 Đêm',readFileSync('soak.json','utf8')],
    ['Harness · AGENTS.md',readFileSync('AGENTS.md','utf8')],['Git · Lịch sử triển khai',execFileSync('git',['log','-12','--oneline'],{encoding:'utf8'})]
   ]
   for(const [title,body] of panels){
    await page.setContent('<body style="background:#0e1430;color:#f5f1e6;padding:30px;font:21px system-ui"><h1></h1><pre style="white-space:pre-wrap;font:19px/1.4 monospace"></pre></body>')
    await page.locator('h1').evaluate((el,s)=>el.textContent=s,title)
    await page.locator('pre').evaluate((el,s)=>el.textContent=s,body);await record(2.5)
   }
   const manifest=join(tmp,'frames.txt')
   writeFileSync(manifest,frames.map(f=>"file '"+f.path.replaceAll('\\','/')+"'\nduration "+f.duration).join('\n'))
   mkdirSync('docs/demo',{recursive:true})
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',manifest,'-vf','fps=24,format=yuv420p','-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart','docs/demo/demo.mp4'])
 }
 assert.deepEqual(errors,[])
 console.log('PASS: rebind, collision, reset, persistence, font size, captions, directional arrow, leaderboard restart/export.')
}finally{await browser.close();await dev.close();await new Promise(resolve=>server.close(resolve));rmSync(tmp,{recursive:true,force:true})}
