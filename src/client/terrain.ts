import * as T from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {colors as c} from './palette.js'
import {maps} from '../sim/maps.js'
import {mulberry32} from '../sim/rng.js'
import type {Night} from '../sim/types.js'
export function terrain(n:Night){
  const group=new T.Group(),batches=new Map<string,T.BufferGeometry[]>(),rand=mulberry32(142+n)
  function add(geom:T.BufferGeometry,color:string,x:number,y:number,z:number,yaw=0,pitch=0){
    geom.rotateZ(pitch);geom.rotateY(yaw);geom.translate(x,y,z)
    const batch=batches.get(color)??[];batch.push(geom.index?geom.toNonIndexed():geom);batches.set(color,batch)
  }
  for(const [cx,r] of maps[n].islands){
    add(new T.CylinderGeometry(r,r-4,4,80),c.sand,cx,-2.04,0)
    add(new T.CylinderGeometry(r-.15,r,.18,80),c.grass,cx,-.09,0)
    add(new T.ConeGeometry(r-4,11,25).rotateZ(Math.PI),c.cloud,cx,-9.5,0)
    for(let i=0;i<26;i++){
      const a=rand()*Math.PI*2,d=r-1-rand()*3,x=cx+Math.cos(a)*d,z=Math.sin(a)*d,h=1.8+rand()*2
      if(n===2&&Math.abs(z)<3)continue
      add(new T.CylinderGeometry(.13,.23,h,5),c.wood,x,h/2,z)
      add(new T.ConeGeometry(h*.52,h*1.35,7),c.grass,x,h,z)
      add(new T.ConeGeometry(h*.37,h,7),'#48867a',x,h*1.55,z)
    }
  }
  if(n===2){
    for(let i=0;i<45;i++)add(new T.CylinderGeometry(.21,.21,4,7).rotateX(Math.PI/2),c.wood,26+.4*i,-.15,0)
  }
  if(n===3){
    const shape=new T.Shape()
    shape.absarc(0,0,24,0,Math.PI,false);shape.lineTo(-12,0);shape.absarc(0,0,12,Math.PI,0,true);shape.closePath()
    const shelf=new T.ExtrudeGeometry(shape,{depth:3,bevelEnabled:false,curveSegments:48})
    shelf.rotateX(Math.PI/2);add(shelf,c.grass,0,3,0)
    add(new T.CylinderGeometry(8,8,6,64),c.grass,0,3,0)
    for(const deg of [30,150]){
      const a=deg*Math.PI/180
      const ramp=new T.BoxGeometry(Math.hypot(6,3),.16,3)
      add(ramp,c.sand,27*Math.cos(a),1.42,27*Math.sin(a),-a,-Math.atan(.5))
    }
    add(new T.CylinderGeometry(1.5,2,6,8),c.wood,0,9,0)
    add(new T.CylinderGeometry(.8,1.35,1.4,12),c.gold,0,12.6,0)
    add(new T.ConeGeometry(2.2,1.4,8),c.red,0,13.3,0)
  }
  for(const p of maps[n].pads)add(new T.CylinderGeometry(1,1,.09,24),c.gold,p.pos[0],p.pos[1]+.045,p.pos[2])
  for(const [color,geos] of batches){
    const merged=mergeGeometries(geos)
    group.add(new T.Mesh(merged,new T.MeshLambertMaterial({color,flatShading:true})))
    geos.forEach(g=>g.dispose())
  }
  return group
}
