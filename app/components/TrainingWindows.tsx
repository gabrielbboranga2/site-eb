'use client';
import {useEffect,useState} from 'react';
import {Clock} from 'lucide-react';
import type {TrainingWindow} from '@/lib/promotion-training';
import {RobloxIdentity} from './RobloxIdentity';
export function TrainingWindows({windows=[]}:{windows?:TrainingWindow[]}){
  const [now,setNow]=useState<number|null>(null);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
  if(!windows.length)return null;
  return <section className="m-panel training-windows"><div className="panel-title"><h2>Treinos em andamento</h2><Clock size={21} aria-hidden="true"/></div><p>Os UPs do mesmo tipo entram no mesmo treino. O treino é contabilizado após 15 minutos do primeiro UP ou quando o instrutor muda de formação.</p>{windows.map(w=>{const seconds=now===null?null:Math.max(0,Math.ceil((new Date(w.closesAt).getTime()-now)/1000));return <article key={w.id}><RobloxIdentity userId={w.actorId} username={w.actorUsername} avatar={w.avatar} detail={w.trainingLabel+' · '+w.community}/><div><b>{w.promotions} UP(s)</b><small>{seconds===null?'Calculando prazo…':seconds===0?'Janela encerrada · atualizando ranking…':`${Math.floor(seconds/60)}min ${seconds%60}s para encerrar`}</small></div></article>})}</section>;
}
