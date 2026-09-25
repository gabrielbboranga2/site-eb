'use client';
import {useEffect,useState} from 'react';
import Manager,{type SessionUser} from './Manager';
import Link from 'next/link';
export default function DashboardGate(){
 const[user,setUser]=useState<SessionUser|null>();const[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/auth/me',{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error();return response.json()}).then(data=>{if(!data.user){location.replace('/?login=required');return}setUser(data.user)}).catch(reason=>{if(reason.name!=='AbortError')setError(true)});return()=>controller.abort()},[]);
 if(error)return <main className="central-loader"><div className="loader-insignia">EB</div><h1>Não foi possível abrir sua Central</h1><p>Confira sua conexão e tente novamente.</p><button onClick={()=>location.reload()}>Tentar novamente</button><Link href="/">Voltar ao início</Link></main>;
 if(user===undefined)return <main className="central-loader" aria-live="polite"><div className="loader-insignia">EB</div><span className="loader-kicker">CENTRAL MILITAR</span><h1>Carregando sua central…</h1><p>Validando patente, divisões e permissões.</p><div className="loader-track" role="progressbar" aria-label="Carregando a Central"><i/></div></main>;
 return user?<Manager user={user}/>:null;
}
