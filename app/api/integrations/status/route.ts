import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{webhookStatus}from'@/lib/creator-config';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const session=await getSessionUser<{exp:number;isCreator?:boolean}>(request);
  if(!session?.isCreator)return NextResponse.json({error:'Não autorizado.'},{status:401});
  return NextResponse.json(await webhookStatus(),{headers:{'cache-control':'no-store'}});
}

