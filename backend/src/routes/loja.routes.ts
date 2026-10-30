import { Router } from 'express';
import * as c from '../controllers/loja.controller';
import { identificacaoOpcional } from '../middleware/auth';

// Rotas publicas da loja. Pedido e OS so aparecem com o token de acesso (X-Acesso),
// com a conta do cliente dono ou depois da consulta por codigo + telefone.
const router = Router();
router.use(identificacaoOpcional);

router.get('/catalogo', c.catalogoPublico);
router.post('/pedidos', c.criarPedido);
router.get('/pedidos/:numero', c.verPedido);
router.post('/consulta', c.consultar);
router.post('/os', c.solicitarOs);
router.get('/os/:numero', c.verOs);
router.post('/os/:numero/orcamento', c.decidirOrcamento);

export default router;
