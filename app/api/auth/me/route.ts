import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';
import{isCreatorRole}from'@/lib/manager';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const user=await getSessionUser<{exp:number;roleId?:string}>(request);
  const normalized=user?{...user,isCreator:isCreatorRole(user.roleId)}:null;
  return NextResponse.json({user:normalized},{headers:{'cache-control':'no-store'}});
}
