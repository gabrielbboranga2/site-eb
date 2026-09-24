import {db,isDatabaseConfigured} from './db';
import {ensureActivitySchema} from './activity-db';
import {EMPTY_COMMERCE,validateCommerce,type CommerceConfig} from './commerce-model';
let ready:Promise<void>|null=null;
async function schema(){
  if(!isDatabaseConfigured())throw new Error('Conecte o banco de dados para salvar o catálogo.');
  if(!ready)ready=(async()=>{
    await ensureActivitySchema();
    await db()`CREATE TABLE IF NOT EXISTS manager_commerce(id integer PRIMARY KEY CHECK(id=1),config jsonb NOT NULL,version integer NOT NULL DEFAULT 0 CHECK(version>=0),updated_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
    await db()`INSERT INTO manager_commerce(id,config,updated_by) VALUES(1,${JSON.stringify(EMPTY_COMMERCE)}::jsonb,'system') ON CONFLICT(id) DO NOTHING`;
  })().catch(error=>{ready=null;throw error});
  await ready;
}
export async function readCommerce(){
  if(!isDatabaseConfigured())return {config:EMPTY_COMMERCE,version:0,canSave:false};
  await schema();
  const [row]=await db()`SELECT config,version FROM manager_commerce WHERE id=1`;
  return {config:validateCommerce(row.config),version:Number(row.version),canSave:true};
}
export async function saveCommerce(value:CommerceConfig,version:number,actor:{id:string;username:string}){
  const config=validateCommerce(value);
  if(!Number.isSafeInteger(version)||version<0)throw new Error('Versão do catálogo inválida.');
  await schema();
  return db().begin(async sql=>{
    const rows=await sql`UPDATE manager_commerce SET config=${JSON.stringify(config)}::jsonb,version=version+1,updated_by=${actor.id},updated_at=now() WHERE id=1 AND version=${version} RETURNING version`;
    if(!rows.length)throw new Error('Outro Criador atualizou o catálogo. Recarregue antes de salvar.');
    await sql`INSERT INTO manager_activity(id,tipo,user_id,username,descricao,autor_id,autor_username) VALUES(${crypto.randomUUID()},'catalogo',${actor.id},${actor.username},${`Catálogo privado atualizado: ${config.items.length} produtos e ${config.rewards.length} recompensas.`},${actor.id},${actor.username})`;
    return {config,version:Number(rows[0].version),canSave:true};
  });
}
