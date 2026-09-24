const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const test=require('node:test');
const assert=require('node:assert/strict');
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {canView,DEFAULT_PERMISSIONS,CHANNELS,validPermissions,migratePermissions}=require('../lib/access.ts');
const {validateCommerce,EMPTY_COMMERCE}=require('../lib/commerce-model.ts');
const {validatePromotionInput,allowedTransition}=require('../lib/promotion-model.ts');
function route(relative,mocks){
  const filename=path.join(__dirname,'..',relative),exports={};
  const source=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const customRequire=name=>{if(name in mocks)return mocks[name];if(name==='next/server')return {NextResponse:{json:(data,init)=>Response.json(data,init)}};throw new Error(`Unmocked import: ${name}`)};
  vm.runInNewContext(source,{exports,require:customRequire,Request,Response,Error,console,crypto,AbortSignal,fetch,Date,Map,URL},{filename});return exports;
}
test('commercial guides stay inaccessible for all lower ranks even with permissive saved settings',()=>{
  const all=Object.fromEntries(CHANNELS.map(c=>[c,'all']));
  for(const role of ['807380036','808546027',undefined])for(const channel of ['Loja','Battle Pass'])assert.equal(canView(role,channel,all,255),false);
  assert.equal(canView('808700015','Loja',all,255),true);
  assert.equal(validPermissions({...DEFAULT_PERMISSIONS,Loja:'all'}),false);
});
test('migration retains every old hierarchy restriction and locks new commercial guides',()=>{
  const saved={...DEFAULT_PERMISSIONS,'Entregar patente':'rank:9','Logs globais':'creator'};
  for(const key of ['Loja','Battle Pass','Divisões','Solicitações de promoção'])delete saved[key];
  const migrated=migratePermissions(saved);
  assert.equal(migrated['Entregar patente'],'rank:9');assert.equal(migrated['Logs globais'],'creator');assert.equal(migrated.Loja,'creator');assert.equal(validPermissions(migrated),true);
  assert.throws(()=>migratePermissions({...saved,bogus:'all'}));delete saved.CDP;assert.throws(()=>migratePermissions(saved));
});
const product={id:'product-1',name:'Insígnia do MIG',description:'Cosmético em preparação.',category:'cosmetico',price:12.50,status:'draft'};
test('catalog validates prices, duplicates, limits and excludes injected fields',()=>{
  const valid=validateCommerce({...EMPTY_COMMERCE,items:[{...product,checkoutUrl:'https://example.com'}]});
  assert.equal(valid.items[0].checkoutUrl,undefined);
  for(const price of [-1,Infinity,NaN,12.123,10001,'50'])assert.throws(()=>validateCommerce({...EMPTY_COMMERCE,items:[{...product,price}]}));
  assert.throws(()=>validateCommerce({...EMPTY_COMMERCE,items:[product,product]}));
});
test('pass rewards reject duplicate level-track pairs and invalid tiers',()=>{
  const reward={id:'r1',level:1,name:'Insígnia',description:'Recompensa de participação.',track:'free'};
  assert.equal(validateCommerce({...EMPTY_COMMERCE,rewards:[reward,{...reward,id:'r2',track:'premium'}]}).rewards.length,2);
  assert.throws(()=>validateCommerce({...EMPTY_COMMERCE,rewards:[reward,{...reward,id:'r2'}]}));
  assert.throws(()=>validateCommerce({...EMPTY_COMMERCE,rewards:[{...reward,level:1.5}]}));
});
test('commerce API denies reads and writes to non-creators before touching storage',async()=>{
  let reads=0,writes=0;
  const api=route('app/api/creator/commerce/route.ts',{'@/lib/auth':{getSessionUser:async()=>({id:'1'})},'@/lib/authorize':{currentCreator:async()=>false,sameOrigin:()=>true},'@/lib/commerce-store':{readCommerce:async()=>{reads++},saveCommerce:async()=>{writes++}},'@/lib/commerce-model':{validateCommerce}});
  assert.equal((await api.GET(new Request('https://mig.test/api/creator/commerce'))).status,403);
  assert.equal((await api.PUT(new Request('https://mig.test/api/creator/commerce',{method:'PUT',body:'{}'}))).status,403);
  assert.equal(reads+writes,0);
});
test('commerce API preserves conflict responses and rejects cross-origin writes',async()=>{
  let origin=false;
  const api=route('app/api/creator/commerce/route.ts',{'@/lib/auth':{getSessionUser:async()=>({id:'1',username:'Criador'})},'@/lib/authorize':{currentCreator:async()=>true,sameOrigin:()=>origin},'@/lib/commerce-store':{saveCommerce:async()=>{throw new Error('Outro Criador atualizou o catálogo.')}},'@/lib/commerce-model':{validateCommerce}});
  const req=()=>new Request('https://mig.test/api/creator/commerce',{method:'PUT',body:JSON.stringify({config:EMPTY_COMMERCE,version:1})});
  assert.equal((await api.PUT(req())).status,403);origin=true;assert.equal((await api.PUT(req())).status,409);
});
test('promotion validation and transitions reject replay, skips and malformed IDs',()=>{
  assert.throws(()=>validatePromotionInput({userId:'-1',groupId:521106467,reason:'motivo válido'}));
  assert.throws(()=>validatePromotionInput({userId:'123',groupId:521106467,reason:'curto'}));
  assert.equal(allowedTransition('pending','execute'),false);assert.equal(allowedTransition('applied','execute'),false);assert.equal(allowedTransition('reconciliation','execute'),false);assert.equal(allowedTransition('approved','execute'),true);
});
function requestHarness({creator=true,fail=false,stale=false}={}){
  let item={id:'r1',userId:'123',username:'Militar',groupId:521106467,currentId:'rank1',targetId:'rank2',status:'approved'};
  let applied=0,cdp=0;
  const api=route('app/api/promotions/requests/route.ts',{
    '@/lib/roblox-identities':{resolveRobloxIdentity:async()=>({id:'123',username:'Militar'})},
    '@/lib/auth':{getSessionUser:async()=>({id:'creator1',username:'Criador'})},
    '@/lib/authorize':{authorizedFor:async()=>true,currentCreator:async()=>creator,sameOrigin:()=>true},
    '@/lib/creator-config':{getDivisions:async()=>[]},
    '@/lib/roblox':{previewRankChange:async()=>({current:{id:stale?'changed':'rank1'},target:{id:'rank2',rank:2,name:'Soldado'}}),applyRankChange:async()=>{applied++;if(fail)throw new Error('uncertain');return {target:{id:'rank2',name:'Soldado'}}}},
    '@/lib/cdp':{assertPromotionCdpAvailable:async()=>{},startPromotionCdp:async()=>{cdp++}},
    '@/lib/promotion-model':{validatePromotionInput,allowedTransition},
    '@/lib/promotion-requests':{enrichRequests:async items=>items,getRequest:async()=>({...item}),transitionRequest:async(id,from,to)=>{if(item.status!==from)throw new Error('Already updated');item={...item,status:to};return item}},
  });
  const execute=()=>api.PATCH(new Request('https://mig.test/api/promotions/requests',{method:'PATCH',body:JSON.stringify({id:'r1',action:'execute',note:'Requisitos confirmados.',confirm:true})}));
  return {execute,counts:()=>({applied,cdp,status:item.status})};
}
test('only creators can execute requests, even if the guide is visible',async()=>{const h=requestHarness({creator:false});assert.equal((await h.execute()).status,403);assert.equal(h.counts().applied,0)});
test('stale rank snapshot is refused before claiming or changing Roblox',async()=>{const h=requestHarness({stale:true});assert.equal((await h.execute()).status,409);assert.equal(h.counts().applied,0)});
test('two concurrent execution attempts produce exactly one Roblox change and one CDP',async()=>{const h=requestHarness();const results=await Promise.all([h.execute(),h.execute()]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.deepEqual(h.counts(),{applied:1,cdp:1,status:'applied'});assert.equal((await h.execute()).status,409)});
test('uncertain Roblox response locks the request for reconciliation without automatic retry',async()=>{const h=requestHarness({fail:true});assert.equal((await h.execute()).status,502);assert.equal(h.counts().status,'reconciliation');assert.equal((await h.execute()).status,409);assert.equal(h.counts().applied,1)});
