import{createHash,randomBytes,randomUUID,timingSafeEqual}from'node:crypto';
import{db,isDatabaseConfigured}from'./db';

export const TRAINING_CODE_TYPES={
  NORMAL:{kind:'TREINAMENTO',label:'Treinamento Normal',ruleId:'normal',minRank:1,maxRank:2,range:'Recruta até Soldado'},
  ESA:{kind:'TREINAMENTO',label:'Treinamento ESA',ruleId:'esa',minRank:3,maxRank:7,range:'Cabo até Subtenente'},
  AMAN:{kind:'TREINAMENTO',label:'Treinamento AMAN',ruleId:'aman',minRank:8,maxRank:15,range:'Cadete até Coronel'},
  EPCAR:{kind:'TREINAMENTO',label:'Treinamento EPCAr',ruleId:'epcar',minRank:16,maxRank:24,range:'Administrador até Comandante'},
  TAF:{kind:'TAF',label:'Teste de Aptidão Física',ruleId:'taf',minRank:1,maxRank:24,range:'Faixa definida pelo instrutor'},
}as const;

export type TrainingCodeType=keyof typeof TRAINING_CODE_TYPES;
export type TrainingCodeClaim={claimToken:string;code:string;type:TrainingCodeType;label:string;instructorId:string;instructorUsername:string};
let schemaReady:Promise<void>|null=null;

async function ensureSchema(){
  if(!schemaReady)schemaReady=(async()=>{
    await db()`CREATE TABLE IF NOT EXISTS training_verification_codes(
      id text PRIMARY KEY,code_hash text UNIQUE NOT NULL,code_suffix text NOT NULL,
      instructor_id text NOT NULL,instructor_username text NOT NULL,
      activity_kind text NOT NULL CHECK(activity_kind IN ('TREINAMENTO','TAF')),
      training_type text NOT NULL,training_label text NOT NULL,
      private_server_id text NOT NULL,place_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,
      claimed_at timestamptz,claim_token text,used_at timestamptz,
      used_by_id text,used_by_username text
    )`;
    await db()`CREATE INDEX IF NOT EXISTS training_codes_lookup_idx ON training_verification_codes(code_hash,expires_at,used_at)`;
    await db()`CREATE INDEX IF NOT EXISTS training_codes_instructor_idx ON training_verification_codes(instructor_id,created_at DESC)`;
  })().catch(error=>{schemaReady=null;throw error});
  await schemaReady;
}

function digest(code:string){return createHash('sha256').update(normalizeTrainingCode(code)).digest('hex')}
function makeCode(){return`MIG-${randomBytes(3).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`}
export function normalizeTrainingCode(code:string){return code.trim().toUpperCase().replace(/\s+/g,'')}
export function trainingTypeForRule(ruleId:string){return(Object.entries(TRAINING_CODE_TYPES).find(([,item])=>item.ruleId===ruleId)?.[0]||null)as TrainingCodeType|null}
export function trainingCodeApiConfigured(){return isDatabaseConfigured()&&Boolean(process.env.TRAINING_CODE_API_SECRET?.trim())}

export function authorizedTrainingCodeRequest(request:Request){
  const expected=process.env.TRAINING_CODE_API_SECRET?.trim()||'';
  const provided=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!expected||!provided)return false;
  const left=Buffer.from(expected);const right=Buffer.from(provided);
  return left.length===right.length&&timingSafeEqual(left,right);
}

export async function issueTrainingCode(input:{instructorId:string;instructorUsername:string;type:TrainingCodeType;privateServerId:string;placeId:string}){
  await ensureSchema();
  const definition=TRAINING_CODE_TYPES[input.type];
  if(!definition)throw new Error('Modalidade de treinamento inválida.');
  await db()`UPDATE training_verification_codes SET expires_at=LEAST(expires_at,now()) WHERE instructor_id=${input.instructorId} AND private_server_id=${input.privateServerId} AND used_at IS NULL`;
  for(let attempt=0;attempt<5;attempt++){
    const code=makeCode();const expiresAt=new Date(Date.now()+6*60*60*1000);
    try{
      await db()`INSERT INTO training_verification_codes(id,code_hash,code_suffix,instructor_id,instructor_username,activity_kind,training_type,training_label,private_server_id,place_id,expires_at) VALUES(${randomUUID()},${digest(code)},${code.slice(-4)},${input.instructorId},${input.instructorUsername},${definition.kind},${input.type},${definition.label},${input.privateServerId},${input.placeId},${expiresAt})`;
      return{code,expiresAt:expiresAt.toISOString(),...definition,type:input.type};
    }catch(error){if(attempt===4)throw error}
  }
  throw new Error('Não foi possível gerar um código único.');
}

export async function inspectTrainingCode(code:string,instructorId:string){
  await ensureSchema();
  const rows=await db()`SELECT training_type,training_label,activity_kind,expires_at,used_at,claimed_at FROM training_verification_codes WHERE code_hash=${digest(code)} AND instructor_id=${instructorId} LIMIT 1`;
  const row=rows[0];
  if(!row||row.used_at||new Date(row.expires_at).getTime()<=Date.now())return null;
  if(row.claimed_at&&Date.now()-new Date(row.claimed_at).getTime()<5*60*1000)return null;
  const type=String(row.training_type)as TrainingCodeType;const definition=TRAINING_CODE_TYPES[type];
  return definition?{type,label:String(row.training_label),kind:String(row.activity_kind),ruleId:definition.ruleId,range:definition.range,expiresAt:new Date(row.expires_at).toISOString()}:null;
}

export async function claimTrainingCode(code:string,instructorId:string,ruleId:string):Promise<TrainingCodeClaim>{
  await ensureSchema();
  const expectedType=trainingTypeForRule(ruleId);
  if(!expectedType)throw new Error('Este tipo de atividade não aceita código do servidor.');
  const claimToken=randomUUID();
  const rows=await db()`UPDATE training_verification_codes SET claimed_at=now(),claim_token=${claimToken} WHERE code_hash=${digest(code)} AND instructor_id=${instructorId} AND training_type=${expectedType} AND used_at IS NULL AND expires_at>now() AND (claimed_at IS NULL OR claimed_at<now()-interval '5 minutes') RETURNING training_type,training_label,instructor_id,instructor_username`;
  const row=rows[0];
  if(!row)throw new Error('Código inválido, expirado, de outro instrutor ou já utilizado. O treinamento foi cancelado.');
  return{claimToken,code:normalizeTrainingCode(code),type:String(row.training_type)as TrainingCodeType,label:String(row.training_label),instructorId:String(row.instructor_id),instructorUsername:String(row.instructor_username)};
}

export async function releaseTrainingCode(claimToken:string){
  await ensureSchema();
  await db()`UPDATE training_verification_codes SET claimed_at=NULL,claim_token=NULL WHERE claim_token=${claimToken} AND used_at IS NULL`;
}

export async function consumeTrainingCode(claimToken:string,userId:string,username:string){
  await ensureSchema();
  const rows=await db()`UPDATE training_verification_codes SET used_at=now(),used_by_id=${userId},used_by_username=${username},claimed_at=NULL,claim_token=NULL WHERE claim_token=${claimToken} AND used_at IS NULL RETURNING id`;
  if(!rows[0])throw new Error('O código não pôde ser confirmado. Tente novamente.');
}
