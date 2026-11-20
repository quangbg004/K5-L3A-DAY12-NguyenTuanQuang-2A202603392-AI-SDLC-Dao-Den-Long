import {applyPreferences,accessSettings,keys,keyLabel} from './access.js'
import {rankings,scoreForm} from './scores.js'
import {benchmark} from './benchmark.js'
import {Game} from '../sim/engine.js'
import {maps} from '../sim/maps.js'
import type {Night} from '../sim/types.js'
import contract from '../../game.contract.json'
import {scene} from './scene.js'
import {chime,music,unlock,volume} from './audio.js'
import {el,hud,panel,preference,slider,colorPreference} from './ui.js'
import './style.css'

const view=scene(el('world')),held=new Set<string>(),pressed=new Set<string>()
let night:Night=1,game=new Game(contract.tuning),screen='menu',total=0,yaw=0,acc=0,previous=performance.now()
let loud=preference('volume',50,0,100),sensitivity=preference('sensitivity',1,.2,2)
let colorblind=preference('colorblind',0,0,1)===1,hitUntil=0
function applyPalette(enabled:boolean){colorblind=enabled;document.body.classList.toggle('colorblind',enabled)}
applyPalette(colorblind)
applyPreferences()
volume(loud/100)
let victories=0,spawnUntil=0,spawnId=''
const quotes=['Hãy theo những đốm sáng về bến. Giữ ít nhất ba đèn sáng cho tới bình minh.','Cầu tre nối đôi bờ. Nếu nghe tiếng gió lùa qua cau, con nhớ giữ chặt túi đom đóm.','Trên tầng đá cao nhất có một tháp chuông. Giữ ít nhất năm ngọn đèn sáng đến bình minh.']
function clear(){held.clear();pressed.clear()}
function overlay(next:string){
  screen=next;clear();music(false);el('prompt').textContent='';el('hud').hidden=true
  document.body.classList.remove('in-game');document.exitPointerLock?.()
}
function menu(){
  overlay('menu');night=1;total=0;victories=0;game=new Game(contract.tuning);view.reset()
  panel('Ba hòn đảo','Đảo Đèn Lồng','Theo chân Mây qua ba đêm, nhặt đom đóm và thắp lại những ngọn đèn giữa biển mây.',[
    ['Bắt đầu hành trình',()=>intro(1)],['Chọn Đêm',choose],['Bảng xếp hạng',()=>{overlay('rankings');void rankings(menu)}],['Cài đặt',settings]])
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
function start(){game=new Game(contract.tuning,42,{},night);yaw=0;hitUntil=0;spawnUntil=0;view.reset();play()}
function result(){
  const won=game.state==='won'
  overlay('result');chime(game.state)
  if(won){total+=game.score;victories++}
  if(won&&night===3){panel('Hành trình hoàn tất','Bình Minh','Tổng điểm hành trình · '+total,[['Chơi lại từ đầu',menu]]);scoreForm(total,victories);return}
  panel('Đêm 0'+night+' · '+game.map.name,won?'Đảo đã sáng':'Đêm đã tàn','Điểm Đêm '+night+' · '+game.score,won?
    [['Sang Đêm '+(night+1),()=>intro((night+1) as Night)],['Về menu',menu]]:[['Chơi lại Đêm',start],['Về menu',menu]])
  if(!won)scoreForm(total,victories)
}
function paused(){
  overlay('paused');panel('Đêm 0'+night+' · '+game.map.name,'Tạm dừng','',[['Tiếp tục',resume],['Chơi lại Đêm',start],['Cài đặt',settings],['Về menu',menu]])
}
function resume(){game.releaseControls();game.step({pause:true});game.releaseControls();play()}
function settings(){
  const back=screen==='paused'?paused:menu
  overlay('settings');panel('Đảo Đèn Lồng','Cài đặt','',[['Quay lại',back]])
  slider('volume','Âm lượng (%)',0,100,1,loud,v=>{loud=v;unlock();volume(v/100);chime('countdown')})
  colorPreference(colorblind,applyPalette)
  accessSettings()
  slider('sensitivity','Độ nhạy chuột',.2,2,.1,sensitivity,v=>sensitivity=v)
}
window.addEventListener('blur',clear)
document.addEventListener('visibilitychange',()=>{clear();acc=0;previous=performance.now()})
window.addEventListener('keydown',e=>{
  if(screen==='paused'&&['Escape',keys.pause].includes(e.code)&&!e.repeat){resume();return}
  if(screen!=='playing')return
  if(['Space','ArrowLeft','ArrowRight','Escape'].includes(e.code))e.preventDefault()
  if(!e.repeat)pressed.add(e.code)
  held.add(e.code)
})
window.addEventListener('keyup',e=>held.delete(e.code))
el('world').oncontextmenu=e=>e.preventDefault()
el('world').onpointerdown=e=>{if(screen==='playing'&&e.button===0)void el('world').requestPointerLock()?.catch(()=>{});if(e.button===2)pressed.add(keys.pulse)}
window.addEventListener('mousemove',e=>{if(screen==='playing'&&(document.pointerLockElement||e.buttons===1))yaw-=e.movementX*.003*sensitivity})
function step(){
  const down=(k:string)=>held.has(k)||pressed.has(k)
  yaw+=(Number(down('ArrowLeft'))-Number(down('ArrowRight')))*1.8/60
  const oldTime=Math.ceil(game.timeLeft),warn=game.windWarning
  game.step({move:[Number(down(keys.right))-Number(down(keys.left)),Number(down(keys.back))-Number(down(keys.forward))],cam_yaw_deg:yaw*180/Math.PI,jump:down(keys.jump),dash:down(keys.dash)||(keys.dash==='ShiftLeft'&&down('ShiftRight')),pulse:down(keys.pulse),interact:down(keys.interact),pause:down(keys.pause)||down('Escape')})
  pressed.clear();view.events(game,game.events)
  for(const e of game.events){
    chime(e.name,game.player.carried)
    if(e.name==='shade_spawned'){spawnId=String(e.data.id);spawnUntil=game.simTick+150}
    if(e.name==='player_hit')hitUntil=game.simTick+90
  }
  if(game.jumped)chime('jump')
  if(game.windWarning&&!warn)chime('wind')
  if(Math.ceil(game.timeLeft)!==oldTime&&game.timeLeft<=10&&game.timeLeft>0)chime('countdown')
  if(game.state==='paused')paused()
  if(game.state==='won'||game.state==='lost')result()
}
function animate(now:number){
  const dt=Math.min((now-previous)/1000,.2);previous=now
  if(screen==='playing'&&!document.hidden){
    acc+=dt
    while(acc>=1/60&&screen==='playing'){acc-=1/60;step()}
  }
  view.draw(game,yaw,['menu','intro','choose'].includes(screen),now/1000,dt,colorblind)
  if(screen==='playing'){
    const spawn=game.simTick<spawnUntil?game.shades.find(s=>s.id===spawnId):undefined
    el('arrow').style.color=spawn?(colorblind?'#00B3FF':'#7A3CFF'):''
    const angle=spawn?Math.atan2(spawn.pos[0]-game.player.pos[0],game.player.pos[2]-spawn.pos[2])*180/Math.PI+yaw*180/Math.PI:view.indicator(game)
    hud(game,angle,colorblind,game.simTick<hitUntil)
    const messages=[]
    if(spawn)messages.push('Bóng Mực xuất hiện ➤')
    if(game.windWarning)messages.push('Gió mạnh sắp đến')
    if(game.timeLeft<=10)messages.push('Còn '+Math.ceil(game.timeLeft)+' giây')
    const weak=game.lanterns.filter(l=>l.lit&&!game.isSafe(l))
    if(weak.length)messages.push((colorblind?'⚠ ':'')+'Đèn sắp cạn dầu · '+weak.map(l=>l.id).join(', '))
    el('captions').textContent=messages.join('　')
    if(el('prompt').textContent?.startsWith('E —'))el('prompt').textContent=keyLabel(keys.interact)+el('prompt').textContent!.slice(1)
    if(!game.dashCd||game.charmTicks)el('dash').textContent='⇢ Lướt · '+keyLabel(keys.dash)
    if(!game.pulseCd)el('pulse').textContent='✧ Tỏa sáng · '+keyLabel(keys.pulse)
  }
  requestAnimationFrame(animate)
}
const params=new URLSearchParams(location.search)
if(params.get('bench')==='1')benchmark(view,params)
else{menu();requestAnimationFrame(animate)}
