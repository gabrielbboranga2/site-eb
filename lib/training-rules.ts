export const TRAINING_COMMUNITIES=['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE']as const;
export type TrainingCommunity=(typeof TRAINING_COMMUNITIES)[number];

export interface TrainingRule{
  id:string;
  code:string;
  name:string;
  result:string;
  minInstructorRank:number;
  minInstructorRole:string;
}

export const TRAINING_RULES:Record<TrainingCommunity,TrainingRule[]>={
  'EXÉRCITO':[
    {id:'normal',code:'NORMAL',name:'Treinamento Normal',result:'Participantes: Recruta até Soldado',minInstructorRank:9,minInstructorRole:'[ASP] Aspirante a Oficial'},
    {id:'esa',code:'ESA',name:'ESA — Escola de Sargentos',result:'Participantes: Cabo até Subtenente',minInstructorRank:9,minInstructorRole:'[ASP] Aspirante a Oficial'},
    {id:'aman',code:'AMAN',name:'AMAN — Academia Militar',result:'Participantes: Cadete até Coronel',minInstructorRank:9,minInstructorRole:'[ASP] Aspirante a Oficial'},
    {id:'epcar',code:'EPCAR',name:'EPCAr — Formação do Alto Comando',result:'Participantes: Administrador até Comandante',minInstructorRank:16,minInstructorRole:'[ADM] Administrador'},
    {id:'taf',code:'TAF',name:'Teste de Aptidão Física',result:'Atividade física verificada pelo servidor',minInstructorRank:9,minInstructorRole:'[ASP] Aspirante a Oficial'},
  ],
  'STAFF':[
    {id:'moderacao',code:'MOD',name:'Formação de Moderação',result:'Procedimentos e conduta da equipe',minInstructorRank:4,minInstructorRole:'[ADM] Administrador'},
    {id:'suporte',code:'SUP',name:'Formação de Suporte',result:'Atendimento e suporte aos membros',minInstructorRank:4,minInstructorRole:'[ADM] Administrador'},
    {id:'relatorios',code:'REL',name:'Formação de Relatórios',result:'Registros, provas e auditoria',minInstructorRank:5,minInstructorRole:'[ADM-G] Administrador Geral'},
  ],
  'BFE':[
    {id:'operacoes-especiais',code:'OPE',name:'Operações especiais',result:'Formação operacional da BFE',minInstructorRank:4,minInstructorRole:'[BFE] OFICIAL'},
    {id:'resgate-refens',code:'RES',name:'Resgate de reféns',result:'Procedimentos táticos de resgate',minInstructorRank:4,minInstructorRole:'[BFE] OFICIAL'},
    {id:'combate-urbano',code:'URB',name:'Combate urbano',result:'Progressão e atuação em ambiente urbano',minInstructorRank:5,minInstructorRole:'[BFE] SUB-COMANDANTE'},
  ],
  'CIE':[
    {id:'inteligencia-tatica',code:'INT',name:'Inteligência tática',result:'Coleta e tratamento de informações',minInstructorRank:4,minInstructorRole:'[CIE] OFICIAL'},
    {id:'interceptacao',code:'ICE',name:'Interceptação',result:'Procedimentos operacionais de interceptação',minInstructorRank:4,minInstructorRole:'[CIE] OFICIAL'},
    {id:'analise-ameacas',code:'AAM',name:'Análise de ameaças',result:'Classificação e resposta a ameaças',minInstructorRank:5,minInstructorRole:'[CIE] ALTO-ESCALÃO'},
  ],
  'BAC':[
    {id:'acoes-comando',code:'ACO',name:'Ações de comando',result:'Formação operacional da BAC',minInstructorRank:4,minInstructorRole:'[BAC] OFICIAL'},
    {id:'infiltracao',code:'INF',name:'Infiltração',result:'Procedimentos táticos de infiltração',minInstructorRank:4,minInstructorRole:'[BAC] OFICIAL'},
    {id:'assalto-edificios',code:'AED',name:'Assalto a edifícios',result:'Entrada, progressão e domínio',minInstructorRank:5,minInstructorRole:'[BAC] ALTO-ESCALÃO'},
  ],
  'BPE':[
    {id:'policiamento',code:'POL',name:'Policiamento ostensivo',result:'Formação policial da BPE',minInstructorRank:4,minInstructorRole:'[BPE] OFICIAL'},
    {id:'controle-disturbios',code:'CDS',name:'Controle de distúrbios',result:'Formação e resposta a distúrbios',minInstructorRank:4,minInstructorRole:'[BPE] OFICIAL'},
    {id:'protecao-autoridades',code:'PRA',name:'Proteção de autoridades',result:'Escolta e proteção de autoridades',minInstructorRank:5,minInstructorRole:'[BPE] ALTO-ESCALÃO'},
  ],
};

export function getTrainingRule(community:string,id:string){
  return TRAINING_RULES[community as TrainingCommunity]?.find(rule=>rule.id===id);
}
