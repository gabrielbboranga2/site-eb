import {resolveRobloxIdentity} from '@/lib/roblox-identities';
import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {authorizedFor,currentCreator,sameOrigin} from '@/lib/authorize';
import {getDivisions} from '@/lib/creator-config';
import {previewRankChange,applyRankChange} from '@/lib/roblox';
import {assertPromotionCdpAvailable,startPromotionCdp} from '@/lib/cdp';
import {listRequests,createRequest,getRequest,transitionRequest,enrichRequests} from '@/lib/promotion-requests';
import {validatePromotionInput,allowedTransition} from '@/lib/promotion-model';
export const dynamic='force-dynamic';
export const runtime='nodejs';
type Session={id:string;username:string;exp:number};
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'no-store'}});
async function authorize(request:Request){
  const user=await getSessionUser<Session>(request);
  if(!user||!await authorizedFor(request,['Solicitações de promoção']))return null;
  return user;
}
export async function GET(request:Request){
  try{const user=await authorize(request);if(!user)return reply({error:'Sem acesso às solicitações.'},403);const creator=await currentCreator(request);return reply({...await listRequests(user.id,creator),canReview:creator})}
  catch{return reply({error:'Não foi possível carregar as solicitações.'},503)}
}
export async function POST(request:Request){
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403);
  try{
    const user=await authorize(request);if(!user)return reply({error:'Sem acesso às solicitações.'},403);
    let input;try{const body=await request.json();if(typeof body.username==='string'){const profile=await resolveRobloxIdentity(body.username);body.userId=profile.id}input=validatePromotionInput(body)}catch(error){return reply({error:(error as Error).message},422)}
    if(!(await getDivisions()).some(g=>g.groupId===input.groupId))return reply({error:'Comunidade não cadastrada.'},422);
    const change=await previewRankChange(input.userId,input.groupId,'promotion');
    if(change.target.rank>=253)return reply({error:'Cargos protegidos não podem ser solicitados.'},422);
    const profile=await fetch(`https://users.roblox.com/v1/users/${input.userId}`,{signal:AbortSignal.timeout(8000)});
    if(!profile.ok)return reply({error:'Não foi possível confirmar o perfil Roblox.'},502);
    const {name}=await profile.json();
    if(typeof name!=='string')return reply({error:'Perfil inválido.'},502);
    const item=await createRequest({...input,username:name,community:change.community,currentId:change.current.id,currentName:change.current.name,targetId:change.target.id,targetName:change.target.name},user);
    return reply({success:true,request:(await enrichRequests([item]))[0]},201);
  }catch(error){return reply({error:error instanceof Error?error.message:'Não foi possível solicitar.'},409)}
}
export async function PATCH(request:Request){
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403);
  try{
    const user=await authorize(request);
    if(!user||!await currentCreator(request))return reply({error:'Somente Criadores podem revisar e executar solicitações.'},403);
    let body;try{body=await request.json()}catch{return reply({error:'JSON inválido.'},400)}
    if(!body||typeof body!=='object'||typeof body.id!=='string'||body.id.length>64||!['approve','reject','execute'].includes(body.action))return reply({error:'Ação inválida.'},422);
    const item=await getRequest(body.id);if(!item)return reply({error:'Solicitação não encontrada.'},404);
    if(!allowedTransition(item.status,body.action))return reply({error:'Esta solicitação não permite essa ação. Recarregue a lista.'},409);
    const note=typeof body.note==='string'?body.note.trim():'';
    if(note.length<5||note.length>500)return reply({error:'Registre um parecer de 5 a 500 caracteres.'},422);
    if(body.action!=='execute')return reply({success:true,request:(await enrichRequests([await transitionRequest(item.id,item.status,body.action==='approve'?'approved':'rejected',note,user)]))[0]});
    if(body.confirm!==true)return reply({error:'Confirme a alteração real no Roblox.'},422);
    const current=await previewRankChange(item.userId,item.groupId,'promotion');
    if(current.current.id!==item.currentId||current.target.id!==item.targetId)return reply({error:'O cargo ou a hierarquia mudou desde a solicitação. Não foi aplicada nenhuma promoção.'},409);
    if(current.target.rank>=253)return reply({error:'Cargo protegido.'},403);
    if(item.groupId===521106467)await assertPromotionCdpAvailable(item.userId);
    // Claim before contacting Roblox. Uncertain outcomes must never be retried automatically.
    await transitionRequest(item.id,'approved','executing',note,user);
    try{
      const change=await applyRankChange(item.userId,item.groupId,'promotion',item.targetId);
      if(item.groupId===521106467)await startPromotionCdp({userId:item.userId,username:item.username,targetRoleId:change.target.id,targetRankName:change.target.name,actorId:user.id,actorUsername:user.username});
      return reply({success:true,request:(await enrichRequests([await transitionRequest(item.id,'executing','applied',note,user)]))[0]});
    }catch{
      await transitionRequest(item.id,'executing','reconciliation','Confira o cargo no Roblox e a CDP antes de qualquer outra alteração.',user).catch(()=>{});
      return reply({error:'A execução precisa de conferência. Verifique o cargo no Roblox e a CDP; não repita a promoção automaticamente.'},502);
    }
  }catch(error){return reply({error:error instanceof Error?error.message:'Não foi possível revisar.'},409)}
}
