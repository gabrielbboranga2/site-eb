# EB DO MIG — polimento incremental

## Conceito e escolhas

**Comando Oliva:** central operacional militar, com tom direto e respeitoso. Preserva a arquitetura e os fluxos existentes. Referências consultadas: dashboards autenticados de [EB Delta](https://ebdelta.com/home) e [EB Mirage](https://ebmirage.com/), em 22/09/2026. Foram aproveitadas organização de navegação, indicação de filiação e separação entre operações e conteúdos. Comunidades reais do MIG são mantidas; não são inventadas SGEX/RT/CEE.

Direções avaliadas antes do código:

| Direção | Paleta | Google Fonts | Referência e sensação |
| --- | --- | --- | --- |
| Comando Oliva (selecionada) | #101310 #1B211B #A9B77C #D8BD78 | Inter | Mirage: clareza operacional e continuidade |
| Quartel Chumbo | #121518 #252B30 #81978B #E0C367 | Roboto | Delta: painel compacto com destaque de patente |
| Arquivo Militar | #171914 #292D23 #BCC6A4 #C9AD72 | Montserrat | Mirage/Delta: ênfase em tabelas e consulta |

A seleção reduz reaprendizado, dá hierarquia aos controles e mantém o foco em concluir consultas e operações. Tons ajustados no código para contraste legível.

## Sistema visual

- Primária/ação #B5C38B; secundária #9EBAD1; patente/acento #E0C584.
- Fundo #101310; lateral #121612; superfície #1B211B; elevada #252D25; borda #3A453B; texto #F1F3ED; secundário #B1BBAE.
- Hover #2C3826; active #293321; disabled mesma cor com opacidade .55; sucesso #B3D5B5; erro #FFBCB5.
- Tema claro: fundo #EEF0E9; superfície #FFFFFF; texto #20281F; secundário #53604E; ação #3E572A; acento #755714.
- Inter: h1 27–36px/1.2 peso 750, tracking -.035em; h2 20–28px/1.3 peso 700, tracking -.025em; h3 18–20px/1.4 peso 650; corpo 14px/1.6 peso 400; caption 11–12px/1.5 peso 500.
- Espaçamento: 4, 8, 16, 24, 32, 48px; extensões 64, 96 e 128px reservadas a seções largas.
- Raios: controles 8px, painéis 16px, login 20px. Sombras: 0 2px 8px #00000014; 0 10px 32px #00000024; 0 24px 64px #00000038.
- Motion: 150/300ms cubic-bezier(.2,.7,.2,1); 500ms reservado, não utilizado. Sem animações essenciais; reduced-motion desliga transições.
- Botões: primário preenchido, secundário contornado, textual; alvos principais ≥44px; foco de 3px com offset 4px.
- Inputs e selects identificados por label, erros em alert e confirmações em status. Cards com estrutura semântica article; badges usam texto além de cor. Navbar com estado atual e menu móvel que retém foco e fecha com Escape. Footer conserva links legais e identidade do grupo.

## Wireframe e propósito

1. Login → identidade, explicação do vínculo Roblox e CTA de autenticação; objetivo: entrar com confiança, sem um botão Discord fictício.
2. Comando → alertas → identificação → métricas → operações/histórico → academias → divisões; objetivo: encontrar a próxima ação sem trocar a estrutura.
3. Solicitações → filtro e nova indicação → parecer → confirmação de execução → histórico; objetivo: distinguir aprovação administrativa de alteração real.
4. Divisões → busca → cards reais → comunidade no Roblox; objetivo: localizar unidades cadastradas.
5. Loja privada → bloqueio explícito → produtos → editor; objetivo: preparar catálogo sem expor compras.
6. Passe privado → temporada → trilhas gratuita/premium por nível → editor; objetivo: planejar recompensas sem simular vendas.

## Arquitetura e execução

Next.js 16.3.3, React 19.2.6, TypeScript 5.9.3, postgres 3.4.7 (versões resolvidas no lockfile), lucide-react 1.46.0. Mantidos OAuth Roblox, sessão e banco existentes. Rotas → serviços PostgreSQL → modelos/validação. Interfaces comerciais carregadas sob demanda; Next minifica o bundle de produção. Imagens novas têm dimensões, lazy loading e fallback.

```text
app/
  api/creator/commerce/route.ts
  api/promotions/requests/route.ts
  command-system.css
  components/
    CommerceWorkspace.tsx
    DivisionDirectory.tsx
    FeedbackToast.tsx
    PromotionRequests.tsx
    Manager.tsx / ManagerViews.tsx / LoginPage.tsx (integração)
lib/
  commerce-model.ts / commerce-store.ts
  promotion-model.ts / promotion-requests.ts
  access.ts / settings-store.ts (permissões e migração)
tests/polish.test.cjs
docs/COMANDO-OLIVA.md
```

```powershell
cd C:\Users\gabri\OneDrive\Desktop\site-eb
npm ci
# Em uma instalação nova, crie .env.local a partir de .env.example.
# Preencha as chaves diretamente no arquivo ou nas configurações da Vercel.
npm test
npm run lint
npm run build -- --webpack
npm run dev
```

Banco: use o DATABASE_URL existente. As tabelas manager_commerce e manager_promotion_requests e seus índices são criados de forma idempotente no primeiro uso autenticado. SQL integral e constraints estão nos serviços correspondentes; INSERT/UPDATE são parametrizados. Auditoria e alteração de configuração/estado são transacionais. Nenhuma carga fictícia é inserida em produção. Dados de demonstração são isolados em sessionStorage, nunca na API nem no Roblox. Loja e passe não aparecem no preview público de produção; a demonstração desses módulos só é habilitada com NODE_ENV=development.

## Regras de prontidão

- Loja/Battle Pass têm bloqueio imutável para Criadores nesta versão, inclusive se permissões persistidas vierem permissivas. APIs também revalidam o cargo atual no grupo principal.
- Migração acrescenta novas guias sem sobrescrever mínimos de patente já configurados. As duas permissões comerciais aparecem desabilitadas em Somente Criadores.
- Catálogo com revisão otimista por versão: outro Criador não tem suas alterações silenciosamente sobrescritas.
- Solicitações: usuário com acesso à guia envia indicação; somente Criador analisa e executa. Regras de grupo, cargo atual, destino e CDP são conferidas novamente na execução. Aprovação sozinha não promove.
- Claim atômico impede dupla execução da mesma solicitação. Uma resposta incerta do Roblox bloqueia novas tentativas e exige conferência no Roblox e na CDP. Não existe transação distribuída entre Roblox e PostgreSQL. Solicitações travadas em executing/reconciliation exigem intervenção operacional após conferência, sem promoção automática.
- Cada estado é auditado nos logs globais. Catálogo privado não é exposto nos logs retornados aos demais cargos.
- Compras, checkout, entrega de recompensas, XP automático e autenticação Discord não estão habilitados. São integrações futuras, não apresentadas como funcionais.
- Não há nova chave de ambiente. Permanece necessário DATABASE_URL, OAuth/sessão e ROBLOX_API_KEY com acesso aos grupos para operações reais. Não registrar segredos no Git.

## Qualidade e evolução

Detalhes de polimento: foco retido no menu móvel; toast acessível; fallback de emblemas e carregamento skeleton.

Breakpoints: 320–760 móvel, 761–1100 tablet, 1101+ desktop, 1500+ expansão. Verificar também claro/escuro/sistema e reduced-motion. Não atribuir um score Lighthouse sem medir.

Evoluções priorizadas: (1) conciliação de execuções Roblox interrompidas com fila durável; (2) configurar gateway e entrega idempotente antes da abertura comercial; (3) ligar XP e resgates do passe a eventos autenticados do jogo.

O resultado desta tarefa é um conjunto de arquivos/diff pronto para revisão e commit. Nenhuma publicação deve ser presumida a partir de validação local.

## Validação desta entrega — 22/09/2026

- [x] Dashboard e login refinados sem substituir a base.
- [x] Fila de solicitações com análise, confirmação de execução e logs transacionais.
- [x] Hierarquia preservada; badges e busca verificados.
- [x] Diretório de divisões e dashboard usam comunidades cadastradas.
- [x] Editores de loja e passe privados; permissões comerciais fixadas em Criadores.
- [x] 21 testes automatizados aprovados, incluindo migração de permissões, autorização de API, validações, concorrência e bloqueio de repetição.
- [x] Build de produção concluído; 0 erros de lint e 1 aviso preexistente referente à fonte no layout.
- [x] Fluxos simulados de cadastro de produto/recompensa, indicação, aprovação e execução testados no navegador.
- [x] Teste visual em 320, 390, 768, 1280 e 1440px; temas claro/escuro; menu com Tab, Shift+Tab e Escape; busca de hierarquia/divisões.
- [x] APIs de catálogo e solicitações retornam 403 e no-store sem autenticação no servidor local de produção.
- [x] Build de produção não mostra Loja/Battle Pass na demonstração pública.
- [ ] Gravação autenticada nas novas tabelas PostgreSQL e alteração real de patente não foram executadas nesta entrega. Os testes de execução e concorrência usam serviços simulados.
- [ ] Checkout, Discord OAuth e resgate/XP do passe aguardam configuração futura.
- [ ] Commit, push e deploy não foram executados: os arquivos ficam prontos para revisão.

Ambiente local de validação: Node 24.18.0. O projeto continua declarando Node 22.x para a hospedagem; não foram adicionadas APIs exclusivas do Node 24.

O diff foi gerado a partir do HEAD 5189a07 e inclui arquivos novos. Não reaplique o patch sobre esta mesma pasta já atualizada. Ele serve para revisão ou aplicação em uma cópia limpa do mesmo commit.


## Atualização: identificação e promoções (23/09/2026)

- Foto, username e perfil Roblox substituem IDs visíveis nas fichas, logs, responsáveis, ranking e solicitações. Os IDs continuam internos para estabilidade e auditoria. Registros antigos são enriquecidos na leitura, sem reescrever seu histórico. Falhas do Roblox preservam o nome conhecido e mostram um ícone neutro.
- A tela Entregar patente agora segue o fluxo observado no Delta: busca por username, ficha, patente atual/destino, modalidade, motivo e confirmação explícita. Demonstração nunca muda cargos reais.
- Normal: Recruta–Soldado. ESA: Cabo–Subtenente. AMAN: Cadete–Coronel. EPCAr: General de Brigada–Comandante (faixa confirmada pelo usuário). A categoria usa o cargo ANTERIOR ao UP. Divisões têm uma formação por comunidade; cargos administrativos posteriores usam categoria própria.
- Cada responsável tem uma sessão ativa. UPs confirmados do mesmo tipo e comunidade se agrupam por 15 minutos fixos desde o primeiro. Outro tipo/comunidade encerra a anterior imediatamente. Voltar ao tipo anterior abre nova sessão.
- A sessão e o evento agendado persistem juntos em transação PostgreSQL, com trava por instrutor e deduplicação do evento. O evento só entra na leitura após seu horário de encerramento; não depende de navegador aberto nem cron. O painel consulta atualizações a cada 30 segundos. Promoções anteriores à instalação não são recontadas.
- Sem treino exige patente atual de Moderador ou superior na comunidade principal, conferida no servidor pela hierarquia real. Justificativa de 10–500 caracteres; motivo e modalidade ficam nos logs. Não gera treino nem ignora CDP. Outras promoções exigem modalidade compatível e motivo de 5–500 caracteres.
- Treinos registrados manualmente com prova/código continuam sendo registros independentes. Não foi inferida uma associação entre relatório manual e sessão de UP; evite registrar a mesma atividade pelos dois caminhos para não contar em duplicidade.
- Migrações idempotentes: nova tabela manager_promotion_training; reviewed_by em manager_promotion_requests. Nenhuma nova variável ou dependência. Não houve commit/push/deploy nesta atualização.

### Arquivos principais adicionados

```text
app/components/RobloxIdentity.tsx
app/components/TrainingWindows.tsx
lib/roblox-identities.ts
lib/promotion-training-model.ts
lib/promotion-training.ts
lib/promotion-policy.ts
tests/training-sessions.test.cjs
tests/promotion-policy.test.cjs
```

### Verificação e limites

34 testes passaram na revisão final. Build de produção e TypeScript aprovados; lint sem erros e com um aviso antigo de fonte. Os testes de banco usam uma implementação simulada de transações; não comprovam execução das novas tabelas no PostgreSQL de produção. A conferência visual foi feita em desktop e celular. Validações executadas: npm test, npm run lint, TypeScript e npm run build -- --webpack. APIs públicas do Roblox confirmaram os usernames e as URLs de foto das duas contas de teste; o layout foi conferido a 390 px sem transbordamento horizontal. A integração real do MIG ainda requer validação autenticada no ambiente de homologação.

Testes externos autorizados pelo usuário no EB Delta: gabribor_sola (Soldado → Cabo, PRA); Contaselling38 (Cadete → Aspirante a Oficial, AMAN). Resultados confirmados na interface/histórico. Não foram alterados cargos do MIG.


## Resgates, CDP em horas e acesso dos Moderadores — 24/09/2026

### Entregue e decisões

- Meu perfil oferece consulta, confirmação e histórico dos códigos. Criadores emitem códigos para uma patente de uma comunidade configurada ou benefício externo manual, com instruções, quantidade máxima e validade opcional. Entrega manual foi confirmada pelo usuário.
- Código aleatório de 128 bits, hash SHA-256 no banco, valor completo exibido uma vez, limite persistente de tentativas por usuário, um resgate por código/pessoa, reserva atômica da disponibilidade e auditoria na mesma transação. A configuração da recompensa é imutável; encerre e crie outro código para alterá-la.
- Patentes por código nunca rebaixam nem atribuem cargos protegidos (nível >=253). Respeitam a CDP atual e iniciam a CDP do destino; não geram treinamento. Uma falha incerta bloqueia repetição e exige conferência do Criador. A confirmação de conferência verifica a patente atual, não reenvia o UP. Caso o Roblox não tenha aplicado, o Criador corrige em Alterar cargo e confere também a CDP antes de encerrar o resgate.
- CDP agora usa horas inteiras (0–720 na configuração). Migração preenche hours=days*24 e duration_hours=duration_days*24 somente quando ainda ausentes. Preserva started_at e ends_at de todos os registros existentes. Colunas antigas permanecem para compatibilidade.
- As regras publicadas já permitem Entregar patente desde Terceiro Sargento e Rebaixamentos desde MOD. Corrigido bloqueio administrativo anterior ao acesso da guia. Operações conferem a patente atual, em vez do cargo salvo na sessão; múltiplos cargos usam o maior nível conhecido. Falha em estatísticas não apaga as guias autorizadas. Busca de promoção consulta diretamente o username no Roblox, sem depender da lista completa.
- Anúncios: cartão militar com cor de destaque, ícone, título, mensagem e prazo; versão compacta na barra, prévia no Criador e atualização periódica. Datas inválidas são rejeitadas. Identidade atual preservada.
- Gestão do criador > Integrações mostra diagnóstico sem secrets. Presença de uma variável não prova sua validade; leitura Open Cloud não comprova permissão de escrita.
- Loja/Battle Pass continuam restritos a Criadores tanto na interface quanto no servidor. Nenhum checkout novo foi aberto. UI do jogo não foi alterada.

### Arquivos desta etapa

~~~text
app/api/rewards/route.ts
app/api/integrations/status/route.ts
app/api/permissions/route.ts
app/api/cdp/{route.ts,settings/route.ts}
app/components/{RewardCodes,AnnouncementBanner,IntegrationDiagnostics}.tsx
app/components/{Manager,ManagerViews,CdpSystem,CreatorOperations}.tsx
app/command-system.css
lib/{reward-model,rewards,cdp,authorize,roblox,creator-config}.ts
tests/rewards.test.cjs
~~~

### Instalação e validação

1. Node 22.x e npm ci na pasta site-eb.
2. Preencher .env.local conforme .env.example para uso local; cadastrar os valores reais em Production na Vercel. Nunca versionar secrets.
3. PostgreSQL: DATABASE_URL (ou POSTGRES_URL/NEON_DATABASE_URL), usuário com permissão de criar/alterar tabelas. Migrações idempotentes acontecem no primeiro acesso à funcionalidade. Não há seed de usuários em produção.
4. npm run dev para desenvolver; npm test, npm run lint, npx tsc --noEmit e npm run build -- --webpack para validar.
5. Commit/push em main do repositório gabrielbboranga2/site-eb dispara a integração Vercel site-eb. Conferir Ready e o domínio de produção.

Sem novas dependências. Versões: Next 16.3.3, React/React DOM 19.2.6, postgres 3.4.7, lucide-react 1.46.0, TypeScript 5.9.3 (ver package-lock.json para resolução exata).

### Integrações necessárias

| Configuração | Origem e finalidade |
| --- | --- |
| ROBLOX_CLIENT_ID / ROBLOX_CLIENT_SECRET | Aplicativo OAuth no Creator Dashboard Roblox; autenticação. |
| SITE_URL | https://eb-do-mig.vercel.app; retorno OAuth exato: https://eb-do-mig.vercel.app/api/auth/roblox/callback. |
| SESSION_SECRET | Valor aleatório forte, estável, privado; assinatura das sessões. |
| ROBLOX_API_KEY | Open Cloud com leitura e escrita de membros/cargos para grupo 521106467 e cada divisão; a conta emissora precisa da autoridade correspondente. |
| DATABASE_URL ou POSTGRES_URL | Conexão PostgreSQL/Neon, com SSL; dados persistentes, CDP, ranking, logs e resgates. |
| SETTINGS_ENCRYPTION_KEY | Chave privada estável para webhooks salvos. Não trocar sem recadastrar os webhooks existentes. |
| DISCORD_TRAININGS_WEBHOOK / DISCORD_LOGS_WEBHOOK | Discord > canal > Integrações > Webhooks; também podem ser cadastrados diretamente no painel Criador. |
| TRAINING_CODE_API_SECRET | Mesmo valor privado no site e no script de servidor do Roblox, com HTTP Requests habilitado no jogo. Não colocar em LocalScript. |

ROBLOX_GROUP_ID e ROBLOX_DIVISION_GROUPS da configuração antiga não substituem a comunidade principal fixa e o cadastro de divisões do painel. DISCORD_PROMOTIONS_WEBHOOK e DISCORD_DEMOTIONS_WEBHOOK antigos não são consumidos pelas rotas atuais; alterações de cargos usam o webhook geral. Para recompensas externas manuais não é necessária nova API. Não enviar secrets pelo chat; cadastrar diretamente na Vercel ou no campo protegido do painel.

### Qualidade e limites

42 testes passaram, incluindo replay/concorrência de códigos, bloqueio de administração forjada, código expirado, patente igual/superior, falha do Roblox, CDP em horas e autorização com sessão antiga. Os testes de persistência usam banco simulado; a migração real será conferida após publicar. Lint sem erros. Build de produção aprovado. Demonstração de criação e resgate validada no navegador; não houve alteração real de patente do MIG nesta etapa.

Detalhes de acabamento: prévia ao vivo dos anúncios, confirmação antes do resgate, histórico com situação de entrega e perfil do militar. Próximas evoluções: (1) teste integrado em ambiente de homologação com conta de treino; (2) associação explícita entre relatório manual e sessão automática para evitar dupla contagem; (3) serviço de entrega automática para recompensas externas quando houver API definida.
