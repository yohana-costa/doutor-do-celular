import * as auth from '../services/auth.service';
import { h } from './_handler';

export const login = h((req) => auth.login(req.body));
export const me = h((req) => auth.me(req.user!.id));
export const trocarSenha = h((req) => auth.trocarSenha(req.user!.id, req.body));
export const listarUsuarios = h(() => auth.listarUsuarios());
export const criarUsuario = h((req) => auth.criarUsuario(req.body), 201);
export const atualizarUsuario = h((req) => auth.atualizarUsuario(req.params.id, req.body, req.user!.id));
