import * as catalogo from '../services/catalogo.service';
import * as pedidos from '../services/pedidos.service';
import * as os from '../services/os.service';
import { h, numeroDe } from './_handler';

export const catalogoPublico = h(async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return catalogo.carregarCatalogo();
});
export const criarPedido = h((req) => pedidos.criarPedido(req.body, req.cliente), 201);
export const verPedido = h((req) => pedidos.verPedidoCliente(numeroDe(req.params.numero), req));
export const consultar = h((req) => pedidos.consultar(req.body));
export const solicitarOs = h((req) => os.solicitar(req.body, req.cliente), 201);
export const verOs = h((req) => os.verOsCliente(numeroDe(req.params.numero), req));
export const decidirOrcamento = h((req) => os.decidirOrcamento(numeroDe(req.params.numero), req.body, req));
