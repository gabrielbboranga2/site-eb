import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {canView,type Channel} from '@/lib/access';
import {readPermissions} from '@/lib/settings-store';
import {readActivities} from '@/lib/activity-db';
import {getActiveCdpMap} from '@/lib/cdp';
import {isDatabaseConfigured} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getSessionUser<{exp:number;id:string;roleId?:string;rankNumber?:number}>(request);
 if(!user)return NextResponse.json({error:'Não autorizado.'},{status:401});
 try{
  const channel=new URL(request.url).searchParams.get('channel')||'Logs globais';const permissions=await readPermissions();
  const allowed=(c:Channel)=>canView(user.roleId,c,permissions,user.rankNumber);
  if(!['Início','Estatísticas','CDP','Logs globais','Histórico de patentes','Ranking','Meu perfil'].includes(channel)||!allowed(channel as Channel))return NextResponse.json({error:'Sua patente não tem acesso a esta guia.'},{status:403});
  let logs=await readActivities();
  const totals={acoesRegistradas:logs.length,treinosMes:logs.filter(l=>l.tipo==='treino'&&l.timestamp.slice(0,7)===new Date().toISOString().slice(0,7)).length};
  if(channel==='Meu perfil'||channel==='CDP')logs=[];
  if(channel==='Início')logs=allowed('Logs globais')?logs.slice(0,4):[];
  if(channel==='Histórico de patentes')logs=logs.filter(l=>['promocao','rebaixamento'].includes(l.tipo));
  if(channel==='Ranking')logs=logs.filter(l=>l.tipo==='treino');
  const active=allowed('CDP')?await getActiveCdpMap():new Map();
  const cdpMembers=[...active.values()].map(m=>({userId:m.userId,username:m.username,rankName:m.rankName,roleId:m.roleId,rankNumber:0,division:'EXÉRCITO',cdpFim:m.endsAt}));
  return NextResponse.json({...totals,logs,cdpMembers,auditAvailable:isDatabaseConfigured()},{headers:{'cache-control':'no-store'}});
 }catch{return NextResponse.json({error:'Não foi possível consultar os registros e permissões.'},{status:503})}
}
