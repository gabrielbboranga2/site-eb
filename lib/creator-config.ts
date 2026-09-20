import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID} from 'crypto';
import {db,isDatabaseConfigured} from './db';
import {DIVISOES,type Divisao} from './divisoes-mig';

export type WebhookKind='trainings'|'logs';
export type AnnouncementPlacement='topbar'|'below';
export interface Announcement{id:string;title:string;message:string;color:string;placement:AnnouncementPlacement;startsAt:string;endsAt:string|null;active:boolean}
type AnnouncementRow={id:string;title:string;message:string;color:string;placement:AnnouncementPlacement;starts_at:Date|string;ends_at:Date|string|null;active:boolean};

let ready:Promise<void>|null=null;
async function schema(){
 if(!isDatabaseConfigured())throw new Error('Conecte o banco PostgreSQL antes de salvar configurações.');
 if(!ready)ready=(async()=>{const sql=db();
  await sql`CREATE TABLE IF NOT EXISTS manager_webhooks(kind text PRIMARY KEY CHECK(kind IN ('trainings','logs')),encrypted_url text NOT NULL,updated_by text NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS manager_divisions(group_id bigint PRIMARY KEY,name text NOT NULL,sigla text NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS manager_announcements(id text PRIMARY KEY,title text NOT NULL,message text NOT NULL,color text NOT NULL,placement text NOT NULL CHECK(placement IN ('topbar','below')),starts_at timestamptz NOT NULL,ends_at timestamptz,active boolean NOT NULL DEFAULT true,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS manager_announcements_active ON manager_announcements(active,starts_at,ends_at)`;
 })().catch(error=>{ready=null;throw error});
 await ready;
}

function encryptionKey(){const value=process.env.SETTINGS_ENCRYPTION_KEY?.trim()||process.env.SESSION_SECRET?.trim();if(!value)throw new Error('Configure SETTINGS_ENCRYPTION_KEY ou SESSION_SECRET para proteger os webhooks.');return createHash('sha256').update(value).digest()}
function encrypt(value:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);const body=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),body.toString('base64url')].join('.')}
function decrypt(value:string){const[iv,tag,body]=value.split('.');const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64url'));decipher.setAuthTag(Buffer.from(tag,'base64url'));return Buffer.concat([decipher.update(Buffer.from(body,'base64url')),decipher.final()]).toString('utf8')}
export function validateWebhook(value:string){try{const url=new URL(value.trim());if(url.protocol!=='https:'||!['discord.com','canary.discord.com','ptb.discord.com'].includes(url.hostname)||!/^\/api(?:\/v\d+)?\/webhooks\/\d+\/[A-Za-z0-9._-]+$/.test(url.pathname))return null;return url.toString().replace(/\/$/,'')}catch{return null}}

export async function getWebhook(kind:WebhookKind){
 if(isDatabaseConfigured()){await schema();const rows=await db()<Array<{encrypted_url:string}>>`SELECT encrypted_url FROM manager_webhooks WHERE kind=${kind}`;if(rows[0])return decrypt(rows[0].encrypted_url)}
 return validateWebhook(kind==='trainings'?process.env.DISCORD_TRAININGS_WEBHOOK||'':process.env.DISCORD_LOGS_WEBHOOK||'');
}
export async function saveWebhook(kind:WebhookKind,value:string,actor:string){const valid=validateWebhook(value);if(!valid)throw new Error('Informe uma URL válida de webhook do Discord.');await schema();await db()`INSERT INTO manager_webhooks(kind,encrypted_url,updated_by) VALUES(${kind},${encrypt(valid)},${actor}) ON CONFLICT(kind) DO UPDATE SET encrypted_url=excluded.encrypted_url,updated_by=excluded.updated_by,updated_at=now()`}
export async function webhookStatus(){return{trainings:Boolean(await getWebhook('trainings')),logs:Boolean(await getWebhook('logs')),database:isDatabaseConfigured()}}

export async function getDivisions():Promise<Divisao[]>{
 if(!isDatabaseConfigured())return DIVISOES;
 await schema();const rows=await db()<Array<{group_id:string|number;name:string;sigla:string}>>`SELECT group_id,name,sigla FROM manager_divisions WHERE active=true ORDER BY created_at`;
 const known=new Set(DIVISOES.map(item=>item.groupId));return[...DIVISOES,...rows.filter(row=>!known.has(Number(row.group_id))).map((row,index)=>({id:1000+index,nome:row.name,sigla:row.sigla,groupId:Number(row.group_id)}))];
}
export async function addDivision(input:{groupId:number;name:string;sigla:string;actor:string}){await schema();if(input.groupId===521106467)throw new Error('O grupo principal já está cadastrado.');const sigla=input.sigla.trim().toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);if(!sigla)throw new Error('Não foi possível gerar uma sigla para a comunidade.');await db()`INSERT INTO manager_divisions(group_id,name,sigla,active,created_by) VALUES(${input.groupId},${input.name.slice(0,100)},${sigla},true,${input.actor}) ON CONFLICT(group_id) DO UPDATE SET name=excluded.name,sigla=excluded.sigla,active=true`;return getDivisions()}

function mapAnnouncement(row:AnnouncementRow):Announcement{return{id:row.id,title:row.title,message:row.message,color:row.color,placement:row.placement,startsAt:new Date(row.starts_at).toISOString(),endsAt:row.ends_at?new Date(row.ends_at).toISOString():null,active:Boolean(row.active)}}
export async function getAnnouncements(all=false):Promise<Announcement[]>{if(!isDatabaseConfigured())return[];await schema();const rows=all?await db()<AnnouncementRow[]>`SELECT * FROM manager_announcements ORDER BY created_at DESC`:await db()<AnnouncementRow[]>`SELECT * FROM manager_announcements WHERE active=true AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now()) ORDER BY created_at DESC`;return rows.map(mapAnnouncement)}
export async function saveAnnouncement(input:{title:string;message:string;color:string;placement:AnnouncementPlacement;startsAt?:string;endsAt?:string|null;actor:string}){await schema();if(input.title.trim().length<3||input.message.trim().length<5)throw new Error('Preencha o título e a mensagem do anúncio.');if(!/^#[0-9a-fA-F]{6}$/.test(input.color))throw new Error('Escolha uma cor válida.');const start=input.startsAt?new Date(input.startsAt):new Date();const end=input.endsAt?new Date(input.endsAt):null;if(end&&end<=start)throw new Error('O término precisa ser posterior ao início.');const rows=await db()<AnnouncementRow[]>`INSERT INTO manager_announcements(id,title,message,color,placement,starts_at,ends_at,active,created_by) VALUES(${randomUUID()},${input.title.trim().slice(0,80)},${input.message.trim().slice(0,500)},${input.color},${input.placement},${start},${end},true,${input.actor}) RETURNING *`;return mapAnnouncement(rows[0])}
export async function disableAnnouncement(id:string){await schema();const rows=await db()`UPDATE manager_announcements SET active=false,updated_at=now() WHERE id=${id} RETURNING id`;if(!rows[0])throw new Error('Anúncio não encontrado.')}
