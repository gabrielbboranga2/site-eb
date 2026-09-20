'use client';
import {useEffect,useState} from 'react';
export default function LoginPage(){
  const[err,setErr]=useState('');
  useEffect(()=>{
    const code=new URLSearchParams(window.location.search).get('login');
    const messages:Record<string,string>={
      cancelled:'A autorização foi cancelada. Você pode tentar novamente quando quiser.',
      invalid:'A sessão de login expirou ou não pôde ser validada. Inicie o acesso novamente.',
      config:'A integração com o Roblox ainda não está configurada corretamente.',
      token:'O Roblox não aceitou o código de autorização. Tente entrar novamente.',
      profile:'Não foi possível carregar seu perfil público do Roblox.',
      nogroup:'Sua conta não pertence ao grupo EB DO MIG no Roblox.',
      service:'O Roblox não respondeu como esperado. Aguarde um instante e tente novamente.',
    };
    if(code){const timer=setTimeout(()=>setErr(messages[code]||'Não foi possível concluir o login.'),0);return()=>clearTimeout(timer)}
  },[]);
  return <main className="login-page">
    <section className="login-intro">
      <div className="login-brand"><span className="login-brand-mark">EB</span><div><b>EB DO MIG</b><small>Central Militar</small></div></div>
      <div>
        <span className="login-kicker">SISTEMA INTERNO DE COMANDO</span>
        <h1>Gestão clara.<br/><strong>Comando em ordem.</strong></h1>
        <p>Efetivo, capacitação e registros reunidos em um único painel para a administração do grupo.</p>
        <div className="login-signal"><span className="login-signal-dot"/><b>Operação ativa</b><i/><span>Grupo 521106467</span></div>
      </div>
      <ul className="login-features">
        <li><span>01</span>Patentes e divisões sincronizadas</li>
        <li><span>02</span>Histórico de ações centralizado</li>
        <li><span>03</span>Acesso conforme a hierarquia</li>
      </ul>
    </section>

    <section className="login-card">
      <div className="login-card-head"><span className="login-seal">EB</span><div><small>ACESSO RESTRITO</small><b>Identificação militar</b></div></div>
      <h2>Entre na Central</h2>
      <p>Use sua conta do Roblox para validar sua patente e permissões.</p>
      {err&&<div className="login-error" role="alert">{err}</div>}
      <a className="login-roblox" href="/api/auth/roblox/start"><svg className="roblox-glyph" aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path fill="currentColor" fillRule="evenodd" d="M3 3h18v18H3zM8.5 8.5h7v7h-7z" transform="rotate(14 12 12)"/></svg><span>Continuar com Roblox</span></a>
      <div className="login-step-note"><span>01</span><div><b>Validação pelo Roblox</b><small>Seu cargo define automaticamente o que você pode consultar.</small></div></div>
      <div className="login-security"><span aria-hidden="true">✓</span> Autenticação segura via OAuth</div>
      <small>Nenhuma senha é armazenada pelo EB DO MIG.</small>
      <div className="login-links"><a href="/privacidade">Privacidade</a><a href="/termos">Termos de Serviço</a><a href="/preview">Ver demonstração</a></div>
    </section>

    <footer>EB DO MIG <i/> GRUPO 521106467</footer>
  </main>;
}

