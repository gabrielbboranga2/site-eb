import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {canView,type Channel} from '@/lib/access';
import {readPermissions} from '@/lib/settings-store';
import {readActivities} from '@/lib/activity-db';
import {getActiveCdpMap} from '@/lib/cdp';
import {isDatabaseConfigured} from '@/lib/db';
import {isCreatorRole} from '@/lib/manager';
import {getRobloxIdentities,identityName} from '@/lib/roblox-identities';
import {readOpenTrainingWindows} from '@/lib/promotion-training';
export const dynamic='force-dynamic';
function publicDescription(type:string,description:string){if(type!=='resgate')return description;const value=description.toLocaleLowerCase('pt-BR');if(value.includes('encerrad'))return'Recompensa encerrada por um Criador';if(value.includes('entrega confirmada'))return'Entrega de recompensa confirmada';if(value.includes('criad')||value.includes('configurad'))return'Nova recompensa configurada';return'Recompensa resgatada'}
export async function GET(request:Request){
 const user=await getSessionUser<{exp:number;id:string;roleId?:string;rankNumber?:number}>(request);
 if(!user)return NextResponse.json({error:'Não autorizado.'},{status:401});
 try{
  const channel=new URL(request.url).searchParams.get('channel')||'Logs globais';const permissions=await readPermissions();
  const allowed=(c:Channel)=>canView(user.roleId,c,permissions,user.rankNumber);
  if(!['Início','Estatísticas','CDP','Logs globais','Histórico de patentes','Ranking','Meu perfil'].includes(channel)||!allowed(channel as Channel))return NextResponse.json({error:'Sua patente não tem acesso a esta guia.'},{status:403});
  let logs=await readActivities(channel==='Ranking');
  const monthlyTrainings=channel==='Ranking'?logs:await readActivities(true);
  if(!isCreatorRole(user.roleId))logs=logs.filter(log=>log.tipo!=='catalogo');
  const totals={acoesRegistradas:logs.length,treinosMes:monthlyTrainings.length};
  if(channel==='Meu perfil'||channel==='CDP')logs=[];
  if(channel==='Início')logs=allowed('Logs globais')?logs.slice(0,4):[];
  if(channel==='Histórico de patentes')logs=logs.filter(l=>['promocao','rebaixamento'].includes(l.tipo));
  if(channel==='Ranking')logs=logs.filter(l=>l.tipo==='treino');
  const active=allowed('CDP')?await getActiveCdpMap():new Map();
  let cdpMembers=[...active.values()].map(m=>({userId:m.userId,username:m.username,rankName:m.rankName,roleId:m.roleId,rankNumber:0,division:'EXÉRCITO',cdpFim:m.endsAt}));
  let trainingWindows=['Início','Ranking','Estatísticas','Logs globais'].includes(channel)?await readOpenTrainingWindows():[];
  if(!allowed('Ranking')&&!allowed('Logs globais'))trainingWindows=trainingWindows.filter(w=>w.actorId===user.id);
  const profiles=await getRobloxIdentities([...logs.flatMap(l=>[l.userId,...(l.autorId?[l.autorId]:[])]),...cdpMembers.map(m=>m.userId),...trainingWindows.map(w=>w.actorId)]);
  const name=(id:string,stored?:string)=>profiles.get(id)?.username==='Perfil indisponível'?identityName(stored):profiles.get(id)?.username||identityName(stored);
  logs=logs.map(l=>({...l,descricao:publicDescription(l.tipo,l.descricao),username:name(l.userId,l.username),avatar:profiles.get(l.userId)?.avatar,autorUsername:l.autorId?name(l.autorId,l.autorUsername):l.autorUsername,autorAvatar:l.autorId?profiles.get(l.autorId)?.avatar:undefined}));
  cdpMembers=cdpMembers.map(m=>({...m,username:name(m.userId,m.username),avatar:profiles.get(m.userId)?.avatar}));
  trainingWindows=trainingWindows.map(w=>({...w,actorUsername:name(w.actorId,w.actorUsername),avatar:profiles.get(w.actorId)?.avatar}));
  return NextResponse.json({...totals,logs,cdpMembers,trainingWindows,auditAvailable:isDatabaseConfigured()},{headers:{'cache-control':'no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível consultar os registros e permissões.'},{status:503})}
}
