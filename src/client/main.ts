import {Game} from '../sim/engine.js'
import {maps} from '../sim/maps.js'
import type {Night} from '../sim/types.js'
import contract from '../../game.contract.json'
import {scene} from './scene.js'
import {chime,music,unlock,volume} from './audio.js'
import {el,hud,panel,preference,slider} from './ui.js'
import './style.css'

const view=scene(el('world')),held=new Set<string>(),pressed=new Set<string>()
let night:Night=1,game=new Game(contract.tuning),screen='menu',total=0,yaw=0,acc=0,previous=performance.now()
let loud=preference('volume',50,0,100),sensitivity=preference('sensitivity',1,.2,2)
volume(loud/100)
const quotes=['Hãy theo những đốm sáng về bến. Năm ngọn đèn sẽ dẫn lối qua biển mây.','Cầu tre nối đôi bờ. Nếu nghe tiếng gió lùa qua cau, con nhớ giữ chặt túi đom đóm.','Trên tầng đá cao nhất có một tháp chuông. Khi ngọn đèn cuối sáng, bình minh sẽ trở về.']
function clear(){held.clear();pressed.clear()}
function overlay(next:string){
  screen=next;clear();music(false);el('prompt').textContent='';el('hud').hidden=true
  document.body.classList.remove('in-game');document.exitPointerLock?.()
}
function menu(){
  overlay('menu');night=1;total=0;game=new Game(contract.tuning);view.reset()
  panel('Ba hòn đảo','Đảo Đèn Lồng','Theo chân Mây qua ba đêm, nhặt đom đóm và thắp lại những ngọn đèn giữa biển mây.',[
    ['Bắt đầu hành trình',()=>intro(1)],['Chọn Đêm',choose],['Cài đặt',settings]])
}
function choose(){
  overlay('choose');panel('Hành trình','Chọn Đêm','',([1,2,3] as Night[]).map(n=>['Đêm '+n+' · '+maps[n].name,()=>intro(n)] as [string,()=>void]).concat([['Về menu',menu]]))
}
function intro(n:Night){
  overlay('intro');night=n;game=new Game(contract.tuning,42,{},night);view.reset()
  panel('Đêm 0'+night+' · Ông Đăng',maps[night].name,'“'+quotes[night-1]+'”',[['Vào Đêm '+night,start],['Về menu',menu]])
}
function play(){
  clear();el('panel').hidden=true;el('hud').hidden=false;screen='playing';document.body.classList.add('in-game')
  previous=performance.now();acc=0;unlock();music(true)
}
function start(){game=new Game(contract.tuning,42,{},night);yaw=0;view.reset();play()}
function result(){
  const won=game.state==='won'
  overlay('result');chime(game.state)
  if(won)total+=game.score
  if(won&&night===3){panel('Hành trình hoàn tất','Bình Minh','Tổng điểm hành trình · '+total,[['Chơi lại từ đầu',menu]]);return}
  panel('Đêm 0'+night+' · '+game.map.name,won?'Đảo đã sáng':'Đêm đã tàn','Điểm Đêm '+night+' · '+game.score,won?
    [['Sang Đêm '+(night+1),()=>intro((night+1) as Night)],['Về menu',menu]]:[['Chơi lại Đêm',start],['Về menu',menu]])
}
function paused(){
  overlay('paused');panel('Đêm 0'+night+' · '+game.map.name,'Tạm dừng','',[['Tiếp tục',resume],['Chơi lại Đêm',start],['Cài đặt',settings],['Về menu',menu]])
}
function resume(){game.step({pause:false});game.step({pause:true,move:[0,0],jump:false,dash:false,pulse:false,interact:false});play()}
function settings(){
  const back=screen==='paused'?paused:menu
  overlay('settings');panel('Đảo Đèn Lồng','Cài đặt','',[['Quay lại',back]])
  slider('volume','Âm lượng (%)',0,100,1,loud,v=>{loud=v;unlock();volume(v/100);chime('countdown')})
  slider('sensitivity','Độ nhạy chuột',.2,2,.1,sensitivity,v=>sensitivity=v)
}
window.addEventListener('blur',clear)
document.addEventListener('visibilitychange',()=>{clear();acc=0;previous=performance.now()})
window.addEventListener('keydown',e=>{
  if(screen==='paused'&&['Escape','KeyP'].includes(e.code)&&!e.repeat){resume();return}
  if(screen!=='playing')return
  if(['Space','ArrowLeft','ArrowRight','Escape'].includes(e.code))e.preventDefault()
  if(!e.repeat)pressed.add(e.code)
  held.add(e.code)
})
window.addEventListener('keyup',e=>held.delete(e.code))
el('world').oncontextmenu=e=>e.preventDefault()
el('world').onpointerdown=e=>{if(screen==='playing'&&e.button===0)void el('world').requestPointerLock()?.catch(()=>{});if(e.button===2)pressed.add('KeyQ')}
window.addEventListener('mousemove',e=>{if(screen==='playing'&&(document.pointerLockElement||e.buttons===1))yaw-=e.movementX*.003*sensitivity})
function step(){
  const down=(k:string)=>held.has(k)||pressed.has(k)
  yaw+=(Number(down('ArrowLeft'))-Number(down('ArrowRight')))*1.8/60
  const oldTime=Math.ceil(game.timeLeft),warn=game.windWarning
  game.step({move:[Number(down('KeyD'))-Number(down('KeyA')),Number(down('KeyS'))-Number(down('KeyW'))],cam_yaw_deg:yaw*180/Math.PI,jump:down('Space'),dash:down('ShiftLeft')||down('ShiftRight'),pulse:down('KeyQ'),interact:down('KeyE'),pause:down('KeyP')||down('Escape')})
  pressed.clear();view.events(game,game.events)
  for(const e of game.events)chime(e.name,game.player.carried)
  if(game.jumped)chime('jump')
  if(game.windWarning&&!warn)chime('wind')
  if(Math.ceil(game.timeLeft)!==oldTime&&game.timeLeft<=10)chime('countdown')
  if(game.state==='paused')paused()
  if(game.state==='won'||game.state==='lost')result()
}
function animate(now:number){
  const dt=Math.min((now-previous)/1000,.2);previous=now
  if(screen==='playing'&&!document.hidden){
    acc+=dt
    while(acc>=1/60&&screen==='playing'){acc-=1/60;step()}
  }
  view.draw(game,yaw,['menu','intro','choose'].includes(screen),now/1000,dt)
  if(screen==='playing')hud(game,view.indicator(game))
  requestAnimationFrame(animate)
}
menu();requestAnimationFrame(animate)
