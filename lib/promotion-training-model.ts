import {getPatenteByRoleId} from './patentes';
export function promotionTrainingType(groupId:number,community:string,current:{id:string;name:string;rank:number}){
  if(groupId!==521106467)return {key:'division:'+groupId,label:'Formação '+community};
  const order=getPatenteByRoleId(current.id)?.ordem;
  if(order&&order<=2)return {key:'normal',label:'Treinamento Normal'};
  if(order&&order<=7)return {key:'esa',label:'ESA'};
  if(order&&order<=15)return {key:'aman',label:'AMAN'};
  if(order&&order<=23)return {key:'epcar',label:'EPCAr'};
  return {key:'administrativo:'+current.id,label:'Formação administrativa · '+current.name};
}
export function continuesTraining(current:{trainingKey:string;closesAt:string}|null,nextKey:string,now:number){return !!current&&current.trainingKey===nextKey&&new Date(current.closesAt).getTime()>now}
