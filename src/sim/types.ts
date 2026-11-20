export type Pos = [number, number, number]
export type Controls = {move:[number, number], cam_yaw_deg:number, jump:boolean, interact:boolean, pulse:boolean}
export type Frame = Partial<Controls> & {tick:number}
export type Entity = {id:string, pos:Pos}
export type Lantern = Entity & {lit:boolean, deposited:number}
export type Player = {pos:Pos, flames:number, carried:number}
export type Scenario = {
  player?:Partial<Player>, time_left_s?:number, random_motes?:boolean, random_shades?:boolean,
  motes?:Pos[], shades?:{id?:string,pos:Pos}[], lanterns?:(Partial<Lantern> & {id:string})[]
}
export type Tuning = (typeof import('../../game.contract.json'))['tuning']
export type GameEvent = {type:'event', tick:number, name:string, data:Record<string,unknown>}
export const idle = ():Controls => ({move:[0,0],cam_yaw_deg:0,jump:false,interact:false,pulse:false})
