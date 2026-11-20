import {el,panel} from './ui.js'
import type {Entry} from '../sim/leaderboard.js'
async function scores(newEntry?:Omit<Entry,'achieved_at'>):Promise<Entry[]>{
  const response=await fetch('/api/leaderboard',newEntry?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newEntry)}:{})
  if(response.ok&&response.headers.get('content-type')?.includes('application/json'))return (await response.json()).entries
  if(![404,405,501].includes(response.status)&&!response.headers.get('content-type')?.includes('text/html'))throw Error('Không thể truy cập bảng điểm')
  const rows:Entry[]=JSON.parse(localStorage.getItem('scores')||'[]')
  if(!newEntry)return rows
  rows.push({...newEntry,achieved_at:new Date().toISOString()})
  const top=rows.sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10)
  localStorage.setItem('scores',JSON.stringify(top));return top
}
export async function rankings(back:()=>void){
  panel('Điểm trên máy','Bảng xếp hạng','',[['Về menu',back]])
  const table=document.createElement('table');el('options').append(table)
  try{
    const rows=await scores()
    if(!rows.length){table.createCaption().textContent='Chưa có điểm đã lưu.';return}
    for(const row of [['Hạng','Tên','Điểm','Đêm','Thời gian','Seed'],...rows.map((e,i)=>[i+1,e.name,e.score,e.nights_won,new Date(e.achieved_at).toLocaleString('vi'),e.seed])]){
      const tr=table.insertRow();for(const cell of row)tr.insertCell().textContent=String(cell)
    }
  }catch{table.createCaption().textContent='Không đọc được bảng điểm.'}
}
export function scoreForm(score:number,nights_won:number){
  const form=document.createElement('form'),input=document.createElement('input'),label=document.createElement('label'),button=document.createElement('button'),status=document.createElement('p')
  label.textContent='Tên người chơi';input.required=true;label.append(input);button.textContent='Lưu điểm'
  status.setAttribute('role','status');form.append(label,button,status);el('options').append(form)
  form.onsubmit=async e=>{
    e.preventDefault()
    const name=input.value.trim().normalize('NFC')
    if(!/^[\p{L}0-9_]{3,12}$/u.test(name)){status.textContent='Tên cần 3–12 chữ cái, chữ số hoặc dấu gạch dưới.';return}
    button.disabled=true
    try{await scores({name,score,nights_won,seed:42});status.textContent='Đã lưu '+score+' điểm.';input.disabled=true}
    catch{button.disabled=false;status.textContent='Lưu điểm thất bại. Vui lòng thử lại.'}
  }
}
