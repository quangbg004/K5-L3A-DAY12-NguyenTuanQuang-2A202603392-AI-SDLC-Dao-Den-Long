import * as T from 'three'
import type {Game} from '../sim/engine.js'
import type {Entity,GameEvent} from '../sim/types.js'
import {mulberry32} from '../sim/rng.js'
import {colors as c} from './palette.js'
import {terrain} from './terrain.js'
const palette=new Map<string,T.MeshStandardMaterial>()
function mesh(geo:T.BufferGeometry,color:string,parent:T.Object3D,x=0,y=0,z=0){
  if(!palette.has(color)) palette.set(color,new T.MeshStandardMaterial({color,flatShading:true}))
  const obj=new T.Mesh(geo,palette.get(color))
  obj.position.set(x,y,z);parent.add(obj);return obj
}
const ball=new T.IcosahedronGeometry(1,0), glow=new T.SphereGeometry(.19,8,6)
function ellipsoid(parent:T.Object3D,c:string,x:number,y:number,z:number,w:number,h:number,d:number){
  const obj=mesh(ball,c,parent,x,y,z);obj.scale.set(w,h,d);return obj
}
function lamp(parent:T.Object3D,size:number){
  const group=new T.Group();parent.add(group)
  const shade=mesh(new T.SphereGeometry(.85,10,6),c.lit,group)
  shade.scale.y=1.2
  for(const y of [-.94,.94])mesh(new T.CylinderGeometry(.38,.38,.2,8),'#77463a',group,0,y)
  mesh(new T.ConeGeometry(.16,.55,6),'#ce723e',group,0,-1.28)
  group.scale.setScalar(size)
  return {group,shade}
}
export function scene(host:HTMLElement){
  const r=new T.WebGLRenderer({antialias:false,alpha:false,powerPreference:'high-performance'})
  r.setPixelRatio(1);host.append(r.domElement)
  const world=new T.Scene(), camera=new T.PerspectiveCamera(48,1,.1,260)
  const fog=new T.FogExp2(c.fog,.009);world.fog=fog;world.background=new T.Color(c.sky)
  const sky=new T.AmbientLight(0xffffff,.15);world.add(sky)
  const sun=new T.DirectionalLight(0xffdbad,2);sun.position.set(-25,45,25);world.add(sun)
  const rand=mulberry32(317)
  const terrains=[terrain(1),terrain(2),terrain(3)]
  world.add(...terrains)
  const clouds=new T.InstancedMesh(ball,new T.MeshLambertMaterial({color:c.cloud}),85)
  const cloud=new T.Object3D()
  for(let i=0;i<clouds.count;i++){
    const a=rand()*Math.PI*2,d=52+rand()*85
    cloud.position.set(Math.cos(a)*d,-13-rand()*3,Math.sin(a)*d)
    cloud.scale.set(7+rand()*10,2+rand()*3,10);cloud.updateMatrix();clouds.setMatrixAt(i,cloud.matrix)
  }
  world.add(clouds)
  const stars=[]
  for(let i=0;i<1300;i++) stars.push((rand()-.5)*290,rand()*102+5,(rand()-.5)*290)
  const starGeo=new T.BufferGeometry()
  starGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3))
  world.add(new T.Points(starGeo,new T.PointsMaterial({color:0xffead3,size:.24,fog:false})))
  const hero=new T.Group();world.add(hero)
  ellipsoid(hero,c.coat,0,.85,0,.53,.78,.44)
  ellipsoid(hero,'#efbc8e',0,1.64,0,.39,.41,.37)
  mesh(new T.ConeGeometry(.85,.62,14),'#e2b978',hero,0,2.1)
  ellipsoid(hero,c.red,0,1.3,0,.48,.14,.42)
  const charm=lamp(hero,.24).group;charm.position.set(.65,1.53,0)
  const lamps:Array<ReturnType<typeof lamp>>=[]
  const halos:T.Mesh[]=[]
  for(let i=0;i<7;i++){
    const pole=new T.Group();world.add(pole)
    mesh(new T.CylinderGeometry(1.35,1.65,.55,8),'#77766f',pole,0,.26)
    mesh(new T.CylinderGeometry(.23,.34,4.8,8),c.wood,pole,0,2.4)
    mesh(new T.BoxGeometry(2.25,.26,.29),c.wood,pole,.75,4.7)
    const l=lamp(pole,.98);l.group.position.set(1.48,3.48,0);lamps.push(l)
    const halo=new T.Mesh(new T.CircleGeometry(6,48),new T.MeshBasicMaterial({color:0xffbf62,transparent:true,opacity:.19,depthWrite:false}))
    halo.rotation.x=-Math.PI/2;halo.position.y=.07;pole.add(halo);halos.push(halo)
  }
  const litMat=new T.MeshStandardMaterial({color:c.lit,emissive:c.core,emissiveIntensity:1.3}),darkMat=new T.MeshStandardMaterial({color:c.unlit})
  const moteMat=new T.MeshBasicMaterial({color:c.mote})
  const moteObjects=new Map<string,T.Object3D>(),shadeObjects=new Map<string,T.Object3D>()
  const effects:{obj:T.Object3D,age:number,sky:boolean}[]=[]
  const ringGeo=new T.RingGeometry(.95,1,64), ringMat=new T.MeshBasicMaterial({color:0xffdf93,side:T.DoubleSide})
  const stunnedMat=new T.MeshStandardMaterial({color:c.stun})
  const trinkets=new Map<string,T.Object3D>()
  function extras(g:Game,time:number){
    const visible=new Set<string>()
    for(const entity of [...g.charms.filter(token=>token.ready<=g.simTick),...g.drifters]){
      visible.add(entity.id)
      let obj=trinkets.get(entity.id)
      if(!obj){
        obj=new T.Group();world.add(obj);trinkets.set(entity.id,obj)
        if('stolen' in entity){
          for(let i=0;i<4;i++)ellipsoid(obj,c.drifter,i*.33-.5,Math.sin(i)*.2,0,.32,.13,.16)
        }else{
          mesh(new T.BoxGeometry(.55,.87,.1),c.gold,obj)
          mesh(new T.BoxGeometry(.43,.72,.12),c.red,obj)
        }
      }
      obj.position.set(entity.pos[0],entity.pos[1]+.8+.16*Math.sin(time*3),entity.pos[2]);obj.rotation.y=time
    }
    for(const [id,obj] of trinkets)if(!visible.has(id)){world.remove(obj);trinkets.delete(id)}
  }
  const leaves=new T.InstancedMesh(ball,new T.MeshBasicMaterial({color:c.gold}),30)
  world.add(leaves)
  const trail=ellipsoid(hero,c.halo,0,.7,-.8,.35,.23,1.1)
  function sync(entities:Entity[],map:Map<string,T.Object3D>,mote:boolean,time:number){
    const active=new Set(entities.map(e=>e.id))
    for(const [id,o] of map)if(!active.has(id)){world.remove(o);map.delete(id)}
    entities.forEach((e,i)=>{
      let obj=map.get(e.id)
      if(!obj){
        obj=new T.Group();world.add(obj);map.set(e.id,obj)
        if(mote){
          obj.add(new T.Mesh(glow,moteMat))
          for(const side of [-1,1])ellipsoid(obj,c.halo,side*.19,.11,0,.17,.1,.07)
        }else{
          ellipsoid(obj,c.shade,0,.2,0,.72,.9,.64)
          for(const side of [-1,1])ellipsoid(obj,c.rim,side*.23,.3,.52,.095,.13,.08)
        }
      }
      obj.position.set(e.pos[0],e.pos[1]+.83+.17*Math.sin(time*3+i),e.pos[2])
      if(!mote) obj.rotation.y=Math.atan2(hero.position.x-obj.position.x,hero.position.z-obj.position.z)
      if('state' in e){
        obj.rotation.z=e.state==='stunned'?.9:0
        const body=obj.children[0] as T.Mesh
        body.material=e.state==='stunned'?stunnedMat:palette.get(c.shade)!
      }
    })
  }
  function events(game:Game,events:GameEvent[]){
    for(const e of events){
      if(e.name==='pulse'){
        const ring=new T.Mesh(ringGeo,ringMat);world.add(ring);ring.rotation.x=-Math.PI/2
        ring.position.copy(hero.position);ring.position.y+=.28;effects.push({obj:ring,age:0,sky:false})
      }
      if(e.name==='lantern_lit'){
        const l=game.lanterns.find(l=>l.id===e.data.lantern_id)!
        const obj=lamp(world,.6);obj.shade.material=litMat
        obj.group.position.set(l.pos[0],l.pos[1]+5,l.pos[2]);effects.push({obj:obj.group,age:0,sky:true})
      }
    }
  }
  function draw(g:Game,yaw:number,overview:boolean,time:number,dt:number){
    const w=host.clientWidth,h=host.clientHeight
    if(r.domElement.width!==Math.floor(w*r.getPixelRatio())||r.domElement.height!==Math.floor(h*r.getPixelRatio()))r.setSize(w,h,false)
    camera.aspect=w/h;camera.updateProjectionMatrix()
    hero.position.set(...g.player.pos);hero.rotation.y=Math.atan2(g.facing[0],g.facing[1]);charm.rotation.z=.14*Math.sin(time*3)
    terrains.forEach((t,i)=>t.visible=i+1===g.night)
    lamps.forEach((l,i)=>l.group.parent!.visible=i<g.lanterns.length)
    extras(g,time);trail.visible=g.dashLeft>0
    leaves.visible=g.windWarning||g.wind.active
    if(leaves.visible)for(let i=0;i<leaves.count;i++){
      const a=g.wind.dir_deg*Math.PI/180,u=(i*17+time*6)%22-11,v=(i*13)%17-8
      cloud.position.set(hero.position.x+u*Math.cos(a)-v*Math.sin(a),hero.position.y+1+i%5,hero.position.z+u*Math.sin(a)+v*Math.cos(a))
      cloud.scale.set(.18,.025,.07);cloud.rotation.y=time+i;cloud.updateMatrix();leaves.setMatrixAt(i,cloud.matrix);leaves.instanceMatrix.needsUpdate=true
    }
    g.lanterns.forEach((l,i)=>{
      lamps[i].group.parent!.position.set(...l.pos)
      lamps[i].shade.material=l.lit?litMat:darkMat;halos[i].visible=l.lit
    })
    const lit=g.lanterns.filter(l=>l.lit).length
    sky.intensity=.15+.55*lit/g.lanterns.length;fog.density=.009-lit*.001
    clouds.rotation.y=time*.003
    sync(g.motes,moteObjects,true,time);sync(g.shades,shadeObjects,false,time)
    for(let i=effects.length-1;i>=0;i--){
      const e=effects[i];e.age+=dt
      if(e.sky)e.obj.position.y+=dt*2
      else e.obj.scale.setScalar(Math.min(1,e.age/.45)*g.t.pulse_radius)
      if(e.age>(e.sky?12:.45)){world.remove(e.obj);effects.splice(i,1)}
    }
    if(overview){
      if(g.night===2){camera.position.set(52,55,88);camera.lookAt(23,0,0)}
      else{camera.position.set(45,32,55);camera.lookAt(-8,0,6)}
    }else{
      camera.position.set(hero.position.x+Math.sin(yaw)*12,8+hero.position.y*.4,hero.position.z+Math.cos(yaw)*12)
      camera.lookAt(hero.position.x-Math.sin(yaw)*3,1.1,hero.position.z-Math.cos(yaw)*3)
    }
    r.render(world,camera)
  }
  function reset(){for(const e of effects)world.remove(e.obj);effects.length=0}
  function indicator(g:Game){
    const l=g.nearestLamp();if(!l)return null
    const p=new T.Vector3(...l.pos);p.y+=2;p.applyMatrix4(camera.matrixWorldInverse)
    const behind=p.z>0
    const ndc=p.clone().applyMatrix4(camera.projectionMatrix)
    if(!behind&&Math.abs(ndc.x)<=1&&Math.abs(ndc.y)<=1)return null
    return Math.atan2(p.x,behind?-Math.abs(p.z):p.y)*180/Math.PI
  }
  return {draw,events,reset,indicator}
}
