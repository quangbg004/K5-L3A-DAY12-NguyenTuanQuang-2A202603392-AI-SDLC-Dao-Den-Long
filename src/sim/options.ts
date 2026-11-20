import {parseArgs} from 'node:util'
export function measurementArgs(key:'duration'|'nights',defaultValue:number,seed:number,file:string){
  try{
    const {values}=parseArgs({options:{seed:{type:'string',default:String(seed)},[key]:{type:'string',default:String(defaultValue)},out:{type:'string',default:file}}})
    const count=Number(values[key]),inputSeed=Number(values.seed)
    if(!Number.isSafeInteger(inputSeed)||!Number.isFinite(count)||count<=0||(key==='nights'&&!Number.isSafeInteger(count))||!values.out)throw Error('Invalid measurement arguments')
    return {count,seed:inputSeed,out:String(values.out)}
  }catch(error){console.error(String(error));process.exit(2)}
}
