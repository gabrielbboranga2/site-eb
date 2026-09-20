import {getHierarchySnapshot} from '@/lib/hierarchy-snapshot';
import {NextResponse} from 'next/server';
import {getSessionUser} from '@/lib/auth';
import {CHANNELS,canView,validPermissions} from '@/lib/access';
import {isCreatorRole} from '@/lib/manager';
import {getUserGroupMemberships,getLiveHierarchies} from '@/lib/roblox';
import {readPermissions,writePermissions,persistentSettingsAvailable} from '@/lib/settings-store';
export const dynamic='force-dynamic';
export async function GET(request:Request){const user=await getSessionUser<{exp:number;roleId?:string;rankNumber?:number}>(request);if(!user)return NextResponse.json({error:'Não autorizado.'},{status:401});try{const permissions=await readPermissions();const groups=await getLiveHierarchies().catch(()=>getHierarchySnapshot());const roles=groups.find(g=>g.groupId===521106467)?.roles||[];return NextResponse.json({roles,allowed:CHANNELS.filter(c=>canView(user.roleId,c,permissions,user.rankNumber)),permissions:isCreatorRole(user.roleId)?permissions:undefined,canSave:isCreatorRole(user.roleId)&&persistentSettingsAvailable()},{headers:{'cache-control':'no-store'}})}catch{return NextResponse.json({error:'Não foi possível verificar as permissões.'},{status:503})}}
export async function PUT(request:Request){
 const user=await getSessionUser<{exp:number;id:string;roleId?:string}>(request);
 if(!user||!isCreatorRole(user.roleId))return NextResponse.json({error:'Acesso exclusivo de Criadores.'},{status:403});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Origem não permitida.'},{status:403});
 let permissions:unknown;try{permissions=await request.json()}catch{return NextResponse.json({error:'JSON inválido.'},{status:400})}
 if(!validPermissions(permissions))return NextResponse.json({error:'Escolha uma patente válida para cada guia.'},{status:400});
 try{
  const groups=await getUserGroupMemberships(user.id);
  if(!groups.some(g=>g.groupId===521106467&&isCreatorRole(g.roleId)))return NextResponse.json({error:'Sua patente atual não é Criador. Entre novamente.'},{status:403});
  await writePermissions(permissions);
  return NextResponse.json({saved:true},{headers:{'cache-control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Não foi possível salvar.'},{status:503})}
}

