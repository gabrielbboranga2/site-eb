import {NextResponse} from 'next/server';
import {currentCreator} from '@/lib/authorize';
import {webhookStatus} from '@/lib/creator-config';
import {db,isDatabaseConfigured} from '@/lib/db';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{if(!await currentCreator(request))return NextResponse.json({error:'Acesso exclusivo de Criadores.'},{status:403});}catch{return NextResponse.json({error:'Não foi possível confirmar sua patente no Roblox.'},{status:503})}
 const checks:Array<{name:string;configured:boolean;detail:string}>=[];
 let database=false;try{if(isDatabaseConfigured()){await db()`SELECT 1`;database=true}}catch{}
 checks.push({name:'Banco PostgreSQL',configured:database,detail:database?'Conexão confirmada. CDP, códigos, ranking e logs podem persistir dados.':'Configure DATABASE_URL com uma conexão PostgreSQL acessível à Vercel.'});
 const oauth=Boolean(process.env.ROBLOX_CLIENT_ID?.trim()&&process.env.ROBLOX_CLIENT_SECRET?.trim()&&process.env.SESSION_SECRET?.trim());
 checks.push({name:'Login Roblox',configured:oauth,detail:oauth?'Variáveis OAuth presentes. O login completo depende também da URL de retorno cadastrada no Roblox.':'Preencha ROBLOX_CLIENT_ID, ROBLOX_CLIENT_SECRET e SESSION_SECRET.'});
 const site=process.env.SITE_URL?.trim(),expected=new URL(request.url).origin;
 checks.push({name:'Endereço de retorno',configured:site===expected,detail:'SITE_URL deve ser '+expected+'. No OAuth, cadastre '+expected+'/api/auth/roblox/callback.'});
 let read=false;try{if(process.env.ROBLOX_API_KEY){const r=await fetch('https://apis.roblox.com/cloud/v2/groups/521106467/roles?maxPageSize=1',{headers:{'x-api-key':process.env.ROBLOX_API_KEY.trim()},cache:'no-store',signal:AbortSignal.timeout(8000)});read=r.ok}}catch{}
 checks.push({name:'Roblox Open Cloud',configured:read,detail:read?'Leitura do grupo principal confirmada. Promoções exigem também escrita de membros/cargos e autoridade da conta emissora; este teste não altera cargos.':'Confira ROBLOX_API_KEY e o acesso de leitura e escrita ao grupo principal e a cada divisão.'});
 let hooks={trainings:false,logs:false,database};try{hooks=await webhookStatus()}catch{}
 checks.push({name:'Webhook de treinamentos',configured:hooks.trainings,detail:hooks.trainings?'Webhook configurado. A entrega ao Discord será confirmada no envio de um treinamento.':'Cole o webhook em Divisões e anúncios ou preencha DISCORD_TRAININGS_WEBHOOK.'});
 checks.push({name:'Webhook de logs',configured:hooks.logs,detail:hooks.logs?'Webhook configurado. Os logs do site também ficam no banco.':'Cole o webhook em Divisões e anúncios ou preencha DISCORD_LOGS_WEBHOOK.'});
 const training=Boolean(process.env.TRAINING_CODE_API_SECRET?.trim());checks.push({name:'Verificação de treinos no jogo',configured:training,detail:training?'Secret presente no site. O script do servidor Roblox deve usar o mesmo valor e ter HTTP Requests habilitado.':'Configure TRAINING_CODE_API_SECRET no site e no script do servidor do jogo.'});
 checks.push({name:'Proteção dos webhooks',configured:Boolean(process.env.SETTINGS_ENCRYPTION_KEY||process.env.SESSION_SECRET),detail:process.env.SETTINGS_ENCRYPTION_KEY?'Chave dedicada configurada. Preserve-a para continuar lendo os webhooks salvos.':'Usa SESSION_SECRET como chave. Não altere a chave sem recadastrar os webhooks existentes.'});
 return NextResponse.json({...hooks,database,checks},{headers:{'cache-control':'no-store'}});
}
