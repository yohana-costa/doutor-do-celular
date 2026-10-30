import * as clientes from '../services/clientes.service';
import { h } from './_handler';

export const cadastrar = h((req) => clientes.cadastrar(req.body), 201);
export const entrar = h((req) => clientes.entrar(req.body));
export const minhaConta = h((req) => clientes.minhaConta(req.cliente!.id));
export const atualizar = h((req) => clientes.atualizarMinhaConta(req.cliente!.id, req.body));
