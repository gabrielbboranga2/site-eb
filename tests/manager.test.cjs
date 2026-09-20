const fs = require('node:fs');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');
// Compile the actual TypeScript modules; no duplicate test implementation.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename);
const {canView,validPermissions,DEFAULT_PERMISSIONS,CHANNELS} = require('../lib/access.ts');
const {isCreatorRole,remainingCdp,filterActivities,trainingRanking} = require('../lib/manager.ts');
const {PATENTES} = require('../lib/patentes.ts');
const {earnedEmblems} = require('../lib/emblems.ts');
test('Only the exact Criador role gets management access',()=>{
  assert.equal(isCreatorRole('808700015'),true);
  for(const rank of PATENTES.filter(p=>p.sigla!=='CR'))assert.equal(isCreatorRole(rank.roleId),false,rank.nome);
  assert.equal(isCreatorRole(undefined),false);
});
test('UP threshold includes 3 SGT and excludes lower ranks',()=>{
  assert.equal(canView('808664027','Entregar patente',DEFAULT_PERMISSIONS,3),false);
  assert.equal(canView('808768016','Entregar patente',DEFAULT_PERMISSIONS,4),true);
  assert.equal(canView('808906015','Entregar patente',DEFAULT_PERMISSIONS,12),true);
});
test('Demotion threshold follows hierarchy, not administrator boolean',()=>{
  assert.equal(canView('807914044','Rebaixamentos',DEFAULT_PERMISSIONS,102),false);
  assert.equal(canView('808432019','Rebaixamentos',DEFAULT_PERMISSIONS,103),true);
  assert.equal(canView('808546027','Rebaixamentos',DEFAULT_PERMISSIONS,200),true);
  assert.equal(canView('unknown','Rebaixamentos',DEFAULT_PERMISSIONS,200),false);
});
test('Every guide supports creator-only and creator cannot be locked out',()=>{
 const locked=Object.fromEntries(CHANNELS.map(c=>[c,'creator']));
 for(const channel of CHANNELS){assert.equal(canView('808700015',channel,locked),true);assert.equal(canView('808546027',channel,locked),false)}
});
test('Permission updates require every known guide and a valid role',()=>{
 assert.equal(validPermissions(DEFAULT_PERMISSIONS),true);
 assert.equal(validPermissions({...DEFAULT_PERMISSIONS,CDP:'99999'}),false);
 const missing={...DEFAULT_PERMISSIONS};delete missing.CDP;assert.equal(validPermissions(missing),false);
 assert.equal(validPermissions({...DEFAULT_PERMISSIONS,unexpected:'all'}),false);
});
test('CDP uses real deadlines and handles elapsed and invalid values',()=>{
 const now=Date.UTC(2026,8,12);assert.equal(remainingCdp(new Date(now+7200000).toISOString(),now),'2h 0min');
 assert.equal(remainingCdp(new Date(now-1000).toISOString(),now),'Período concluído');assert.equal(remainingCdp('invalid',now),'Prazo indisponível');
});
test('Log filters and ranking count only identified training instructors',()=>{
 const logs=[{id:'1',tipo:'treino',userId:'12',username:'Militar',descricao:'Aprovado',autorId:'1',autorUsername:'Instrutor'},{id:'2',tipo:'promocao',userId:'12',username:'Militar',descricao:'UP',autorId:'1',autorUsername:'Instrutor'},{id:'3',tipo:'treino',userId:'13',username:'Outro',descricao:'Aprovado'}];
 assert.equal(filterActivities(logs,'  instrutor  ','treino').length,1);
 assert.equal(filterActivities(logs,'13','').length,1);
 assert.deepEqual(trainingRanking(logs),[{id:'1',name:'Instrutor',avatar:undefined,count:1}]);
});
test('Emblems follow divisions and the main-group hierarchy',()=>{
 const thirdSergeant=PATENTES.find(rank=>rank.ordem===4);const aspirant=PATENTES.find(rank=>rank.ordem===9);const brigadier=PATENTES.find(rank=>rank.ordem===16);
 assert.deepEqual(earnedEmblems(thirdSergeant.roleId,['BFE']).map(item=>item.key),['BFE','ESA']);
 assert.deepEqual(earnedEmblems(aspirant.roleId,[]).map(item=>item.key),['ESA','AMAN']);
 assert.deepEqual(earnedEmblems(brigadier.roleId,['STAFF']).map(item=>item.key),['STAFF','ESA','AMAN','EPCAR']);
});
