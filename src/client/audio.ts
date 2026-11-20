let ctx:AudioContext|undefined,master:GainNode|undefined,level=.5,background:ReturnType<typeof setInterval>|undefined
export function volume(value:number){level=value;if(master&&ctx)master.gain.setTargetAtTime(level,ctx.currentTime,.025)}
export function unlock(){
  if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.connect(ctx.destination);master.gain.value=level}
  void ctx.resume()
}
function notes(freqs:number[],length=.38,gain=.09){
  if(!ctx||!master)return
  for(const [i,f] of freqs.entries()){
    const osc=ctx.createOscillator(),amp=ctx.createGain(),at=ctx.currentTime+i*.09
    osc.frequency.value=f;amp.gain.setValueAtTime(.0001,at);amp.gain.exponentialRampToValueAtTime(gain,at+.025);amp.gain.exponentialRampToValueAtTime(.0001,at+length)
    osc.connect(amp).connect(master);osc.start(at);osc.stop(at+length+.01)
  }
}
export function music(on:boolean){
  if(background){clearInterval(background);background=undefined}
  if(on){let i=0;const motif=[196,220,261.6,293.7,261.6,220]
    const play=()=>notes([motif[i++%motif.length],392],1.8,.027)
    play();background=setInterval(play,2100)}
}
export function chime(name:string,carried=0){
  const cues:Record<string,number[]>={mote_picked:[[392,440,523,587,659][carried%5]],charm_picked:[523,784],lantern_lit:[392,523,659],pulse:[220,440],player_hit:[147,98],jump:[294,392],dash:[440,880],won:[392,523,659,784],lost:[330,262,196],shade_spawned:[147,139],countdown:[660],wind:[330,370,415]}
  if(cues[name])notes(cues[name])
}
