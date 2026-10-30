// Teste ponta a ponta da API (passa pelo proxy do front, como em producao).
// Uso: com o banco local, npm run dev:api e npm run dev rodando:  node tools/testes/api.mjs
// ATENCAO: cria pedidos, OS, clientes e um usuario de teste. Nunca rode contra o banco de producao.
import { readFileSync } from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:8093';
let pass = 0, fail = 0;
const ok = (cond, msg, extra) => { if (cond) { pass++; console.log('  ok  ', msg); } else { fail++; console.log('  FAIL', msg, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); } };
async function call(method, path, { body, token, acesso, form } = {}) {
  const h = {};
  if (body) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = 'Bearer ' + token;
  if (acesso) h['X-Acesso'] = acesso;
  const r = await fetch(BASE + '/api' + path, { method, headers: h, body: form || (body ? JSON.stringify(body) : undefined) });
  let data = null; try { data = await r.json(); } catch { }
  return { status: r.status, data };
}
const sum = n => Math.round(n * 100) / 100;

console.log('1) login da equipe');
let r = await call('POST', '/auth/login', { body: { email: 'admin@doutordocelular.com.br', senha: 'errada' } });
ok(r.status === 401, 'senha errada recusada (401)');
r = await call('POST', '/auth/login', { body: { email: 'admin@doutordocelular.com.br', senha: 'admin123' } });
ok(r.status === 200 && r.data.token, 'admin entra');
const T = r.data.token;
r = await call('GET', '/gestao/dashboard');
ok(r.status === 401, 'gestão sem token recusada');
const unique = Date.now().toString(36).slice(-5);

console.log('2) CRUD de produto + foto');
r = await call('POST', '/gestao/produtos', { token: T, body: { name: 'Capa teste ' + unique, sub: 'capinhas', brand: 'Diversas', price: 30, options: [{ name: 'Cor', type: 'color', values: [{ v: 'Preto' }, { v: 'Rosa', d: 5 }] }, { name: 'Tamanho', type: 'pill', values: [{ v: 'P' }, { v: 'G', d: 10 }] }], exclude: [{ Cor: 'Rosa', Tamanho: 'G' }], initialStock: 2 } });
ok(r.status === 201, 'cria produto', r.data);
const np = r.data.product;
ok(np.variations.filter(v => v.active).length === 3, '3 variações (2x2 menos 1 bloqueada)', np.variations);
ok(np.variations.find(v => v.key === 'Rosa|P').price === 35, 'preço da variação com acréscimo = 35');
ok(Object.values(r.data.stock).every(q => q === 2) && Object.keys(r.data.stock).length === 9, 'estoque inicial 2 em 3 variações x 3 unidades', r.data.stock);
r = await call('PUT', '/gestao/produtos/' + np.id, { token: T, body: { price: 40, exclude: [] } });
ok(r.status === 200 && r.data.product.variations.filter(v => v.active).length === 4 && r.data.product.variations.find(v => v.key === 'Rosa|G').price === 55, 'edita preço e libera combinação (4 variações, Rosa|G = 55)', r.data);
r = await call('PUT', '/gestao/produtos/' + np.id, { token: T, body: { exclude: [{ Cor: 'Azul' }] } });
ok(r.status === 400, 'combinação com valor inexistente recusada (400)');
const fd = new FormData(); fd.append('imagem', new Blob([readFileSync(new URL('../../assets/img/produto-pelicula.jpg', import.meta.url))], { type: 'image/jpeg' }), 'foto.jpg');
r = await call('POST', `/gestao/produtos/${np.id}/imagem`, { token: T, form: fd });
ok(r.status === 200 && /^\/uploads\//.test(r.data.product.image), 'foto enviada', r.data);
const img = await fetch(BASE + r.data.product.image);
ok(img.status === 200 && img.headers.get('content-type').includes('image'), 'foto servida em /uploads');
r = await call('PATCH', `/gestao/produtos/${np.id}/ativo`, { token: T, body: { active: false } });
ok(r.status === 200 && r.data.product.active === false, 'desativa produto');
r = await call('GET', '/loja/catalogo');
ok(!r.data.products.some(p => p.id === np.id), 'produto inativo some da loja');
ok(r.data.products.length === 34, 'loja tem os 34 produtos do catálogo inicial', r.data.products.length);

console.log('3) ajuste de estoque');
const K = { produtoId: 'p01', chave: '128 GB|Preto', unidadeId: 'itaim' };
r = await call('POST', '/gestao/estoque/ajuste', { token: T, body: { ...K, quantidade: 5 } });
ok(r.status === 200 && r.data.quantity === 5, 'define estoque 5', r.data);
r = await call('POST', '/gestao/estoque/ajuste', { token: T, body: { ...K, delta: -6 } });
ok(r.status === 409, 'ajuste que deixaria negativo recusado (409)', r.data);
r = await call('GET', '/loja/catalogo');
ok(r.data.stock['p01|128 GB|Preto|itaim'] === 5, 'loja vê 5 em Itaim');

console.log('4) checkout');
const cliente = { nome: 'Cliente Teste', telefone: '(11) 98888-' + String(Date.now()).slice(-4), email: '' };
r = await call('POST', '/loja/pedidos', { body: { ...cliente, unidadeId: 'itaim', modalidade: 'retirada', pagamento: 'pix', itens: [{ produtoId: 'p01', chave: '128 GB|Preto', quantidade: 10 }] } });
ok(r.status === 409, 'pedido acima do estoque recusado (409)', r.data);
r = await call('POST', '/loja/pedidos', { body: { ...cliente, unidadeId: 'itaim', modalidade: 'retirada', pagamento: 'pix', itens: [{ produtoId: 'p01', chave: '128 GB|Preto', quantidade: 1 }, { produtoId: 'p01', chave: '128 GB|Preto', quantidade: 1 }] } });
ok(r.status === 201 && r.data.order.status === 'recebido', 'pedido criado como Recebido', r.data);
const ped = r.data.order, acessoPed = r.data.access;
ok(ped.total === 10999.8 && ped.items.length === 1 && ped.items[0].qty === 2, 'linhas repetidas somadas, total calculado no servidor (10999,80)', ped);
r = await call('GET', '/loja/catalogo');
ok(r.data.stock['p01|128 GB|Preto|itaim'] === 5, 'criar pedido não baixa estoque');

console.log('5) status x estoque');
const st = async s => (await call('PATCH', `/gestao/pedidos/${ped.num}/status`, { token: T, body: { status: s } }));
const saldo = async () => (await call('GET', '/loja/catalogo')).data.stock['p01|128 GB|Preto|itaim'];
const movs = async () => (await call('GET', `/gestao/estoque/movimentacoes?pedido=${ped.num}`, { token: T })).data;
r = await st('confirmado'); ok(r.status === 200 && r.data.order.stockApplied, 'confirma', r.data);
ok(await saldo() === 3, 'confirmado baixa 2 (5 -> 3)');
await st('separacao'); await st('pronto');
ok(await saldo() === 3, 'separação e pronto não baixam de novo');
await st('aguardando');
ok(await saldo() === 5, 'voltar para antes de Confirmado devolve (3 -> 5)');
await st('confirmado'); await st('confirmado');
ok(await saldo() === 3, 'confirmar de novo baixa uma vez só (5 -> 3)');
let m = await movs();
ok(m.filter(x => x.type === 'VENDA').length === 2 && m.filter(x => x.type === 'DEVOLUCAO').length === 1, 'movimentações: 2 vendas e 1 devolução, sem duplicar', m.map(x => x.type));
r = await st('cancelado');
ok(r.data.order.stockApplied === false && await saldo() === 5, 'cancelar devolve (3 -> 5)');
m = await movs();
ok(m.length === 4 && m[0].balance === 5, '4 movimentações no total, saldo final 5', m.map(x => [x.type, x.qty, x.balance]));
await st('recebido');
ok(await saldo() === 5, 'reabrir cancelado como Recebido não mexe no estoque');

console.log('6) estoque insuficiente na confirmação');
r = await call('POST', '/loja/pedidos', { body: { ...cliente, unidadeId: 'itaim', modalidade: 'entrega', endereco: 'Rua Teste, 100', pagamento: 'cartao', itens: [{ produtoId: 'p01', chave: '128 GB|Preto', quantidade: 3 }] } });
const ped2 = r.data.order;
await call('POST', '/gestao/estoque/ajuste', { token: T, body: { ...K, quantidade: 1 } });
r = await call('PATCH', `/gestao/pedidos/${ped2.num}/status`, { token: T, body: { status: 'confirmado' } });
ok(r.status === 409, 'confirmar sem estoque recusado (409)', r.data);
r = await call('GET', `/gestao/pedidos/${ped2.num}`, { token: T });
ok(r.data.order.status === 'recebido' && !r.data.order.stockApplied && await saldo() === 1, 'pedido e estoque intactos após recusa');
await call('POST', '/gestao/estoque/ajuste', { token: T, body: { ...K, quantidade: 10 } });

console.log('7) faturamento só com Concluído');
const dash = async () => (await call('GET', '/gestao/dashboard?periodo=hoje&unidade=all', { token: T })).data;
const d0 = await dash();
await call('PATCH', `/gestao/pedidos/${ped2.num}/status`, { token: T, body: { status: 'confirmado' } });
const d1 = await dash();
ok(d1.revenue === d0.revenue, 'confirmado não entra no faturamento', [d0.revenue, d1.revenue]);
await call('PATCH', `/gestao/pedidos/${ped2.num}/status`, { token: T, body: { status: 'concluido' } });
const d2 = await dash();
ok(sum(d2.revenue - d0.revenue) === ped2.total && d2.doneCount === d0.doneCount + 1, 'concluído entra no faturamento (+' + ped2.total + ')', [d0.revenue, d2.revenue]);
await call('PATCH', `/gestao/pedidos/${ped.num}/status`, { token: T, body: { status: 'cancelado' } });
const d3 = await dash();
ok(d3.revenue === d2.revenue, 'cancelado fora do faturamento');
ok(Array.isArray(d3.series) && d3.series.length === 7, 'série do dia em faixas de 2h');

console.log('8) privacidade do pedido');
r = await call('GET', `/loja/pedidos/${ped.num}`);
ok(r.status === 401, 'pedido sem token de acesso recusado');
r = await call('GET', `/loja/pedidos/${ped.num}`, { acesso: acessoPed });
ok(r.status === 200 && r.data.order.id === ped.id, 'pedido com token de acesso');
r = await call('GET', `/loja/pedidos/${ped2.num}`, { acesso: acessoPed });
ok(r.status === 401, 'token de um pedido não abre outro');
r = await call('POST', '/loja/consulta', { body: { codigo: ped.id, telefone: '(11) 90000-0000' } });
ok(r.status === 404, 'consulta com telefone errado recusada (404)');
r = await call('POST', '/loja/consulta', { body: { codigo: ped.id, telefone: cliente.telefone } });
ok(r.status === 200 && r.data.type === 'pedido' && r.data.access, 'consulta com código + telefone certo');

console.log('9) assistência: solicitação, orçamento, aprovação');
r = await call('POST', '/loja/os', { body: { nome: cliente.nome, telefone: cliente.telefone, marca: 'Samsung', modelo: 'Galaxy A15', servico: 'Troca de tela', descricao: 'Tela trincada depois de uma queda', unidadeId: 'suzano' } });
ok(r.status === 201 && r.data.service.status === 'recebida', 'OS criada', r.data);
const os = r.data.service, acessoOs = r.data.access;
ok(os.customerId === ped.customerId, 'mesmo telefone = mesmo cliente');
r = await call('POST', `/loja/os/${os.num}/orcamento`, { acesso: acessoOs, body: { decisao: 'aprovar' } });
ok(r.status === 409, 'aprovar sem orçamento recusado');
r = await call('PUT', `/gestao/os/${os.num}/orcamento`, { token: T, body: { valor: 450.5, observacao: 'Tela original' } });
ok(r.status === 200 && r.data.service.status === 'orcamento' && r.data.service.quote.value === 450.5, 'orçamento move para Aguardando aprovação', r.data);
r = await call('GET', `/loja/os/${os.num}`);
ok(r.status === 401, 'OS sem acesso recusada');
r = await call('POST', '/loja/consulta', { body: { codigo: os.id, telefone: '11977776666' } });
ok(r.status === 404, 'acompanhamento de OS com telefone errado recusado');
r = await call('POST', `/loja/os/${os.num}/orcamento`, { acesso: acessoPed, body: { decisao: 'aprovar' } });
ok(r.status === 401, 'token de pedido não aprova OS');
r = await call('POST', `/loja/os/${os.num}/orcamento`, { acesso: acessoOs, body: { decisao: 'aprovar' } });
ok(r.status === 200 && r.data.service.status === 'reparo' && r.data.service.quote.decision === 'aprovado', 'cliente aprova: Em reparo', r.data);
r = await call('POST', `/loja/os/${os.num}/orcamento`, { acesso: acessoOs, body: { decisao: 'recusar' } });
ok(r.status === 409, 'segunda resposta recusada');
for (const s of ['retirada', 'concluido']) r = await call('PATCH', `/gestao/os/${os.num}/status`, { token: T, body: { status: s } });
ok(r.data.service.status === 'concluido' && r.data.service.history.length === 5, 'fluxo até Concluído com histórico', r.data.service.history.map(h => h.s));

console.log('10) conta do cliente');
r = await call('POST', '/conta/cadastro', { body: { nome: 'Cliente Teste', telefone: cliente.telefone, senha: 'segredo1' } });
ok(r.status === 409 && r.data.details && r.data.details.precisaCodigo, 'telefone com histórico exige código', r.data);
r = await call('POST', '/conta/cadastro', { body: { nome: 'Cliente Teste', telefone: cliente.telefone, senha: 'segredo1', codigo: 'PED-1' } });
ok(r.status === 409, 'código que não é dele recusado');
r = await call('POST', '/conta/cadastro', { body: { nome: 'Cliente Teste', telefone: cliente.telefone, senha: 'segredo1', codigo: os.id } });
ok(r.status === 201 && r.data.token, 'conta criada com código da OS');
r = await call('POST', '/conta/login', { body: { telefone: cliente.telefone, senha: 'errada' } });
ok(r.status === 401, 'login do cliente com senha errada recusado');
r = await call('POST', '/conta/login', { body: { telefone: cliente.telefone, senha: 'segredo1' } });
const CT = r.data.token;
r = await call('GET', '/conta/me', { token: CT });
ok(r.status === 200 && r.data.orders.length === 2 && r.data.services.length === 1, 'Minha conta lista 2 pedidos e 1 OS', r.data && { o: r.data.orders?.length, s: r.data.services?.length });
r = await call('GET', `/loja/pedidos/${ped2.num}`, { token: CT });
ok(r.status === 200, 'cliente logado vê o próprio pedido sem token de acesso');
r = await call('GET', '/gestao/dashboard', { token: CT });
ok(r.status === 401, 'token de cliente não abre a gestão');
r = await call('GET', '/conta/me', { token: T });
ok(r.status === 401, 'token da equipe não serve como cliente');

console.log('11) perfis da equipe');
const em = `op${unique}@doutordocelular.com.br`;
r = await call('POST', '/auth/usuarios', { token: T, body: { nome: 'Operador', email: em, senha: 'op12345', perfil: 'OPERADOR' } });
ok(r.status === 201, 'admin cria operador');
const OT = (await call('POST', '/auth/login', { body: { email: em, senha: 'op12345' } })).data.token;
r = await call('POST', '/gestao/produtos', { token: OT, body: { name: 'X', sub: 'capinhas', price: 1 } });
ok(r.status === 403, 'operador não cria produto (403)');
r = await call('POST', '/gestao/estoque/ajuste', { token: OT, body: { ...K, delta: 1 } });
ok(r.status === 200, 'operador ajusta estoque');
r = await call('PUT', '/gestao/configuracoes', { token: OT, body: { estoque_baixo_limite: 9 } });
ok(r.status === 403, 'operador não altera configurações');

console.log('12) painel: contadores, unidades, oportunidades, clientes');
for (const p of ['/gestao/contadores', '/gestao/unidades/resumo', '/gestao/oportunidades', '/gestao/clientes', '/gestao/os', '/gestao/pedidos?status=open', '/gestao/catalogo']) {
  r = await call('GET', p, { token: T }); ok(r.status === 200, 'GET ' + p);
}
r = await call('GET', '/gestao/oportunidades', { token: T });
ok(r.data.phoneBuys.some(x => x.model === 'iPhone 16'), 'oportunidade: comprou iPhone 16 sem capa/película', r.data.phoneBuys);

console.log(`\nResultado: ${pass} ok, ${fail} falhas`);
process.exit(fail ? 1 : 0);
