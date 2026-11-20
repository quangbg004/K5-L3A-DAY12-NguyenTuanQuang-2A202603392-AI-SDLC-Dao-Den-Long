import {createServer} from 'node:http'
import {readFile} from 'node:fs/promises'
import {resolve,sep,extname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {entries,save} from './leaderboard.js'
const root=fileURLToPath(new URL('../dist/',import.meta.url))
export function serve(port:number){
  const server=createServer(async(req,res)=>{
    try{
      const path=new URL(req.url??'/','http://localhost').pathname
      if(path==='/api/leaderboard'){
        res.setHeader('Content-Type','application/json')
        if(req.method==='GET'){res.end(JSON.stringify({entries:entries()}));return}
        if(req.method!=='POST'){res.writeHead(405).end();return}
        if(req.headers.origin && req.headers.origin!=='http://'+req.headers.host){res.writeHead(403).end();return}
        if(!req.headers['content-type']?.startsWith('application/json')){res.writeHead(415).end();return}
        let body=''
        for await(const chunk of req){body+=chunk;if(body.length>4096){res.writeHead(413).end();return}}
        res.end(JSON.stringify({entries:save(JSON.parse(body))}));return
      }
      if(req.method!=='GET'){res.writeHead(405).end();return}
      const file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path))
      if(!file.startsWith(resolve(root)+sep)){res.writeHead(403).end();return}
      const types:Record<string,string>={'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.png':'image/png','.json':'application/json'}
      const bytes=await readFile(file)
      res.writeHead(200,{'Content-Type':types[extname(file)]??'application/octet-stream'}).end(bytes)
    }catch(error){res.writeHead((error as NodeJS.ErrnoException).code==='ENOENT'?404:400).end('Invalid request')}
  })
  return server.listen(port,'127.0.0.1')
}
