'use client';
/* eslint-disable @next/next/no-img-element -- Dynamic Roblox headshots. */
import {useState} from 'react';
import {UserRound} from 'lucide-react';
export function RobloxAvatar({name,src}:{name:string;src?:string}){
  const [failed,setFailed]=useState<string>();
  return src&&src!==failed?<img className="m-avatar" width={48} height={48} loading="lazy" decoding="async" src={src} alt={`Foto de ${name} no Roblox`} onError={()=>setFailed(src)}/>:<span className="m-avatar initials" role="img" aria-label={`Foto de ${name} indisponível`}><UserRound size={22} aria-hidden="true"/></span>;
}
export function RobloxIdentity({userId,username,avatar,detail}:{userId?:string;username?:string;avatar?:string;detail?:string}){
  const name=username&&!/^\d+$/.test(username)&&!/^Usuário \d+$/.test(username)?username:'Perfil indisponível';
  const content=<><RobloxAvatar name={name} src={avatar}/><span><b>{name}</b>{detail&&<small>{detail}</small>}</span></>;
  return userId&&/^[1-9]\d+$/.test(userId)?<a className="roblox-identity" href={`https://www.roblox.com/users/${userId}/profile`} target="_blank" rel="noreferrer" aria-label={`Abrir perfil de ${name} no Roblox`}>{content}</a>:<span className="roblox-identity">{content}</span>;
}
