export type LogField={name:string;value:string;inline?:boolean};
import {getWebhook} from './creator-config';

export async function sendSiteLog(input:{title:string;description?:string;color?:number;fields:LogField[]}){
  const webhook=await getWebhook('logs');
  if(!webhook)return false;
  try{
    const response=await fetch(`${webhook}?wait=true`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'EB DO MIG · Logs do Site',allowed_mentions:{parse:[]},embeds:[{title:input.title,description:input.description,color:input.color??0xBDA866,fields:input.fields.map(field=>({...field,value:field.value.slice(0,1024)})),footer:{text:'Central Militar · auditoria automática'},timestamp:new Date().toISOString()}]})});
    if(!response.ok){console.error('Discord recusou o log do site',response.status,await response.text());return false}
    return true;
  }catch(error){console.error('Falha ao enviar log do site',error);return false}
}
