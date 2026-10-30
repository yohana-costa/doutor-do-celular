import { Router } from 'express';
import * as c from '../controllers/gestao.controller';
import { authMiddleware, requireAdmin, requireGerente } from '../middleware/auth';
import { upload } from '../middleware/upload';

// Area da equipe. OPERADOR: pedidos, assistencia, estoque e consultas.
// GERENTE: mais catalogo, unidades, categorias e servicos. ADMIN: mais configuracoes e usuarios (em /api/auth).
const router = Router();
router.use(authMiddleware);

router.get('/dashboard', c.dashboardGeral);
router.get('/contadores', c.contadores);
router.get('/unidades/resumo', c.resumoUnidades);
router.get('/oportunidades', c.oportunidades);

router.get('/catalogo', c.catalogoGestao);
router.get('/produtos/:id', c.buscarProduto);
router.post('/produtos', requireGerente, c.criarProduto);
router.put('/produtos/:id', requireGerente, c.atualizarProduto);
router.patch('/produtos/:id/ativo', requireGerente, c.ativarProduto);
router.post('/produtos/:id/imagem', requireGerente, upload.single('imagem'), c.enviarFoto);
router.delete('/produtos/:id/imagem', requireGerente, c.removerFoto);

router.post('/categorias', requireGerente, c.criarCategoria);
router.put('/categorias/:id', requireGerente, c.atualizarCategoria);
router.post('/unidades', requireAdmin, c.criarUnidade);
router.put('/unidades/:id', requireGerente, c.atualizarUnidade);
router.post('/servicos', requireGerente, c.criarServico);
router.put('/servicos/:id', requireGerente, c.atualizarServico);
router.get('/configuracoes', c.lerConfig);
router.put('/configuracoes', requireAdmin, c.atualizarConfig);

router.post('/estoque/ajuste', c.ajustarEstoque);
router.get('/estoque/movimentacoes', c.movimentacoes);

router.get('/pedidos', c.listarPedidos);
router.get('/pedidos/:numero', c.detalhePedido);
router.patch('/pedidos/:numero/status', c.statusPedido);

router.get('/os', c.listarOs);
router.get('/os/:numero', c.detalheOs);
router.patch('/os/:numero/status', c.statusOs);
router.put('/os/:numero/orcamento', c.orcamentoOs);

router.get('/clientes', c.listarClientes);
router.get('/clientes/:id', c.detalheCliente);
router.put('/clientes/:id', c.atualizarCliente);

export default router;
