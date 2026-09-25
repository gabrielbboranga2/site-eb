import type{Metadata}from'next';
import{ContactBlock,LegalPage}from'../components/LegalPage';

export const metadata:Metadata={title:'Sobre | EB DO MIG',description:'Conheça o propósito, a estrutura e o funcionamento da Central Militar EB DO MIG.'};

export default function Sobre(){
  return <LegalPage eyebrow="INFORMAÇÕES INSTITUCIONAIS" title="Sobre o EB DO MIG" summary="Uma estrutura digital criada para organizar o efetivo, fortalecer a formação e manter cada ação militar registrada com clareza.">
    <section><h2>O que é o EB DO MIG</h2><p>O EB DO MIG é uma comunidade militar dentro do Roblox. A Central reúne recursos de identificação, gestão de patentes, treinamentos, divisões e auditoria para apoiar a rotina dos militares e dos responsáveis pelo comando.</p></section>
    <section><h2>Propósito do projeto</h2><p>O projeto busca tornar os processos internos mais claros, consistentes e fáceis de consultar. A plataforma ajuda a reduzir registros dispersos, oferece contexto para decisões administrativas e preserva um histórico das ações realizadas.</p></section>
    <section><h2>Como funciona a hierarquia</h2><p>Cada integrante possui uma patente vinculada à comunidade principal. Essa posição define quais áreas, guias e operações ficam disponíveis. Promoções, rebaixamentos e permissões seguem regras próprias da administração, sempre respeitando a autoridade reconhecida dentro do grupo.</p><p>As divisões podem possuir cargos e responsabilidades adicionais. A participação em uma divisão não substitui a patente do Exército; ela complementa a função exercida pelo militar.</p></section>
    <section><h2>Segurança e responsabilidade</h2><p>O acesso é identificado pela conta Roblox. Operações sensíveis exigem permissão compatível e geram registros para auditoria. Nenhum militar deve compartilhar senhas, códigos de sessão ou credenciais com terceiros.</p></section>
    <section><h2>Contato oficial e Discord</h2><ContactBlock/><p>Quando o servidor oficial do Discord estiver definido pelos Criadores, o convite verificado será publicado nesta página. Desconfie de convites enviados por fontes não oficiais.</p></section>
  </LegalPage>;
}
