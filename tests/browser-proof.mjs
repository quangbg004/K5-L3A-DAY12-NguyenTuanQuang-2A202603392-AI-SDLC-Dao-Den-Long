import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {Game} from '../dist-sim/engine.js'

const tuning=JSON.parse(readFileSync(new URL('../game.contract.json',import.meta.url))).tuning
const game=new Game(tuning)
const route=[]
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2])
while(game.state==='playing'){
  const p=game.player, nearest=list=>list.slice().sort((a,b)=>distance(p.pos,a.pos)-distance(p.pos,b.pos))[0]
  const lamp=nearest(game.lanterns.filter(l=>!l.lit))
  const target=p.carried>=tuning.lantern_cost-lamp.deposited?lamp:nearest(game.motes)??lamp
  const dx=target.pos[0]-p.pos[0],dz=target.pos[2]-p.pos[2]
  const move=[Math.abs(dx)>.5?Math.sign(dx):0,Math.abs(dz)>.5?Math.sign(dz):0]
  const pulse=game.shades.some(s=>s.state!=='stunned'&&distance(s.pos,p.pos)<3)&&p.carried>0
  const input={move,interact:p.carried>0&&distance(lamp.pos,p.pos)<=3,pulse,jump:game.tick===0}
  const keys=[move[0]>0?'KeyD':move[0]<0?'KeyA':'',move[1]>0?'KeyS':move[1]<0?'KeyW':'',input.interact?'KeyE':'',pulse?'KeyQ':'',input.jump?'Space':''].filter(Boolean)
  route.push(keys)
  game.step(input)
}
assert.equal(game.state,'won','default island must be winnable')
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
try{
  const page=await browser.newPage({viewport:{width:1152,height:720}})
  const errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  // Drive the normal animation loop and keyboard listeners with a deterministic clock.
  await page.addInitScript(()=>{
    let time=0,pending
    performance.now=()=>time
    window.requestAnimationFrame=cb=>{pending=cb;return 1}
    window.advance=steps=>{time+=steps*1000/60;pending(time+.00001)}
  })
  await page.goto(process.env.GAME_URL??'http://127.0.0.1:4173')
  await page.waitForSelector('canvas')
  const shot=name=>page.screenshot({path:'docs/proof/'+name+'.png'})
  await page.evaluate(()=>window.advance(0))
  await shot('welcome')
  await page.click('#play')
  // Batch only consecutive identical key states; the game still runs every simulation tick.
  await page.evaluate(route=>{
    let held=[]
    for(let i=0;i<route.length;){
      const next=route[i]
      for(const code of held.filter(c=>!next.includes(c))) window.dispatchEvent(new KeyboardEvent('keyup',{code}))
      for(const code of next.filter(c=>!held.includes(c))) window.dispatchEvent(new KeyboardEvent('keydown',{code}))
      let n=1
      while(n<8 && i+n<route.length && String(route[i+n])===String(next)) n++
      window.advance(n);held=next;i+=n
    }
  },route)
  assert.equal(await page.locator('h1').innerText(),'Đảo đã sáng')
  assert.equal(await page.locator('#score').innerText(),String(game.score))
  await shot('won')
  await page.click('#play')
  await page.keyboard.down('ArrowLeft')
  await page.evaluate(()=>window.advance(8))
  await page.keyboard.up('ArrowLeft')
  await shot('playing')
  await page.evaluate(()=>{for(let i=0;i<1351&&document.querySelector('#panel').hidden;i++)window.advance(8)})
  assert.equal(await page.locator('h1').innerText(),'Đêm đã tàn')
  await shot('lost')
  await page.click('#play')
  await page.evaluate(()=>window.advance(2))
  assert.equal(await page.locator('#lamps').innerText(),'0 / 5')
  assert.equal(await page.locator('#score').innerText(),'0')
  assert.deepEqual(errors,[])
  console.log('WebGL OK. Default island won in',game.tick,'ticks with',game.score,'points. Loss and both restarts verified.')
}finally{await browser.close()}
