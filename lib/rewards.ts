import {getRobloxIdentities} from './roblox-identities';
import {createHash,randomBytes,randomUUID} from 'crypto';
import {db} from './db';
import {ensureActivitySchema} from './activity-db';
import {getLiveHierarchies,previewDirectRankChange,applyDirectRankChange,getUserGroupMemberships} from './roblox';
import {assertPromotionCdpAvailable,startPromotionCdp} from './cdp';
import {normalizeRewardCode,validateRewardInput,type RewardCode,type RewardClaim} from './reward-model';
type Actor={id:string;username:string};
type CodeRow={id:string;title:string;kind:'rank'|'external';instructions:string;group_id:number|null;target_role_id:string|null;target_name:string|null;max_uses:number;uses:number;expires_at:Date|null;active:boolean;created_at:Date};
type ClaimRow=CodeRow & {code_id:string;user_id:string;username:string;status:RewardClaim['status'];note:string};
let ready:Promise<void>|null=null;
export async function ensureRewardSchema(){
 if(!ready)ready=(async()=>{
  await ensureActivitySchema();
  await db()`CREATE TABLE IF NOT EXISTS manager_reward_codes(id text PRIMARY KEY,code_hash text NOT NULL UNIQUE,title text NOT NULL,kind text NOT NULL CHECK(kind IN ('rank','external')),instructions text NOT NULL,group_id bigint,target_role_id text,target_name text,max_uses integer NOT NULL CHECK(max_uses BETWEEN 1 AND 10000),uses integer NOT NULL DEFAULT 0 CHECK(uses>=0 AND uses<=max_uses),expires_at timestamptz,active boolean NOT NULL DEFAULT true,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),CHECK(kind='external' OR (group_id>0 AND target_role_id IS NOT NULL)))`;
  await db()`CREATE TABLE IF NOT EXISTS manager_reward_claims(id text PRIMARY KEY,code_id text NOT NULL REFERENCES manager_reward_codes(id) ON DELETE RESTRICT,user_id text NOT NULL,username text NOT NULL,group_id bigint,status text NOT NULL CHECK(status IN ('executing','delivered','pending','reconciliation')),note text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(code_id,user_id))`;
  await db()`CREATE UNIQUE INDEX IF NOT EXISTS reward_member_executing ON manager_reward_claims(user_id,group_id) WHERE status IN ('executing','reconciliation') AND group_id IS NOT NULL`;
  await db()`CREATE INDEX IF NOT EXISTS reward_claims_user_date ON manager_reward_claims(user_id,created_at DESC)`;
  await db()`CREATE TABLE IF NOT EXISTS manager_reward_attempts(user_id text PRIMARY KEY,window_start timestamptz NOT NULL DEFAULT now(),attempts integer NOT NULL DEFAULT 1)`;
 })().catch(e=>{ready=null;throw e});await ready;
}
function mapCode(r:CodeRow):RewardCode{return{id:r.id,title:r.title,kind:r.kind,instructions:r.instructions,groupId:r.group_id?Number(r.group_id):null,targetRoleId:r.target_role_id,targetName:r.target_name,maxUses:r.max_uses,uses:r.uses,expiresAt:r.expires_at?new Date(r.expires_at).toISOString():null,active:r.active,createdAt:new Date(r.created_at).toISOString()}}
function mapClaim(r:ClaimRow):RewardClaim{return{id:r.id,codeId:r.code_id,title:r.title,kind:r.kind,instructions:r.instructions,userId:r.user_id,username:r.username,status:r.status,createdAt:new Date(r.created_at).toISOString(),note:r.note,targetName:r.target_name}}
function hash(code:string){return createHash('sha256').update(normalizeRewardCode(code)).digest('hex')}
export async function rewardOverview(actor:Actor,creator=false){await ensureRewardSchema();const claims=creator?await db()<ClaimRow[]>`SELECT c.*,r.id,r.code_id,r.user_id,r.username,r.status,r.note,r.created_at FROM manager_reward_claims r JOIN manager_reward_codes c ON c.id=r.code_id ORDER BY r.created_at DESC LIMIT 200`:await db()<ClaimRow[]>`SELECT c.*,r.id,r.code_id,r.user_id,r.username,r.status,r.note,r.created_at FROM manager_reward_claims r JOIN manager_reward_codes c ON c.id=r.code_id WHERE r.user_id=${actor.id} ORDER BY r.created_at DESC LIMIT 100`;const codes=creator?await db()<CodeRow[]>`SELECT * FROM manager_reward_codes ORDER BY created_at DESC LIMIT 200`:[];const profiles=await getRobloxIdentities(claims.map(r=>r.user_id));return{claims:claims.map(r=>({...mapClaim(r),avatar:profiles.get(r.user_id)?.avatar,username:profiles.get(r.user_id)?.username||r.username})),codes:codes.map(mapCode)}}
export async function createReward(body:Record<string,unknown>,actor:Actor){
 const input=validateRewardInput(body);let targetName:string|null=null;
 if(input.kind==='rank'){const group=(await getLiveHierarchies()).find(g=>g.groupId===input.groupId);const role=group?.roles.find(r=>r.id===input.targetRoleId);if(!role||role.rank<=0||role.rank>=253)throw Error('Esta patente não pode ser entregue por código.');targetName=group!.sigla+' · '+role.name;}
 await ensureRewardSchema();const code='MIG-'+randomBytes(16).toString('hex').toUpperCase().match(/.{8}/g)!.join('-');
 const id=randomUUID();await db().begin(async sql=>{
 await sql`INSERT INTO manager_reward_codes(id,code_hash,title,kind,instructions,group_id,target_role_id,target_name,max_uses,expires_at,created_by) VALUES(${id},${hash(code)},${input.title},${input.kind},${input.instructions},${input.groupId},${input.targetRoleId},${targetName},${input.maxUses},${input.expiresAt},${actor.id})`;
 await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${randomUUID()},'resgate',${actor.id},${actor.username},${'Código criado: '+input.title+' · '+(targetName||'Entrega manual')+' · referência '+id},${actor.id},${actor.username})`;
 });return{code};
}
async function throttle(userId:string){await ensureRewardSchema();const [row]=await db()`INSERT INTO manager_reward_attempts(user_id) VALUES(${userId}) ON CONFLICT(user_id) DO UPDATE SET attempts=CASE WHEN manager_reward_attempts.window_start<now()-interval '10 minutes' THEN 1 ELSE manager_reward_attempts.attempts+1 END,window_start=CASE WHEN manager_reward_attempts.window_start<now()-interval '10 minutes' THEN now() ELSE manager_reward_attempts.window_start END RETURNING attempts`;if(row.attempts>30)throw Error('Muitas tentativas. Aguarde 10 minutos antes de tentar novamente.')}
async function lookup(code:string){const [r]=await db()<CodeRow[]>`SELECT * FROM manager_reward_codes WHERE code_hash=${hash(code)} AND active=true AND uses<max_uses AND (expires_at IS NULL OR expires_at>now())`;if(!r)throw Error('Código inválido, encerrado, esgotado ou expirado.');return r}
export async function previewReward(code:string,actor:Actor){await throttle(actor.id);const r=await lookup(code);const used=await db()`SELECT id FROM manager_reward_claims WHERE code_id=${r.id} AND user_id=${actor.id}`;if(used.length)throw Error('Você já resgatou este código. Consulte seu histórico.');await validateRecipient(r,actor);return mapCode(r)}
async function validateRecipient(r:CodeRow,actor:Actor){
 const membership=(await getUserGroupMemberships(actor.id)).find(g=>g.groupId===521106467);if(!membership)throw Error('Entre na comunidade principal para resgatar recompensas.');
 if(r.kind==='rank'){const change=await previewDirectRankChange(actor.id,Number(r.group_id),r.target_role_id!);if(change.target.rank<=change.current.rank)throw Error('Você já possui esta patente ou uma superior. O código não foi consumido.');if(Number(r.group_id)===521106467)await assertPromotionCdpAvailable(actor.id);return change;}return null;
}
export async function redeemReward(code:string,actor:Actor){
 await throttle(actor.id);const r=await lookup(code),change=await validateRecipient(r,actor),id=randomUUID();
 await db().begin(async sql=>{
  await sql`SELECT pg_advisory_xact_lock(hashtextextended(${`reward:${actor.id}`},0))`;
  const taken=await sql`SELECT id FROM manager_reward_claims WHERE code_id=${r.id} AND user_id=${actor.id}`;if(taken.length)throw Error('Você já resgatou este código.');
  const updated=await sql`UPDATE manager_reward_codes SET uses=uses+1 WHERE id=${r.id} AND active=true AND uses<max_uses AND (expires_at IS NULL OR expires_at>now()) RETURNING id`;if(!updated.length)throw Error('Este código acabou de expirar ou esgotar.');
  await sql`INSERT INTO manager_reward_claims(id,code_id,user_id,username,group_id,status) VALUES(${id},${r.id},${actor.id},${actor.username},${r.kind==='rank'?r.group_id:null},${r.kind==='rank'?'executing':'pending'})`;
  await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${randomUUID()},'resgate',${actor.id},${actor.username},${'Resgate reservado: '+r.title+' · referência '+id},${actor.id},${actor.username})`;
 });
 if(r.kind==='external')return{message:'Resgate registrado. Um Criador confirmará a entrega.',status:'pending'};
 try{
  const result=await applyDirectRankChange(actor.id,Number(r.group_id),r.target_role_id!,change!.current.id);
  if(Number(r.group_id)===521106467)await startPromotionCdp({userId:actor.id,username:actor.username,targetRoleId:result.target.id,targetRankName:result.target.name,actorId:actor.id,actorUsername:actor.username});
  await finishClaim(id,'delivered','Patente entregue pelo Roblox: '+r.target_name,actor);
  return{message:'Patente entregue no Roblox. O resgate não soma treinamento.',status:'delivered'};
 }catch{
  await db()`UPDATE manager_reward_claims SET status='reconciliation',note='Conferência necessária. Não repetir a entrega; consultar o cargo atual no Roblox e a CDP.',updated_at=now() WHERE id=${id}`;
  return{message:'O resgate foi reservado, mas a entrega precisa de conferência por um Criador. Não repita o código.',status:'reconciliation'};
 }
}
async function finishClaim(id:string,status:'delivered',note:string,actor:Actor){await db().begin(async sql=>{const [r]=await sql`UPDATE manager_reward_claims SET status=${status},note=${note},updated_at=now() WHERE id=${id} AND status IN ('executing','pending','reconciliation') RETURNING user_id,username`;if(!r)throw Error('Este resgate já foi atualizado.');await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${randomUUID()},'resgate',${r.user_id},${r.username},${'Entrega confirmada · '+id+' · '+note},${actor.id},${actor.username})`})}
export async function manageReward(body:Record<string,unknown>,actor:Actor){
 await ensureRewardSchema();const id=String(body.id||'');
 if(body.action==='disable'){await db().begin(async sql=>{const rows=await sql`UPDATE manager_reward_codes SET active=false WHERE id=${id} AND active=true RETURNING title`;if(!rows.length)throw Error('Código já encerrado ou inexistente.');await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${randomUUID()},'resgate',${actor.id},${actor.username},${'Código encerrado: '+rows[0].title+' · '+id},${actor.id},${actor.username})`});return;}
 const note=String(body.note||'').trim();if(note.length<10||note.length>500)throw Error('Descreva a entrega em 10 a 500 caracteres.');
 const [r]=await db()<ClaimRow[]>`SELECT c.*,r.id,r.code_id,r.user_id,r.username,r.status,r.note,r.created_at FROM manager_reward_claims r JOIN manager_reward_codes c ON c.id=r.code_id WHERE r.id=${id}`;
 if(!r)throw Error('Resgate não encontrado.');
 if(r.kind==='rank'){
  if(!['executing','reconciliation'].includes(r.status))throw Error('O resgate já foi concluído.');
  const current=await previewDirectRankChange(r.user_id,Number(r.group_id),r.target_role_id!);
  if(current.current.id!==r.target_role_id)throw Error('O Roblox ainda não confirma a patente esperada. Corrija pelo painel Alterar cargo antes de confirmar a entrega.');
  // Reconciliation verifies the external result; it never repeats the Roblox write.
 }else if(r.status!=='pending')throw Error('Este resgate já foi entregue.');
 await finishClaim(id,'delivered',note,actor);
}
