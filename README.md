# Doutor do Celular · Kauan Cell

Sistema da Doutor do Celular, Kauan Cell: loja on-line, assistência técnica e painel de gestão, todos usando o mesmo banco de dados.

- **Front:** HTML, CSS e JavaScript puro (sem framework), servido como arquivos estáticos.
- **API:** Node.js + Express + Prisma 5 + PostgreSQL, com validação zod, senhas com bcryptjs e tokens JWT.
- **Hospedagem:** Vercel. O front estático e a API (função serverless em `api/index.ts`) ficam no mesmo domínio: o site chama `/api/...`, sem CORS.
- **Banco:** Neon Postgres (integração da Vercel). **Fotos de produto:** Vercel Blob.

---

## Estrutura

```
doutor-do-celular/
├── index.html               Página única do site (carrega src/)
├── src/
│   ├── fonts.css, styles.css
│   └── js/                  (carregados nesta ordem)
│       ├── assets.js        Imagens fixas (logo, vitrine, categorias)
│       ├── api.js           fetch com token, armazenamento local, redução de foto antes do envio
│       ├── art.js           Ícones e ilustrações SVG dos produtos
│       ├── data.js          Status, cores e regras de variação (unidades, categorias e produtos vêm da API)
│       ├── app.js           Estado, regras da loja e todas as telas da loja
│       ├── admin.js         Painel de gestão (login, dashboard, pedidos, produtos, estoque, clientes, assistência, unidades, oportunidades, ajustes)
│       └── main.js          Rotas, renderização, ações e formulários
├── assets/                  Imagens e fontes (as fotos iniciais do catálogo também ficam aqui)
├── api/index.ts             Entrada da função serverless da Vercel (exporta o app Express)
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    Modelo de dados
│   │   ├── migrations/      Migrations SQL (aplicadas com prisma migrate deploy)
│   │   └── seed.ts          Carga inicial (admin, unidades, categorias, catálogo, serviços)
│   └── src/
│       ├── app.ts           App Express (sem listen)
│       ├── server.ts        Servidor local (listen na porta 3342)
│       ├── config/env.ts    Variáveis de ambiente
│       ├── middleware/      auth (equipe, cliente, acesso), errorHandler, logger, upload
│       ├── lib/             prisma, jwt, storage (Blob ou pasta local), variações, datas, telefone, serialização
│       ├── routes/          Rotas finas
│       ├── controllers/     Controllers finos
│       └── services/        Regras de negócio (pedidos, estoque, OS, catálogo, clientes, dashboard, config, auth)
├── build.mjs                Gera dist/ (o que a Vercel publica)
├── vercel.json              Build, saída, rewrite de /api e cabeçalhos
├── tools/
│   ├── serve.mjs            Servidor do front no desenvolvimento (repassa /api e /uploads para a API)
│   └── testes/              Testes ponta a ponta (api.mjs e ui.cjs)
└── referencias/             Telas de referência e briefing original
```

---

## Rodar localmente

Requisitos: Node.js 20+ e um PostgreSQL.

```bash
npm install                      # instala e roda prisma generate
cp .env.example .env             # ajuste DATABASE_URL e DATABASE_URL_UNPOOLED (podem ser iguais no local)
npx prisma migrate deploy        # cria as tabelas
npm run db:seed                  # admin, unidades, categorias, catálogo e serviços
npm run dev:api                  # API em http://localhost:3342
npm run dev                      # site em http://localhost:8093 (repassa /api para a API)
```

Acesse a gestão em `http://localhost:8093/#gestao` (ou pelo rodapé, "Área da equipe").

**Usuário inicial:** `admin@doutordocelular.com.br` / `admin123`. **Troque essa senha no primeiro acesso** (Gestão > Ajustes > Minha senha) e crie usuários próprios para a equipe.

Sem `BLOB_READ_WRITE_TOKEN`, as fotos enviadas no painel vão para a pasta `uploads/` e são servidas pela API local em `/uploads`.

Para testar o build: `npm run build` e depois `DIR=dist PORT=8097 node tools/serve.mjs`.

### Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres com pool (usado pela API). Na Vercel vem da integração com o Neon. |
| `DATABASE_URL_UNPOOLED` | Postgres direto (usado pelo `prisma migrate`). Também vem da integração. |
| `JWT_SECRET` | Segredo dos tokens. Obrigatório em produção (mínimo 16 caracteres). |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob, para as fotos de produto. Vem da integração do Blob. |
| `PORT` | Porta da API local (padrão 3342). |
| `JWT_EXPIRES_IN`, `CLIENTE_JWT_EXPIRES_IN`, `ACESSO_JWT_EXPIRES_IN` | Validade das sessões (padrão 7d, 30d e 60d). |

---

## Deploy na Vercel

1. Crie um projeto na Vercel importando este repositório. O `vercel.json` já define: instalação `npm install`, build `npm run vercel-build` (que roda `prisma migrate deploy` e depois `node build.mjs`), saída `dist/` e o rewrite de `/api/*` para a função `api/index.ts`.
2. Em **Storage**, adicione a integração **Neon** (Postgres) ao projeto. Ela cria `DATABASE_URL` e `DATABASE_URL_UNPOOLED`.
3. Em **Storage**, adicione um **Blob** store ao projeto. Ele cria `BLOB_READ_WRITE_TOKEN`.
4. Em **Settings > Environment Variables**, crie `JWT_SECRET` com um valor longo e aleatório (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
5. Faça o primeiro deploy. O build aplica as migrations no banco.
6. Rode o seed **uma vez**, da sua máquina, apontando para o banco de produção (copie as URLs do painel do Neon/Vercel):
   ```bash
   DATABASE_URL="<url de producao>" DATABASE_URL_UNPOOLED="<url direta de producao>" npm run db:seed
   ```
   O seed é idempotente: pode rodar de novo sem duplicar nada e nunca sobrescreve o que a equipe editou.
7. Entre em `/#gestao`, troque a senha do admin, preencha endereço, horário e WhatsApp das unidades (Gestão > Unidades) e lance o estoque real (Gestão > Estoque).

A API não guarda nada em memória nem roda tarefas em segundo plano, e não grava em disco em produção (fotos vão para o Blob), como exige a função serverless.

---

## Telas e endereços

**Loja:** `#inicio` · `#loja` · `#loja-celulares` · `#loja-acessorios` · `#loja-assistencia` · `#loja-capinhas` (qualquer categoria) · `#produto-p01` · `#sacola` · `#checkout` · `#pedido-1001`

**Assistência e atendimento:** `#assistencia` · `#solicitar` · `#os-2001` · `#acompanhar` · `#atendimento` · `#unidades` · `#conta`

**Gestão (com login):** `#gestao` · `#gestao-pedidos` · `#gestao-produtos` · `#gestao-estoque` · `#gestao-clientes` · `#gestao-assistencia` · `#gestao-unidades` · `#gestao-oportunidades` · `#gestao-ajustes`

Pedidos começam em `PED-1001` e ordens de serviço em `OS-2001`.

---

## Regras de negócio (garantidas na API)

- **Checkout sem conta:** o cliente é criado ou reaproveitado pelo telefone. O servidor recalcula preços, confere se a variação existe e se há estoque na unidade escolhida, e cria o pedido como *Recebido*. A forma de pagamento escolhida fica registrada; a loja confirma e combina o pagamento.
- **Estoque:** a baixa acontece uma única vez, quando o pedido chega a *Confirmado* (ou etapa seguinte), dentro de uma transação com a linha do pedido travada. Se o pedido for cancelado ou voltar para antes de *Confirmado*, os itens voltam. Trocar o status várias vezes não duplica movimentações. Confirmar sem saldo suficiente é recusado e nada muda.
- **Estoque nunca negativo:** conferido no serviço e garantido por `CHECK` no banco. Toda alteração (ajuste, venda, devolução) gera uma linha em `movimentacoes_estoque` com delta, saldo final, motivo, pedido e usuário.
- **Faturamento:** só pedidos *Concluídos* (pela data de conclusão) contam no dashboard e nos indicadores.
- **Estoque baixo:** de 1 até o limite configurado (padrão 3) por variação e unidade. A disponibilidade na loja considera a unidade escolhida.
- **Clientes:** identificados pelo telefone (só dígitos, com DDD). Pedidos e assistências com o mesmo telefone ficam no mesmo cadastro.
- **Privacidade:** pedido e OS só aparecem com o token de acesso entregue após o checkout ou a consulta por **código + telefone**, ou com a conta do cliente dono. Telefone errado e código inexistente dão a mesma resposta.
- **Conta do cliente:** telefone + senha, com token separado do token da equipe. Se o telefone já tem pedidos ou OS, criar a conta exige o código de um deles.
- **Orçamento de assistência:** registrar um valor move a OS para *Aguardando aprovação do orçamento* (se estiver numa etapa anterior). O cliente aprova (vai para *Em reparo*) ou recusa (a OS é cancelada e o aparelho fica para retirada) pelo acompanhamento. Um novo valor pede nova resposta.
- **Oportunidades:** regras simples e visíveis (comprou celular sem capa ou película compatível, clientes da assistência, comprados juntos, categorias em movimento, reposição sugerida). Nada é disparado automaticamente.
- **Perfis da equipe:** *Operador* cuida de pedidos, assistência e estoque; *Gerente* também do catálogo, unidades, categorias e serviços; *Administrador* também das configurações e da equipe.

---

## API (resumo)

Todas as rotas ficam em `/api`. Erros voltam como `{ "error": "mensagem" }`.

| Área | Rotas |
|---|---|
| Saúde | `GET /health` |
| Loja (pública) | `GET /loja/catalogo` · `POST /loja/pedidos` · `GET /loja/pedidos/:numero` (header `X-Acesso` ou conta) · `POST /loja/consulta` (código + telefone) · `POST /loja/os` · `GET /loja/os/:numero` · `POST /loja/os/:numero/orcamento` (`aprovar` ou `recusar`) |
| Conta do cliente | `POST /conta/cadastro` · `POST /conta/login` · `GET /conta/me` · `PUT /conta/me` |
| Equipe | `POST /auth/login` · `GET /auth/me` · `POST /auth/senha` · `GET/POST /auth/usuarios` · `PUT /auth/usuarios/:id` (admin) |
| Gestão: painel | `GET /gestao/dashboard?periodo=hoje\|7\|30\|tudo&unidade=` · `GET /gestao/contadores` · `GET /gestao/unidades/resumo` · `GET /gestao/oportunidades` |
| Gestão: catálogo | `GET /gestao/catalogo` · `GET/PUT /gestao/produtos/:id` · `POST /gestao/produtos` · `PATCH /gestao/produtos/:id/ativo` · `POST/DELETE /gestao/produtos/:id/imagem` · `POST/PUT /gestao/categorias` · `POST/PUT /gestao/unidades` · `POST/PUT /gestao/servicos` · `GET/PUT /gestao/configuracoes` |
| Gestão: estoque | `POST /gestao/estoque/ajuste` (`delta` ou `quantidade`) · `GET /gestao/estoque/movimentacoes` |
| Gestão: pedidos | `GET /gestao/pedidos` · `GET /gestao/pedidos/:numero` · `PATCH /gestao/pedidos/:numero/status` |
| Gestão: assistência | `GET /gestao/os` · `GET /gestao/os/:numero` · `PATCH /gestao/os/:numero/status` · `PUT /gestao/os/:numero/orcamento` |
| Gestão: clientes | `GET /gestao/clientes` · `GET/PUT /gestao/clientes/:id` |

---

## Dados iniciais

`npm run db:seed` cria apenas: o usuário administrador, as unidades Itaim Paulista, Suzano e Carrão (endereço, horário e WhatsApp em branco até a loja preencher), as categorias, o catálogo de 34 produtos com variações e combinações bloqueadas (153 variações) e os 10 serviços da assistência. **O estoque inicial é zero:** a equipe lança as quantidades reais em Gestão > Estoque, e cada lançamento vira uma movimentação. Não há clientes, pedidos nem ordens de serviço de exemplo.

Produtos e preços do catálogo inicial vieram da fase de protótipo e devem ser revisados no painel.

---

## Testes

Com o banco local, a API (`npm run dev:api`) e o front (`npm run dev`) rodando:

```bash
npm run typecheck                # backend, seed e entrada da Vercel
node tools/testes/api.mjs        # 71 verificações da API (estoque, status, faturamento, privacidade, OS, conta, perfis)
node tools/testes/ui.cjs         # passeio no Chrome local (loja, checkout, assistência, conta e gestão)
```

Os testes criam pedidos, clientes e usuários de teste. **Nunca rode contra o banco de produção.**

---

## Próximos passos

- **Gateway de pagamento** (Pix e cartão, por exemplo Mercado Pago ou Asaas): hoje o checkout só registra a forma escolhida e o pedido entra como pendente para a equipe confirmar. O ponto de entrada é `criarPedido` em `backend/src/services/pedidos.service.ts`, com um webhook que muda o status do pedido.
- Regras de entrega (área, prazo e frete) e emissão fiscal.
- Avisos ao cliente (WhatsApp ou e-mail) quando o status do pedido ou da OS muda.
- Recuperação de senha do cliente (hoje não há envio de código por SMS ou e-mail).
- Limite de tentativas no login e na consulta por telefone (rate limit, por exemplo com Vercel KV/Upstash ou o firewall da Vercel).
- Paginação nas listas da gestão (hoje trazem até 200 pedidos e 500 clientes/OS por consulta).

---

## Créditos

Fontes: Archivo, Plus Jakarta Sans e IBM Plex Mono, todas sob a SIL Open Font License 1.1 (ver `assets/fonts/licencas`).
Logo e fotos: fornecidos pela Doutor do Celular, Kauan Cell.
