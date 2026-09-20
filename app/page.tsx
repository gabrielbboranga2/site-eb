'use client';
import {useEffect,useState} from 'react';
import Manager, {type SessionUser} from './components/Manager';
import LoginPage from './components/LoginPage';
export default function Home(){
 const [user,setUser]=useState<SessionUser|null>();
 const [error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();fetch('/api/auth/me',{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>setUser(d.user)).catch(e=>{if(e.name!=='AbortError')setError(true)});return()=>controller.abort()},[]);
 if(error)return <main className="auth-loading"><p>Não foi possível verificar sua sessão.</p><button onClick={()=>location.reload()}>Tentar novamente</button></main>;
 if(user===undefined)return <main className="auth-loading">Carregando sua central…</main>;
 return user?<Manager user={user}/>:<LoginPage/>;
}
