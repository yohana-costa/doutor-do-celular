/*
 * Carga inicial da Doutor do Celular (idempotente: pode rodar de novo sem duplicar nada).
 * Cria apenas: usuario administrador, unidades, categorias, catalogo de produtos e catalogo de servicos.
 * Nao cria clientes, pedidos nem ordens de servico. O estoque inicial e ZERO: a equipe lanca as
 * quantidades reais pelo painel (Gestao > Estoque), e cada lancamento fica registrado como movimentacao.
 *
 * Uso: npm run db:seed   (com DATABASE_URL apontando para o banco desejado)
 */
import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { combinacoes, chaveDe, precoDe, skuDe, Opcao, Selecao, COMPAT } from '../src/lib/variacoes';

const prisma = new PrismaClient();

const UNIDADES = [
  { id: 'itaim', nome: 'Itaim Paulista', nomeCurto: 'Itaim', ordem: 1 },
  { id: 'suzano', nome: 'Suzano', nomeCurto: 'Suzano', ordem: 2 },
  { id: 'carrao', nome: 'Carrão', nomeCurto: 'Carrão', ordem: 3 },
];

const CATEGORIAS: [string, string, string][] = [
  ['smartphones', 'Celulares', 'celulares'],
  ['capinhas', 'Capinhas', 'acessorios'],
  ['carregadores', 'Carregadores', 'acessorios'],
  ['fones', 'Fones', 'acessorios'],
  ['peliculas', 'Películas', 'acessorios'],
  ['cabos', 'Cabos', 'acessorios'],
  ['powerbanks', 'Power banks', 'acessorios'],
  ['smartwatches', 'Smartwatches', 'acessorios'],
  ['pulseiras', 'Pulseiras', 'acessorios'],
  ['caixas', 'Caixas de som', 'acessorios'],
  ['suportes', 'Suportes', 'acessorios'],
  ['veicular', 'Veicular', 'acessorios'],
  ['foto', 'Foto mobile', 'acessorios'],
  ['adaptadores', 'Hubs e adaptadores', 'acessorios'],
];

const SERVICOS: [string, string, string, string][] = [
  ['s01', 'Troca de tela', 'screen', 'Substituição de tela trincada, manchada ou que não responde ao toque.'],
  ['s02', 'Troca de bateria', 'battery', 'Para aparelhos que descarregam rápido, desligam sozinhos ou estão estufados.'],
  ['s03', 'Conector de carga', 'plug', 'Quando o cabo fica frouxo, o carregamento falha ou só funciona em uma posição.'],
  ['s04', 'Câmera', 'camera', 'Câmera embaçada, tremendo, com manchas ou que não abre.'],
  ['s05', 'Áudio', 'volume', 'Alto-falante, microfone ou auricular com som baixo, chiado ou mudo.'],
  ['s06', 'Diagnóstico', 'scan', 'Avaliação técnica quando você não sabe exatamente o que o aparelho tem.'],
  ['s07', 'Software', 'code', 'Travamentos, atualização, backup e configuração do sistema.'],
  ['s08', 'Aplicação de película', 'film', 'Aplicação de película comprada na loja ou trazida pelo cliente.'],
  ['s09', 'Instalação de acessórios', 'puzzle', 'Ajuda para instalar suporte veicular, pareamento de fones e relógios.'],
  ['s10', 'Outros reparos', 'tool', 'Botões, vibração, biometria, sinal e outros problemas.'],
];

// Familia de cada modelo, usada no filtro "Compatibilidade" da loja.
const MODEL_FAM: Record<string, string> = {
  'iPhone 16': 'iPhone', 'iPhone 15': 'iPhone', 'iPhone 13': 'iPhone', 'Galaxy S24 FE': 'Samsung Galaxy', 'Galaxy A55 5G': 'Samsung Galaxy',
  'Galaxy A15': 'Samsung Galaxy', 'Moto G84 5G': 'Motorola', 'Redmi Note 13': 'Xiaomi',
};
const ALL_MODELS = Object.keys(MODEL_FAM);

type V = string | { v: string; d?: number; hex?: string };
const opt = (name: string, values: V[], type?: 'color' | 'pill'): Opcao => ({
  name,
  type: type || (name === 'Cor' ? 'color' : 'pill'),
  values: values.map((v) => (typeof v === 'string' ? { v } : v)),
});

interface Base {
  id: string; code: string; name: string; brand: string; model: string; sub: string; price: number; rank: number; isNew?: boolean;
  options: Opcao[]; exclude?: Selecao[]; art: Record<string, string>; image?: string; tags: string; desc: string; specs: [string, string][]; compat?: string[];
}

// Catalogo inicial (o mesmo do prototipo). Precos e textos podem ser ajustados no painel.
const PRODUTOS: Base[] = [
  { id: 'p01', code: 'CEL-001', name: 'iPhone 16', brand: 'Apple', model: 'iPhone 16', sub: 'smartphones', price: 5499.9, rank: 2, isNew: true,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 800 }]), opt('Cor', ['Preto', 'Branco', 'Rosa', 'Ultramarino', 'Verde-acinzentado'])],
    art: { kind: 'phone', cam: 'apple-v' }, tags: 'iphone apple smartphone celular 5g usb-c ios',
    desc: 'Smartphone Apple com tela de 6,1" e conector USB-C. Disponível em duas capacidades e cinco cores.',
    specs: [['Tela', '6,1"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'iOS']] },
  { id: 'p02', code: 'CEL-002', name: 'iPhone 15', brand: 'Apple', model: 'iPhone 15', sub: 'smartphones', price: 4299.9, rank: 4,
    options: [opt('Condição', ['Novo', { v: 'Seminovo', d: -700 }]), opt('Armazenamento', ['128 GB', { v: '256 GB', d: 700 }]), opt('Cor', ['Preto', 'Azul', 'Verde', 'Rosa'])],
    exclude: [{ 'Condição': 'Seminovo', 'Armazenamento': '256 GB' }, { 'Condição': 'Seminovo', 'Cor': 'Verde' }],
    art: { kind: 'phone', cam: 'apple-d' }, tags: 'iphone apple smartphone celular 5g usb-c seminovo ios',
    desc: 'iPhone 15 em versões nova e seminova. Combinações que a loja não trabalha aparecem bloqueadas.',
    specs: [['Tela', '6,1"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'iOS']] },
  { id: 'p03', code: 'CEL-003', name: 'iPhone 13', brand: 'Apple', model: 'iPhone 13', sub: 'smartphones', price: 2399.9, rank: 9,
    options: [opt('Condição', ['Seminovo']), opt('Armazenamento', ['128 GB']), opt('Cor', ['Meia-noite', 'Estelar'])],
    art: { kind: 'phone', cam: 'apple-d' }, tags: 'iphone apple smartphone celular seminovo lightning ios',
    desc: 'iPhone 13 seminovo, opção de entrada para quem quer o ecossistema Apple. Usa conector Lightning.',
    specs: [['Tela', '6,1"'], ['Rede', '5G'], ['Conector', 'Lightning'], ['Sistema', 'iOS']] },
  { id: 'p04', code: 'CEL-004', name: 'Galaxy S24 FE', brand: 'Samsung', model: 'Galaxy S24 FE', sub: 'smartphones', price: 3199.9, rank: 5, isNew: true,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 400 }]), opt('Cor', ['Grafite', { v: 'Azul', hex: '#5a7ea8' }, 'Menta'])],
    art: { kind: 'phone', cam: 'sam' }, tags: 'samsung galaxy smartphone celular android 5g usb-c',
    desc: 'Galaxy S24 FE com tela grande e câmera tripla.',
    specs: [['Tela', '6,7"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p05', code: 'CEL-005', name: 'Galaxy A55 5G', brand: 'Samsung', model: 'Galaxy A55 5G', sub: 'smartphones', price: 1999.9, rank: 3,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 300 }]), opt('Cor', ['Azul-escuro', 'Gelo', 'Lilás'])],
    art: { kind: 'phone', cam: 'sam' }, tags: 'samsung galaxy smartphone celular android 5g usb-c',
    desc: 'Intermediário da linha Galaxy A com 5G.',
    specs: [['Tela', '6,6"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p06', code: 'CEL-006', name: 'Galaxy A15', brand: 'Samsung', model: 'Galaxy A15', sub: 'smartphones', price: 999.9, rank: 7,
    options: [opt('Armazenamento', ['128 GB']), opt('Cor', ['Preto', 'Azul-claro'])],
    art: { kind: 'phone', cam: 'sam' }, tags: 'samsung galaxy smartphone celular android usb-c entrada',
    desc: 'Galaxy de entrada com bateria para o dia todo.',
    specs: [['Tela', '6,5"'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p07', code: 'CEL-007', name: 'Moto G84 5G', brand: 'Motorola', model: 'Moto G84 5G', sub: 'smartphones', price: 1399.9, rank: 6,
    options: [opt('Armazenamento', ['256 GB']), opt('Cor', ['Grafite', 'Magenta', { v: 'Azul', hex: '#9fb6d6' }])],
    art: { kind: 'phone', cam: 'moto' }, tags: 'motorola moto smartphone celular android 5g usb-c',
    desc: 'Motorola com 256 GB e 5G.',
    specs: [['Tela', '6,55"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p08', code: 'CEL-008', name: 'Moto E14', brand: 'Motorola', model: 'Moto E14', sub: 'smartphones', price: 599.9, rank: 10,
    options: [opt('Armazenamento', ['64 GB']), opt('Cor', ['Grafite', 'Verde'])],
    art: { kind: 'phone', cam: 'moto-e' }, tags: 'motorola moto smartphone celular android usb-c entrada barato',
    desc: 'Opção de entrada da Motorola para uso essencial.',
    specs: [['Tela', '6,5"'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p09', code: 'CEL-009', name: 'Redmi Note 13', brand: 'Xiaomi', model: 'Redmi Note 13', sub: 'smartphones', price: 1199.9, rank: 8,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 250 }]), opt('Cor', ['Preto', 'Verde', 'Azul-gelo'])],
    art: { kind: 'phone', cam: 'xi' }, tags: 'xiaomi redmi smartphone celular android usb-c',
    desc: 'Redmi Note 13 com tela AMOLED e boa autonomia.',
    specs: [['Tela', '6,67"'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p10', code: 'CEL-010', name: 'Poco X6 Pro', brand: 'Xiaomi', model: 'Poco X6 Pro', sub: 'smartphones', price: 1999.9, rank: 11, isNew: true,
    options: [opt('Armazenamento', ['256 GB', { v: '512 GB', d: 400 }]), opt('Cor', ['Preto', 'Amarelo', 'Cinza'])],
    exclude: [{ 'Armazenamento': '512 GB', 'Cor': 'Cinza' }],
    art: { kind: 'phone', cam: 'xi' }, tags: 'xiaomi poco smartphone celular android 5g usb-c gamer',
    desc: 'Poco X6 Pro voltado a desempenho. A versão Cinza não existe com 512 GB.',
    specs: [['Tela', '6,67"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },

  { id: 'a01', code: 'CAP-001', name: 'Capa transparente', brand: 'Diversas', model: 'Capa transparente', sub: 'capinhas', price: 39.9, rank: 1,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE', 'Galaxy A55 5G']), opt('Cor', ['Transparente'])],
    art: { kind: 'case', style: 'silicone' }, image: '/assets/img/produto-capa-transparente.jpg', tags: 'capa capinha case transparente protecao',
    desc: 'Capa transparente que mantém a cor original do aparelho à mostra. Escolha o modelo do seu celular.',
    specs: [['Tipo de proteção', 'Bordas reforçadas'], ['Acabamento', 'Transparente']] },
  { id: 'a02', code: 'CAP-002', name: 'Capa antichoque', brand: 'Diversas', model: 'Capa antichoque', sub: 'capinhas', price: 59.9, rank: 12,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'Galaxy S24 FE', 'Galaxy A55 5G', 'Moto G84 5G', 'Redmi Note 13']), opt('Cor', ['Preto', 'Azul-marinho', 'Amarelo'])],
    exclude: [{ [COMPAT]: 'Moto G84 5G', 'Cor': 'Amarelo' }, { [COMPAT]: 'Redmi Note 13', 'Cor': 'Amarelo' }],
    art: { kind: 'case', style: 'antichoque' }, tags: 'capa capinha case antichoque anti impacto protecao',
    desc: 'Capa com cantos reforçados e textura antideslizante. A cor Amarelo não existe para todos os modelos.',
    specs: [['Tipo de proteção', 'Antichoque com cantos reforçados'], ['Acabamento', 'Fosco texturizado']] },
  { id: 'a03', code: 'CAP-003', name: 'Capa de silicone', brand: 'Diversas', model: 'Capa de silicone', sub: 'capinhas', price: 49.9, rank: 14,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13']), opt('Cor', ['Preto', 'Lilás', 'Verde-menta', 'Areia'])],
    art: { kind: 'case', style: 'silicone' }, tags: 'capa capinha case silicone macia',
    desc: 'Capa de silicone com toque macio e interior aveludado.',
    specs: [['Tipo de proteção', 'Silicone flexível'], ['Acabamento', 'Toque macio']] },
  { id: 'a04', code: 'CAP-004', name: 'Capa com anel suporte', brand: 'Diversas', model: 'Capa com anel', sub: 'capinhas', price: 54.9, rank: 18,
    options: [opt(COMPAT, ['iPhone 15', 'Galaxy A55 5G', 'Galaxy A15', 'Redmi Note 13']), opt('Cor', ['Preto', 'Grafite'])],
    art: { kind: 'case', style: 'suporte' }, tags: 'capa capinha case anel suporte ring',
    desc: 'Capa com anel giratório que funciona como apoio para vídeos e chamadas.',
    specs: [['Tipo de proteção', 'Rígida com anel'], ['Acabamento', 'Fosco']] },

  { id: 'a05', code: 'PEL-001', name: 'Película de proteção', brand: 'Diversas', model: 'Película de vidro', sub: 'peliculas', price: 29.9, rank: 3,
    options: [opt(COMPAT, ALL_MODELS)],
    art: { kind: 'film', style: 'privacidade' }, image: '/assets/img/produto-pelicula.jpg', tags: 'pelicula vidro protecao tela',
    desc: 'Película de vidro para a tela, com aplicação disponível na unidade.',
    specs: [['Tipo de proteção', 'Vidro para tela'], ['Acabamento', 'Alta definição']] },
  { id: 'a06', code: 'PEL-002', name: 'Película de privacidade', brand: 'Diversas', model: 'Película privacidade', sub: 'peliculas', price: 49.9, rank: 15,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE', 'Galaxy A55 5G'])],
    art: { kind: 'film', style: 'privacidade' }, tags: 'pelicula privacidade vidro protecao tela',
    desc: 'Película que escurece a tela quando vista de lado.',
    specs: [['Tipo de proteção', 'Vidro com filtro de privacidade'], ['Acabamento', 'Escurecido lateral']] },
  { id: 'a07', code: 'PEL-003', name: 'Película para câmera', brand: 'Diversas', model: 'Película de câmera', sub: 'peliculas', price: 24.9, rank: 20,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE'])],
    art: { kind: 'film', style: 'camera' }, tags: 'pelicula camera lente protecao',
    desc: 'Protetor de vidro para o conjunto de câmeras traseiras.',
    specs: [['Tipo de proteção', 'Vidro para lentes'], ['Acabamento', 'Transparente']] },

  { id: 'a08', code: 'CAR-001', name: 'Carregador USB-C', brand: 'Diversas', model: 'Fonte USB-C', sub: 'carregadores', price: 69.9, rank: 2, compat: ['Universal'],
    options: [opt('Potência', ['20 W', { v: '35 W', d: 30 }])],
    art: { kind: 'brick' }, image: '/assets/img/produto-carregador-usb-c.jpg', tags: 'carregador fonte usb-c tomada rapido',
    desc: 'Fonte de tomada com saída USB-C.',
    specs: [['Conexão', 'USB-C'], ['Portas', '1'], ['Compatibilidade', 'Aparelhos com carga via USB-C']] },
  { id: 'a09', code: 'CAR-002', name: 'Fonte dupla USB-C + USB-A', brand: 'Diversas', model: 'Fonte dupla', sub: 'carregadores', price: 89.9, rank: 16, compat: ['Universal'],
    options: [opt('Cor', ['Branco', 'Preto'])],
    art: { kind: 'brick' }, tags: 'carregador fonte adaptador usb-c usb-a duas portas tomada',
    desc: 'Fonte com duas saídas para carregar dois aparelhos ao mesmo tempo.',
    specs: [['Conexão', 'USB-C + USB-A'], ['Portas', '2'], ['Potência', '30 W']] },
  { id: 'a10', code: 'CAB-001', name: 'Cabo USB-C para USB-C', brand: 'Diversas', model: 'Cabo C-C', sub: 'cabos', price: 39.9, rank: 6, compat: ['Universal', 'iPhone', 'Samsung Galaxy', 'Motorola', 'Xiaomi'],
    options: [opt('Comprimento', ['1 m', { v: '2 m', d: 10 }]), opt('Cor', ['Branco', 'Preto'])],
    art: { kind: 'cable', end: 'c' }, tags: 'cabo usb-c tipo c carregamento dados',
    desc: 'Cabo trançado USB-C nas duas pontas.',
    specs: [['Conexão', 'USB-C / USB-C'], ['Compatibilidade', 'Aparelhos com USB-C']] },
  { id: 'a11', code: 'CAB-002', name: 'Cabo USB-C para Lightning', brand: 'Diversas', model: 'Cabo C-Lightning', sub: 'cabos', price: 49.9, rank: 19, compat: ['iPhone'],
    options: [opt('Comprimento', ['1 m', { v: '2 m', d: 10 }]), opt('Cor', ['Branco'])],
    art: { kind: 'cable', end: 'l' }, tags: 'cabo lightning iphone usb-c',
    desc: 'Cabo para iPhones com conector Lightning, como o iPhone 13.',
    specs: [['Conexão', 'USB-C / Lightning'], ['Compatibilidade', 'iPhones com Lightning (ex.: iPhone 13)']] },
  { id: 'a12', code: 'CAR-003', name: 'Carregador sem fio', brand: 'Diversas', model: 'Base por indução', sub: 'carregadores', price: 119.9, rank: 13, compat: ['Universal'],
    options: [opt('Cor', ['Preto', 'Branco'])],
    art: { kind: 'pad' }, tags: 'carregador sem fio wireless inducao qi',
    desc: 'Base de carregamento por indução para aparelhos compatíveis.',
    specs: [['Conexão', 'Sem fio + entrada USB-C'], ['Compatibilidade', 'Aparelhos com recarga sem fio']] },
  { id: 'a13', code: 'ENE-001', name: 'Power bank', brand: 'Diversas', model: 'Bateria portátil', sub: 'powerbanks', price: 149.9, rank: 9, compat: ['Universal'],
    options: [opt('Capacidade', ['10.000 mAh', { v: '20.000 mAh', d: 60 }]), opt('Cor', ['Preto', 'Branco'])],
    art: { kind: 'bank' }, tags: 'power bank bateria portatil carregador usb-c',
    desc: 'Bateria portátil com duas saídas USB-C.',
    specs: [['Conexão', '2x USB-C'], ['Portas', '2']] },

  { id: 'a14', code: 'AUD-001', name: 'Fone sem fio', brand: 'Diversas', model: 'Fone TWS', sub: 'fones', price: 99.9, rank: 4, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'wired' }, image: '/assets/img/produto-fone-sem-fio.jpg', tags: 'fone sem fio bluetooth tws earbuds',
    desc: 'Fone intra-auricular Bluetooth com estojo de carregamento.',
    specs: [['Conexão', 'Bluetooth'], ['Estojo', 'Com carregamento']] },
  { id: 'a15', code: 'AUD-002', name: 'Fone com cancelamento de ruído', brand: 'Diversas', model: 'Headphone ANC', sub: 'fones', price: 399.9, rank: 10, compat: ['Universal'],
    options: [opt('Cor', ['Preto', 'Prata'])],
    art: { kind: 'headphones' }, tags: 'fone headphone bluetooth cancelamento de ruido anc premium',
    desc: 'Headphone Bluetooth com cancelamento de ruído.',
    specs: [['Conexão', 'Bluetooth'], ['Recurso', 'Cancelamento de ruído']] },
  { id: 'a16', code: 'AUD-003', name: 'Fone com fio USB-C', brand: 'Diversas', model: 'Fone com fio', sub: 'fones', price: 49.9, rank: 17, compat: ['Universal'],
    options: [opt('Cor', ['Branco', 'Preto'])],
    art: { kind: 'wired' }, tags: 'fone com fio usb-c earphone',
    desc: 'Fone com fio e conector USB-C, sem precisar de adaptador.',
    specs: [['Conexão', 'USB-C'], ['Microfone', 'Integrado']] },
  { id: 'a17', code: 'AUD-004', name: 'Caixa de som portátil', brand: 'Diversas', model: 'Caixa Bluetooth', sub: 'caixas', price: 199.9, rank: 8, compat: ['Universal'],
    options: [opt('Cor', ['Preto', { v: 'Azul', hex: '#2f62c9' }, 'Amarelo'])],
    art: { kind: 'speaker' }, tags: 'caixa de som bluetooth portatil speaker',
    desc: 'Caixa de som Bluetooth portátil com alça.',
    specs: [['Conexão', 'Bluetooth'], ['Recarga', 'USB-C']] },

  { id: 'a18', code: 'WEA-001', name: 'Smartwatch', brand: 'Diversas', model: 'Relógio inteligente', sub: 'smartwatches', price: 349.9, rank: 11, compat: ['Universal'],
    options: [opt('Tamanho', ['41 mm', { v: '45 mm', d: 40 }]), opt('Cor', ['Preto', 'Prata', 'Rosa'])],
    exclude: [{ 'Tamanho': '45 mm', 'Cor': 'Rosa' }],
    art: { kind: 'watch' }, tags: 'smartwatch relogio inteligente bluetooth',
    desc: 'Relógio inteligente com notificações e monitor de atividades. A cor Rosa existe apenas em 41 mm.',
    specs: [['Conexão', 'Bluetooth'], ['Compatibilidade', 'Android e iOS']] },
  { id: 'a19', code: 'WEA-002', name: 'Pulseira esportiva', brand: 'Diversas', model: 'Pulseira para smartwatch', sub: 'pulseiras', price: 39.9, rank: 21,
    options: [opt('Tamanho', ['41 mm', '45 mm']), opt('Cor', ['Preto', 'Amarelo', 'Branco', 'Verde-menta'])],
    art: { kind: 'band' }, tags: 'pulseira smartwatch relogio esportiva',
    desc: 'Pulseira de silicone para o smartwatch da loja, nos tamanhos 41 e 45 mm.',
    specs: [['Material', 'Silicone'], ['Compatibilidade', 'Smartwatch da loja']] },

  { id: 'a20', code: 'SUP-001', name: 'Suporte veicular magnético', brand: 'Diversas', model: 'Suporte de saída de ar', sub: 'veicular', price: 59.9, rank: 22, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'carmount' }, tags: 'suporte veicular carro magnetico',
    desc: 'Suporte para saída de ar do carro com fixação magnética.',
    specs: [['Fixação', 'Saída de ar'], ['Tipo', 'Magnético']] },
  { id: 'a21', code: 'VEI-001', name: 'Carregador veicular USB-C', brand: 'Diversas', model: 'Carregador de carro', sub: 'veicular', price: 49.9, rank: 23, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'carcharger' }, tags: 'carregador veicular carro usb-c',
    desc: 'Carregador para tomada 12 V do carro com duas saídas USB-C.',
    specs: [['Conexão', '2x USB-C'], ['Entrada', 'Tomada 12 V']] },
  { id: 'a22', code: 'FOT-001', name: 'Tripé com ring light', brand: 'Diversas', model: 'Ring light de mesa', sub: 'foto', price: 89.9, rank: 24, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'ring' }, tags: 'tripe ring light foto video fotografia mobile',
    desc: 'Tripé de mesa com anel de luz para fotos e vídeos com o celular.',
    specs: [['Iluminação', 'Anel de LED'], ['Alimentação', 'USB']] },
  { id: 'a23', code: 'CON-001', name: 'Hub USB-C 4 em 1', brand: 'Diversas', model: 'Adaptador multiportas', sub: 'adaptadores', price: 129.9, rank: 25, compat: ['Universal'],
    options: [opt('Cor', ['Cinza'])],
    art: { kind: 'hub' }, tags: 'hub adaptador usb-c hdmi usb-a conectividade',
    desc: 'Adaptador USB-C com saídas HDMI, USB-A e USB-C.',
    specs: [['Conexão', 'USB-C'], ['Saídas', 'HDMI, 2x USB-A, USB-C']] },
  { id: 'a24', code: 'SUP-002', name: 'Suporte de mesa articulado', brand: 'Diversas', model: 'Suporte de mesa', sub: 'suportes', price: 44.9, rank: 26, compat: ['Universal'],
    options: [opt('Cor', ['Prata'])],
    art: { kind: 'desk' }, tags: 'suporte mesa celular apoio articulado',
    desc: 'Suporte dobrável de alumínio para apoiar o celular na mesa.',
    specs: [['Material', 'Alumínio'], ['Ajuste', 'Articulado']] },
];

async function main() {
  console.log('Seed: iniciando');

  // Administrador inicial. TROQUE A SENHA no primeiro acesso (Gestao > Ajustes).
  await prisma.usuario.upsert({
    where: { email: 'admin@doutordocelular.com.br' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@doutordocelular.com.br', senha: await bcrypt.hash('admin123', 10), perfil: 'ADMIN' },
  });

  // Endereco, horario e WhatsApp ficam vazios ("a configurar") ate a loja preencher no painel.
  for (const u of UNIDADES) await prisma.unidade.upsert({ where: { id: u.id }, update: {}, create: u });
  for (const [i, [id, nome, grupo]] of CATEGORIAS.entries())
    await prisma.categoria.upsert({ where: { id }, update: {}, create: { id, nome, grupo, ordem: i + 1 } });
  for (const [i, [id, nome, icone, descricao]] of SERVICOS.entries())
    await prisma.servico.upsert({ where: { id }, update: {}, create: { id, nome, icone, descricao, ordem: i + 1 } });

  let criados = 0;
  for (const p of PRODUTOS) {
    if (await prisma.produto.findFirst({ where: { OR: [{ id: p.id }, { codigo: p.code }] } })) continue;
    const exclusoes = p.exclude || [];
    const compatOpt = p.options.find((o) => o.name === COMPAT);
    const compat = p.compat || (compatOpt ? [...new Set(compatOpt.values.map((v) => MODEL_FAM[v.v]).filter(Boolean))] : null);
    await prisma.$transaction(async (tx) => {
      await tx.produto.create({
        data: {
          id: p.id,
          codigo: p.code,
          nome: p.name,
          marca: p.brand,
          modelo: p.model,
          categoriaId: p.sub,
          precoBase: p.price,
          ordem: p.rank,
          novidade: !!p.isNew,
          descricao: p.desc,
          tags: p.tags,
          especificacoes: p.specs,
          arte: p.art,
          compatibilidade: compat ? compat : Prisma.DbNull,
          imagemUrl: p.image || null,
          opcoes: {
            create: p.options.map((o, i) => ({
              nome: o.name,
              tipo: o.type,
              ordem: i,
              valores: { create: o.values.map((v, j) => ({ valor: v.v, acrescimo: v.d || 0, hex: v.hex || null, ordem: j })) },
            })),
          },
          exclusoes: { create: exclusoes.map((c) => ({ combinacao: c })) },
        },
      });
      for (const sel of combinacoes(p.options, exclusoes)) {
        await tx.produtoVariacao.create({
          data: { produtoId: p.id, chave: chaveDe(p.options, sel), sku: skuDe(p.code, p.options, sel), preco: precoDe(p.price, p.options, sel) },
        });
      }
    });
    criados++;
  }

  const variacoes = await prisma.produtoVariacao.count();
  console.log(`Seed: ok. Produtos novos: ${criados} (total ${await prisma.produto.count()}), variações: ${variacoes}. Estoque inicial: 0.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
