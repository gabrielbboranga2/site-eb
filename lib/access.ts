import {PATENTES} from './patentes';
import {isCreatorRole} from './manager';
export const CHANNELS=['Início','Meu perfil','Central de ajuda','Configurações','Entregar patente','Promoção em divisão','Rebaixamentos','Treinamentos','Estatísticas','Militares','Hierarquia','Logs globais','CDP','Histórico de patentes','Ranking','Documentos','Atualizações'] as const;
export type Channel=typeof CHANNELS[number];
export type Permissions=Record<Channel,string>;
export const DEFAULT_PERMISSIONS=Object.fromEntries(CHANNELS.map(c=>[c,c==='Rebaixamentos'?'rank:103':['Entregar patente','Promoção em divisão'].includes(c)?'rank:4':'all'])) as Permissions;
export function canView(roleId:string|undefined,channel:Channel,permissions:Permissions,rankNumber?:number){
  if(isCreatorRole(roleId))return true;
  const minimum=permissions[channel];
  if(minimum==='all')return true;
  if(minimum==='creator')return false;
  if(minimum.startsWith('rank:'))return !!roleId&&/^\d+$/.test(roleId)&&typeof rankNumber==='number'&&Number.isFinite(rankNumber)&&rankNumber>=Number(minimum.slice(5));
  const role=PATENTES.find(p=>p.roleId===roleId),required=PATENTES.find(p=>p.roleId===minimum);
  return !!role&&!!required&&role.ordem>=required.ordem;
}
export function validPermissions(value:unknown):value is Permissions{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const entries=Object.entries(value);
  return entries.length===CHANNELS.length&&entries.every(([key,role])=>CHANNELS.includes(key as Channel)&&typeof role==='string'&&(role==='all'||role==='creator'||(/^rank:\d{1,3}$/.test(role)&&Number(role.slice(5))<=255)||PATENTES.some(p=>p.roleId===role)));
}
