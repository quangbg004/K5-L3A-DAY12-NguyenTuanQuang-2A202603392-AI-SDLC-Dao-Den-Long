import * as T from 'three'
import type {Game} from '../sim/engine.js'
import type {Entity,GameEvent} from '../sim/types.js'
import {mulberry32} from '../sim/rng.js'
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
  const shade=mesh(new T.SphereGeometry(.85,10,6),'#ffbc61',group)
  shade.scale.y=1.2
  for(const y of [-.94,.94])mesh(new T.CylinderGeometry(.38,.38,.2,8),'#77463a',group,0,y)
  mesh(new T.ConeGeometry(.16,.55,6),'#ce723e',group,0,-1.28)
  group.scale.setScalar(size)
  return {group,shade}
}
export function scene(host:HTMLElement){
  const r=new T.WebGLRenderer({antialias:true,alpha:true})
  r.setPixelRatio(Math.min(devicePixelRatio,2));host.append(r.domElement)
  const world=new T.Scene(), camera=new T.PerspectiveCamera(48,1,.1,260)
  const fog=new T.FogExp2(0x635979,.009);world.fog=fog
  const sky=new T.HemisphereLight(0xffeadd,0x62527c,1.65);world.add(sky)
  const sun=new T.DirectionalLight(0xffdbad,2);sun.position.set(-25,45,25);world.add(sun)
  const rand=mulberry32(317)
  mesh(new T.CylinderGeometry(36,32,3.2,48),'#596a67',world,0,-1.6)
  mesh(new T.ConeGeometry(32,15,18),'#4c455e',world,0,-10).rotation.z=Math.PI
  const clouds=new T.Group();world.add(clouds)
  for(let i=0;i<115;i++){
    const a=rand()*Math.PI*2,d=48+rand()*68
    ellipsoid(clouds,'#aba0b4',Math.cos(a)*d,-11-rand()*3,Math.sin(a)*d,6+rand()*11,2+rand()*4,9)
  }
  const stars=[]
  for(let i=0;i<1300;i++) stars.push((rand()-.5)*290,rand()*102+5,(rand()-.5)*290)
  const starGeo=new T.BufferGeometry()
  starGeo.setAttribute('position',new T.Float32BufferAttribute(stars,3))
  world.add(new T.Points(starGeo,new T.PointsMaterial({color:0xffead3,size:.24,fog:false})))
  for(let i=0;i<44;i++){
    const a=rand()*Math.PI*2,d=29+rand()*6,x=d*Math.cos(a),z=d*Math.sin(a),h=1+rand()*2
    if(i%3===0){ellipsoid(world,'#747978',x,.55,z,h,.9,h*.7);continue}
    mesh(new T.CylinderGeometry(.19,.35,h,6),'#685246',world,x,h/2,z)
    for(let j=0;j<2;j++)mesh(new T.ConeGeometry(h*(.86-.2*j),h*1.6,7),j?'#598378':'#38695f',world,x,h*(1+j*.65),z)
  }
  // Flagstone paths lead from the landing to each of the five lanterns.
  for(let i=0;i<5;i++)for(let j=1;j<=11;j++){
    const a=i*2*Math.PI/5,d=j*1.9
    ellipsoid(world,'#81857b',Math.cos(a)*d,.035,Math.sin(a)*d,1+rand()*.45,.10,.85)
  }
  const hero=new T.Group();world.add(hero)
  ellipsoid(hero,'#ca6451',0,.85,0,.53,.78,.44)
  ellipsoid(hero,'#efbc8e',0,1.64,0,.39,.41,.37)
  mesh(new T.ConeGeometry(.85,.62,14),'#e2b978',hero,0,2.1)
  const charm=lamp(hero,.24).group;charm.position.set(.65,1.53,0)
  const lamps:Array<ReturnType<typeof lamp>>=[]
  const halos:T.Mesh[]=[]
  for(let i=0;i<5;i++){
    const pole=new T.Group();world.add(pole)
    mesh(new T.CylinderGeometry(1.35,1.65,.55,8),'#77766f',pole,0,.26)
    mesh(new T.CylinderGeometry(.23,.34,4.8,8),'#835543',pole,0,2.4)
    mesh(new T.BoxGeometry(2.25,.26,.29),'#975f48',pole,.75,4.7)
    const l=lamp(pole,.98);l.group.position.set(1.48,3.48,0);lamps.push(l)
    const halo=new T.Mesh(new T.CircleGeometry(5,48),new T.MeshBasicMaterial({color:0xffbf62,transparent:true,opacity:.19,depthWrite:false}))
    halo.rotation.x=-Math.PI/2;halo.position.y=.07;pole.add(halo);halos.push(halo)
  }
  const litMat=new T.MeshStandardMaterial({color:0xffcf76,emissive:0xffa338,emissiveIntensity:1.3}),darkMat=new T.MeshStandardMaterial({color:0xad7068})
  const moteMat=new T.MeshBasicMaterial({color:0xffed96})
  const moteObjects=new Map<string,T.Object3D>(),shadeObjects=new Map<string,T.Object3D>()
  const effects:{obj:T.Object3D,age:number,sky:boolean}[]=[]
  const ringGeo=new T.RingGeometry(.95,1,64), ringMat=new T.MeshBasicMaterial({color:0xffdf93,side:T.DoubleSide})
  function sync(entities:Entity[],map:Map<string,T.Object3D>,mote:boolean,time:number){
    const active=new Set(entities.map(e=>e.id))
    for(const [id,o] of map)if(!active.has(id)){world.remove(o);map.delete(id)}
    entities.forEach((e,i)=>{
      let obj=map.get(e.id)
      if(!obj){
        obj=new T.Group();world.add(obj);map.set(e.id,obj)
        if(mote){
          obj.add(new T.Mesh(glow,moteMat))
          for(const side of [-1,1])ellipsoid(obj,'#ffe4a3',side*.19,.11,0,.17,.1,.07)
        }else{
          ellipsoid(obj,'#312038',0,.2,0,.72,.9,.64)
          for(const side of [-1,1])ellipsoid(obj,'#d198ec',side*.23,.3,.52,.095,.13,.08)
        }
      }
      obj.position.set(e.pos[0],e.pos[1]+.83+.17*Math.sin(time*3+i),e.pos[2])
      if(!mote) obj.rotation.y=Math.atan2(hero.position.x-obj.position.x,hero.position.z-obj.position.z)
      if('state' in e) obj.rotation.z=e.state==='stunned'?.9:0
    })
  }
  function events(game:Game,events:GameEvent[]){
    for(const e of events){
      if(e.name==='pulse'){
        const ring=new T.Mesh(ringGeo,ringMat);world.add(ring);ring.rotation.x=-Math.PI/2
        ring.position.copy(hero.position);ring.position.y=.28;effects.push({obj:ring,age:0,sky:false})
      }
      if(e.name==='lantern_lit'){
        const l=game.lanterns.find(l=>l.id===e.data.lantern_id)!
        const obj=lamp(world,.6);obj.shade.material=litMat
        obj.group.position.set(l.pos[0],5,l.pos[2]);effects.push({obj:obj.group,age:0,sky:true})
      }
    }
  }
  function draw(g:Game,yaw:number,overview:boolean,time:number,dt:number){
    const w=host.clientWidth,h=host.clientHeight
    if(r.domElement.width!==Math.floor(w*r.getPixelRatio())||r.domElement.height!==Math.floor(h*r.getPixelRatio()))r.setSize(w,h,false)
    camera.aspect=w/h;camera.updateProjectionMatrix()
    hero.position.set(...g.player.pos);hero.rotation.y=yaw;charm.rotation.z=.14*Math.sin(time*3)
    g.lanterns.forEach((l,i)=>{
      lamps[i].group.parent!.position.set(...l.pos)
      lamps[i].shade.material=l.lit?litMat:darkMat;halos[i].visible=l.lit
    })
    const lit=g.lanterns.filter(l=>l.lit).length
    sky.intensity=1.65+lit*.22;fog.density=.009-lit*.001
    clouds.rotation.y=time*.003
    sync(g.motes,moteObjects,true,time);sync(g.shades,shadeObjects,false,time)
    for(let i=effects.length-1;i>=0;i--){
      const e=effects[i];e.age+=dt
      if(e.sky)e.obj.position.y+=dt*2
      else e.obj.scale.setScalar(Math.min(1,e.age/.45)*g.t.pulse_radius)
      if(e.age>(e.sky?12:.45)){world.remove(e.obj);effects.splice(i,1)}
    }
    if(overview){
      camera.position.set(45,32,55);camera.lookAt(-8,0,6)
    }else{
      camera.position.set(hero.position.x+Math.sin(yaw)*12,8+hero.position.y*.4,hero.position.z+Math.cos(yaw)*12)
      camera.lookAt(hero.position.x-Math.sin(yaw)*3,1.1,hero.position.z-Math.cos(yaw)*3)
    }
    r.render(world,camera)
  }
  function reset(){for(const e of effects)world.remove(e.obj);effects.length=0}
  return {draw,events,reset}
}
