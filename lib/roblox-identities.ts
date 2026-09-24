import {getUserAvatarMap} from './roblox';
export type RobloxIdentity={id:string;username:string;avatar?:string};
const cache=new Map<string,{value:RobloxIdentity;expires:number}>();
const validId=(id:string)=>/^[1-9]\d{0,19}$/.test(id)&&Number.isSafeInteger(Number(id));
export function identityName(name?:string){return name&&!/^\d+$/.test(name)&&!/^Usuário \d+$/.test(name)?name:'Perfil indisponível'}
export async function getRobloxIdentities(ids:string[]):Promise<Map<string,RobloxIdentity>>{
  const unique=[...new Set(ids.filter(validId))],result=new Map<string,RobloxIdentity>();
  const missing=unique.filter(id=>{const saved=cache.get(id);if(saved&&saved.expires>Date.now()){result.set(id,saved.value);return false}return true});
  // Limit concurrent Roblox requests and reuse identities across log pages.
  for(let start=0;start<missing.length;start+=100){
    const batch=missing.slice(start,start+100);
    const [profiles,avatars]=await Promise.all([
      fetch('https://users.roblox.com/v1/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({userIds:batch.map(Number),excludeBannedUsers:false}),signal:AbortSignal.timeout(8000)}).then(async r=>{if(!r.ok)return [];const data=(await r.json()).data;return Array.isArray(data)?data:[]}).catch(()=>[]) as Promise<Array<{id:number;name:string}>>,
      getUserAvatarMap(batch).catch(()=>new Map<string,string>())
    ]);
    for(const id of batch){const profile=profiles.find(p=>String(p.id)===id);if(profile?.name){const value={id,username:profile.name,avatar:avatars.get(id)};result.set(id,value);cache.set(id,{value,expires:Date.now()+(value.avatar?300_000:30_000)})}else if(avatars.has(id)){result.set(id,{id,username:'Perfil indisponível',avatar:avatars.get(id)})}}
  }
  if(cache.size>5000)for(const [id,item] of cache)if(item.expires<Date.now())cache.delete(id);
  while(cache.size>5000)cache.delete(cache.keys().next().value!);
  return result;
}
export async function resolveRobloxIdentity(query:string):Promise<RobloxIdentity>{
  const clean=query.trim();let id=clean;
  if(!validId(clean)){
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(clean))throw new Error('Informe um username Roblox válido.');
    const response=await fetch('https://users.roblox.com/v1/usernames/users',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({usernames:[clean],excludeBannedUsers:false}),signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new Error('O Roblox não respondeu à busca de username.');
    const found=(await response.json()).data?.[0];if(!found?.id)throw new Error('Username não encontrado no Roblox.');id=String(found.id);
  }
  const profile=(await getRobloxIdentities([id])).get(id);
  if(!profile||profile.username==='Perfil indisponível')throw new Error('Não foi possível confirmar o perfil Roblox. Tente novamente.');
  return profile;
}
