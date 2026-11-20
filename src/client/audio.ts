let ctx:AudioContext|undefined
export let enabled=true
export function unlock(){ctx??=new AudioContext();void ctx.resume()}
export function toggle(){enabled=!enabled;return enabled}
export function chime(name:string,carried:number){
  if(!ctx||!enabled) return
  const scale=[392,440,523.25,587.33,659.25]
  const notes=name==='lantern_lit'?[392,523.25,659.25]:name==='pulse'?[220,440]:
    name==='mote_picked'?[scale[(carried+4)%5]]:[]
  const context=ctx
  notes.forEach((hz,i)=>{
    const osc=context.createOscillator(),gain=context.createGain(),start=context.currentTime+i*.07
    osc.frequency.value=hz
    gain.gain.setValueAtTime(.0001,start)
    gain.gain.exponentialRampToValueAtTime(.08,start+.018)
    gain.gain.exponentialRampToValueAtTime(.0001,start+.65)
    osc.connect(gain).connect(context.destination)
    osc.start(start);osc.stop(start+.7)
  })
}
