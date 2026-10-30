import { Router } from 'express';
import * as c from '../controllers/conta.controller';
import { clienteAuth } from '../middleware/auth';

// Conta do cliente (telefone + senha). Token separado do token da equipe.
const router = Router();
router.post('/cadastro', c.cadastrar);
router.post('/login', c.entrar);
router.get('/me', clienteAuth, c.minhaConta);
router.put('/me', clienteAuth, c.atualizar);

export default router;
