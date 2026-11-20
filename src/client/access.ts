import {el} from './ui.js'
const defaults={forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',dash:'ShiftLeft',interact:'KeyE',pulse:'KeyQ',pause:'KeyP'}
type Action=keyof typeof defaults
const labels:Record<Action,string>={forward:'Tiến',back:'Lùi',left:'Trái',right:'Phải',jump:'Nhảy',dash:'Lướt',interact:'Nạp đèn',pulse:'Tỏa sáng',pause:'Tạm dừng'}
const actions=Object.keys(defaults) as Action[]
export const keys={...defaults}
export const keyLabel=(code:string)=>code.replace(/^Key/,'').replace('ShiftLeft','Shift')
try{
  const saved=JSON.parse(localStorage.getItem('keybindings')||'null')
  if(saved&&actions.every(a=>typeof saved[a]==='string')&&new Set(actions.map(a=>saved[a])).size===9)Object.assign(keys,saved)
}catch{}
function persist(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
export function applyPreferences(){
  for(const id of ['reduced-motion','large-text']){
    try{document.body.classList.toggle(id,localStorage.getItem(id)==='true')}catch{}
  }
  document.querySelector('footer')!.textContent=actions.map(a=>keyLabel(keys[a])+' · '+labels[a]).join('　')
}
export function accessSettings(){
  for(const [id,title] of [['reduced-motion','Giảm chuyển động'],['large-text','Chữ lớn (×1.25)']]){
    const label=document.createElement('label'),input=document.createElement('input')
    label.className='palette-setting';input.type='checkbox';input.checked=document.body.classList.contains(id)
    input.onchange=()=>{persist(id,String(input.checked));document.body.classList.toggle(id,input.checked)}
    label.append(input,title);el('options').append(label)
  }
  const group=document.createElement('fieldset'),legend=document.createElement('legend'),feedback=document.createElement('p')
  legend.textContent='Phím điều khiển';feedback.setAttribute('role','status');group.append(legend)
  const buttons=new Map<Action,HTMLButtonElement>()
  const refresh=()=>{for(const [a,b] of buttons)b.textContent=labels[a]+' · '+keyLabel(keys[a])}
  for(const a of actions){
    const b=document.createElement('button');buttons.set(a,b);group.append(b)
    b.onclick=()=>{refresh();b.dataset.wait='1';b.textContent=labels[a]+' · Nhấn phím mới';b.focus()}
    b.onblur=()=>{delete b.dataset.wait;refresh()}
    b.onkeydown=e=>{
      if(!b.dataset.wait)return
      e.preventDefault();e.stopPropagation()
      if(actions.some(other=>other!==a&&keys[other]===e.code)||['Escape','ArrowLeft','ArrowRight','ShiftRight','Tab'].includes(e.code)){
        feedback.textContent='Phím đang được sử dụng. Hãy chọn phím khác.';return
      }
      keys[a]=e.code;persist('keybindings',JSON.stringify(keys));delete b.dataset.wait;feedback.textContent='Đã lưu phím.';refresh();applyPreferences()
    }
  }
  const reset=document.createElement('button');reset.textContent='Khôi phục mặc định'
  reset.onclick=()=>{Object.assign(keys,defaults);persist('keybindings',JSON.stringify(keys));refresh();applyPreferences();feedback.textContent='Đã khôi phục phím mặc định.'}
  refresh();group.append(reset,feedback);el('options').append(group)
}
