const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict');
function load(file,mocks={}){const filename=path.join(__dirname,'..',file),exports={};const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{exports,require:n=>{if(n in mocks)return mocks[n];throw Error('Missing mock '+n)},Date,Map,Set,Number,Array,crypto,console,AbortSignal,fetch,Response,Request},{filename});return exports}
const ranks=load('lib/patentes.ts');const model=load('lib/promotion-training-model.ts',{'./patentes':ranks});
test('training type follows the rank BEFORE promotion at every category boundary',()=>{
  for(const [order,key] of [[1,'normal'],[2,'normal'],[3,'esa'],[7,'esa'],[8,'aman'],[15,'aman'],[16,'epcar'],[23,'epcar']]){const r=ranks.PATENTES.find(r=>r.ordem===order);assert.equal(model.promotionTrainingType(521106467,'EXÉRCITO',{id:r.roleId,name:r.nome,rank:order}).key,key)}
  assert.notEqual(model.promotionTrainingType(2,'BFE',{id:'1',name:'Soldado',rank:2}).key,'normal');
});
test('15 minute boundary is fixed and a different training cannot continue the session',()=>{const now=Date.parse('2026-09-23T12:00:00Z'),w={trainingKey:'esa',closesAt:new Date(now+900000).toISOString()};assert.equal(model.continuesTraining(w,'esa',now+899999),true);assert.equal(model.continuesTraining(w,'esa',now+900000),false);assert.equal(model.continuesTraining(w,'aman',now+1),false)});
function database(){
  let now=Date.parse('2026-09-23T12:00:00Z'),queue=Promise.resolve();const windows=[],events=new Map(),locks=[];
  const sql=async(strings,...v)=>{const q=strings.join('?').replace(/\s+/g,' ').trim();
    if(q.startsWith('CREATE'))return [];
    if(q.includes('pg_advisory_xact_lock')){locks.push(v[0]);return []}
    if(q==='SELECT clock_timestamp() AS current_time')return [{current_time:new Date(now)}];
    if(q.startsWith('SELECT * FROM manager_promotion_training WHERE actor_id'))return windows.filter(w=>w.actor_id===v[0]&&w.closes_at>v[1]).slice(-1);
    if(q.startsWith('INSERT INTO manager_activity')){if(events.has(v[0]))return [];if(q.includes("'treino'")){events.set(v[0],{id:v[0],tipo:'treino',timestamp:v[6],descricao:v[3]})}else{events.set(v[0],{id:v[0],tipo:v[1],timestamp:new Date(now)})}return [{id:v[0]}]}
    if(q.startsWith('INSERT INTO manager_promotion_training')){windows.push({id:v[0],actor_id:v[1],actor_username:v[2],group_id:v[3],community:v[4],training_key:v[5],training_label:v[6],started_at:v[7],closes_at:v[8],promotions:1,activity_id:v[9]});return []}
    if(q.startsWith('UPDATE manager_promotion_training SET promotions')){const w=windows.find(w=>w.id===v[2]);w.promotions=v[0];return []}
    if(q.startsWith('UPDATE manager_promotion_training SET closes_at')){windows.find(w=>w.id===v[1]).closes_at=v[0];return []}
    if(q.startsWith('UPDATE manager_activity SET timestamp')){events.get(v[1]).timestamp=v[0];return []}
    if(q.startsWith('UPDATE manager_activity SET descricao')){events.get(v[3]).descricao=v[0];return []}
    throw Error('Unexpected query '+q);
  };
  sql.begin=fn=>{const work=queue.then(()=>fn(sql));queue=work.catch(()=>{});return work};
  const service=load('lib/promotion-training.ts',{'./db':{db:()=>sql,isDatabaseConfigured:()=>true},'./activity-db':{ensureActivitySchema:async()=>{}},'./promotion-training-model':model});
  const up=(eventId,key='normal',actor='1',groupId=521106467,promoted=true)=>service.recordRankActivity({eventId,actorId:actor,actorUsername:'Instrutor'+actor,userId:'123',username:'Militar',groupId,community:'EXÉRCITO',description:'Recruta → Soldado',promoted,trainingKey:key,trainingLabel:key.toUpperCase()});
  return {up,windows,events,locks,advance:ms=>{now+=ms},count:()=>[...events.values()].filter(e=>e.tipo==='treino'&&e.timestamp.getTime()<=now).length};
}
test('multiple UPs create one training, counted only when 15 minutes have elapsed',async()=>{const d=database();const first=await d.up('a');d.advance(14*60000);const next=await d.up('b');assert.equal(first.closesAt,next.closesAt);assert.equal(d.windows.length,1);assert.equal(next.promotions,2);assert.equal(d.count(),0);d.advance(60000);assert.equal(d.count(),1);await d.up('c');assert.equal(d.windows.length,2);assert.equal(d.count(),1)});
test('switching type closes the first training immediately and opens another; switching back opens a third',async()=>{const d=database();await d.up('a');d.advance(1000);await d.up('b','esa');assert.equal(d.count(),1);assert.equal(d.windows.length,2);d.advance(1000);await d.up('c','normal');assert.equal(d.count(),2);assert.equal(d.windows.length,3)});
test('different instructors remain independent; a community change closes only that instructor session',async()=>{const d=database();await d.up('a');await d.up('b','esa','2');d.advance(1000);await d.up('c','division:99','1',99);assert.equal(d.count(),1);assert.equal(d.windows.length,3);assert.equal(d.locks[0],d.locks[2]);assert.notEqual(d.locks[0],d.locks[1])});
test('replayed event IDs do not add a promotion or a training; demotions do not count',async()=>{const d=database();await Promise.all([d.up('same'),d.up('same')]);assert.equal(d.windows.length,1);assert.equal(d.windows[0].promotions,1);await d.up('lower','esa','1',521106467,false);assert.equal(d.windows.length,1);assert.equal(d.count(),0)});
test('concurrent distinct UPs in a single category share the instructor lock and window',async()=>{const d=database();await Promise.all(Array.from({length:12},(_,i)=>d.up('up-'+i)));assert.equal(d.windows.length,1);assert.equal(d.windows[0].promotions,12);assert.equal(new Set(d.locks).size,1)});
