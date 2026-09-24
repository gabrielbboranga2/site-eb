import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {currentCreator,sameOrigin} from '@/lib/authorize';
import {readCommerce,saveCommerce} from '@/lib/commerce-store';
import {validateCommerce} from '@/lib/commerce-model';
export const dynamic='force-dynamic';
export const runtime='nodejs';
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'cache-control':'no-store'}});
export async function GET(request:Request){
  try{
    if(!await currentCreator(request))return reply({error:'Loja e Battle Pass são exclusivos de Criadores.'},403);
    return reply(await readCommerce());
  }catch{return reply({error:'Não foi possível consultar o catálogo privado. Tente novamente.'},503)}
}
export async function PUT(request:Request){
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403);
  try{
    if(!await currentCreator(request))return reply({error:'Área exclusiva de Criadores.'},403);
    const actor=await getSessionUser<{id:string;username:string;exp:number}>(request);
    if(!actor)return reply({error:'Entre novamente.'},401);
    if(Number(request.headers.get('content-length'))>100000)return reply({error:'Catálogo muito grande.'},413);
    let body;
    try{body=await request.json()}catch{return reply({error:'JSON inválido.'},400)}
    if(!body||typeof body!=='object'||!Number.isSafeInteger(body.version)||body.version<0)return reply({error:'Versão do catálogo inválida.'},422);
    try{validateCommerce(body?.config)}catch(error){return reply({error:(error as Error).message},422)}
    const saved=await saveCommerce(body.config,body.version,actor);
    return reply({...saved,success:true,message:'Catálogo salvo. Acesso continua exclusivo de Criadores.'});
  }catch(error){const message=error instanceof Error?error.message:'Falha ao salvar.';return reply({error:message},message.includes('Outro Criador')?409:503)}
}
