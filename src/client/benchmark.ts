import type {scene} from './scene.js'
import {Game} from '../sim/engine.js'
import contract from '../../game.contract.json'
export function benchmark(view:ReturnType<typeof scene>,params:URLSearchParams){
  const game=Game.createBench(contract.tuning,Number(params.get('seed')??42))
  const duration=Number(params.get('duration')??30)*1000
  document.querySelectorAll<HTMLElement>('header,footer,#panel,#hud,#prompt').forEach(el=>el.hidden=true)
  const samples:number[]=[]
  let start:number|undefined,last=0,measuring=false,measuredFrom=0,acc=0
  function frame(now:number){
    const first=start===undefined
    start??=now
    const elapsed=now-start,dt=first?0:now-last
    acc+=dt
    while(acc>=1000/60){game.step();acc-=1000/60}
    view.draw(game,0,false,elapsed/1000,dt/1000,false)
    if(first)Object.assign(window,{benchFirst:performance.timeOrigin+performance.now()})
    if(measuring)samples.push(dt)
    else if(elapsed>=3000){measuring=true;measuredFrom=now}
    last=now
    if(!measuring||now-measuredFrom<duration){requestAnimationFrame(frame);return}
    const sorted=samples.slice().sort((a,b)=>b-a),n=samples.length,k=Math.max(1,Math.ceil(n*.01))
    const gl=document.querySelector('canvas')!.getContext('webgl2')!,info=gl.getExtension('WEBGL_debug_renderer_info')
    const sum=(a:number[])=>a.reduce((x,y)=>x+y,0)
    Object.assign(window,{benchDone:{frames:n,avg_fps:1000*n/sum(samples),p1_low_fps:1000*k/sum(sorted.slice(0,k)),frame_ms_p95:sorted[n-Math.ceil(.95*n)],
      renderer:'Three.js r170 WebGL2 · '+gl.getParameter(info?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)}})
  }
  requestAnimationFrame(frame)
}
