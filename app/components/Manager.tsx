'use client';
import dynamic from 'next/dynamic';
import {RewardCodes} from './RewardCodes';
import {AnnouncementBanner} from './AnnouncementBanner';
import {RobloxAvatar as Avatar,RobloxIdentity} from './RobloxIdentity';
import {TrainingWindows} from './TrainingWindows';
export {RobloxAvatar as Avatar} from './RobloxIdentity';
import {DivisionImage,useDivisions} from './DivisionDirectory';
import {FeedbackToast} from './FeedbackToast';
const RankChangeWorkflow=dynamic(()=>import('./RankChangeWorkflow').then(m=>m.RankChangeWorkflow));
const TrainingRegistration=dynamic(()=>import('./TrainingRegistration').then(m=>m.TrainingRegistration));
const CommerceWorkspace=dynamic(()=>import('./CommerceWorkspace'));
const PromotionRequests=dynamic(()=>import('./PromotionRequests'));
const DivisionDirectory=dynamic(()=>import('./DivisionDirectory'));

/* eslint-disable @next/next/no-img-element -- Dynamic Roblox avatars. */
import {useEffect,useState,useRef} from 'react';
import {House,UserRound,Users,Medal,Layers,ChartNoAxesCombined,Clock,ClipboardList,BookOpen,Flag,ArrowDown,ShieldCheck,Menu,X,Search,Sun,RefreshCw,CircleHelp,Settings,type LucideIcon} from 'lucide-react';

import {CHANNELS,COMMERCE_CHANNELS,DEFAULT_PERMISSIONS,canView,type Channel,type Permissions} from '@/lib/access';
import {EVENT_LABELS,type ManagerData,type Activity,type RosterMember} from '@/lib/manager';
import {Hierarchy,Members,Logs,Cdp,Ranking,Creator,Help} from './ManagerViews';
export interface SessionUser {id:string;username:string;rank?:string;avatar?:string;isAdmin?:boolean;isCreator?:boolean;roleId?:string;division?:string;rankNumber?:number;divisions?:Array<{name:string;rankNumber?:number;role?:string}>}
type Announcement={id:string;title:string;message:string;color:string;placement:'topbar'|'below';endsAt:string|null};

const groups=[{title:'Geral',items:['Início','Meu perfil','Central de ajuda','Configurações']},{title:'Ferramentas',items:['Entregar patente','Promoção em divisão','Solicitações de promoção','Rebaixamentos','Treinamentos']},{title:'Consultas',items:['Estatísticas','Militares','Hierarquia','Divisões','Logs globais','CDP','Histórico de patentes','Ranking']},{title:'Conteúdo',items:['Documentos','Atualizações']},{title:'Preparação · Criadores',items:['Loja','Battle Pass']}];
const icons:Record<string,string>={'Loja':'book','Battle Pass':'award','Divisões':'layers','Solicitações de promoção':'logs','Início':'home','Meu perfil':'user','Central de ajuda':'help','Configurações':'settings','Entregar patente':'award','Promoção em divisão':'layers','Rebaixamentos':'down','Treinamentos':'flag','Estatísticas':'chart','Militares':'users','Hierarquia':'layers','Logs globais':'logs','CDP':'clock','Histórico de patentes':'clock','Ranking':'award','Documentos':'book','Atualizações':'flag'};
export function Icon({name,size=20}:{name:string;size?:number}){
 const icons:Record<string,LucideIcon>={home:House,user:UserRound,users:Users,award:Medal,layers:Layers,chart:ChartNoAxesCombined,clock:Clock,logs:ClipboardList,book:BookOpen,flag:Flag,down:ArrowDown,shield:ShieldCheck,menu:Menu,close:X,search:Search,sun:Sun,refresh:RefreshCw,help:CircleHelp,settings:Settings};
 const Glyph=icons[name]||Flag;
 return <Glyph size={size} strokeWidth={1.7} aria-hidden="true"/>;
}
export const demoMembers:RosterMember[]=[{userId:'demo-1001',username:'LucasMIG',rankName:'[CB] Cabo',division:'BPE',roleId:'808664027',rankNumber:3},{userId:'demo-1002',username:'AnaComandos',rankName:'[SLD] Soldado',division:'BAC',roleId:'807380036',rankNumber:2},{userId:'demo-1003',username:'PedroTatico',rankName:'[3° SGT] Terceiro Sargento',division:'BFE',roleId:'808768016',rankNumber:4},{userId:'demo-1004',username:'MarinaIntel',rankName:'[CAP] Capitão',division:'CIE',roleId:'808906015',rankNumber:12}];
function demoData():ManagerData{const now=Date.now();const logs:Activity[]=Array.from({length:24},(_,i)=>({id:`demo-${i}`,tipo:i%4===0?'treino':'promocao',userId:demoMembers[i%4].userId,username:demoMembers[i%4].username,descricao:i%4===0?'Treinamento de formação concluído.':'Progressão de patente após treinamento.',timestamp:new Date(now-i*13_000_000).toISOString(),autorId:`instrutor-${i%3}`,autorUsername:['ComandanteMIG','InstrutorMIG','OficialMIG'][i%3]}));return {totalSincronizados:148,emCdp:2,treinosMes:6,acoesRegistradas:24,ultimaSincronizacao:new Date(now).toISOString(),divisoes:{'EXÉRCITO':148,STAFF:8,BFE:24,CIE:12,BAC:32,BPE:41},atividadesRecentes:logs,auditAvailable:true,cdpMembers:demoMembers.slice(0,2).map((m,i)=>({...m,cdpFim:new Date(now+(i+1)*4_000_000).toISOString()}))}}
export async function json(url:string){const r=await fetch(url,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível carregar os dados.');return d}
export default function Manager({user,preview=false}:{user:SessionUser;preview?:boolean}){
 const generation=useRef(0);
 const [active,setActive]=useState('Início'),[menu,setMenu]=useState(false),[data,setData]=useState<ManagerData|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[theme,setTheme]=useState('dark'),[notice,setNotice]=useState(true),[demoRole,setDemoRole]=useState('creator');
 const [roles,setRoles]=useState<Array<{id:string;name:string;rank:number}>>([]);
 const [announcements,setAnnouncements]=useState<Announcement[]>([]);
 const [allowed,setAllowed]=useState<string[]>([]),[permissions,setPermissions]=useState<Permissions>({...DEFAULT_PERMISSIONS}),[canSave,setCanSave]=useState(false);
 const [liveCreator,setLiveCreator]=useState(false);
 const creator=preview?demoRole==='creator':liveCreator;
 const [toast,setToast]=useState('');
 const visible=(preview?CHANNELS.filter(c=>canView(creator?'808700015':'807380036',c,permissions,creator?255:2)):allowed).filter(c=>!COMMERCE_CHANNELS.includes(c as Channel)||(creator&&(!preview||process.env.NODE_ENV==='development')));
 const load=async()=>{
  const current=++generation.current;let accessReady=false;
  setLoading(true);setError('');
  try{
   if(preview){setData(demoData());return}
   const access=await json('/api/permissions');
   if(current!==generation.current)return;
   accessReady=true;setAllowed(access.allowed);setLiveCreator(access.creator===true);if(access.permissions)setPermissions(access.permissions);setCanSave(access.canSave);setRoles(access.roles||[]);
   if(!access.allowed.includes(active)&&active!=='Gestão do criador'){setActive(access.allowed[0]||'Acesso restrito');return}
   if(['Início','Estatísticas','CDP','Logs globais','Histórico de patentes','Ranking','Meu perfil'].includes(active)){
    const stats=['Início','Estatísticas'].includes(active)?await json(`/api/dashboard/stats?channel=${encodeURIComponent(active)}`):{totalSincronizados:0,divisoes:{},ultimaSincronizacao:null};
    const audit=await json(`/api/manager?channel=${encodeURIComponent(active)}`);
    if(current!==generation.current)return;
    setData({...stats,atividadesRecentes:audit.logs,cdpMembers:audit.cdpMembers,auditAvailable:audit.auditAvailable,emCdp:audit.cdpMembers.length,acoesRegistradas:audit.acoesRegistradas,treinosMes:audit.treinosMes,trainingWindows:audit.trainingWindows});
   }
  }catch(e){if(current===generation.current){if(!accessReady){setAllowed([]);setLiveCreator(false)}setData(null);setError(e instanceof Error?e.message:'Falha na consulta.')}}
  finally{if(current===generation.current)setLoading(false)}
 };
 useEffect(()=>{const timer=setTimeout(()=>{void load()},0);return()=>clearTimeout(timer)},[preview,active]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{if(preview||!['Ranking','Início','Estatísticas','Logs globais'].includes(active))return;const timer=setInterval(()=>void load(),30000);return()=>clearInterval(timer)},[preview,active]); // eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{const timer=setTimeout(()=>{try{setTheme(localStorage.getItem('mig-theme')||'dark')}catch{}},0);return()=>clearTimeout(timer)},[]);
 useEffect(()=>{if(preview)return;const refresh=()=>fetch('/api/announcements',{cache:'no-store'}).then(r=>r.json()).then(d=>setAnnouncements(d.announcements||[])).catch(()=>{});void refresh();const timer=setInterval(()=>void refresh(),60000);return()=>clearInterval(timer)},[preview]);
 useEffect(()=>{
  if(!menu)return;
  const previous=document.activeElement as HTMLElement|null;
  const sidebar=document.querySelector<HTMLElement>('.manager-sidebar');
  const focusables=()=>Array.from(sidebar?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')||[]).filter(el=>el.getClientRects().length>0);
  focusables()[0]?.focus();
  const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false);if(e.key==='Tab'){const nodes=focusables(),first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
  document.addEventListener('keydown',handler);const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',handler);document.body.style.overflow=overflow;previous?.focus()};
 },[menu]);
 function navigate(page:string){if(page!==active){generation.current++;setData(null);setLoading(true)}setActive(page);setMenu(false);window.scrollTo({top:0,behavior:'instant'});requestAnimationFrame(()=>document.getElementById('manager-main')?.focus({preventScroll:true}))}
 function changeTheme(value:string){setTheme(value);try{localStorage.setItem('mig-theme',value)}catch{}}
 const permitted=visible.includes(active as Channel)||(active==='Gestão do criador'&&creator);
 return <div className={`manager theme-${theme}`}><a className="skip-link" href="#manager-main">Ir para o conteúdo</a>{menu&&<button className="menu-scrim" aria-label="Fechar menu" onClick={()=>setMenu(false)}/>}
 <aside className={`manager-sidebar ${menu?'is-open':''}`} aria-label="Menu principal"><div className="manager-brand"><span className="brand-shield"><Icon name="shield" size={29}/></span><span>EB DO MIG<small>Central militar</small></span></div><button className="close-menu icon-button" aria-label="Fechar menu" onClick={()=>setMenu(false)}><Icon name="close"/></button><nav>{groups.map(g=>g.items.some(i=>visible.includes(i as Channel))&&<div className="menu-group" key={g.title}><p>{g.title}</p>{g.items.filter(i=>visible.includes(i as Channel)).map(item=><button key={item} className={active===item?'selected':''} aria-current={active===item?'page':undefined} onClick={()=>navigate(item)}><Icon name={icons[item]}/><span>{item}</span>{active===item&&<i/>}</button>)}</div>)}{creator&&<div className="menu-group creator-nav"><p>Exclusivo de Criadores</p><button className={active==='Gestão do criador'?'selected':''} onClick={()=>navigate('Gestão do criador')}><Icon name="shield"/><span>Gestão do criador</span></button></div>}</nav><div className="sidebar-account"><div className="account-tools"><button aria-label="Alternar tema" onClick={()=>changeTheme(theme==='dark'?'light':'dark')}><Icon name="sun"/></button><button aria-label="Atualizar consultas" disabled={loading} onClick={()=>void load()}><Icon name="refresh"/></button><a href={preview?'/':'/api/auth/logout'}>{preview?'Entrar':'Sair'}</a></div><div className="account-person"><Avatar name={user.username} src={user.avatar}/><div><b>{user.username}</b><small>{preview&&!creator?'[SLD] Soldado':user.rank||'Membro'}</small></div></div></div></aside>
 <div className="manager-content">{announcements.filter(item=>item.placement==='topbar').map(item=><AnnouncementBanner item={item} key={item.id}/>)}<header className="manager-topbar"><button className="open-menu icon-button" aria-label="Abrir menu" aria-expanded={menu} onClick={()=>setMenu(true)}><Icon name="menu"/></button><span>Central militar <span className="breadcrumb">/ {active}</span></span><span className="connection"><i/>{preview?'Demonstração':loading?'Consultando…':error?'Consulta indisponível':'Sessão autenticada'}</span></header><main id="manager-main" className="manager-main" tabIndex={-1}>{announcements.filter(item=>item.placement==='below').map(item=><AnnouncementBanner item={item} key={item.id}/>)}{preview&&<div className="demo-notice"><span><b>Demonstração interativa</b> · Dados fictícios.</span><label>Visualizar como <select aria-label="Visualizar como" value={demoRole} onChange={e=>{setDemoRole(e.target.value);navigate('Início')}}><option value="creator">Criador</option><option value="member">Soldado</option></select></label></div>}{notice&&<div className="mural"><Icon name="flag"/><span><b>Bem-vindo à central do EB DO MIG.</b> Consulte sua patente e acompanhe sua divisão.</span><button className="icon-button" aria-label="Fechar aviso" onClick={()=>setNotice(false)}><Icon name="close" size={16}/></button></div>}<div className="manager-heading"><div><h1>{active==='Início'?'Seu quartel, em um só lugar.':active}</h1><p>{descriptions[active]||'Organização e informação para o seu dia a dia no Exército.'}</p></div>{['Início','Estatísticas','CDP','Logs globais'].includes(active)&&<button className="m-button" disabled={loading} onClick={()=>void load()}><Icon name="refresh" size={16}/>{loading?'Carregando…':'Atualizar'}</button>}</div>{error&&<div className="m-alert" role="alert">{error} <button onClick={()=>void load()}>Tentar novamente</button></div>}
 {!permitted?<Blank title={loading?'Verificando acesso…':'Guia indisponível para sua patente'} text="As permissões de cada guia são definidas pelos Criadores."/>:<>
 {active==='Início'&&<Overview preview={preview} user={preview&&!creator?{...user,rank:"[SLD] Soldado"}:user} data={data} navigate={navigate} visible={visible}/>}
 {active==='Meu perfil'&&<><section className="m-panel profile-panel"><Avatar name={user.username} src={user.avatar}/><h2>{user.username}</h2><span className="m-tag">{user.rank||'Membro'}</span><div className="profile-facts"><div><small>Divisão</small><b>{user.division||'EXÉRCITO'}</b></div><div><small>Username Roblox</small><b>{user.username}</b></div></div>{!preview&&<a className="m-button" href={`https://www.roblox.com/users/${user.id}/profile`} target="_blank" rel="noreferrer">Ver no Roblox ↗</a>}</section><EmblemGallery preview={preview}/><RewardCodes preview={preview}/></>}
 {active==='Estatísticas'&&<Statistics data={data}/>}{active==='Militares'&&<Members preview={preview}/>}{active==='Hierarquia'&&<Hierarchy preview={preview}/>}{active==='CDP'&&<Cdp data={data} user={user}/>}{['Logs globais','Histórico de patentes'].includes(active)&&<Logs key={active} logs={data?.atividadesRecentes||[]} history={active==='Histórico de patentes'} available={data?.auditAvailable}/>}{active==='Ranking'&&<TrainingWindows windows={data?.trainingWindows}/>}
 {active==='Ranking'&&<Ranking logs={data?.atividadesRecentes||[]}/>}{['Entregar patente','Promoção em divisão','Rebaixamentos'].includes(active)&&<RankChangeWorkflow key={active} mode={active==='Rebaixamentos'?'demotion':'promotion'} channel={active} preview={preview} previewCanSkip={creator}/>}{active==='Treinamentos'&&<TrainingRegistration instructor={user.username} instructorRank={preview?255:user.rankNumber||0} instructorRole={user.rank} membershipRanks={user.divisions?.map(d=>({sigla:d.name,rank:d.rankNumber||0,role:d.role}))} preview={preview}/>}
 {active==='Divisões'&&<DivisionDirectory preview={preview}/>}
 {active==='Solicitações de promoção'&&<PromotionRequests preview={preview} creator={creator}/>}
 {creator&&['Loja','Battle Pass'].includes(active)&&<CommerceWorkspace key={active} mode={active==='Loja'?'shop':'pass'} preview={preview}/>}
 {active==='Configurações'&&<section className="m-panel prose"><h2>Aparência</h2><p>Escolha o tema. A preferência vale apenas para este navegador.</p><div className="tabs">{[['dark','Escuro'],['light','Claro'],['system','Sistema']].map(([v,label])=><button aria-pressed={theme===v} className={theme===v?'active':''} key={v} onClick={()=>{changeTheme(v);setToast('Preferência de aparência salva neste navegador.')}}>{label}</button>)}</div><h2>Minha conta</h2><p>Se sua patente ou divisão mudar, saia e entre novamente para atualizar sua sessão.</p>{creator&&<button className="m-button primary" onClick={()=>navigate('Gestão do criador')}>Abrir gestão do criador</button>}</section>}
 {active==='Gestão do criador'&&creator&&<Creator roles={roles} preview={preview} permissions={permissions} update={setPermissions} canSave={canSave}/>}{active==='Central de ajuda'&&<Help/>}{active==='Documentos'&&<section className="m-panel prose"><h2>Documentos da central</h2>{[['/termos','Termos de serviço'],['/privacidade','Política de privacidade']].map(([href,label])=><a className="document-link" href={href} key={href}><Icon name="book"/><b>{label}</b><span>↗</span></a>)}<p>Documentos operacionais serão disponibilizados quando aprovados pelos Criadores.</p></section>}{active==='Atualizações'&&<section className="m-panel prose"><span className="m-tag">Nova central</span><h2>Uma rotina militar mais organizada</h2><p>Navegação por áreas, consultas, revisão de militares em lote e permissões por patente. A gestão do sistema é exclusiva de Criadores.</p><p>Interface adaptada para computador e celular, com temas claro, escuro e do sistema.</p></section>}</>}
 <footer className="manager-footer"><span>EB DO MIG · Central militar</span><span>Grupo 521106467 <a href="/privacidade">Privacidade</a></span></footer></main></div>
 <nav className="mobile-bottom" aria-label="Atalhos">{[['Início','home','Início'],['Meu perfil','user','Perfil'],['Entregar patente','award','Patente'],['Logs globais','logs','Logs']].filter(([p])=>visible.includes(p as Channel)).map(([p,i,l])=><button className={active===p?'active':''} aria-current={active===p?'page':undefined} key={p} onClick={()=>navigate(p)}><Icon name={i}/><span>{l}</span></button>)}<button className={menu?'active':''} aria-expanded={menu} onClick={()=>setMenu(true)}><Icon name="menu"/><span>Menu</span></button></nav><FeedbackToast message={toast} onClose={()=>setToast('')}/></div>
}
const descriptions:Record<string,string>={'Loja':'Organize o catálogo em acesso privado antes do lançamento.','Battle Pass':'Planeje temporadas e recompensas. Acesso exclusivo de Criadores.','Divisões':'Comunidades oficiais e unidades do Exército Brasileiro do Mig.','Solicitações de promoção':'Indicações, pareceres e execução com rastreabilidade.','Início':'Bem-vindo ao seu ponto de encontro com o Exército Brasileiro do Mig.','Estatísticas':'Acompanhe o efetivo e a atividade registrada na central.','Entregar patente':'Prepare a relação de militares após um treinamento aprovado.','Promoção em divisão':'Selecione a divisão e confira os militares antes da progressão.','Rebaixamentos':'Consulte o militar e revise a seleção.','Hierarquia':'Estrutura de patentes do MIG, organizada por categoria.','CDP':'Capacitação de patente. Acompanhe os períodos registrados.','Militares':'Encontre militares por nome, ID, patente ou divisão.','Logs globais':'Filtre os registros por militar, responsável ou ação.','Ranking':'Instrutores com mais treinamentos registrados neste mês.','Gestão do criador':'Gerencie as permissões de acesso às guias da central.'};
export function Blank({title='Nenhum registro por aqui',text}:{title?:string;text:string}){return <div className="m-empty"><Icon name="logs" size={32}/><h3>{title}</h3><p>{text}</p></div>}
function EmblemGallery({preview}:{preview:boolean}){const[items,setItems]=useState<Array<{key:string;name:string;reason:string;imageUrl:string}>>(()=>preview?[{key:'BFE',name:'BFE',reason:'Membro da divisão BFE',imageUrl:''},{key:'ESA',name:'ESA',reason:'Terceiro Sargento ou superior',imageUrl:''}]:[]);useEffect(()=>{if(preview)return;fetch('/api/emblems',{cache:'no-store'}).then(r=>r.json()).then(d=>setItems(d.emblems||[])).catch(()=>{})},[preview]);return <section className="m-panel"><div className="panel-title"><h2>Meus emblemas</h2><span>{items.length} conquistados</span></div>{items.length?<div className="emblem-grid">{items.map(item=><article key={item.key}>{item.imageUrl?<img src={item.imageUrl} alt={`Emblema ${item.name}`}/>:<span><Icon name="shield" size={30}/></span>}<b>{item.name}</b><small>{item.reason}</small></article>)}</div>:<Blank title="Nenhum emblema conquistado" text="Entre em uma divisão ou avance na hierarquia para liberar emblemas."/>}</section>}
function Metric({label,value,icon,note}:{label:string;value:string|number;icon:string;note:string}){return <article className="metric"><div><span>{label}</span><Icon name={icon}/></div><strong>{value}</strong><small>{note}</small></article>}
function Overview({user,data,navigate,visible,preview=false}:{preview?:boolean;user:SessionUser;data:ManagerData|null;navigate:(s:string)=>void;visible:readonly string[]}){
 const primaryAction=visible.includes('Treinamentos')?'Treinamentos':visible.includes('Entregar patente')?'Entregar patente':'Meu perfil';
 const quickDescriptions:Record<string,string>={'Treinamentos':'Validar e registrar uma instrução','Entregar patente':'Preparar militares aprovados','CDP':'Acompanhar prazos ativos','Hierarquia':'Consultar a cadeia de comando','Militares':'Pesquisar o efetivo','Logs globais':'Revisar ações confirmadas'};
 const shortcuts=['Treinamentos','Entregar patente','CDP','Hierarquia','Militares','Logs globais'].filter(page=>visible.includes(page as Channel)).slice(0,4);
 const {divisions:divisionVisuals}=useDivisions(preview);
 const divisionImage=(sigla:string)=>divisionVisuals.find(item=>item.sigla===sigla)?.imageUrl||'';
 const mainGroupImage=divisionImage('EXÉRCITO');
 return <>
  <TrainingWindows windows={data?.trainingWindows}/>
  <div className="command-alerts" aria-label="Alertas do comando">
   {visible.includes('CDP')&&<button onClick={()=>navigate('CDP')}><Icon name="clock" size={18}/>{data?.emCdp??'—'} em capacitação<span>Consultar prazos</span></button>}
   {visible.includes('Solicitações de promoção')&&<button onClick={()=>navigate('Solicitações de promoção')}><Icon name="logs" size={18}/>Solicitações de promoção<span>Acompanhar análise</span></button>}
   {data?.auditAvailable===false&&<span role="status" className="m-alert">Histórico indisponível. Consulte um Criador.</span>}
  </div>
  <section className="welcome-panel command-briefing">
   <div className="briefing-copy">
    <span className="m-tag">Quartel general</span>
    <h2>Pronto para a missão, {user.username}?</h2>
    <p>Acompanhe sua situação militar, registre atividades e acesse as ferramentas liberadas para sua patente.</p>
    <div className="briefing-actions">
     <button className="m-button primary" onClick={()=>navigate(primaryAction)}><Icon name={icons[primaryAction]||'user'} size={17}/>{primaryAction==='Meu perfil'?'Ver meu perfil':`Abrir ${primaryAction.toLowerCase()}`}</button>
     {visible.includes('Hierarquia')&&<button className="m-button briefing-secondary" onClick={()=>navigate('Hierarquia')}>Consultar hierarquia</button>}
    </div>
   </div>
   {mainGroupImage&&<img className="command-group-mark" width={118} height={118} alt="" aria-hidden="true" src={mainGroupImage}/>}
   <div className="command-pass" aria-label="Identificação militar atual">
    <div className="command-pass-head"><span>Identificação militar</span><i>Ativa</i></div>
    <div className="command-pass-person"><Avatar name={user.username} src={user.avatar}/><div><b>{user.username}</b><small>{user.rank||'Membro do Exército'}</small></div></div>
    <div className="command-pass-foot"><span>{user.division||'EXÉRCITO'}</span><span>@{user.username}</span></div>
   </div>
  </section>
  <div className="metric-grid command-metrics"><Metric label="Efetivo principal" value={data?.totalSincronizados??'—'} icon="users" note="Militares sincronizados"/><Metric label="Em capacitação" value={data?.auditAvailable?data.emCdp:'—'} icon="clock" note="Prazos de CDP ativos"/><Metric label="Treinos no mês" value={data?.auditAvailable?data.treinosMes:'—'} icon="flag" note="Registros confirmados"/><Metric label="Ações auditadas" value={data?.auditAvailable?data.acoesRegistradas:'—'} icon="chart" note="Histórico da central"/></div>
  <div className="overview-grid">
   <section className="m-panel quick-panel"><div className="panel-title"><div><small>Operações</small><h2>Acesso rápido</h2></div><span>{shortcuts.length} disponíveis</span></div><div className="quick-grid">{shortcuts.map(page=><button key={page} onClick={()=>navigate(page)}><span className="quick-icon"><Icon name={icons[page]} size={22}/></span><span className="quick-copy"><b>{page}</b><small>{quickDescriptions[page]}</small></span><span className="quick-arrow" aria-hidden="true">›</span></button>)}</div></section>
   <section className="m-panel activity-panel"><div className="panel-title"><div><small>Movimentação</small><h2>Atividade recente</h2></div>{visible.includes('Logs globais')&&<button className="text-button" onClick={()=>navigate('Logs globais')}>Abrir registros</button>}</div>{data?.atividadesRecentes.length?<div className="activity-list">{data.atividadesRecentes.slice(0,4).map(l=><div key={l.id}><RobloxIdentity userId={l.userId} username={l.username} avatar={l.avatar} detail={EVENT_LABELS[l.tipo]||l.tipo}/><RobloxIdentity userId={l.autorId} username={l.autorUsername} avatar={l.autorAvatar} detail="Responsável"/><time>{new Date(l.timestamp).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</time></div>)}</div>:<Blank text={data?.auditAvailable===false?'O histórico precisa de armazenamento persistente para ficar disponível.':'As ações confirmadas aparecerão aqui.'}/>}</section>
  </div>
  <section className="home-feature-grid" aria-label="Destaques da central">
   <article className="m-panel identity-feature">
    <div className="feature-avatar"><Avatar name={user.username} src={user.avatar}/><span><i/>EM SERVIÇO</span></div>
    <div><small>Seu posto de comando</small><h2>{user.rank||'Militar do MIG'}</h2><p>{user.division||'EXÉRCITO'} · perfil sincronizado com o Roblox</p><button className="text-button" onClick={()=>navigate('Meu perfil')}>Ver identificação completa</button></div>
   </article>
   <article className="m-panel academy-feature">
    <div><small>Formação militar</small><h2>Academias do MIG</h2><p>Conquistas liberadas conforme sua progressão na hierarquia.</p></div>
    <div className="academy-badges"><span><img width={53} height={53} loading="lazy" decoding="async" src="/badges/esa.png" alt="Emblema ESA"/><b>ESA</b></span><span><img width={53} height={53} loading="lazy" decoding="async" src="/badges/aman.png" alt="Emblema AMAN"/><b>AMAN</b></span></div>
   </article>
   <article className="m-panel mission-feature">
    <small>Próxima missão</small><h2>Prepare sua operação</h2>
    <ol><li><span>01</span>Confirme a modalidade</li><li><span>02</span>Reúna o efetivo</li><li><span>03</span>Registre a prova</li></ol>
    {visible.includes(primaryAction as Channel)&&<button className="m-button primary" onClick={()=>navigate(primaryAction)}>Começar agora</button>}
   </article>
  </section>
  <section className="m-panel division-panel"><div className="panel-title"><div><small>Comunidades</small><h2>Divisões do MIG</h2></div><span>{divisionVisuals.length} comunidades</span></div><div className="division-cards">{divisionVisuals.map(d=>{return<a key={d.id} href={`https://www.roblox.com/communities/${d.groupId}`} target="_blank" rel="noreferrer"><DivisionImage division={d}/><b>{d.sigla}</b><span>{data?.divisoes[d.sigla]??'—'} militares</span><small>{d.nome}</small></a>})}</div></section>
 </>
}
function Statistics({data}:{data:ManagerData|null}){const logs=data?.atividadesRecentes||[];const days=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return {label:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),count:logs.filter(l=>l.tipo==='promocao'&&new Date(l.timestamp).toDateString()===d.toDateString()).length}});const max=Math.max(1,...days.map(d=>d.count));return <><div className="metric-grid"><Metric label="Promoções" value={data?.auditAvailable?logs.filter(l=>l.tipo==='promocao').length:'—'} icon="award" note="Histórico registrado"/><Metric label="Rebaixamentos" value={data?.auditAvailable?logs.filter(l=>l.tipo==='rebaixamento').length:'—'} icon="down" note="Histórico registrado"/><Metric label="Treinamentos" value={data?.auditAvailable?data.treinosMes:'—'} icon="flag" note="Mês atual"/><Metric label="Efetivo" value={data?.totalSincronizados??'—'} icon="users" note="Grupo principal"/></div><section className="m-panel"><div className="panel-title"><h2>Promoções por dia</h2><span>Últimos 14 dias</span></div>{logs.length?<div className="bar-chart" role="img" aria-label={days.map(d=>`${d.label}: ${d.count} promoções`).join('; ')}>{days.map(d=><div className="chart-column" key={d.label}><b>{d.count}</b><div style={{height:`${Math.max(2,d.count/max*150)}px`}}/><small>{d.label}</small></div>)}</div>:<Blank text="O gráfico aparece quando houver promoções registradas."/>}</section><Ranking logs={logs}/></>}
