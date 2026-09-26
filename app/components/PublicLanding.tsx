import Image from'next/image';
import Link from'next/link';
import{ArrowRight,BadgeCheck,BookOpenCheck,CalendarCheck2,CheckCircle2,ClipboardCheck,GraduationCap,History,KeyRound,ListChecks,Medal,ShieldCheck,UserCheck,UsersRound}from'lucide-react';
import PublicAccess from'./PublicAccess';
import{BrandEmblem}from'./BrandEmblem';

const trainingTracks=[
 {code:'TR-01',name:'Formação Normal',range:'Recruta até Soldado',detail:'Entrada, disciplina e fundamentos do serviço.'},
 {code:'TR-02',name:'ESA',range:'Cabo até Subtenente',detail:'Formação de graduados e condução de tropa.'},
 {code:'TR-03',name:'AMAN',range:'Cadete até Coronel',detail:'Preparação de oficiais e liderança.'},
 {code:'TR-04',name:'EPCAr',range:'General de Brigada até Comandante',detail:'Comando superior e responsabilidade estratégica.'}
];

export default function PublicLanding(){return <main className="public-site ops-site">
 <header className="public-nav ops-nav">
  <Link className="public-brand" href="/" aria-label="EB DO MIG, início"><BrandEmblem size={48} decorative priority/><div><b>EB DO MIG</b><small>CENTRAL DE INSTRUÇÃO</small></div></Link>
  <nav aria-label="Navegação principal"><a href="#operacao">Operação</a><a href="#modalidades">Treinamentos</a><a href="#registro">Registros</a><Link href="/ajuda">Ajuda</Link></nav>
  <a className="nav-access" href="#acesso">Abrir posto <ArrowRight size={15}/></a>
 </header>

 <section className="ops-hero" id="acesso">
  <div className="ops-hero-copy">
   <div className="ops-status"><span/><b>CENTRAL OPERACIONAL</b><small>GRUPO 521106467</small></div>
   <h1>Conduza o treinamento.<br/><em>Registre os concluintes.</em><br/>Entregue as patentes.</h1>
   <p>Uma área de trabalho para instrutores e cargos superiores organizarem turmas, validarem conclusões e manterem cada promoção ligada ao treinamento que a originou.</p>
   <div className="ops-hero-actions"><a className="ops-primary" href="#acesso-direto">Entrar como instrutor <ArrowRight/></a><a href="#operacao">Ver como funciona</a></div>
   <dl className="ops-brief">
    <div><dt>01</dt><dd><b>Abra a instrução</b><span>Escolha a modalidade e identifique a turma.</span></dd></div>
    <div><dt>02</dt><dd><b>Confirme os concluintes</b><span>Selecione quem cumpriu as exigências.</span></dd></div>
    <div><dt>03</dt><dd><b>Finalize a patente</b><span>A alteração e o responsável ficam registrados.</span></dd></div>
   </dl>
  </div>
  <div className="ops-hero-access" id="acesso-direto"><div className="ops-access-label"><span>POSTO DE ACESSO</span><small>Somente pessoal autorizado</small></div><PublicAccess/></div>
 </section>

 <figure className="ops-unit" aria-label="Pelotão de instrução EB DO MIG">
  <Image src="/eb-command-unit.webp" alt="Quatro avatares do EB DO MIG uniformizados em uma sala de comando" fill sizes="(max-width: 900px) 100vw, 1180px"/>
  <div className="ops-unit-shade"/>
  <figcaption><span>EFETIVO DE INSTRUÇÃO</span><strong>Preparados para formar a próxima turma.</strong><small>Identificação visual dos militares vinculados à operação.</small></figcaption>
 </figure>

 <section className="ops-workflow" id="operacao">
  <header className="ops-section-head"><span>FLUXO DE SERVIÇO / 01</span><h2>Do início da turma à patente entregue.</h2><p>A Central acompanha uma única linha operacional. Cada etapa informa o que falta e quem assumiu a responsabilidade.</p></header>
  <div className="ops-workbench">
   <article className="ops-order">
    <header><div><small>ORDEM DE INSTRUÇÃO</small><b>Treinamento em andamento</b></div><span className="ops-live"><i/> ABERTO</span></header>
    <dl><div><dt>Instrutor</dt><dd>Identificado pelo acesso</dd></div><div><dt>Modalidade</dt><dd>Definida antes da abertura</dd></div><div><dt>Servidor</dt><dd>Código de verificação vinculado</dd></div><div><dt>Concluintes</dt><dd>Selecionados no encerramento</dd></div></dl>
    <footer><ShieldCheck/><span><b>Validação obrigatória</b><small>O registro só é concluído quando os dados da instrução forem confirmados.</small></span></footer>
   </article>
   <ol className="ops-process">
    <li><span>01</span><CalendarCheck2/><div><b>Preparar</b><p>Defina o treinamento, confira a faixa permitida e abra a sessão.</p></div></li>
    <li><span>02</span><UsersRound/><div><b>Conduzir</b><p>Realize a instrução e mantenha a turma vinculada ao responsável.</p></div></li>
    <li><span>03</span><ListChecks/><div><b>Concluir</b><p>Marque os aprovados e revise a patente que cada um receberá.</p></div></li>
    <li><span>04</span><BadgeCheck/><div><b>Registrar</b><p>Entregue as patentes e grave a ação nos Logs Globais.</p></div></li>
   </ol>
  </div>
 </section>

 <section className="ops-tracks" id="modalidades">
  <header className="ops-section-head"><span>PLANO DE FORMAÇÃO / 02</span><h2>Cada patente segue uma formação compatível.</h2><p>O instrutor seleciona a modalidade antes do treino. A Central usa essa escolha para separar turmas e organizar o histórico.</p></header>
  <div className="ops-track-list">{trainingTracks.map((track,index)=><article key={track.code}><div><span>{track.code}</span><small>0{index+1}</small></div><h3>{track.name}</h3><b>{track.range}</b><p>{track.detail}</p></article>)}</div>
 </section>

 <section className="ops-records" id="registro">
  <div className="ops-record-copy"><span>REGISTRO DE SERVIÇO / 03</span><h2>O que aconteceu fica claro para o próximo responsável.</h2><p>O histórico reúne instrutor, modalidade, concluintes, mudança de patente e horário. Assim, o comando revisa uma promoção sem depender de mensagens soltas.</p><ul><li><ClipboardCheck/> Treinamento ligado à promoção</li><li><UserCheck/> Responsável identificado pela conta Roblox</li><li><History/> Linha do tempo disponível para auditoria</li><li><KeyRound/> Ações sensíveis protegidas por patente</li></ul></div>
  <div className="ops-logbook" aria-label="Exemplo de registro operacional">
   <header><div><small>LIVRO DE REGISTRO</small><b>Movimentação da turma</b></div><span>EXEMPLO</span></header>
   <ol><li className="done"><i><CheckCircle2/></i><div><b>Sessão validada</b><small>Instrutor e modalidade confirmados</small></div><time>14:02</time></li><li className="done"><i><GraduationCap/></i><div><b>Concluintes revisados</b><small>Lista pronta para processamento</small></div><time>15:18</time></li><li><i><Medal/></i><div><b>Patentes entregues</b><small>Alterações registradas individualmente</small></div><time>15:21</time></li></ol>
   <footer><BookOpenCheck/><span>Registro completo e disponível nos Logs Globais.</span></footer>
  </div>
 </section>

 <section className="ops-access-rules">
  <header className="ops-section-head"><span>CADEIA DE AUTORIDADE / 04</span><h2>Acesso definido pela função exercida.</h2></header>
  <div className="ops-role-table">
   <div className="head"><span>Perfil operacional</span><span>Responsabilidade na Central</span><span>Acesso</span></div>
   <div><b>Instrutor autorizado</b><span>Abrir treinamentos, confirmar concluintes e registrar a turma.</span><i>OPERACIONAL</i></div>
   <div><b>Moderador ou superior</b><span>Revisar ações, aplicar exceções justificadas e acompanhar registros.</span><i>SUPERVISÃO</i></div>
   <div><b>Criador</b><span>Configurar hierarquia, divisões, permissões e integrações da Central.</span><i>CONFIGURAÇÃO</i></div>
  </div>
 </section>

 <section className="ops-faq"><header className="ops-section-head"><span>ORIENTAÇÃO RÁPIDA</span><h2>Antes de iniciar uma turma.</h2></header><div>
  <details><summary>Todo militar pode registrar treinamentos?</summary><p>Não. O acesso operacional depende da patente e das permissões definidas pelos Criadores.</p></details>
  <details><summary>Como a promoção fica ligada ao treinamento?</summary><p>A modalidade e o responsável permanecem ativos durante a sessão. Ao selecionar os concluintes, as promoções são registradas dentro desse contexto.</p></details>
  <details><summary>Uma ação pode ser revisada depois?</summary><p>Sim. Os Logs Globais preservam o responsável, o militar afetado, a mudança realizada e o horário.</p></details>
 </div><Link href="/ajuda">Abrir Central de Ajuda <ArrowRight/></Link></section>

 <section className="ops-closing"><span>CENTRAL DE INSTRUÇÃO EB DO MIG</span><h2>Abra a turma. Forme o efetivo.<br/>Registre o resultado.</h2><a href="#acesso">Identificar-se para entrar <ArrowRight/></a></section>

 <footer className="public-footer ops-footer"><div className="public-brand"><BrandEmblem size={46} decorative/><div><b>EB DO MIG</b><small>CENTRAL DE INSTRUÇÃO</small></div></div><p>Treinamentos, concluintes e patentes em uma linha de comando.</p><nav><Link href="/ajuda">Ajuda</Link><Link href="/sobre">Sobre</Link><Link href="/termos">Termos</Link><Link href="/privacidade">Privacidade</Link></nav><small>© {new Date().getFullYear()} EB DO MIG · Grupo 521106467</small></footer>
 </main>}
