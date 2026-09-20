'use client';
import {useEffect,useState} from 'react';
import {getHierarchySnapshot} from '@/lib/hierarchy-snapshot';
import {Blank,Icon} from './Manager';
export function LiveHierarchy({preview=false}:{preview?:boolean}){
 const [groups,setGroups]=useState(getHierarchySnapshot),[query,setQuery]=useState(''),[selected,setSelected]=useState('EXÉRCITO'),[source,setSource]=useState(preview?'Estrutura de referência':'Consultando Roblox…');
 useEffect(()=>{if(preview)return;const c=new AbortController();fetch('/api/hierarquia',{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setGroups(d.groups);setSource(d.source==='verified-snapshot'?`Estrutura verificada em ${d.verifiedAt}`:'Hierarquia atual do Roblox')}).catch(e=>{if(!c.signal.aborted)setSource(e instanceof Error?e.message:'Consulta indisponível')});return()=>c.abort()},[preview]);
 const group=groups.find(g=>g.sigla===selected);const ranks=group?.roles.filter(r=>r.name.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.rank-a.rank)||[];
 return <><div className="tabs">{groups.map(g=><button key={g.groupId} className={selected===g.sigla?'active':''} onClick={()=>setSelected(g.sigla)}>{g.sigla}</button>)}</div><label className="m-search standalone-search"><Icon name="search"/><input aria-label="Buscar patente" placeholder="Buscar patente ou sigla" value={query} onChange={e=>setQuery(e.target.value)}/></label><section className="m-panel"><div className="panel-title"><h2>{group?.name}</h2><span>{source}</span></div>{ranks.map((r,i)=><div className="rank-row" key={`${r.id}-${i}`}><span className="rank-badge">Nível {r.rank}</span><b>{r.name}</b></div>)}{!ranks.length&&<Blank text="Nenhuma patente corresponde à busca."/>}</section></>
}
