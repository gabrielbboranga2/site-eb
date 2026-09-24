export type RequestStatus='pending'|'approved'|'rejected'|'executing'|'applied'|'reconciliation';
export type PromotionRequest={id:string;userId:string;username:string;groupId:number;community:string;currentId:string;currentName:string;targetId:string;targetName:string;reason:string;status:RequestStatus;requestedBy:string;requestedName:string;reviewedName:string|null;reviewedBy?:string;avatar?:string;requestedAvatar?:string;reviewedAvatar?:string;reviewNote:string;createdAt:string;updatedAt:string};
export const REQUEST_STATUS:Record<RequestStatus,string>={pending:'Em análise',approved:'Aprovada para execução',rejected:'Recusada',executing:'Em execução',applied:'Aplicada no Roblox',reconciliation:'Conferência necessária'};
export function validatePromotionInput(body:unknown){
  if(!body||typeof body!=='object')throw new Error('Solicitação inválida.');
  const b=body as Record<string,unknown>;
  if(typeof b.userId!=='string'||!/^\d{1,20}$/.test(b.userId))throw new Error('Informe o ID numérico do militar.');
  if(!Number.isSafeInteger(b.groupId)||Number(b.groupId)<=0)throw new Error('Escolha uma comunidade válida.');
  if(typeof b.reason!=='string'||b.reason.trim().length<10||b.reason.length>500)throw new Error('Explique o motivo em 10 a 500 caracteres.');
  return {userId:b.userId,groupId:Number(b.groupId),reason:b.reason.trim()};
}
export function allowedTransition(status:RequestStatus,action:string){return (status==='pending'&&(action==='approve'||action==='reject'))||(status==='approved'&&(action==='execute'||action==='reject'))}
