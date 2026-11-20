import {existsSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'
export type Entry={name:string,score:number,nights_won:number,achieved_at:string,seed:number}
const folder=process.env.DAO_DEN_LONG_DATA_DIR||join(homedir(),'.dao-den-long')
const file=join(folder,'leaderboard.json')
export function entries():Entry[]{return existsSync(file)?JSON.parse(readFileSync(file,'utf8')).entries:[]}
export function save(data:Partial<Entry>){
  const name=data.name?.normalize('NFC')??'',{score,nights_won,seed}=data
  if(!/^[\p{L}0-9_]{3,12}$/u.test(name)||!Number.isSafeInteger(score)||score!<0||!Number.isInteger(nights_won)||nights_won!<0||nights_won!>3||!Number.isSafeInteger(seed))throw Error('Tên hoặc điểm không hợp lệ')
  const ranked=[...entries(),{name,score:score!,nights_won:nights_won!,seed:seed!,achieved_at:new Date().toISOString()}]
    .sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)).slice(0,10)
  mkdirSync(folder,{recursive:true})
  const tmp=file+'.'+process.pid+'.tmp'
  writeFileSync(tmp,JSON.stringify({entries:ranked},null,2))
  renameSync(tmp,file)
  return ranked
}
