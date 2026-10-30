-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeCurto" TEXT NOT NULL,
    "endereco" TEXT,
    "horario" TEXT,
    "whatsapp" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "marca" TEXT NOT NULL DEFAULT 'Diversas',
    "modelo" TEXT NOT NULL DEFAULT '',
    "categoriaId" TEXT NOT NULL,
    "precoBase" DECIMAL(10,2) NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 100,
    "novidade" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "descricao" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "especificacoes" JSONB NOT NULL DEFAULT '[]',
    "arte" JSONB NOT NULL DEFAULT '{}',
    "compatibilidade" JSONB,
    "imagemUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_opcoes" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'pill',
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "produto_opcoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_opcao_valores" (
    "id" TEXT NOT NULL,
    "opcaoId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "acrescimo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hex" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "produto_opcao_valores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_exclusoes" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "combinacao" JSONB NOT NULL,

    CONSTRAINT "produto_exclusoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_variacoes" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_variacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoques" (
    "id" TEXT NOT NULL,
    "variacaoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "variacaoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldoApos" INTEGER NOT NULL,
    "motivo" TEXT,
    "pedidoId" TEXT,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "senha" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'site',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL DEFAULT 'retirada',
    "endereco" TEXT,
    "pagamento" TEXT NOT NULL DEFAULT 'pix',
    "status" TEXT NOT NULL DEFAULT 'recebido',
    "total" DECIMAL(10,2) NOT NULL,
    "estoqueAplicado" BOOLEAN NOT NULL DEFAULT false,
    "concluidoEm" TIMESTAMP(3),
    "origem" TEXT NOT NULL DEFAULT 'site',
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_itens" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "variacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "variacaoNome" TEXT NOT NULL DEFAULT '',
    "chave" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "pedido_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_historico" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "usuarioId" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedido_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT NOT NULL DEFAULT 'tool',
    "descricao" TEXT NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "servico" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recebida',
    "orcamentoValor" DECIMAL(10,2),
    "orcamentoObs" TEXT,
    "orcamentoEm" TIMESTAMP(3),
    "orcamentoDecisao" TEXT,
    "orcamentoDecididoEm" TIMESTAMP(3),
    "origem" TEXT NOT NULL DEFAULT 'site',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_historico" (
    "id" TEXT NOT NULL,
    "osId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "autor" TEXT NOT NULL DEFAULT 'equipe',
    "usuarioId" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "os_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes" (
    "chave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("chave")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "produtos"("codigo");

-- CreateIndex
CREATE INDEX "produtos_categoriaId_idx" ON "produtos"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "produto_opcoes_produtoId_nome_key" ON "produto_opcoes"("produtoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "produto_opcao_valores_opcaoId_valor_key" ON "produto_opcao_valores"("opcaoId", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "produto_variacoes_produtoId_chave_key" ON "produto_variacoes"("produtoId", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "estoques_variacaoId_unidadeId_key" ON "estoques"("variacaoId", "unidadeId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_variacaoId_unidadeId_idx" ON "movimentacoes_estoque"("variacaoId", "unidadeId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_pedidoId_idx" ON "movimentacoes_estoque"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_telefone_key" ON "clientes"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_numero_key" ON "pedidos"("numero");

-- CreateIndex
CREATE INDEX "pedidos_status_idx" ON "pedidos"("status");

-- CreateIndex
CREATE INDEX "pedidos_criadoEm_idx" ON "pedidos"("criadoEm");

-- CreateIndex
CREATE INDEX "pedidos_concluidoEm_idx" ON "pedidos"("concluidoEm");

-- CreateIndex
CREATE INDEX "pedido_itens_pedidoId_idx" ON "pedido_itens"("pedidoId");

-- CreateIndex
CREATE INDEX "pedido_historico_pedidoId_idx" ON "pedido_historico"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "servicos_nome_key" ON "servicos"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "ordens_servico"("numero");

-- CreateIndex
CREATE INDEX "ordens_servico_status_idx" ON "ordens_servico"("status");

-- CreateIndex
CREATE INDEX "ordens_servico_criadoEm_idx" ON "ordens_servico"("criadoEm");

-- CreateIndex
CREATE INDEX "os_historico_osId_idx" ON "os_historico"("osId");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_opcoes" ADD CONSTRAINT "produto_opcoes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_opcao_valores" ADD CONSTRAINT "produto_opcao_valores_opcaoId_fkey" FOREIGN KEY ("opcaoId") REFERENCES "produto_opcoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_exclusoes" ADD CONSTRAINT "produto_exclusoes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_variacoes" ADD CONSTRAINT "produto_variacoes_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques" ADD CONSTRAINT "estoques_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "produto_variacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques" ADD CONSTRAINT "estoques_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "produto_variacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_variacaoId_fkey" FOREIGN KEY ("variacaoId") REFERENCES "produto_variacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_historico" ADD CONSTRAINT "pedido_historico_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_historico" ADD CONSTRAINT "pedido_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico" ADD CONSTRAINT "os_historico_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico" ADD CONSTRAINT "os_historico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Regras que o banco garante mesmo se algum codigo falhar:
-- saldo de estoque nunca negativo e itens com quantidade positiva.
ALTER TABLE "estoques" ADD CONSTRAINT "estoques_quantidade_nao_negativa" CHECK ("quantidade" >= 0);
ALTER TABLE "pedido_itens" ADD CONSTRAINT "pedido_itens_quantidade_positiva" CHECK ("quantidade" > 0);

-- Numeracao visivel ao cliente: pedidos comecam em PED-1001 e ordens de servico em OS-2001.
ALTER SEQUENCE "pedidos_numero_seq" RESTART WITH 1001;
ALTER SEQUENCE "ordens_servico_numero_seq" RESTART WITH 2001;
