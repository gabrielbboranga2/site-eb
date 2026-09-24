'use client';
import {useEffect,useState} from 'react';
import {CheckCircle2,AlertCircle,RefreshCw} from 'lucide-react';
type Check={name:string;configured:boolean;detail:string};
export function IntegrationDiagnostics({preview=false}:{preview?:boolean}){
 const[checks,setChecks]=useState<Check[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 async function load(){setBusy(true);setError('');try{if(preview){setChecks([{name:'Demonstração',configured:false,detail:'O diagnóstico real é executado somente no site autenticado. Nenhuma integração foi testada aqui.'}]);return;}const r=await fetch('/api/integrations/status',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error);setChecks(d.checks||[])}catch(e){setError(e instanceof Error?e.message:'Diagnóstico indisponível.')}finally{setBusy(false)}}
 useEffect(()=>{const t=setTimeout(()=>void load(),0);return()=>clearTimeout(t)},[preview]); // eslint-disable-line react-hooks/exhaustive-deps
 return <section className="integration-diagnostics"><div className="panel-title"><div><h2>Saúde das integrações</h2><p className="field-hint">Verificações de leitura. Nenhuma patente é alterada e nenhum secret é exibido.</p></div><button className="m-button" disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/>{busy?'Verificando…':'Verificar novamente'}</button></div>{error&&<p className="m-alert" role="alert">{error}</p>}<div className="reward-list">{checks.map(c=><article key={c.name}>{c.configured?<CheckCircle2/>:<AlertCircle/>}<div><b>{c.name}</b><p>{c.detail}</p></div><span className="m-tag">{c.configured?'Verificado':'Atenção'}</span></article>)}</div></section>
}
