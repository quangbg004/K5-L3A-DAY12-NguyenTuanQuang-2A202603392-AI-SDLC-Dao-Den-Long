export type Pos=[number,number,number]
export type Night=1|2|3
export type Controls={move:[number,number],cam_yaw_deg:number,jump:boolean,interact:boolean,pulse:boolean,dash:boolean,pause:boolean}
export const idle=():Controls=>({move:[0,0],cam_yaw_deg:0,jump:false,interact:false,pulse:false,dash:false,pause:false})
export type Frame=Partial<Controls>&{tick:number}
export type Entity={id:string,pos:Pos}
export type Lantern=Entity & {lit:boolean,deposited:number}
export type Player={pos:Pos,flames:number,carried:number}
export type ShadeState='spawning'|'wander'|'chase'|'recoil'|'stunned'
export type DrifterState='idle'|'chase'|'flee'|'removed'
export type ShadeInput={id?:string,pos:Pos,state?:ShadeState,state_ticks_left?:number}
export type DrifterInput={id?:string,pos:Pos,state?:DrifterState,stolen?:number,state_ticks_left?:number}
export type CharmInput={id:string,pos?:Pos,available?:boolean,respawn_ticks?:number,respawn_s?:number}
export type Scenario={
  player?:Partial<Player>&{invuln_ticks?:number,dash_cd_ticks?:number,pulse_cd_ticks?:number,charm_ticks?:number},
  time_left_s?:number,random_motes?:boolean,random_shades?:boolean,random_drifters?:boolean,wind_enabled?:boolean,
  motes?:Pos[],shades?:ShadeInput[],lanterns?:(Partial<Lantern>&{id:string})[],drifters?:DrifterInput[],charms?:CharmInput[]
}
export type Tuning=(typeof import('../../game.contract.json'))['tuning']
export type GameEvent={type:'event',tick:number,name:string,data:Record<string,unknown>}
