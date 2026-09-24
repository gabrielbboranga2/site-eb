export type CatalogItem = {id:string; name:string; description:string; category:'patente'|'cosmetico'|'beneficio'; price:number; status:'draft'|'ready'};
export type PassReward = {id:string; level:number; name:string; description:string; track:'free'|'premium'};
export type CommerceConfig = {season:string; items:CatalogItem[]; rewards:PassReward[]};
export const EMPTY_COMMERCE:CommerceConfig={season:'Operação Alvorada',items:[],rewards:[]};

export function validateCommerce(value:unknown):CommerceConfig {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Configuração inválida.');
  const v=value as CommerceConfig;
  if(typeof v.season!=='string'||v.season.trim().length<3||v.season.length>80)throw new Error('A temporada precisa de 3 a 80 caracteres.');
  if(!Array.isArray(v.items)||v.items.length>60||!Array.isArray(v.rewards)||v.rewards.length>100)throw new Error('Limite de 60 produtos e 100 recompensas por temporada.');
  const ids=new Set<string>();
  const text=(value:unknown,min:number,max:number)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max;
  for(const item of [...v.items,...v.rewards]){
    if(!item||!text(item.id,1,64)||!(/^[a-zA-Z0-9_-]+$/).test(item.id)||ids.has(item.id))throw new Error('Identificador duplicado ou inválido.');
    ids.add(item.id);
    if(!text(item.name,3,80)||!text(item.description,5,300))throw new Error('Preencha nome (3–80) e descrição (5–300 caracteres).');
  }
  for(const item of v.items){
    if(!['patente','cosmetico','beneficio'].includes(item.category)||!['draft','ready'].includes(item.status))throw new Error('Categoria ou estado do produto inválido.');
    if(typeof item.price!=='number'||!Number.isFinite(item.price)||item.price<0||item.price>10000||Math.abs(item.price*100-Math.round(item.price*100))>1e-6)throw new Error('Preço inválido. Use no máximo duas casas decimais.');
  }
  const levels=new Set<string>();
  for(const item of v.rewards){
    const key=`${item.level}:${item.track}`;
    if(!Number.isInteger(item.level)||item.level<1||item.level>100||!['free','premium'].includes(item.track)||levels.has(key))throw new Error('Cada trilha aceita uma recompensa por nível, entre 1 e 100.');
    levels.add(key);
  }
  return {season:v.season.trim(),items:v.items.map(({id,name,description,category,price,status})=>({id,name:name.trim(),description:description.trim(),category,price,status})),rewards:v.rewards.map(({id,level,name,description,track})=>({id,level,name:name.trim(),description:description.trim(),track})).sort((a,b)=>a.level-b.level)};
}
