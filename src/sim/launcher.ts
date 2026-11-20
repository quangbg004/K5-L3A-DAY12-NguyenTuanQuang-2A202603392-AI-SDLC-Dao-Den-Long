import {parseArgs} from 'node:util'
import {writeFileSync} from 'node:fs'
import type {AddressInfo} from 'node:net'
import {entries} from './leaderboard.js'
import {serve} from './server.js'
const {values}=parseArgs({options:{port:{type:'string',default:'4173'},'export-leaderboard':{type:'string'}}})
if(values['export-leaderboard'])writeFileSync(values['export-leaderboard'],JSON.stringify({entries:entries()},null,2)+'\n')
else{
  const server=serve(Number(values.port))
  server.on('listening',()=>console.log('http://127.0.0.1:'+(server.address() as AddressInfo).port))
}
