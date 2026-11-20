import type {Game} from '../sim/engine.js'
export const el=(id:string)=>document.getElementById(id)!
export function panel(chapter:string,title:string,story:string,buttons:[string,()=>void][]){
  el('panel').hidden=false;el('chapter').textContent=chapter;el('title').textContent=title;el('story').textContent=story
  el('options').replaceChildren();el('actions').replaceChildren()
  for(const [label,fn] of buttons){const b=document.createElement('button');b.textContent=label;b.onclick=fn;el('actions').append(b)}
}
export function preference(key:string,fallback:number,min:number,max:number){
  try{const raw=localStorage.getItem(key),v=Number(raw);if(raw!==null&&Number.isFinite(v))return Math.max(min,Math.min(max,v))}catch{}
  return fallback
}
export function slider(key:string,label:string,min:number,max:number,step:number,value:number,apply:(n:number)=>void){
  const field=document.createElement('label'),input=document.createElement('input'),out=document.createElement('output')
  input.type='range';input.min=String(min);input.max=String(max);input.step=String(step);input.value=String(value);input.id=key
  out.textContent=input.value;field.append(label,input,out);el('options').append(field)
  input.oninput=()=>{apply(Number(input.value));out.textContent=input.value;try{localStorage.setItem(key,input.value)}catch{}}
}
export function hud(g:Game,angle:number|null){
  const sec=Math.ceil(g.timeLeft)
  el('time').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0')
  el('time').classList.toggle('urgent',g.timeLeft<=30)
  el('lamps').textContent=g.lanterns.filter(l=>l.lit).length+' / '+g.lanterns.length
  el('life').textContent='♥'.repeat(g.player.flames)+'♡'.repeat(3-g.player.flames);el('score').textContent=String(g.score)
  el('bag').textContent='●'.repeat(g.player.carried)+'○'.repeat(10-g.player.carried)
  el('dash').textContent='⇢ Lướt · '+(g.dashCd&&!g.charmTicks?(g.dashCd/60).toFixed(1)+'s':'Shift')
  el('pulse').textContent='✧ Tỏa sáng · '+(g.pulseCd?(g.pulseCd/60).toFixed(1)+'s':'Q')
  el('charm').textContent=g.charmTicks?'Bùa Gió · '+Math.ceil(g.charmTicks/60)+'s':''
  const l=g.interactLamp()
  el('prompt').textContent=l?'E — Nạp ánh sáng ('+l.deposited+'/10)':g.windWarning?'Lá bay · Gió mạnh sắp đến':g.wind.active?'Gió mạnh':''
  const arrow=el('arrow');arrow.hidden=angle===null
  if(angle!==null){const a=angle*Math.PI/180;arrow.style.left=(50+44*Math.sin(a))+'%';arrow.style.top=(50-31*Math.cos(a))+'%';arrow.style.transform='translate(-50%,-50%) rotate('+(angle-90)+'deg)'}
}
