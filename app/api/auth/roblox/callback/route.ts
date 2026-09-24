import{NextResponse}from'next/server';
import{getAppOrigin,readCookie,secureCookie}from'@/lib/auth';
import{createSignedSession}from'@/lib/session-profile';

export const dynamic='force-dynamic';

export async function GET(request:Request){
  const requestUrl=new URL(request.url);
  const origin=getAppOrigin(request.url);
  if(!origin)return NextResponse.redirect(`${requestUrl.origin}/?login=config`);

  if(requestUrl.searchParams.get('error'))return redirectError(origin,'cancelled');
  const code=requestUrl.searchParams.get('code');
  const state=requestUrl.searchParams.get('state');
  const oauth=readCookie(request.headers.get('cookie')||'','rbx_oauth');
  if(!code||!state||!oauth||oauth.split('.')[0]!==state)return redirectError(origin,'invalid');

  const verifier=oauth.slice(oauth.indexOf('.')+1);
  const clientId=process.env.ROBLOX_CLIENT_ID?.trim();
  const clientSecret=process.env.ROBLOX_CLIENT_SECRET?.trim();
  const sessionSecret=process.env.SESSION_SECRET?.trim();
  if(!clientId||!clientSecret||!sessionSecret)return redirectError(origin,'config');

  const redirectUri=`${origin}/api/auth/roblox/callback`;
  try{
    const tokenResponse=await fetch('https://apis.roblox.com/oauth/v1/token',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({
        grant_type:'authorization_code',
        code,
        code_verifier:verifier,
        redirect_uri:redirectUri,
        client_id:clientId,
        client_secret:clientSecret,
      }),
      cache:'no-store',
    });
    if(!tokenResponse.ok)return redirectError(origin,'token');
    const tokens=await tokenResponse.json()as{access_token?:string};
    if(!tokens.access_token)return redirectError(origin,'token');

    const profileResponse=await fetch('https://apis.roblox.com/oauth/v1/userinfo',{
      headers:{authorization:`Bearer ${tokens.access_token}`},
      cache:'no-store',
    });
    if(!profileResponse.ok)return redirectError(origin,'profile');
    const profile=await profileResponse.json()as{sub?:string;preferred_username?:string;name?:string;picture?:string};
    if(!profile.sub)return redirectError(origin,'profile');

    const session=await createSignedSession({id:profile.sub,username:profile.preferred_username||profile.name||'Militar',avatar:profile.picture});
    const response=NextResponse.redirect(`${origin}/central`);
    response.headers.set('cache-control','no-store');
    response.cookies.set('eb_session',session,{
      httpOnly:true,
      secure:secureCookie(origin),
      sameSite:'lax',
      maxAge:86_400,
      path:'/',
    });
    response.cookies.delete('rbx_oauth');
    return response;
  }catch(error){
    console.error('Falha no callback OAuth do Roblox',error);
    return redirectError(origin,'service');
  }
}

function redirectError(origin:string,code:string){
  const response=NextResponse.redirect(`${origin}/?login=${encodeURIComponent(code)}`);
  response.headers.set('cache-control','no-store');
  response.cookies.delete('rbx_oauth');
  return response;
}
