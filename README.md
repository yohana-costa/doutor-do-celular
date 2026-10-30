# Doutor do Celular · Kauan Cell — Protótipo

Protótipo navegável desenvolvido pela **SMG (Smart Management Group)** para apresentar à Doutor do Celular — Kauan Cell um ecossistema digital integrado: loja on-line, assistência técnica e painel de gestão, todos usando os mesmos dados.

É um front-end demonstrativo. Não tem backend, login, pagamento nem integração externa. Produtos, preços, estoques, clientes, pedidos e contatos são fictícios.

---

## Abrir o protótipo

| Para quê | Como |
|---|---|
| Mostrar ou enviar ao cliente | Abra `dist/Doutor-do-Celular-Prototipo-SMG.html`. É um arquivo único com tudo embutido e funciona sem internet. |
| Editar o código | Abra `index.html` no navegador, ou rode `npm run dev` e acesse http://localhost:5173 |
| Gerar o arquivo final de novo | `npm run build` (ou `node build.mjs`) |

Requisito para os comandos: **Node.js 18 ou mais novo**. O projeto não usa nenhum pacote npm, então não precisa de `npm install`.

---

## Estrutura

```
doutor-do-celular-prototipo/
├── index.html               Página de desenvolvimento (carrega os arquivos de src/)
├── build.mjs                Gera o HTML único em dist/
├── package.json             Atalhos: npm run dev / npm run build
├── src/
│   ├── fonts.css            @font-face das fontes locais
│   ├── styles.css           Todo o visual: tokens de cor, componentes e responsividade
│   └── js/                  (carregados nesta ordem)
│       ├── assets.js        Mapa das imagens (assets/img)
│       ├── art.js           Ícones e ilustrações SVG dos produtos
│       ├── data.js          Dados demonstrativos: unidades, categorias, produtos, serviços, status e base inicial
│       ├── app.js           Núcleo: estado, regras de negócio, busca e todas as telas da loja
│       ├── admin.js         Painel de gestão (dashboard, pedidos, produtos, estoque, clientes, assistência, unidades, oportunidades)
│       └── main.js          Rotas, renderização, ações dos botões e formulários
├── assets/
│   ├── img/                 Logo, foto da vitrine, cards de categoria, banner e fotos de produto
│   └── fonts/               Archivo, Plus Jakarta Sans e IBM Plex Mono (+ licenças OFL)
├── dist/
│   └── Doutor-do-Celular-Prototipo-SMG.html   Arquivo final para enviar
├── referencias/             As duas telas de referência e o briefing original
└── tools/
    ├── serve.mjs            Servidor local do npm run dev
    └── extrair-imagens.py   Recorta as imagens de assets/img a partir das referências
```

É JavaScript puro, sem framework. As telas são funções que devolvem HTML (`viewHome`, `viewCatalog`, `viewProduct`, `adminShell`…), e `render()` em `main.js` redesenha a tela sempre que algo muda.

---

## Telas e endereços

A navegação usa o `#` da URL, então qualquer tela pode ser aberta direto pelo link:

**Loja:** `#inicio` · `#loja` · `#loja-celulares` · `#loja-acessorios` · `#loja-assistencia` · `#loja-capinhas` (qualquer categoria) · `#produto-p01` · `#sacola` · `#checkout` · `#pedido-1044`

**Assistência e atendimento:** `#assistencia` · `#solicitar` · `#os-2039` · `#acompanhar` · `#atendimento` · `#unidades` · `#conta`

**Gestão:** `#gestao` · `#gestao-pedidos` · `#gestao-produtos` · `#gestao-estoque` · `#gestao-clientes` · `#gestao-assistencia` · `#gestao-unidades` · `#gestao-oportunidades`

Na loja, o painel de gestão fica no menu (☰), em "Demonstração SMG", e no rodapé, em "Área da equipe".

---

## Onde editar

**Produtos** — `src/js/data.js`, lista `BASE_PRODUCTS`. Cada produto tem nome, marca, categoria (`sub`), preço base e `options` (variações). Cada opção pode somar valor ao preço (`d: 800`, por exemplo). Combinações que não existem vão em `exclude` e aparecem bloqueadas na página do produto.

**Foto real de um produto** — salve a imagem em `assets/img/`, adicione uma chave em `src/js/assets.js` e use `art: { kind: 'photo', key: 'sua-chave' }` no produto. Sem foto, o produto usa uma ilustração SVG que muda de cor conforme a variação.

**Unidades, categorias, serviços e status** — `UNITS`, `SUBS`, `SERVICES`, `ORDER_STATUS` e `SVC_STATUS` em `src/js/data.js`.

**Clientes, pedidos e assistências iniciais** — `CUSTOMERS_SEED`, `ORDERS_SEED` e `SERVICES_SEED` em `src/js/data.js`. As datas são relativas ao dia em que o protótipo é aberto, então o dashboard sempre mostra movimento recente.

**Cores e fontes** — bloco `:root` no início de `src/styles.css`. O amarelo da marca é `--y` e o preto é `--ink`.

**Endereços, horários e WhatsApp das unidades** — hoje aparecem como "a configurar", em `unitCards()` e no modal de contato (`app.js`). Troque quando a loja passar os dados oficiais.

> Os dados ficam salvos no navegador (localStorage, chave `kc-doutor-demo-v3`). Depois de mudar `data.js`, use **Restaurar dados iniciais** no menu para ver as alterações, ou mude o `STORE_KEY` em `app.js`.

---

## Regras de negócio da demonstração

- **Estoque:** a baixa acontece uma única vez, quando o pedido chega a *Confirmado* (ou a uma etapa seguinte). Se o pedido for cancelado ou voltar para antes de *Confirmado*, os itens voltam ao estoque. Mudar o status várias vezes não duplica movimentações.
- **Faturamento:** só pedidos *Concluídos* contam como venda, no dashboard e nos indicadores. Pedido criado ou confirmado não entra.
- **Estoque baixo:** de 1 a 3 unidades. A disponibilidade na loja considera a unidade escolhida pelo cliente.
- **Clientes:** um cliente é identificado pelo telefone. Pedidos e assistências com o mesmo telefone ficam no mesmo cadastro.
- **Orçamento de assistência:** ao registrar um valor, a solicitação passa para *Aguardando aprovação do orçamento*, se ainda estiver numa etapa anterior. O cliente vê o valor no acompanhamento.
- **Oportunidades:** regras simples e visíveis na tela, como "comprou celular e não levou capa ou película compatível" e "produtos comprados juntos". Nenhuma mensagem é disparada automaticamente.

---

## Gerar o arquivo final

```
npm run build
```

Isso gera `dist/Doutor-do-Celular-Prototipo-SMG.html` com CSS, JavaScript, imagens e fontes embutidos. Pode ser enviado por e-mail ou hospedado em qualquer lugar que sirva arquivos estáticos (Netlify Drop, Vercel, GitHub Pages, S3…).

No iPhone, a pré-visualização de arquivos do WhatsApp não executa o protótipo. Oriente o cliente a abrir no Safari ou no Chrome.

---

## Para virar produto

O protótipo valida fluxo e visual. A versão real precisa de:

- Banco de dados e API no lugar do localStorage (o formato dos dados em `buildSeed()` já serve como ponto de partida para as tabelas).
- Login para a equipe acessar a gestão.
- Catálogo, preços, estoque e dados das unidades reais.
- Gateway de pagamento, regras de entrega e emissão fiscal.
- Canal oficial de atendimento (WhatsApp) e notificações de pedido e de assistência.

---

## Créditos

Protótipo: SMG — Smart Management Group.
Fontes: Archivo, Plus Jakarta Sans e IBM Plex Mono, todas sob a SIL Open Font License 1.1 (ver `assets/fonts/licencas`).
Logo e fotos de referência: fornecidos para a proposta da Doutor do Celular — Kauan Cell.
