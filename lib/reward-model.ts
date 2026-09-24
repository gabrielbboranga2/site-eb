export type RewardKind='rank'|'external';
export type RewardStatus='executing'|'delivered'|'pending'|'reconciliation';
export interface RewardCode {id:string;code?:string;title:string;kind:RewardKind;instructions:string;groupId:number|null;targetRoleId:string|null;targetName:string|null;maxUses:number;uses:number;expiresAt:string|null;active:boolean;createdAt:string}
export interface RewardClaim {id:string;codeId:string;title:string;kind:RewardKind;instructions:string;userId:string;username:string;avatar?:string;status:RewardStatus;createdAt:string;note:string;targetName:string|null}
export function normalizeRewardCode(value:unknown){if(typeof value!=='string')throw Error('Informe o código recebido.');const code=value.trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]{2,23}$/.test(code)&&!/^MIG-[A-F0-9]{8}(?:-[A-F0-9]{8}){3}$/.test(code))throw Error('Use de 3 a 24 caracteres: letras, números, hífen ou sublinhado.');return code}
export function validateRewardInput(body:Record<string,unknown>){
 const code=normalizeRewardCode(body.code);
 const title=typeof body.title==='string'?body.title.trim():'';
 const instructions=typeof body.instructions==='string'?body.instructions.trim():'';
 const kind=body.kind;
 const maxUses=Number(body.maxUses);
 const expiresAt=body.expiresAt?new Date(String(body.expiresAt)):null;
 if(title.length<3||title.length>80)throw Error('O título precisa ter de 3 a 80 caracteres.');
 if(kind!=='rank'&&kind!=='external')throw Error('Escolha o tipo de recompensa.');
 if(instructions.length<5||instructions.length>500)throw Error('Descreva a recompensa em 5 a 500 caracteres.');
 if(!Number.isSafeInteger(maxUses)||maxUses<1||maxUses>10000)throw Error('Defina de 1 a 10.000 resgates.');
 if(expiresAt&&(!Number.isFinite(expiresAt.getTime())||expiresAt.getTime()<=Date.now()))throw Error('Escolha uma validade futura.');
 const groupId=kind==='rank'?Number(body.groupId):null,targetRoleId=kind==='rank'?String(body.targetRoleId||''):null;
 if(kind==='rank'&&(!Number.isSafeInteger(groupId)||(groupId??0)<=0||(!/^\d+$/.test(targetRoleId!)&&targetRoleId!=='__NEXT__')))throw Error('Selecione uma comunidade e uma patente.');
 return {code,title,instructions,kind:kind as RewardKind,maxUses,expiresAt,groupId,targetRoleId};
}
