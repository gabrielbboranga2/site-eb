import {ensurePromotionTrainingSchema,appendPromotionTraining} from './promotion-training';
import {promotionTrainingType} from './promotion-training-model';
import {getRobloxIdentities,identityName} from './roblox-identities';
import {db,isDatabaseConfigured} from './db';
import {ensureActivitySchema} from './activity-db';
import {type PromotionRequest,type RequestStatus} from './promotion-model';
let ready:Promise<void>|null=null;
type Actor={id:string;username:string};
async function schema(){
  if(!isDatabaseConfigured())throw new Error('Conecte o banco de dados para registrar solicitações.');
  if(!ready)ready=(async()=>{
    await ensureActivitySchema();
    await ensurePromotionTrainingSchema();
    await db()`CREATE TABLE IF NOT EXISTS manager_promotion_requests(id text PRIMARY KEY,user_id text NOT NULL,username text NOT NULL,group_id bigint NOT NULL CHECK(group_id>0),community text NOT NULL,current_id text NOT NULL,current_name text NOT NULL,target_id text NOT NULL,target_name text NOT NULL,reason text NOT NULL CHECK(length(reason) BETWEEN 10 AND 500),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','executing','applied','reconciliation')),requested_by text NOT NULL,requested_name text NOT NULL,reviewed_name text,review_note text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
    await db()`ALTER TABLE manager_promotion_requests ADD COLUMN IF NOT EXISTS reviewed_by text`;
    await db()`CREATE UNIQUE INDEX IF NOT EXISTS promotion_open_member ON manager_promotion_requests(user_id,group_id) WHERE status IN ('pending','approved','executing','reconciliation')`;
    await db()`CREATE INDEX IF NOT EXISTS promotion_requester_date ON manager_promotion_requests(requested_by,created_at DESC)`;
  })().catch(error=>{ready=null;throw error});
  await ready;
}
type Row={id:string;user_id:string;username:string;group_id:string|number;community:string;current_id:string;current_name:string;target_id:string;target_name:string;reason:string;status:RequestStatus;requested_by:string;requested_name:string;reviewed_name:string|null;reviewed_by?:string|null;review_note:string;created_at:Date;updated_at:Date};
function map(r:Row):PromotionRequest{return {id:r.id,userId:r.user_id,username:r.username,groupId:Number(r.group_id),community:r.community,currentId:r.current_id,currentName:r.current_name,targetId:r.target_id,targetName:r.target_name,reason:r.reason,status:r.status,requestedBy:r.requested_by,requestedName:r.requested_name,reviewedName:r.reviewed_name,reviewedBy:r.reviewed_by||undefined,reviewNote:r.review_note,createdAt:new Date(r.created_at).toISOString(),updatedAt:new Date(r.updated_at).toISOString()}}
export async function listRequests(actorId:string,creator:boolean){
  if(!isDatabaseConfigured())return {requests:[],canSave:false};
  await schema();const rows=creator?await db()<Row[]>`SELECT * FROM manager_promotion_requests ORDER BY created_at DESC LIMIT 200`:await db()<Row[]>`SELECT * FROM manager_promotion_requests WHERE requested_by=${actorId} ORDER BY created_at DESC LIMIT 100`;
  return {requests:await enrichRequests(rows.map(map)),canSave:true};
}
export async function createRequest(input:{userId:string;username:string;groupId:number;community:string;currentId:string;currentName:string;targetId:string;targetName:string;reason:string},actor:Actor){
  await schema();
  return db().begin(async sql=>{
    const rows=await sql<Row[]>`INSERT INTO manager_promotion_requests(id,user_id,username,group_id,community,current_id,current_name,target_id,target_name,reason,requested_by,requested_name) VALUES(${crypto.randomUUID()},${input.userId},${input.username},${input.groupId},${input.community},${input.currentId},${input.currentName},${input.targetId},${input.targetName},${input.reason},${actor.id},${actor.username}) ON CONFLICT(user_id,group_id) WHERE status IN ('pending','approved','executing','reconciliation') DO NOTHING RETURNING *`;
    if(!rows.length)throw new Error('Já existe uma solicitação em aberto para este militar nesta comunidade.');
    const r=map(rows[0]);
    await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${crypto.randomUUID()},'solicitacao',${r.userId},${r.username},${`Solicitação ${r.id}: ${r.currentName} → ${r.targetName}. Motivo: ${r.reason}`},${actor.id},${actor.username})`;
    return r;
  });
}
export async function getRequest(id:string){await schema();const [row]=await db()<Row[]>`SELECT * FROM manager_promotion_requests WHERE id=${id}`;return row?map(row):null}
export async function transitionRequest(id:string,from:RequestStatus,to:RequestStatus,note:string,actor:Actor){
  await schema();
  return db().begin(async sql=>{
    const rows=await sql<Row[]>`UPDATE manager_promotion_requests SET status=${to},reviewed_name=${actor.username},reviewed_by=${actor.id},review_note=${note},updated_at=now() WHERE id=${id} AND status=${from} RETURNING *`;
    if(!rows.length)throw new Error('Esta solicitação já foi atualizada. Recarregue a lista.');
    const r=map(rows[0]);
    const description=`Solicitação ${r.id}: ${to}. ${r.currentName} → ${r.targetName}. ${note}`;
    await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${crypto.randomUUID()},${to==='applied'?'promocao':'solicitacao'},${r.userId},${r.username},${description},${actor.id},${actor.username})`;
    if(to==='applied'){const training=promotionTrainingType(r.groupId,r.community,{id:r.currentId,name:r.currentName,rank:0});await appendPromotionTraining(sql,{actorId:actor.id,actorUsername:actor.username,groupId:r.groupId,community:r.community,trainingKey:training.key,trainingLabel:training.label})}
    return r;
  });
}

export async function enrichRequests(items:PromotionRequest[]){const profiles=await getRobloxIdentities(items.flatMap(r=>[r.userId,r.requestedBy,...(r.reviewedBy?[r.reviewedBy]:[])]));return items.map(r=>({...r,username:profiles.get(r.userId)?.username&&profiles.get(r.userId)?.username!=='Perfil indisponível'?profiles.get(r.userId)!.username:identityName(r.username),avatar:profiles.get(r.userId)?.avatar,requestedName:profiles.get(r.requestedBy)?.username&&profiles.get(r.requestedBy)?.username!=='Perfil indisponível'?profiles.get(r.requestedBy)!.username:identityName(r.requestedName),requestedAvatar:profiles.get(r.requestedBy)?.avatar,reviewedAvatar:r.reviewedBy?profiles.get(r.reviewedBy)?.avatar:undefined}))}
