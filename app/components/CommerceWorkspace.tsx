'use client';
import {useEffect,useState} from 'react';
import {LockKeyhole,PackagePlus,Medal,ShieldCheck,Trash2,Pencil,Save} from 'lucide-react';
import {EMPTY_COMMERCE,validateCommerce,type CommerceConfig,type CatalogItem,type PassReward} from '@/lib/commerce-model';
import {FeedbackToast} from './FeedbackToast';
const priceFormat=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const emptyProduct:CatalogItem={id:'',name:'',description:'',price:0,category:'cosmetico',status:'draft'};
const emptyReward:PassReward={id:'',name:'',description:'',level:1,track:'free'};
export default function CommerceWorkspace({mode,preview=false}:{mode:'shop'|'pass';preview?:boolean}){
  const [config,setConfig]=useState<CommerceConfig>(EMPTY_COMMERCE),[version,setVersion]=useState(0),[canSave,setCanSave]=useState(preview);
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[dirty,setDirty]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const [product,setProduct]=useState<CatalogItem>(emptyProduct),[reward,setReward]=useState<PassReward>(emptyReward),[editing,setEditing]=useState(false);
  const [filter,setFilter]=useState('all'),[season,setSeason]=useState(EMPTY_COMMERCE.season),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setLoading(true);setError('');
      try{
        if(preview){const saved=sessionStorage.getItem('mig-commerce-preview');const c=saved?validateCommerce(JSON.parse(saved)):EMPTY_COMMERCE;setConfig(c);setSeason(c.season);setCanSave(true);return}
        const response=await fetch('/api/creator/commerce',{signal:controller.signal,cache:'no-store'});const data=await response.json();
        if(!response.ok)throw new Error(data.error);setConfig(data.config);setSeason(data.config.season);setVersion(data.version);setCanSave(data.canSave);setDirty(false);
      }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Não foi possível carregar.')}
      finally{if(!controller.signal.aborted)setLoading(false)}
    },0);
    return()=>{clearTimeout(timer);controller.abort()};
  },[preview,retry]);
  useEffect(()=>{if(!dirty)return;const handler=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler)},[dirty]);
  async function persist(next:CommerceConfig){
    setSaving(true);setError('');
    try{
      const clean=validateCommerce(next);
      if(preview){sessionStorage.setItem('mig-commerce-preview',JSON.stringify(clean));setConfig(clean);setDirty(false);setNotice('Salvo apenas nesta demonstração. Nenhuma compra foi criada.');return true}
      const response=await fetch('/api/creator/commerce',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({config:clean,version})});const data=await response.json();if(!response.ok)throw new Error(data.error);
      setConfig(data.config);setVersion(data.version);setDirty(false);setNotice('Configuração salva. Somente Criadores têm acesso.');return true;
    }catch(e){setError(e instanceof Error?e.message:'Falha ao salvar.');return false}finally{setSaving(false)}
  }
  async function submit(event:React.FormEvent){
    event.preventDefault();
    const id=(mode==='shop'?product.id:reward.id)||crypto.randomUUID();
    const next=mode==='shop'?{...config,items:[...config.items.filter(p=>p.id!==id),{...product,id}]}:{...config,season,rewards:[...config.rewards.filter(r=>r.id!==id),{...reward,id}]};
    if(await persist(next)){setEditing(false);setProduct(emptyProduct);setReward(emptyReward)}
  }
  const items=config.items.filter(item=>filter==='all'||item.category===filter);
  return <div className="commerce-workspace">
    <section className="restricted-banner"><LockKeyhole size={22}/><div><b>Preparação exclusiva dos Criadores</b><p>Catálogo privado. Pagamentos, compras e entrega de benefícios ainda estão desativados para todos.</p></div><span className="m-tag">Acesso restrito</span></section>
    <section className="commerce-hero"><div><span className="section-label">{mode==='shop'?'Intendência do MIG':'Passe de campanha'}</span><h2>{mode==='shop'?'Prepare o próximo capítulo.':config.season}</h2><p>{mode==='shop'?'Organize benefícios e preços antes de abrir a loja para a comunidade.':'Planeje uma progressão que valorize a participação dos militares.'}</p><button className="m-button primary" disabled={loading||saving||!canSave} onClick={()=>{setEditing(true);setProduct(emptyProduct);setReward(emptyReward)}}><PackagePlus size={18}/>{mode==='shop'?'Adicionar produto':'Adicionar recompensa'}</button></div><div className="commerce-insignia" aria-hidden="true"><Medal size={76}/><span>{mode==='shop'?'MIG':'PASSE'}</span></div></section>
    {error&&<div className="m-alert" role="alert">{error}<button className="m-button" disabled={saving} onClick={()=>setRetry(n=>n+1)}>Recarregar catálogo</button></div>}
    {!loading&&!canSave&&<div className="m-alert">O catálogo precisa do banco de dados para salvar as configurações.</div>}
    {loading?<div className="panel-skeleton" role="status" aria-label="Carregando catálogo"><span/><span/><span/></div>:<>
      {mode==='shop'?<div className="catalog-toolbar"><div><h2>Catálogo privado</h2><p>{config.items.length} {config.items.length===1?'produto cadastrado':'produtos cadastrados'}</p></div><label>Categoria<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Todas</option><option value="patente">Patentes</option><option value="cosmetico">Cosméticos</option><option value="beneficio">Benefícios</option></select></label></div>:<form className="season-editor" onSubmit={e=>{e.preventDefault();void persist({...config,season})}}><label htmlFor="season-name">Nome da temporada<input id="season-name" value={season} minLength={3} maxLength={80} required onChange={e=>{setSeason(e.target.value);setDirty(true)}}/></label><button className="m-button" disabled={!dirty||saving||!canSave}><Save size={16}/>Salvar temporada</button></form>}
      {mode==='shop'?<div className="catalog-grid">{items.map(item=><article className="catalog-card" key={item.id}><div className={`catalog-art category-${item.category}`}><Medal size={44}/><span>{item.category==='patente'?'Patente':item.category==='cosmetico'?'Cosmético':'Benefício'}</span></div><div className="catalog-copy"><span className="m-tag">{item.status==='ready'?'Revisado · privado':'Rascunho'}</span><h3>{item.name}</h3><p>{item.description}</p><strong>{priceFormat.format(item.price)}</strong><small>Preço planejado · compra indisponível</small><div className="catalog-actions"><button className="m-button" disabled={saving||!canSave} onClick={()=>{setProduct(item);setEditing(true)}}><Pencil size={15}/>Editar</button><button className="icon-button" aria-label={`Remover ${item.name}`} disabled={saving||!canSave} onClick={()=>void persist({...config,items:config.items.filter(p=>p.id!==item.id)})}><Trash2 size={17}/></button></div></div></article>)}</div>:<div className="reward-track">{config.rewards.map(item=><article className={`reward-step ${item.track}`} key={item.id}><span className="reward-level">{item.level}</span><div><span className="m-tag">{item.track==='premium'?'Premium':'Gratuita'}</span><h3>{item.name}</h3><p>{item.description}</p></div><button className="icon-button" aria-label={`Editar ${item.name}`} disabled={saving||!canSave} onClick={()=>{setReward(item);setEditing(true)}}><Pencil size={17}/></button><button className="icon-button" aria-label={`Remover ${item.name}`} disabled={saving||!canSave} onClick={()=>void persist({...config,rewards:config.rewards.filter(r=>r.id!==item.id)})}><Trash2 size={17}/></button></article>)}</div>}
      {!(mode==='shop'?items.length:config.rewards.length)&&<div className="m-empty"><ShieldCheck size={36}/><h3>{mode==='shop'?'Seu catálogo começa aqui':'Planeje a primeira recompensa'}</h3><p>{mode==='shop'?'Cadastre um produto para revisar a apresentação e o preço.':'Defina o nível e a trilha. Nada será entregue aos jogadores nesta etapa.'}</p></div>}
    </>}
    {editing&&<section className="m-panel catalog-editor" aria-label={mode==='shop'?'Editor de produto':'Editor de recompensa'}><h2>{mode==='shop'?'Detalhes do produto':'Detalhes da recompensa'}</h2><form onSubmit={submit}>
      <label>Nome<input autoFocus required minLength={3} maxLength={80} value={mode==='shop'?product.name:reward.name} onChange={e=>{if(mode==='shop')setProduct({...product,name:e.target.value});else setReward({...reward,name:e.target.value})}}/></label>
      <label>Descrição<textarea required minLength={5} maxLength={300} rows={3} value={mode==='shop'?product.description:reward.description} onChange={e=>{if(mode==='shop')setProduct({...product,description:e.target.value});else setReward({...reward,description:e.target.value})}}/></label>
      <div className="editor-fields">{mode==='shop'?<><label>Preço planejado (R$)<input type="number" min="0" max="10000" step="0.01" required value={product.price} onChange={e=>setProduct({...product,price:Number(e.target.value)})}/></label><label>Categoria<select value={product.category} onChange={e=>setProduct({...product,category:e.target.value as CatalogItem['category']})}><option value="cosmetico">Cosmético</option><option value="patente">Patente</option><option value="beneficio">Benefício</option></select></label><label>Revisão<select value={product.status} onChange={e=>setProduct({...product,status:e.target.value as CatalogItem['status']})}><option value="draft">Rascunho</option><option value="ready">Revisado (continua privado)</option></select></label></>:<><label>Nível<input type="number" required min="1" max="100" value={reward.level} onChange={e=>setReward({...reward,level:Number(e.target.value)})}/></label><label>Trilha<select value={reward.track} onChange={e=>setReward({...reward,track:e.target.value as PassReward['track']})}><option value="free">Gratuita</option><option value="premium">Premium</option></select></label></>}</div>
      <div className="save-bar"><button type="button" className="m-button" disabled={saving} onClick={()=>setEditing(false)}>Cancelar</button><button className="m-button primary" disabled={saving||!canSave}>{saving?'Salvando…':'Salvar configuração'}</button></div>
    </form></section>}
    <FeedbackToast message={notice} onClose={()=>setNotice('')}/>
  </div>;
}
