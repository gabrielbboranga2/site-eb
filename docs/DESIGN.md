# Direção de arte — Central Militar MIG

## Conceito

Nome: Central Militar MIG. Posicionamento: um quartel digital para rotina, progressão e administração do Exército Brasileiro do Mig. Tom: direto, responsável e acolhedor, sem propaganda ou promessas de elegibilidade não verificadas. Objetivo principal: o militar encontrar sua próxima ação e o Criador controlar acesso sem ambiguidade.

## Direções avaliadas

1. **Comando noturno — escolhida.** Fundo #080D18, navegação #0C1422, superfície #111D31, azul #426B9D, verde operacional #80B28A, ouro #C7A45D e texto #F2F4EF. Manrope com Merriweather reservado para destaques editoriais. Referências funcionais: EB Delta, EB Mirage, Linear e Vercel. Sensação: centro de comando confiável, com azul na atmosfera e verde reservado a sucesso e operação.
2. **Institucional azul.** Fundo #F4F7FB, superfície #FFFFFF, texto #102A43, azul #1351B4, amarelo #FFCD07, divisórias #DCE2E8. Source Sans 3 (Google Fonts). Referência: https://www.gov.br/exercito/ . Sensação: serviço público legível, mais documental e menos próxima da experiência Mirage.
3. **Oliva de campo.** Fundo #111711, superfície #1E281E, texto #F2F4E9, oliva #BCCB91, areia #D6C49E, divisórias #394639. IBM Plex Sans (Google Fonts). Referência de conteúdo militar: https://www.eb.mil.br/ . Sensação: sobriedade de comando, mas com menor identificação visual com a referência escolhida.

Recomendação: comando noturno, porque combina o mural e a densidade operacional do EB Delta com a organização do EB Mirage. O azul estrutura a interface; verde indica sucesso; ouro diferencia hierarquia e conquistas. Como este produto é um painel autenticado, a conversão relevante é concluir consultas e ações autorizadas.

## Wireframe e finalidade

- Navegação lateral por Geral, Ferramentas, Consultas e Conteúdo: encontrar a guia com poucos cliques; somente itens permitidos.
- Barra superior e identificação: orientação e estado de acesso.
- Anúncios do quartel: Criadores escolhem conteúdo, cor, posição e prazo; usuários recebem apenas anúncios ativos.
- Boas-vindas e perfil: CTA primário para confirmar a identificação militar.
- Indicadores: efetivo, capacitação, treinamentos e ações com origem real e estados indisponíveis honestos.
- Acesso rápido e atividade recente: continuar o trabalho e entender o que aconteceu.
- Divisões: acessar os grupos corretos do Roblox.
- Guias operacionais: consulta → revisão → confirmação → resultado confirmado no servidor.
- Gestão do Criador: permissões por guia, CDP, operações em massa, webhooks criptografados, divisões e anúncios; gestão nunca liberada por simples nível numérico.
- Perfil e emblemas: conquistas por divisão e por patente na hierarquia do grupo principal.
- Rodapé: identificação, grupo oficial e documentos legais.
- Celular: cabeçalho compacto, menu lateral fechado por padrão e atalhos fixos inferiores.

## Stack

Next.js 16.3.3 / React 19.2.6 / TypeScript 5.9.3, preservando a base atual. PostgreSQL via postgres 3.4.7, aproveitando DATABASE_URL existente. OAuth Roblox e sessões assinadas httpOnly; autorização revalidada no servidor. CSS com tokens, sem trocar a arquitetura por um novo serviço de hospedagem. Vercel e GitHub permanecem como implantação e versionamento.

## Design system

Cores: primária #40CD86; secundária #8DCDDD; acento #ECC678; fundo #101216; navegação #0C0E11; superfície #191C21; elevada #20242A; borda #2C3037; texto #F0F2F4; secundário #A0A6AF. Hover #254135; ativo #152D24; desabilitado #67716A; sucesso #40CD86; erro #F29B91. Tema claro: fundo #F3F5F7, superfície #FFFFFF, texto #18232A, secundário #5D6B76, verde #087944, ativo #E2F3E9.

Tipografia: Manrope. Escala 12 / 14 / 16 / 20 / 25 / 31 / 39 px. h1 31px/1.2, peso 800, tracking -0.03em; h2 20px/1.4, peso 700, -0.01em; h3 16px/1.4, peso 650; corpo 14px/1.6, peso 400; caption 12px/1.5, peso 500. Em telas pequenas h1 25px. Textos longos com limite próximo a 70 caracteres.

Espaçamento: tokens 4, 8, 16, 24, 32, 48, 64, 96, 128px. Raios 8px (controles), 12px (cards), 16px (hero). Elevação 1: 0 2px 8px #00000014; 2: 0 8px 24px #00000024; 3: 0 16px 48px #0000003D. Movimento 150/300/500ms, cubic-bezier(.2,.8,.2,1), desativado com prefers-reduced-motion.

Componentes: botão primário preenchido para ação principal, secundário com borda para revisão, destrutivo para rebaixamentos; inputs com rótulo, foco e erro; cards com título único; badges para status sem depender somente de cor; navbar com aria-current; rodapé com links legais. Ícones Lucide. Nenhum emoji usado como ícone no novo shell.

Breakpoints: celular até 760px, intermediário 761–1100px, desktop acima de 1100px e largura ampla a partir de 1500px. Revisão visual real em 390px e desktop, com foco e menu por teclado; não declarar nota Lighthouse sem executar a ferramenta.
