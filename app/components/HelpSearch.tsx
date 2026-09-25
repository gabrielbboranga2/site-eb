'use client';
import{useMemo,useState}from'react';
import{Search}from'lucide-react';

const categories=[
 {title:'Acesso e Login',items:[
  {q:'Como entro com minha conta Roblox?',a:'Na página inicial, aceite os Termos e a Política de Privacidade e selecione “Continuar com Roblox”. A autorização acontece no domínio oficial da Roblox.'},
  {q:'Sou menor de 13 anos. Como acesso?',a:'A disponibilidade do login depende das configurações e regras da sua conta Roblox. Se a autorização não aparecer, peça orientação a um responsável e use apenas os meios oficiais disponibilizados pela Central.'},
  {q:'O site pede minha senha do Roblox?',a:'Não. A Central nunca solicita nem armazena sua senha. Você também pode usar a verificação temporária pela descrição do perfil quando essa opção estiver disponível.'}
 ]},
 {title:'Patentes e Promoções',items:[
  {q:'Como funciona uma promoção?',a:'Uma promoção é registrada por um responsável autorizado, de acordo com a hierarquia, o treinamento aplicável e as regras vigentes. A alteração fica vinculada ao militar e ao responsável.'},
  {q:'Por que minha nova patente ainda não apareceu?',a:'A sincronização pode levar alguns instantes. Atualize a Central e confirme se a patente já foi alterada na comunidade oficial. Persistindo a divergência, procure um Criador ou responsável autorizado.'},
  {q:'O que é CDP?',a:'CDP é o intervalo mínimo definido para determinadas progressões. A Central apresenta o tempo aplicável ao seu cargo e informa quando uma nova ação estiver disponível.'}
 ]},
 {title:'Regras e Punições',items:[
  {q:'Por que fui rebaixado?',a:'Rebaixamentos devem possuir motivo registrado e seguir a autoridade da hierarquia. Consulte seu histórico e, se precisar de revisão, procure a administração pelos canais oficiais.'},
  {q:'Posso usar funções que não aparecem para mim?',a:'Não. Cada área é liberada conforme a patente e as permissões configuradas. Tentar contornar essas restrições pode gerar bloqueio e análise administrativa.'},
  {q:'Como denuncio uma ação incorreta?',a:'Guarde as informações relevantes, como data, responsável e contexto, e encaminhe o caso à administração do EB DO MIG. Evite expor dados pessoais em canais públicos.'}
 ]},
 {title:'Suporte',items:[
  {q:'O painel não carrega. O que faço?',a:'Confira sua conexão, atualize a página e entre novamente. Se o problema continuar, informe o horário, a tela acessada e a mensagem apresentada ao suporte oficial.'},
  {q:'Onde encontro os canais oficiais?',a:'Use os links publicados na Central e na comunidade oficial do EB DO MIG no Roblox. Convites e mensagens externas devem ser confirmados antes de qualquer ação.'},
  {q:'Como sugiro uma melhoria?',a:'Envie uma descrição objetiva da ideia, o problema que ela resolve e um exemplo de uso pelos canais oficiais da administração.'}
 ]}];

export default function HelpSearch(){
 const[query,setQuery]=useState('');
 const filtered=useMemo(()=>{const term=query.trim().toLocaleLowerCase('pt-BR');if(!term)return categories;return categories.map(category=>({...category,items:category.items.filter(item=>(item.q+' '+item.a).toLocaleLowerCase('pt-BR').includes(term))})).filter(category=>category.items.length)},[query]);
 const total=filtered.reduce((sum,category)=>sum+category.items.length,0);
 return <div className="help-center">
  <label className="help-search"><Search aria-hidden="true"/><span className="sr-only">Buscar na Central de Ajuda</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Busque por login, patente, promoção..." autoComplete="off"/></label>
  <p className="help-result" aria-live="polite">{query?total+' resultado'+(total===1?'':'s')+' encontrado'+(total===1?'':'s'):'Perguntas organizadas por assunto'}</p>
  {filtered.map(category=><section className="help-category" key={category.title}><h2>{category.title}</h2><div className="help-questions">{category.items.map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div></section>)}
  {total===0&&<div className="help-empty"><b>Nenhuma resposta encontrada.</b><p>Tente outra palavra ou procure a administração pelos canais oficiais.</p></div>}
 </div>;
}
