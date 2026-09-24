import {authorizedFor} from '@/lib/authorize';
import type {Channel} from '@/lib/access';
import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{getLiveRoster}from'@/lib/roblox';
import{getDivisions}from'@/lib/creator-config';
import{getActiveCdpMap}from'@/lib/cdp';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const session=await getSessionUser<{exp:number}>(request);
  if(!session)return NextResponse.json({error:'Não autorizado.'},{status:401});

  try{
    const channel=new URL(request.url).searchParams.get('channel')||'Estatísticas'; if(!['Início','Estatísticas'].includes(channel)||!await authorizedFor(request,[channel as Channel]))return NextResponse.json({error:'Sua patente não tem acesso a esta guia.'},{status:403});
    const[members,activeCdp]=await Promise.all([getLiveRoster(),getActiveCdpMap()]);
    const divisoes=Object.fromEntries((await getDivisions()).map(division=>[
      division.sigla,
      members.filter(member=>member.divisions.includes(division.sigla)).length,
    ]));
    return NextResponse.json({
      totalSincronizados:divisoes['EXÉRCITO']||members.length,
      emCdp:activeCdp.size,
      treinosMes:0,
      acoesRegistradas:0,
      ultimaSincronizacao:new Date().toISOString(),
      divisoes,
      atividadesRecentes:[],
    },{headers:{'cache-control':'private, max-age=30'}});
  }catch(error){
    console.error('Falha ao carregar estatísticas do Roblox',error);
    return NextResponse.json({error:'Não foi possível sincronizar os grupos do Roblox.'},{status:503});
  }
}

