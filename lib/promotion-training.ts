import type {TransactionSql} from 'postgres';
import {continuesTraining} from './promotion-training-model';
import {db,isDatabaseConfigured} from './db';
import {ensureActivitySchema} from './activity-db';
export const TRAINING_WINDOW_MINUTES=15;
export type TrainingWindow={id:string;actorId:string;actorUsername:string;groupId:number;community:string;trainingKey:string;trainingLabel:string;startedAt:string;closesAt:string;promotions:number;avatar?:string};
let ready:Promise<void>|null=null;
export async function ensurePromotionTrainingSchema(){
  if(!ready)ready=(async()=>{
    await ensureActivitySchema();
    await db()`CREATE TABLE IF NOT EXISTS manager_promotion_training(id text PRIMARY KEY,actor_id text NOT NULL,actor_username text NOT NULL,group_id bigint NOT NULL CHECK(group_id>0),community text NOT NULL,training_key text NOT NULL,training_label text NOT NULL,started_at timestamptz NOT NULL,closes_at timestamptz NOT NULL,promotions integer NOT NULL DEFAULT 1 CHECK(promotions>0),activity_id text NOT NULL UNIQUE REFERENCES manager_activity(id) ON DELETE RESTRICT,CHECK(closes_at>=started_at AND closes_at<=started_at+interval '15 minutes'))`;
    await db()`CREATE INDEX IF NOT EXISTS promotion_training_actor_date ON manager_promotion_training(actor_id,closes_at DESC)`;
  })().catch(error=>{ready=null;throw error});await ready;
}
type Input={actorId:string;actorUsername:string;groupId:number;community:string;trainingKey:string;trainingLabel:string};
// The caller transaction includes the promotion audit entry, whose ID prevents replay.
export async function appendPromotionTraining(sql:TransactionSql,input:Input){
  const {actorId,actorUsername,groupId,community,trainingKey,trainingLabel}=input;
  await sql`SELECT pg_advisory_xact_lock(hashtextextended(${'promotion-training:'+actorId},0))`;
  const [clock]=await sql`SELECT clock_timestamp() AS current_time`;const now=new Date(clock.current_time);
  const [active]=await sql`SELECT * FROM manager_promotion_training WHERE actor_id=${actorId} AND closes_at>${now} ORDER BY started_at DESC LIMIT 1 FOR UPDATE`;
  const same=active&&Number(active.group_id)===groupId&&continuesTraining({trainingKey:active.training_key,closesAt:new Date(active.closes_at).toISOString()},trainingKey,now.getTime());
  if(active&&!same){
    await sql`UPDATE manager_promotion_training SET closes_at=${now} WHERE id=${active.id}`;
    await sql`UPDATE manager_activity SET timestamp=${now},descricao=descricao||' Encerrado pela mudança de formação.' WHERE id=${active.activity_id}`;
  }
  const existing=same?active:undefined;
  const id=existing?.id||crypto.randomUUID(),activityId=existing?.activity_id||crypto.randomUUID();
  const start=existing?new Date(existing.started_at):now,close=existing?new Date(existing.closes_at):new Date(now.getTime()+TRAINING_WINDOW_MINUTES*60_000),count=existing?Number(existing.promotions)+1:1;
  const description=trainingLabel+' · '+community+' · '+count+' UP(s) confirmados · janela de até 15 minutos.';
  if(existing){await sql`UPDATE manager_promotion_training SET promotions=${count},actor_username=${actorUsername} WHERE id=${id}`;await sql`UPDATE manager_activity SET descricao=${description},username=${actorUsername},autor_username=${actorUsername} WHERE id=${activityId}`}
  else{
    // Durable scheduled event: visible at closure even if the browser is closed.
    await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username,timestamp) VALUES(${activityId},'treino',${actorId},${actorUsername},${description},${actorId},${actorUsername},${close})`;
    await sql`INSERT INTO manager_promotion_training(id,actor_id,actor_username,group_id,community,training_key,training_label,started_at,closes_at,promotions,activity_id) VALUES(${id},${actorId},${actorUsername},${groupId},${community},${trainingKey},${trainingLabel},${start},${close},1,${activityId})`;
  }
  return {id,actorId,actorUsername,groupId,community,trainingKey,trainingLabel,startedAt:start.toISOString(),closesAt:close.toISOString(),promotions:count} satisfies TrainingWindow;
}
export async function recordRankActivity(input:Input&{eventId:string;userId:string;username:string;description:string;promoted:boolean;countsAsTraining?:boolean}){
  await ensurePromotionTrainingSchema();
  return db().begin(async sql=>{
    const rows=await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${input.eventId},${input.promoted?'promocao':'rebaixamento'},${input.userId},${input.username},${input.description},${input.actorId},${input.actorUsername}) ON CONFLICT(id) DO NOTHING RETURNING id`;
    if(rows.length&&input.promoted&&input.countsAsTraining!==false)return appendPromotionTraining(sql,input);return null;
  });
}
export async function readOpenTrainingWindows():Promise<TrainingWindow[]>{
  if(!isDatabaseConfigured())return [];await ensurePromotionTrainingSchema();
  const rows=await db()`SELECT * FROM manager_promotion_training WHERE closes_at>now() ORDER BY closes_at LIMIT 200`;
  return rows.map(r=>({id:r.id,actorId:r.actor_id,actorUsername:r.actor_username,groupId:Number(r.group_id),community:r.community,trainingKey:r.training_key,trainingLabel:r.training_label,startedAt:new Date(r.started_at).toISOString(),closesAt:new Date(r.closes_at).toISOString(),promotions:Number(r.promotions)}));
}
