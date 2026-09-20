# Central MIG — interface e permissões

Referência visual e de navegação: EB Mirage. A identidade, grupos e patentes continuam sendo os do MIG. Não há loja nem venda de patentes.

## Permissões

Em Gestão do criador → Permissões das guias, escolha uma patente mínima para cada guia. A escolha é inclusiva: a patente selecionada e todas as superiores, na ordem de `lib/patentes.ts`, podem consultar a área. Também existem Todos os militares e Somente Criadores. Ver uma guia não autoriza modificar o sistema.

Somente o role ID `808700015` ([CR] Criador) gerencia permissões. Developer, Sub Criador, Administrador ou rank numérico alto não concedem gestão. O servidor verifica a assinatura da sessão, a origem da gravação, os valores recebidos e a patente atual no Roblox antes de salvar. Sessões antigas são normalizadas em `/api/auth/me`.

Localmente, as regras são gravadas de forma atômica em `.data/permissions.json`. Na Vercel, configure `DATABASE_URL` para persistir permissões e auditoria no PostgreSQL. Sem essa conexão, a aplicação usa as regras padrão e informa que o salvamento persistente está indisponível. As regras padrão liberam UP a partir de 3º Sargento e Rebaixamentos a partir de Moderador. Alterações são consultadas a cada acesso a uma API protegida; alterações de patente pessoal exigem renovar o login.

## O que funciona

- Menu por grupos, atalhos no celular e temas claro, escuro e do sistema.
- Mesma interface em produção e demonstração `/preview`.
- Consultas Roblox existentes, busca e filtros de militares, perfil, hierarquia e documentos.
- Seleção de divisão, consulta exata e revisão de militares em lote.
- Filtros e paginação do histórico; ranking e gráficos calculados dos registros disponíveis; CDP calculada de prazos reais.
- Configuração de acesso de todas as guias e proteção dos endpoints de consulta.
- Na demonstração, alternância Criador/Soldado para conferir quais guias aparecem e testar permissões sem tocar no Roblox.
- Em Gestão do criador → Alterar cargo, busca por username/ID, seleção da comunidade, lista dos cargos disponíveis, motivo obrigatório e confirmação para aplicar a mudança no Roblox.

## Integrações ainda necessárias

O envio direto de cargo ao Roblox está habilitado somente para o role exato `[CR] Criador` (`808700015`), com revalidação da participação atual no grupo, motivo e registro de auditoria. Promoção/rebaixamento por guias continuam sujeitos às permissões configuradas. A criação/resgate de códigos de UP e a edição de hierarquia/CDP ainda exigem fluxos próprios de integração e não são simuladas como concluídas. O catálogo de treinamentos continua sendo informativo.

O histórico/CDP usa PostgreSQL quando `DATABASE_URL` existe e mantém fallback local para desenvolvimento. Em Vercel, configure também as credenciais de escrita do Roblox Open Cloud (`ROBLOX_API_KEY`, `ROBLOX_GROUP_ID` e demais variáveis de OAuth) antes de usar alterações reais. A demonstração `/preview` nunca chama o Roblox.

## Validar

`npm ci`, `npm test`, `npm run lint`, `npm run build`. Para revisão visual: `npm run dev` e `/preview`. Não são necessárias credenciais para a demonstração; ações reais continuam exigindo login e autorização.
