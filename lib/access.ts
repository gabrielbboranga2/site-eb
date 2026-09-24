import {PATENTES} from './patentes';
import {isCreatorRole} from './manager';
export const CHANNELS=['Início','Meu perfil','Central de ajuda','Configurações','Entregar patente','Promoção em divisão','Solicitações de promoção','Rebaixamentos','Treinamentos','Estatísticas','Militares','Hierarquia','Divisões','Logs globais','CDP','Histórico de patentes','Ranking','Documentos','Atualizações','Loja','Battle Pass'] as const;
export type Channel=typeof CHANNELS[number];
export type Permissions=Record<Channel,string>;
export const COMMERCE_CHANNELS:readonly Channel[]=['Loja','Battle Pass'];
export const DEFAULT_PERMISSIONS=Object.fromEntries(CHANNELS.map(c=>[c,COMMERCE_CHANNELS.includes(c)?'creator':c==='Rebaixamentos'?'rank:103':['Entregar patente','Promoção em divisão'].includes(c)?'rank:4':'all'])) as Permissions;
export function canView(roleId:string|undefined,channel:Channel,permissions:Permissions,rankNumber?:number){
  if(isCreatorRole(roleId))return true;
  // The commercial launch is intentionally locked independently of saved permissions.
  if(COMMERCE_CHANNELS.includes(channel))return false;
  const minimum=permissions[channel];
  if(minimum==='all')return true;
  if(!minimum||minimum==='creator')return false;
  if(minimum.startsWith('rank:'))return !!roleId&&/^\d+$/.test(roleId)&&typeof rankNumber==='number'&&Number.isFinite(rankNumber)&&rankNumber>=Number(minimum.slice(5));
  const role=PATENTES.find(p=>p.roleId===roleId),required=PATENTES.find(p=>p.roleId===minimum);
  return !!role&&!!required&&role.ordem>=required.ordem;
}
export function validPermissions(value:unknown):value is Permissions{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const entries=Object.entries(value);
  return entries.length===CHANNELS.length&&entries.every(([key,role])=>CHANNELS.includes(key as Channel)&&typeof role==='string'&&(COMMERCE_CHANNELS.includes(key as Channel)?role==='creator':role==='all'||role==='creator'||(/^rank:\d{1,3}$/.test(role)&&Number(role.slice(5))<=255)||PATENTES.some(p=>p.roleId===role)));
}
export function migratePermissions(value:unknown):Permissions{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Configuração de permissões inválida.');
  const added:Channel[]=['Solicitações de promoção','Divisões','Loja','Battle Pass'];
  const source=value as Record<string,unknown>;
  if(CHANNELS.some(c=>!added.includes(c)&&!(c in source))||Object.keys(source).some(c=>!CHANNELS.includes(c as Channel)))throw new Error('Configuração de permissões inválida.');
  const next={...DEFAULT_PERMISSIONS,...source,Loja:'creator','Battle Pass':'creator'};
  if(!validPermissions(next))throw new Error('Configuração de permissões inválida.');
  return next;
}
