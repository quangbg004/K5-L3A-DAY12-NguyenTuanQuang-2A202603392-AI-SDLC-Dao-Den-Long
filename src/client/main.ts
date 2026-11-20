import {Game} from '../sim/engine.js'
import contract from '../../game.contract.json'
import {scene} from './scene.js'
import {chime,toggle,unlock} from './audio.js'
import './style.css'
const el=(id:string)=>document.getElementById(id)!
const view=scene(el('world'))
let game=new Game(contract.tuning), started=false, yaw=0, accumulator=0, previous=performance.now(), messageUntil=0
const held=new Set<string>(), taps=new Set<string>()
const actions=['Space','KeyE','KeyQ','Mouse2']
function clear(){held.clear();taps.clear()}
window.addEventListener('blur',clear)
document.addEventListener('visibilitychange',()=>{previous=performance.now();accumulator=0;clear()})
window.addEventListener('keydown',e=>{
  if(!started||game.state!=='playing')return
  if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault()
  if(!e.repeat && actions.includes(e.code))taps.add(e.code)
  held.add(e.code)
})
window.addEventListener('keyup',e=>held.delete(e.code))
el('world').addEventListener('contextmenu',e=>e.preventDefault())
el('world').addEventListener('pointerdown',e=>{if(e.button===2){held.add('Mouse2');taps.add('Mouse2')}})
window.addEventListener('pointerup',()=>held.delete('Mouse2'))
el('sound').onclick=()=>{unlock();const on=toggle();el('sound').textContent='Âm thanh · '+(on?'Bật':'Tắt');el('sound').setAttribute('aria-pressed',String(on))}
el('play').onclick=()=>{
  unlock();clear();view.reset();game=new Game(contract.tuning);started=true;yaw=0;accumulator=0;previous=performance.now()
  el('panel').hidden=true;el('hud').hidden=false;el('prompt').textContent='';messageUntil=0
}
function hud(){
  const {t,player:p}=game
  el('lamps').textContent=game.lanterns.filter(l=>l.lit).length+' / '+game.lanterns.length
  el('bag').textContent=p.carried+' / '+t.carry_capacity
  el('life').textContent='♥'.repeat(Math.max(0,p.flames)) || '0'
  const seconds=Math.ceil(game.timeLeft)
  el('time').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')
  el('score').textContent=String(game.score)
}
function step(){
  const down=(k:string)=>held.has(k)||taps.has(k)
  yaw+=(Number(down('ArrowLeft'))-Number(down('ArrowRight')))*1.8/60
  game.step({move:[Number(down('KeyD'))-Number(down('KeyA')),Number(down('KeyS'))-Number(down('KeyW'))],cam_yaw_deg:yaw*180/Math.PI,
    jump:down('Space'),interact:down('KeyE'),pulse:down('KeyQ')||down('Mouse2')})
  taps.clear();view.events(game,game.events)
  for(const e of game.events){
    chime(e.name,game.player.carried)
    const msg=({player_hit:'Bóng Mực chạm vào Mây · −1 lửa',lantern_lit:'Đèn lồng đã sáng',pulse:'Mây tỏa sáng'} as Record<string,string>)[e.name]
    if(msg){el('prompt').textContent=msg;messageUntil=game.tick+70}
  }
  if(game.tick>=messageUntil){
    const p=game.player.pos,l=game.lanterns.find(l=>!l.lit && Math.hypot(l.pos[0]-p[0],l.pos[2]-p[2])<=game.t.interact_radius)
    el('prompt').textContent=l?'E · Nạp đèn '+l.id+' ('+l.deposited+'/'+game.t.lantern_cost+')':''
  }
  hud()
  if(game.state!=='playing'){
    const won=game.state==='won'
    el('panel').querySelector('h1')!.textContent=won?'Đảo đã sáng':'Đêm đã tàn'
    el('story').textContent=(won?'Mây đã thắp sáng cả năm đèn.':game.player.flames===0?'Ngọn lửa cuối cùng của Mây đã tắt.':'Bình minh đã đến trước khi cả đảo sáng đèn.')+' '+game.score+' điểm.'
    el('play').textContent='Chơi lại  ↻';el('panel').hidden=false;el('prompt').textContent='';clear()
  }
}
function animate(now:number){
  const delta=Math.min((now-previous)/1000,.15);previous=now
  if(started && game.state==='playing' && !document.hidden){
    accumulator+=delta
    while(accumulator>=1/60 && game.state==='playing'){step();accumulator-=1/60}
  }
  view.draw(game,yaw,!started,now/1000,delta)
  requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
