import * as catalogo from '../services/catalogo.service';
import * as estoque from '../services/estoque.service';
import * as pedidos from '../services/pedidos.service';
import * as os from '../services/os.service';
import * as clientes from '../services/clientes.service';
import * as dashboard from '../services/dashboard.service';
import * as config from '../services/config.service';
import { h, numeroDe } from './_handler';

const q = (v: unknown) => (typeof v === 'string' ? v : undefined);

// Painel
export const dashboardGeral = h((req) => dashboard.metricas(q(req.query.periodo) || '30', q(req.query.unidade) || 'all'));
export const contadores = h(() => dashboard.contadores());
export const resumoUnidades = h(() => dashboard.resumoUnidades());
export const oportunidades = h(() => dashboard.oportunidades());

// Catalogo completo (inclui inativos) e cadastros
export const catalogoGestao = h(() => catalogo.carregarCatalogo({ gestao: true }));
export const buscarProduto = h((req) => catalogo.buscarProduto(req.params.id));
export const criarProduto = h((req) => catalogo.criarProduto(req.body, req.user!.id), 201);
export const atualizarProduto = h((req) => catalogo.atualizarProduto(req.params.id, req.body));
export const ativarProduto = h((req) => catalogo.definirAtivo(req.params.id, !!req.body?.active));
export const enviarFoto = h((req) => catalogo.enviarFoto(req.params.id, req.file));
export const removerFoto = h((req) => catalogo.removerFoto(req.params.id));
export const criarCategoria = h((req) => catalogo.criarCategoria(req.body), 201);
export const atualizarCategoria = h((req) => catalogo.atualizarCategoria(req.params.id, req.body));
export const criarUnidade = h((req) => catalogo.criarUnidade(req.body), 201);
export const atualizarUnidade = h((req) => catalogo.atualizarUnidade(req.params.id, req.body));
export const criarServico = h((req) => catalogo.criarServico(req.body), 201);
export const atualizarServico = h((req) => catalogo.atualizarServico(req.params.id, req.body));
export const lerConfig = h(() => config.lerConfig());
export const atualizarConfig = h((req) => config.atualizarConfig(req.body));

// Estoque
export const ajustarEstoque = h((req) => estoque.ajustar(req.body, req.user!.id));
export const movimentacoes = h((req) =>
  estoque.listarMovimentacoes({ produtoId: q(req.query.produtoId), unidadeId: q(req.query.unidadeId), pedido: q(req.query.pedido), limite: q(req.query.limite) }),
);

// Pedidos
export const listarPedidos = h((req) => pedidos.listar({ status: q(req.query.status), unidade: q(req.query.unidade), busca: q(req.query.busca), limite: q(req.query.limite) }));
export const detalhePedido = h((req) => pedidos.detalhe(numeroDe(req.params.numero)));
export const statusPedido = h((req) => pedidos.alterarStatus(numeroDe(req.params.numero), req.body, req.user!.id));

// Assistencia
export const listarOs = h((req) => os.listar({ status: q(req.query.status), unidade: q(req.query.unidade), busca: q(req.query.busca) }));
export const detalheOs = h((req) => os.detalhe(numeroDe(req.params.numero)));
export const statusOs = h((req) => os.alterarStatus(numeroDe(req.params.numero), req.body, req.user!.id));
export const orcamentoOs = h((req) => os.registrarOrcamento(numeroDe(req.params.numero), req.body, req.user!.id));

// Clientes
export const listarClientes = h((req) => clientes.listar({ busca: q(req.query.busca) }));
export const detalheCliente = h((req) => clientes.detalhe(req.params.id));
export const atualizarCliente = h((req) => clientes.atualizarPelaEquipe(req.params.id, req.body));
