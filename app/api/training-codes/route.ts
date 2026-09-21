import{NextResponse}from'next/server';
import{authorizedTrainingCodeRequest,issueTrainingCode,TRAINING_CODE_TYPES,type TrainingCodeType}from'@/lib/training-codes';
import{isDatabaseConfigured}from'@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(request:Request){
  if(!authorizedTrainingCodeRequest(request))return NextResponse.json({success:false,error:'UNAUTHORIZED',message:'Credencial do jogo inválida.'},{status:401});
  if(!isDatabaseConfigured())return NextResponse.json({success:false,error:'DATABASE_UNAVAILABLE',message:'Banco de dados indisponível.'},{status:503});
  try{
    const body=await request.json()as Record<string,unknown>;
    const instructorId=clean(body.instructorId,24);const instructorUsername=clean(body.instructorUsername,20);
    const type=clean(body.type,16).toUpperCase()as TrainingCodeType;
    const privateServerId=clean(body.privateServerId,160);const placeId=clean(body.placeId,24);
    if(!/^\d+$/.test(instructorId)||!/^[A-Za-z0-9_]{3,20}$/.test(instructorUsername)||!TRAINING_CODE_TYPES[type]||!privateServerId||!/^\d+$/.test(placeId))return NextResponse.json({success:false,error:'INVALID_REQUEST',message:'Dados do servidor ou instrutor inválidos.'},{status:400});
    const result=await issueTrainingCode({instructorId,instructorUsername,type,privateServerId,placeId});
    return NextResponse.json({success:true,data:result,error:null,message:'Código de verificação gerado.'},{status:201,headers:{'cache-control':'no-store'}});
  }catch(error){console.error('Falha ao gerar código de treinamento',error);return NextResponse.json({success:false,error:'ISSUE_FAILED',message:'Não foi possível gerar o código de verificação.'},{status:500})}
}

function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
