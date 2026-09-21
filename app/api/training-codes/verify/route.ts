import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{sameOrigin}from'@/lib/authorize';
import{inspectTrainingCode,normalizeTrainingCode}from'@/lib/training-codes';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function POST(request:Request){
  const session=await getSessionUser<{exp:number;id:string}>(request);
  if(!session)return NextResponse.json({success:false,error:'UNAUTHORIZED',message:'Sua sessão expirou.'},{status:401});
  if(!sameOrigin(request))return NextResponse.json({success:false,error:'INVALID_ORIGIN',message:'Origem da solicitação inválida.'},{status:403});
  try{
    const body=await request.json()as{code?:unknown};const code=normalizeTrainingCode(typeof body.code==='string'?body.code:'');
    if(!/^MIG-[A-F0-9]{6}-[A-F0-9]{4}$/.test(code))return NextResponse.json({success:false,error:'INVALID_CODE',message:'Digite o código no formato MIG-XXXXXX-XXXX.'},{status:400});
    const data=await inspectTrainingCode(code,session.id);
    if(!data)return NextResponse.json({success:false,error:'INVALID_CODE',message:'Código inválido, expirado, em uso ou já utilizado.'},{status:404});
    return NextResponse.json({success:true,data,error:null,message:'Código válido e vinculado à sua conta.'},{headers:{'cache-control':'no-store'}});
  }catch(error){console.error('Falha ao consultar código de treinamento',error);return NextResponse.json({success:false,error:'VERIFY_FAILED',message:'Não foi possível verificar o código agora.'},{status:503})}
}
