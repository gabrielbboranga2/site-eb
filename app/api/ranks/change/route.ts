import {recordActivity} from '@/lib/activity-db';
import {authorizedFor,currentCreator,sameOrigin} from '@/lib/authorize';
import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{applyRankChange,previewRankChange,applyDirectRankChange,previewDirectRankChange}from'@/lib/roblox';
import{assertPromotionCdpAvailable,startPromotionCdp}from'@/lib/cdp';
import{sendSiteLog}from'@/lib/discord-logs';
import{isDatabaseConfigured}from'@/lib/db';

export const dynamic='force-dynamic';
type AdminSession={exp:number;id:string;username:string;isAdmin?:boolean;isCreator?:boolean};

export async function POST(request:Request){
  const session=await getSessionUser<AdminSession>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente.'},{status:401});
  if(!session.isAdmin&&!session.isCreator)return NextResponse.json({error:'Você não possui permissão administrativa para alterar cargos.'},{status:403});
  try{
    const body=await request.json()as{userId?:string;groupId?:number;direction?:string;confirm?:boolean;targetRoleId?:string;reason?:string;channel?:string};
    const direct=body.direction==='direct';
    const channel=direct?'Gestão do criador':body.direction==='demotion'?'Rebaixamentos':body.channel==='Promoção em divisão'?'Promoção em divisão':'Entregar patente';
    if(direct&&(!session.isCreator||!await currentCreator(request)))return NextResponse.json({error:'A alteração direta é exclusiva de Criadores.'},{status:403});
    if(!sameOrigin(request)||(!direct&&!await authorizedFor(request,[channel as 'Rebaixamentos'|'Promoção em divisão'|'Entregar patente'])))return NextResponse.json({error:'Sua patente não tem acesso a esta guia.'},{status:403});
    const userId=String(body.userId||'').trim();
    const groupId=Number(body.groupId);
    const direction=direct?'promotion':body.direction==='demotion'?'demotion':body.direction==='promotion'?'promotion':null;
    if(!/^\d+$/.test(userId)||!Number.isSafeInteger(groupId)||!direction||(direct&&!body.targetRoleId))return NextResponse.json({error:'Solicitação de cargo inválida.'},{status:400});
    if(body.confirm&&String(body.reason||'').trim().length<5)return NextResponse.json({error:'Informe um motivo com pelo menos 5 caracteres.'},{status:400});
    if(body.confirm&&!isDatabaseConfigured())return NextResponse.json({error:'O banco de dados precisa estar conectado para registrar a alteração nos logs.'},{status:503});
    if(!direct&&channel==='Entregar patente'&&groupId!==521106467)return NextResponse.json({error:'Entregar patente altera somente o grupo principal do Exército.'},{status:400});
    if(!direct&&channel==='Promoção em divisão'&&groupId===521106467)return NextResponse.json({error:'Promoção em divisão aceita apenas comunidades divisionais.'},{status:400});
    if(!body.confirm){const change=direct?await previewDirectRankChange(userId,groupId,String(body.targetRoleId)):await previewRankChange(userId,groupId,direction);return NextResponse.json({ok:true,applied:false,change},{headers:{'cache-control':'no-store'}})}
    if(!direct&&direction==='promotion'&&groupId===521106467)await assertPromotionCdpAvailable(userId);
    const change=direct?await applyDirectRankChange(userId,groupId,String(body.targetRoleId)):await applyRankChange(userId,groupId,direction,String(body.targetRoleId||''));
    const cdp=!direct&&direction==='promotion'&&groupId===521106467?await startPromotionCdp({userId,username:userId,targetRoleId:change.target.id,targetRankName:change.target.name,actorId:session.id,actorUsername:session.username}):null;
    await sendSiteLog({title:direction==='promotion'?'Promoção realizada':'Rebaixamento realizado',color:direction==='promotion'?0x78A785:0xC56F68,fields:[{name:'Militar',value:`Roblox ID: ${userId}`,inline:true},{name:'Comunidade',value:change.community,inline:true},{name:'Responsável',value:session.username,inline:true},{name:'Cargo anterior',value:change.current.name,inline:true},{name:'Novo cargo',value:change.target.name,inline:true},{name:'Motivo',value:String(body.reason||'').trim()}]});
    await recordActivity({tipo:direction==='promotion'?'promocao':'rebaixamento',userId,username:userId,descricao:change.current.name+' → '+change.target.name,autorId:session.id,autorUsername:session.username},{required:true});
    if(cdp)await recordActivity({tipo:'cdp_inicio',userId,username:userId,descricao:`CDP de ${cdp.durationDays} dias até ${new Date(cdp.endsAt).toLocaleDateString('pt-BR')}`,autorId:session.id,autorUsername:session.username},{required:true});
    return NextResponse.json({ok:true,applied:Boolean(body.confirm),change,cdp},{headers:{'cache-control':'no-store'}});
  }catch(error){
    const message=error instanceof Error?error.message:'Não foi possível processar a alteração.';
    console.error('Falha na alteração de cargo',error);
    return NextResponse.json({error:message},{status:message.includes('não pertence')?404:message.includes('já está')||message.includes('CDP')||message.includes('bloqueada')?409:502});
  }
}


