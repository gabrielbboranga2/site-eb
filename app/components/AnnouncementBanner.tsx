'use client';
import {useEffect,useState,type CSSProperties} from 'react';
import {Megaphone,Clock3,ShieldCheck} from 'lucide-react';
export function AnnouncementBanner({item}:{item:{title:string;message:string;color:string;placement:'topbar'|'below';endsAt:string|null}}){
 const[now,setNow]=useState(0);useEffect(()=>{const tick=()=>setNow(Date.now());const start=setTimeout(tick,0),timer=setInterval(tick,30000);return()=>{clearTimeout(start);clearInterval(timer)}},[]);
 const minutes=item.endsAt&&now?Math.ceil((new Date(item.endsAt).getTime()-now)/60000):null;
 if(minutes!==null&&minutes<=0)return null;
 return <aside className={'command-announcement '+(item.placement==='topbar'?'compact':'')} aria-label={'Comunicado: '+item.title} style={{'--announcement-color':item.color} as CSSProperties}><span className="announcement-symbol"><Megaphone size={25}/></span><div className="announcement-copy"><small><ShieldCheck size={12}/> COMUNICADO DO COMANDO</small><h2>{item.title}</h2><p>{item.message}</p></div>{item.endsAt&&<div className="announcement-deadline"><Clock3 size={17}/><span><small>DISPONÍVEL ATÉ</small><b>{new Date(item.endsAt).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</b>{minutes!==null&&<small>{minutes>=60?Math.floor(minutes/60)+'h '+minutes%60+'min':minutes+'min'} restantes</small>}</span></div>}</aside>;
}
