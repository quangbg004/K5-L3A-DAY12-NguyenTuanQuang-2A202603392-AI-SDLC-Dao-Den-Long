import type {Night,Pos} from './types.js'
export type IslandMap = {
  name:string, islands:[number,number][], spawn:Pos, lamps:Pos[], motes:Pos[], mist:Pos[], charms:Pos[],
  pads:{pos:Pos, velocity:Pos}[], interval:number, limit:number
}
function ring(n:number,r:number,start=0,step=360/n,cx=0,y=0):Pos[]{
  return Array.from({length:n},(_,i)=>{const a=(start+i*step)*Math.PI/180;return [cx+r*Math.cos(a),y,r*Math.sin(a)]})
}
function launch(x:number,z:number,target:number):Pos{
  const d=Math.hypot(target-x,z)
  return [(target-x)*24/d,14,-z*24/d]
}
export const maps:Record<Night,IslandMap>={
  1:{name:'Đảo Bến',islands:[[0,40]],spawn:[0,0,0],lamps:[[0,0,25],[23.8,0,7.7],[14.7,0,-20.2],[-14.7,0,-20.2],[-23.8,0,7.7]],
    motes:[...ring(8,12),...ring(16,33)],mist:ring(12,37,15),pads:[],charms:[],interval:480,limit:6},
  2:{name:'Đảo Cau',islands:[[0,28],[70,28]],spawn:[0,0,0],lamps:[[0,0,20],[17,0,-10],[-17,0,-10],[70,0,20],[87,0,-10],[53,0,-10]],
    motes:[0,70].flatMap(x=>[...ring(4,10,0,90,x),...ring(8,22,0,45,x)]),mist:[0,70].flatMap(x=>ring(8,26,22.5,45,x)),
    pads:[{pos:[20,0,18],velocity:launch(20,18,70)},{pos:[50,0,-18],velocity:launch(50,-18,0)}],charms:[[35,0,0]],interval:420,limit:8},
  3:{name:'Đảo Chuông',islands:[[0,45]],spawn:[0,0,34],lamps:[[0,6,6],[18,3,10],[-18,3,10],[35,0,-10],[-35,0,-10],[20,0,-35],[-20,0,-35]],
    motes:[...ring(18,34),...ring(8,18,20,20,0,3),...ring(4,5,45,90,0,6)],mist:ring(16,43),
    pads:[{pos:[0,3,13],velocity:[0,12,-8]}],charms:[[30,0,25],[-30,0,25]],interval:360,limit:10}
}
export const distance=(a:Pos,b:Pos)=>Math.hypot(a[0]-b[0],a[2]-b[2])
export function direction(a:Pos,b:Pos):[number,number]{
  const d=distance(a,b)
  return d?[(b[0]-a[0])/d,(b[2]-a[2])/d]:[1,0]
}
export function ground(n:Night,x:number,z:number){
  if(n===2 && x>=26 && x<=44 && Math.abs(z)<=2)return 0
  if(!maps[n].islands.some(([cx,r])=>Math.hypot(x-cx,z)<=r))return -Infinity
  if(n!==3)return 0
  const r=Math.hypot(x,z)
  if(r<=8)return 6
  if(r>=12&&r<=24&&z>0)return 3
  for(const degrees of [30,150]){
    const a=degrees*Math.PI/180,u=x*Math.cos(a)+z*Math.sin(a),v=z*Math.cos(a)-x*Math.sin(a)
    if(u>=23.9 && u<=30 && Math.abs(v)<=1.5)return Math.min(3,(30-u)/2)
  }
  return 0
}
export function slide(n:Night,p:Pos,dx:number,dz:number){
  const x=p[0]+dx,z=p[2]+dz
  if(n===3 && Math.hypot(x,z)<2 && p[1]<14)return
  const level=ground(n,x,z)
  if(level>p[1]+Math.hypot(dx,dz)*.51+.00001)return
  p[0]=x;p[2]=z
}
