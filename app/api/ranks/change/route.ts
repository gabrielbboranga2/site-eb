import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {authorizedFor,currentCreator,sameOrigin} from '@/lib/authorize';
import {applyRankChange,previewRankChange,applyDirectRankChange,previewDirectRankChange} from '@/lib/roblox';
import {resolveRobloxIdentity} from '@/lib/roblox-identities';
import {canSkipPromotionTraining} from '@/lib/promotion-policy';
import {promotionTrainingType} from '@/lib/promotion-training-model';
import {ensurePromotionTrainingSchema,recordRankActivity} from '@/lib/promotion-training';
import {assertPromotionCdpAvailable,startPromotionCdp} from '@/lib/cdp';
import {recordActivity} from '@/lib/activity-db';
import {isDatabaseConfigured} from '@/lib/db';
import {sendSiteLog} from '@/lib/discord-logs';
export const dynamic='force-dynamic';
type Session={exp:number;id:string;username:string};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'no-store'}});
export async function POST(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return reply({error:'Sua sessão expirou. Entre novamente.'},401);
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403);
  let applied=false;
  try{
    const body=await request.json();
    if(!body||typeof body!=='object')return reply({error:'Solicitação inválida.'},400);
    const direct=body.direction==='direct',direction=direct?'promotion':body.direction;
    const channel=direct?'Gestão do criador':direction==='demotion'?'Rebaixamentos':body.channel==='Promoção em divisão'?'Promoção em divisão':'Entregar patente';
    if(direct?!await currentCreator(request):!await authorizedFor(request,[channel as 'Rebaixamentos'|'Promoção em divisão'|'Entregar patente']))return reply({error:'Sua patente não tem acesso a esta operação.'},403);
    const groupId=Number(body.groupId),query=typeof body.username==='string'?body.username.trim():typeof body.userId==='string'?body.userId.trim():'';
    if(!query||query.length>20||!Number.isSafeInteger(groupId)||groupId<1||!['promotion','demotion'].includes(direction)||(direct&&typeof body.targetRoleId!=='string'))return reply({error:'Solicitação de cargo inválida.'},400);
    if(!direct&&channel==='Entregar patente'&&groupId!==521106467)return reply({error:'Entregar patente altera somente o Exército.'},400);
    if(!direct&&channel==='Promoção em divisão'&&groupId===521106467)return reply({error:'Selecione uma comunidade divisional.'},400);
    const profile=await resolveRobloxIdentity(query),userId=profile.id;
    const change=direct?await previewDirectRankChange(userId,groupId,body.targetRoleId):await previewRankChange(userId,groupId,direction);
    if(change.target.rank>=253||change.target.rank<=0)return reply({error:'Esse cargo é protegido.'},403);
    const promoted=change.target.rank>change.current.rank,training=promotionTrainingType(groupId,change.community,change.current);
    const canSkipTraining=promoted?await canSkipPromotionTraining(session.id):false;
    if(body.confirm!==true)return reply({ok:true,applied:false,change,member:{userId,username:profile.username,avatar:profile.avatar},training,canSkipTraining});
    const withoutTraining=body.trainingMode==='none';
    if(withoutTraining&&(!promoted||!canSkipTraining))return reply({error:'Somente Moderador ou patente superior pode promover sem treino.'},403);
    if(!direct&&promoted&&!withoutTraining&&(body.trainingMode!=='training'||body.trainingKey!==training.key))return reply({error:'Selecione o treinamento compatível com a patente atual.'},422);
    if(body.trainingMode!==undefined&&!['none','training'].includes(body.trainingMode))return reply({error:'Tipo de promoção inválido.'},422);
    const reason=typeof body.reason==='string'?body.reason.trim():'';
    if(reason.length<(withoutTraining?10:5)||reason.length>500)return reply({error:withoutTraining?'Explique o motivo da promoção sem treino em 10 a 500 caracteres.':'Informe o motivo em 5 a 500 caracteres.'},422);
    if(!isDatabaseConfigured())return reply({error:'Conecte o banco de dados para registrar a alteração.'},503);
    await ensurePromotionTrainingSchema();
    if(!direct&&promoted&&groupId===521106467)await assertPromotionCdpAvailable(userId);
    const result=direct?await applyDirectRankChange(userId,groupId,body.targetRoleId):await applyRankChange(userId,groupId,direction,String(body.targetRoleId||''));
    applied=true;
    const description=result.current.name+' → '+result.target.name+' · '+(promoted?(withoutTraining?'Sem treino':training.label):'Rebaixamento')+' · Motivo: '+reason;
    const trainingWindow=await recordRankActivity({eventId:crypto.randomUUID(),userId,username:profile.username,groupId,community:result.community,promoted,countsAsTraining:!withoutTraining,description,actorId:session.id,actorUsername:session.username,trainingKey:training.key,trainingLabel:training.label});
    const cdp=!direct&&promoted&&groupId===521106467?await startPromotionCdp({userId,username:profile.username,targetRoleId:result.target.id,targetRankName:result.target.name,actorId:session.id,actorUsername:session.username}):null;
    if(cdp)await recordActivity({tipo:'cdp_inicio',userId,username:profile.username,descricao:'CDP de '+cdp.durationHours+' horas',autorId:session.id,autorUsername:session.username},{required:true});
    await sendSiteLog({title:promoted?'Promoção realizada':'Rebaixamento realizado',fields:[{name:'Militar',value:profile.username,inline:true},{name:'Responsável',value:session.username,inline:true},{name:'Comunidade',value:result.community},{name:'Alteração',value:result.current.name+' → '+result.target.name},{name:'Modalidade',value:withoutTraining?'Sem treino':training.label},{name:'Motivo',value:reason}]}).catch(()=>false);
    return reply({ok:true,applied:true,change:result,cdp,trainingWindow,withoutTraining});
  }catch(error){
    const message=applied?'O Roblox confirmou a alteração, mas o registro ou a CDP precisa de conferência. Não repita o UP.':error instanceof Error?error.message:'Não foi possível processar a alteração.';
    console.error('Falha na alteração de cargo',error);
    return reply({error:message,applied,reconciliation:applied},applied?502:/CDP|mudou|já possui/.test(message)?409:502);
  }
}
