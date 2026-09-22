import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {getDivisions} from '@/lib/creator-config';
export const dynamic='force-dynamic';

type GroupThumbnail={targetId:number;state:string;imageUrl:string};

export async function GET(request:Request){
  if(!await getSessionUser(request))return NextResponse.json({error:'Não autorizado.'},{status:401});
  const divisions=await getDivisions();
  const images=new Map<number,string>();
  try{
    const url=new URL('https://thumbnails.roblox.com/v1/groups/icons');
    url.searchParams.set('groupIds',divisions.map(item=>item.groupId).join(','));
    url.searchParams.set('size','150x150');
    url.searchParams.set('format','Png');
    url.searchParams.set('isCircular','false');
    const response=await fetch(url,{next:{revalidate:3600}});
    if(response.ok){
      const payload=await response.json()as{data?:GroupThumbnail[]};
      for(const item of payload.data||[]){
        if(item.state==='Completed'&&item.imageUrl)images.set(item.targetId,item.imageUrl);
      }
    }
  }catch(error){console.warn('Ícones das comunidades indisponíveis.',error)}
  return NextResponse.json({
    divisions:divisions.map(item=>({...item,imageUrl:images.get(item.groupId)||''})),
  },{headers:{'cache-control':'private, max-age=300'}});
}
