import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {DEFAULT_PERMISSIONS,validPermissions,migratePermissions,type Permissions} from './access';
import {db,isDatabaseConfigured} from './db';
const file=join(process.cwd(),'.data','permissions.json');
let ready:Promise<void>|null=null;
async function schema(){if(!ready)ready=(async()=>{await db()`CREATE TABLE IF NOT EXISTS manager_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`})().catch(e=>{ready=null;throw e});await ready}
export function persistentSettingsAvailable(){return isDatabaseConfigured()||!process.env.VERCEL}
export async function readPermissions():Promise<Permissions>{
 let parsed:unknown=null;
 if(isDatabaseConfigured()){await schema();const rows=await db()`SELECT value FROM manager_settings WHERE key='channel_permissions'`;parsed=rows[0]?.value}
 else if(!process.env.VERCEL){try{parsed=JSON.parse(await readFile(file,'utf8'))}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}}
 if(!parsed)return {...DEFAULT_PERMISSIONS};return migratePermissions(parsed);
}
export async function writePermissions(value:Permissions){
 if(!validPermissions(value))throw new Error('Permissões inválidas.');
 if(isDatabaseConfigured()){await schema();await db()`INSERT INTO manager_settings(key,value) VALUES('channel_permissions',${JSON.stringify(value)}::jsonb) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()`;return}
 if(process.env.VERCEL)throw new Error('Conecte DATABASE_URL na Vercel para salvar permissões.');
 await mkdir(join(process.cwd(),'.data'),{recursive:true});const temporary=`${file}.${crypto.randomUUID()}.tmp`;await writeFile(temporary,JSON.stringify(value,null,2),'utf8');await rename(temporary,file);
}
