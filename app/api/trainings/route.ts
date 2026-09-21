import {recordActivity} from '@/lib/activity-db';
import {authorizedFor,sameOrigin} from '@/lib/authorize';
import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getDivisions}from'@/lib/creator-config';
import{getUserGroupMemberships}from'@/lib/roblox';
import{getTrainingRule}from'@/lib/training-rules';
import{sendSiteLog}from'@/lib/discord-logs';
import{getWebhook}from'@/lib/creator-config';
import{isDatabaseConfigured}from'@/lib/db';
import{claimTrainingCode,consumeTrainingCode,normalizeTrainingCode,releaseTrainingCode,type TrainingCodeClaim}from'@/lib/training-codes';

export const dynamic='force-dynamic';
export const runtime='nodejs';

const ALLOWED_TYPES=new Set(['image/jpeg','image/png','image/webp']);
const MAX_FILE_SIZE=8*1024*1024;
type Session={exp:number;id:string;username:string;rank?:string;isAdmin?:boolean;isCreator?:boolean};

export async function POST(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente com o Roblox.'},{status:401});

  let verificationClaim:TrainingCodeClaim|null=null;
  try{
    if(!sameOrigin(request)||!await authorizedFor(request,['Treinamentos']))return NextResponse.json({error:'Sua patente não tem acesso a treinamentos.'},{status:403});
    const form=await request.formData();
    const community=clean(form.get('community'),30);
    const training=clean(form.get('training'),100);
    const observation=clean(form.get('observation'),1000);
    const verificationCode=normalizeTrainingCode(clean(form.get('verificationCode'),30));
    const proof=form.get('proof');
    let participants:string[]=[];
    try{
participants=JSON.parse(String(form.get('participants')||'[]'))}catch{}
    participants=Array.from(new Set(participants.map(item=>clean(item,20)).filter(item=>/^[A-Za-z0-9_]{3,20}$/.test(item)))).slice(0,15);

    const rule=getTrainingRule(community,training);
    const division=(await getDivisions()).find(item=>item.sigla===community);
    if(!division||!rule||observation.length<10||participants.length<1)return NextResponse.json({error:'Os dados do treinamento estão incompletos ou inválidos.'},{status:400});
    if(!(proof instanceof File)||!ALLOWED_TYPES.has(proof.type)||proof.size<1||proof.size>MAX_FILE_SIZE)return NextResponse.json({error:'Anexe uma foto JPG, PNG ou WEBP de até 8 MB.'},{status:400});
    const memberships=await getUserGroupMemberships(session.id);
    const instructorMembership=memberships.find(item=>item.groupId===division.groupId);
    if(!instructorMembership)return NextResponse.json({error:`Você não pertence à comunidade ${community}.`},{status:403});
    if(instructorMembership.rankNumber<rule.minInstructorRank)return NextResponse.json({error:`Seu cargo não pode conduzir ${rule.name}. Patente mínima: ${rule.minInstructorRole}.`},{status:403});
    if(!isDatabaseConfigured())return NextResponse.json({error:'O banco de dados precisa estar conectado para registrar o treino no ranking e nos logs.'},{status:503});
    const webhook=await getWebhook('trainings');
    if(!webhook)return NextResponse.json({error:'O webhook de treinamentos ainda não foi configurado no painel do Criador.'},{status:503});
    if(community==='EXÉRCITO')verificationClaim=await claimTrainingCode(verificationCode,session.id,rule.id);

    const extension=proof.type==='image/png'?'png':proof.type==='image/webp'?'webp':'jpg';
    const filename=`treinamento-${community.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,'-')}-${Date.now()}.${extension}`;
    const payload={
      username:'EB DO MIG · Registros',
      allowed_mentions:{parse:[]},
      embeds:[{
        title:'Treinamento concluído',
        color:0xBDA866,
        description:`**${rule.name}** foi registrado com prova fotográfica.`,
        fields:[
          {name:'Comunidade',value:community,inline:true},
          {name:'Instrutor',value:`${escapeDiscord(session.username)}\n${escapeDiscord(session.rank||'Militar')}`,inline:true},
          {name:'Regra de instrução',value:`Mínimo: ${escapeDiscord(rule.minInstructorRole)}`,inline:true},
          {name:`Participantes (${participants.length})`,value:participants.map(name=>`• ${escapeDiscord(name)}`).join('\n')},
          {name:'Relatório',value:escapeDiscord(observation)},
        ],
        image:{url:`attachment://${filename}`},
        footer:{text:`Roblox ID do instrutor: ${session.id}`},
        timestamp:new Date().toISOString(),
      }],
      attachments:[{id:0,filename,description:'Prova do treinamento: formação em cunha com a bandeira do Brasil ao fundo.'}],
    };
    const discordForm=new FormData();
    discordForm.set('payload_json',JSON.stringify(payload));
    discordForm.set('files[0]',proof,filename);
    const response=await fetch(`${webhook}?wait=true`,{method:'POST',body:discordForm,cache:'no-store'});
    if(!response.ok){console.error('Discord recusou o registro de treinamento',response.status,await response.text());throw new Error('O Discord não aceitou o envio. Confira o webhook na Vercel.')}
    const message=await response.json()as{id?:string};
    if(verificationClaim)await consumeTrainingCode(verificationClaim.claimToken,session.id,session.username);
    await sendSiteLog({title:'Treinamento registrado',color:0xBDA866,fields:[{name:'Instrutor',value:`${session.username}\n${session.rank||'Militar'}`,inline:true},{name:'Comunidade',value:community,inline:true},{name:'Treinamento',value:rule.name,inline:true},...(verificationClaim?[{name:'Código utilizado',value:verificationClaim.code,inline:true}]:[]),{name:'Participantes',value:participants.map(name=>`• ${name}`).join('\n')},{name:'Relatório',value:observation},{name:'Prova',value:`Enviada no canal de treinamentos · mensagem ${message.id||'sem ID'}`} ]});
    const verificationText=verificationClaim?` · código ${verificationClaim.code} validado`:'';
    await recordActivity({tipo:'treino',userId:session.id,username:session.username,descricao:rule.name+' · '+participants.length+' participantes'+verificationText,autorId:session.id,autorUsername:session.username},{required:true});
    return NextResponse.json({ok:true,messageId:message.id||null},{status:201,headers:{'cache-control':'no-store'}});
  }catch(error){
    if(verificationClaim)await releaseTrainingCode(verificationClaim.claimToken).catch(releaseError=>console.error('Falha ao liberar código reservado',releaseError));
    console.error('Falha ao registrar treinamento',error);
    const message=error instanceof Error&&(/código|Discord/i.test(error.message))?error.message:'Não foi possível processar a foto do treinamento.';
    return NextResponse.json({error:message},{status:/código/i.test(message)?409:500})
  }
}

function clean(value:FormDataEntryValue|null,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
function escapeDiscord(value:string){return value.replace(/([\\`*_{}\[\]()<>#+\-.!|])/g,'\\$1')}



