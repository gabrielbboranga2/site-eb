import type{Metadata}from'next';
import HelpSearch from'../components/HelpSearch';
import{LegalPage}from'../components/LegalPage';

export const metadata:Metadata={title:'Central de Ajuda | EB DO MIG',description:'Respostas sobre acesso, promoções, regras e suporte da Central Militar EB DO MIG.'};

export default function Ajuda(){
  return <LegalPage eyebrow="SUPORTE AO MILITAR" title="Central de Ajuda" summary="Encontre orientações rápidas para acessar a Central, entender promoções e resolver dúvidas durante o serviço.">
    <HelpSearch/>
  </LegalPage>;
}
