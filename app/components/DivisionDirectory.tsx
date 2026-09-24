'use client';
/* eslint-disable @next/next/no-img-element -- Official Roblox community thumbnails. */
import {useEffect,useState} from 'react';
import {Search,Shield,ArrowUpRight,Users} from 'lucide-react';
import {DIVISOES,type Divisao} from '@/lib/divisoes-mig';
export type DivisionVisual=Divisao&{imageUrl?:string};
export function useDivisions(preview=false){
  const [divisions,setDivisions]=useState<DivisionVisual[]>(DIVISOES),[error,setError]=useState('');
  useEffect(()=>{if(preview)return;const c=new AbortController();fetch('/api/divisions',{signal:c.signal,cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível sincronizar as divisões.');setDivisions(d.divisions)}).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[preview]);
  return {divisions,error};
}
export function DivisionImage({division}:{division:DivisionVisual}){
  const [failed,setFailed]=useState(false);
  return division.imageUrl&&!failed?<img className="division-image" src={division.imageUrl} alt={`Emblema ${division.sigla}`} width={58} height={58} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>:<span className="division-symbol"><Shield size={25}/></span>;
}
export default function DivisionDirectory({preview=false}:{preview?:boolean}){
  const {divisions,error}=useDivisions(preview),[query,setQuery]=useState('');
  const filtered=divisions.filter(d=>`${d.nome} ${d.sigla}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <><section className="division-intro"><Shield size={32}/><div><h2>Uma força. Diferentes missões.</h2><p>Encontre as comunidades oficiais do MIG e conheça cada divisão.</p></div><span className="m-tag">{divisions.length} comunidades</span></section><label className="m-search standalone-search"><Search size={19}/><input aria-label="Buscar divisão" placeholder="Nome ou sigla da divisão" value={query} onChange={e=>setQuery(e.target.value)}/></label>{error&&<p className="m-alert" role="alert">{error} Exibindo a lista de referência.</p>}<div className="directory-grid">{filtered.map(d=><article className="directory-card" key={d.groupId}><DivisionImage division={d}/><span className="m-tag">{d.groupId===521106467?'Comunidade principal':'Divisão'}</span><h2>{d.sigla}</h2><p>{d.nome}</p><small>Comunidade {d.groupId}</small><a className="m-button" href={`https://www.roblox.com/communities/${d.groupId}`} target="_blank" rel="noreferrer">Ver no Roblox<ArrowUpRight size={16}/></a></article>)}</div>{!filtered.length&&<div className="m-empty"><Users size={32}/><h3>Nenhuma divisão encontrada</h3><p>Tente buscar por outra sigla ou nome.</p></div>}</>;
}
