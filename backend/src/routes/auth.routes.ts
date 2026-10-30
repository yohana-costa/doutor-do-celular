import { Router } from 'express';
import * as c from '../controllers/auth.controller';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = Router();
router.post('/login', c.login);
router.get('/me', authMiddleware, c.me);
router.post('/senha', authMiddleware, c.trocarSenha);
router.get('/usuarios', authMiddleware, requireAdmin, c.listarUsuarios);
router.post('/usuarios', authMiddleware, requireAdmin, c.criarUsuario);
router.put('/usuarios/:id', authMiddleware, requireAdmin, c.atualizarUsuario);

export default router;
