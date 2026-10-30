/* ============ Dados demonstrativos (fictícios) ============ */
const UNITS = [
  { id: 'itaim', name: 'Itaim Paulista', short: 'Itaim' },
  { id: 'suzano', name: 'Suzano', short: 'Suzano' },
  { id: 'carrao', name: 'Carrão', short: 'Carrão' },
];
const unitName = id => (UNITS.find(u => u.id === id) || {}).name || '—';

const GROUPS = {
  celulares: { label: 'Celulares', title: 'Celulares para o seu', titleHl: 'próximo nível.' },
  acessorios: { label: 'Acessórios', title: 'Acessórios para o seu dia.', titleHl: '' },
  assistencia: { label: 'Assistência', title: 'Assistência para o seu aparelho.', titleHl: '' },
};
const SUBS = [
  { id: 'smartphones', label: 'Celulares', group: 'celulares' },
  { id: 'capinhas', label: 'Capinhas', group: 'acessorios' },
  { id: 'carregadores', label: 'Carregadores', group: 'acessorios' },
  { id: 'fones', label: 'Fones', group: 'acessorios' },
  { id: 'peliculas', label: 'Películas', group: 'acessorios' },
  { id: 'cabos', label: 'Cabos', group: 'acessorios' },
  { id: 'powerbanks', label: 'Power banks', group: 'acessorios' },
  { id: 'smartwatches', label: 'Smartwatches', group: 'acessorios' },
  { id: 'pulseiras', label: 'Pulseiras', group: 'acessorios' },
  { id: 'caixas', label: 'Caixas de som', group: 'acessorios' },
  { id: 'suportes', label: 'Suportes', group: 'acessorios' },
  { id: 'veicular', label: 'Veicular', group: 'acessorios' },
  { id: 'foto', label: 'Foto mobile', group: 'acessorios' },
  { id: 'adaptadores', label: 'Hubs e adaptadores', group: 'acessorios' },
];
const subLabel = id => (SUBS.find(s => s.id === id) || {}).label || id;
const PHONE_BRANDS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi'];
const COMPAT_FAMS = ['iPhone', 'Samsung Galaxy', 'Motorola', 'Xiaomi', 'Universal'];
const MODEL_FAM = { 'iPhone 16': 'iPhone', 'iPhone 15': 'iPhone', 'iPhone 13': 'iPhone', 'Galaxy S24 FE': 'Samsung Galaxy', 'Galaxy A55 5G': 'Samsung Galaxy', 'Galaxy A15': 'Samsung Galaxy', 'Moto G84 5G': 'Motorola', 'Redmi Note 13': 'Xiaomi' };

const COLOR_HEX = {
  'Preto': '#26272b', 'Branco': '#ecebe7', 'Rosa': '#f0c6d0', 'Ultramarino': '#6a78d8', 'Verde-acinzentado': '#b3c2b0',
  'Azul': '#a9c6dd', 'Verde': '#c8d8c2', 'Meia-noite': '#262b33', 'Estelar': '#ebe4d8', 'Grafite': '#3b3d42', 'Menta': '#bfe2cf',
  'Azul-escuro': '#2c3a5c', 'Gelo': '#e3e9ec', 'Lilás': '#c7b6e2', 'Azul-claro': '#b8d3e6', 'Magenta': '#a3214f', 'Azul-gelo': '#c9dde8',
  'Amarelo': '#ffc800', 'Cinza': '#8e9198', 'Prata': '#c9ccd1', 'Transparente': '#e8edf2', 'Azul-marinho': '#22304d',
  'Verde-menta': '#a8dcc3', 'Areia': '#d8c6a4', 'Vermelho': '#c8332f', 'Laranja': '#f08a24',
};

const ALL_MODELS = ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE', 'Galaxy A55 5G', 'Galaxy A15', 'Moto G84 5G', 'Redmi Note 13'];
const opt = (name, values, type) => ({ name, type: type || (name === 'Cor' ? 'color' : 'pill'), values: values.map(v => typeof v === 'string' ? { v } : v) });
const COMPAT = 'Compatível com';

const BASE_PRODUCTS = [
  /* ---------- Celulares ---------- */
  { id: 'p01', code: 'CEL-001', name: 'iPhone 16', brand: 'Apple', model: 'iPhone 16', group: 'celulares', sub: 'smartphones', price: 5499.9, rank: 2, isNew: true,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 800 }]), opt('Cor', ['Preto', 'Branco', 'Rosa', 'Ultramarino', 'Verde-acinzentado'])],
    art: { kind: 'phone', cam: 'apple-v' }, tags: 'iphone apple smartphone celular 5g usb-c ios',
    desc: 'Smartphone Apple com tela de 6,1" e conector USB-C. Disponível em duas capacidades e cinco cores nesta configuração demonstrativa.',
    specs: [['Tela', '6,1"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'iOS']] },
  { id: 'p02', code: 'CEL-002', name: 'iPhone 15', brand: 'Apple', model: 'iPhone 15', group: 'celulares', sub: 'smartphones', price: 4299.9, rank: 4,
    options: [opt('Condição', ['Novo', { v: 'Seminovo', d: -700 }]), opt('Armazenamento', ['128 GB', { v: '256 GB', d: 700 }]), opt('Cor', ['Preto', 'Azul', 'Verde', 'Rosa'])],
    exclude: [{ 'Condição': 'Seminovo', 'Armazenamento': '256 GB' }, { 'Condição': 'Seminovo', 'Cor': 'Verde' }],
    art: { kind: 'phone', cam: 'apple-d' }, tags: 'iphone apple smartphone celular 5g usb-c seminovo ios',
    desc: 'iPhone 15 em versões nova e seminova. Algumas combinações não existem nesta configuração demonstrativa e aparecem bloqueadas.',
    specs: [['Tela', '6,1"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'iOS']] },
  { id: 'p03', code: 'CEL-003', name: 'iPhone 13', brand: 'Apple', model: 'iPhone 13', group: 'celulares', sub: 'smartphones', price: 2399.9, rank: 9,
    options: [opt('Condição', ['Seminovo']), opt('Armazenamento', ['128 GB']), opt('Cor', ['Meia-noite', 'Estelar'])],
    art: { kind: 'phone', cam: 'apple-d' }, tags: 'iphone apple smartphone celular seminovo lightning ios',
    desc: 'iPhone 13 seminovo, opção de entrada para quem quer o ecossistema Apple. Usa conector Lightning.',
    specs: [['Tela', '6,1"'], ['Rede', '5G'], ['Conector', 'Lightning'], ['Sistema', 'iOS']] },
  { id: 'p04', code: 'CEL-004', name: 'Galaxy S24 FE', brand: 'Samsung', model: 'Galaxy S24 FE', group: 'celulares', sub: 'smartphones', price: 3199.9, rank: 5, isNew: true,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 400 }]), opt('Cor', ['Grafite', { v: 'Azul', hex: '#5a7ea8' }, 'Menta'])],
    art: { kind: 'phone', cam: 'sam' }, tags: 'samsung galaxy smartphone celular android 5g usb-c',
    desc: 'Galaxy S24 FE com tela grande e câmera tripla. Configuração e cores demonstrativas.',
    specs: [['Tela', '6,7"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p05', code: 'CEL-005', name: 'Galaxy A55 5G', brand: 'Samsung', model: 'Galaxy A55 5G', group: 'celulares', sub: 'smartphones', price: 1999.9, rank: 3,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 300 }]), opt('Cor', ['Azul-escuro', 'Gelo', 'Lilás'])],
    art: { kind: 'phone', cam: 'sam' }, tags: 'samsung galaxy smartphone celular android 5g usb-c',
    desc: 'Intermediário da linha Galaxy A com 5G. Preço e disponibilidade demonstrativos.',
    specs: [['Tela', '6,6"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p06', code: 'CEL-006', name: 'Galaxy A15', brand: 'Samsung', model: 'Galaxy A15', group: 'celulares', sub: 'smartphones', price: 999.9, rank: 7,
    options: [opt('Armazenamento', ['128 GB']), opt('Cor', ['Preto', 'Azul-claro'])],
    art: { kind: 'phone', cam: 'sam' }, tags: 'samsung galaxy smartphone celular android usb-c entrada',
    desc: 'Galaxy de entrada com bateria para o dia todo. Dados demonstrativos.',
    specs: [['Tela', '6,5"'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p07', code: 'CEL-007', name: 'Moto G84 5G', brand: 'Motorola', model: 'Moto G84 5G', group: 'celulares', sub: 'smartphones', price: 1399.9, rank: 6,
    options: [opt('Armazenamento', ['256 GB']), opt('Cor', ['Grafite', 'Magenta', { v: 'Azul', hex: '#9fb6d6' }])],
    art: { kind: 'phone', cam: 'moto' }, tags: 'motorola moto smartphone celular android 5g usb-c',
    desc: 'Motorola com 256 GB e 5G. Cores e preço demonstrativos.',
    specs: [['Tela', '6,55"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p08', code: 'CEL-008', name: 'Moto E14', brand: 'Motorola', model: 'Moto E14', group: 'celulares', sub: 'smartphones', price: 599.9, rank: 10,
    options: [opt('Armazenamento', ['64 GB']), opt('Cor', ['Grafite', 'Verde'])],
    art: { kind: 'phone', cam: 'moto-e' }, tags: 'motorola moto smartphone celular android usb-c entrada barato',
    desc: 'Opção de entrada da Motorola para uso essencial. Dados demonstrativos.',
    specs: [['Tela', '6,5"'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p09', code: 'CEL-009', name: 'Redmi Note 13', brand: 'Xiaomi', model: 'Redmi Note 13', group: 'celulares', sub: 'smartphones', price: 1199.9, rank: 8,
    options: [opt('Armazenamento', ['128 GB', { v: '256 GB', d: 250 }]), opt('Cor', ['Preto', 'Verde', 'Azul-gelo'])],
    art: { kind: 'phone', cam: 'xi' }, tags: 'xiaomi redmi smartphone celular android usb-c',
    desc: 'Redmi Note 13 com tela AMOLED e boa autonomia. Configuração demonstrativa.',
    specs: [['Tela', '6,67"'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },
  { id: 'p10', code: 'CEL-010', name: 'Poco X6 Pro', brand: 'Xiaomi', model: 'Poco X6 Pro', group: 'celulares', sub: 'smartphones', price: 1999.9, rank: 11, isNew: true,
    options: [opt('Armazenamento', ['256 GB', { v: '512 GB', d: 400 }]), opt('Cor', ['Preto', 'Amarelo', 'Cinza'])],
    exclude: [{ 'Armazenamento': '512 GB', 'Cor': 'Cinza' }],
    art: { kind: 'phone', cam: 'xi' }, tags: 'xiaomi poco smartphone celular android 5g usb-c gamer',
    desc: 'Poco X6 Pro voltado a desempenho. A versão Cinza não existe com 512 GB nesta configuração demonstrativa.',
    specs: [['Tela', '6,67"'], ['Rede', '5G'], ['Conector', 'USB-C'], ['Sistema', 'Android']] },

  /* ---------- Capinhas ---------- */
  { id: 'a01', code: 'CAP-001', name: 'Capa transparente', brand: 'Diversas', model: 'Capa transparente', group: 'acessorios', sub: 'capinhas', price: 39.9, rank: 1,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE', 'Galaxy A55 5G']), opt('Cor', ['Transparente'])],
    art: { kind: 'photo', key: 'ph_case' }, tags: 'capa capinha case transparente protecao',
    desc: 'Capa transparente que mantém a cor original do aparelho à mostra. Escolha o modelo do seu celular.',
    specs: [['Tipo de proteção', 'Bordas reforçadas'], ['Acabamento', 'Transparente']] },
  { id: 'a02', code: 'CAP-002', name: 'Capa antichoque', brand: 'Diversas', model: 'Capa antichoque', group: 'acessorios', sub: 'capinhas', price: 59.9, rank: 12,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'Galaxy S24 FE', 'Galaxy A55 5G', 'Moto G84 5G', 'Redmi Note 13']), opt('Cor', ['Preto', 'Azul-marinho', 'Amarelo'])],
    exclude: [{ [COMPAT]: 'Moto G84 5G', 'Cor': 'Amarelo' }, { [COMPAT]: 'Redmi Note 13', 'Cor': 'Amarelo' }],
    art: { kind: 'case', style: 'antichoque' }, tags: 'capa capinha case antichoque anti impacto protecao',
    desc: 'Capa com cantos reforçados e textura antideslizante. A cor Amarelo não existe para todos os modelos nesta configuração.',
    specs: [['Tipo de proteção', 'Antichoque com cantos reforçados'], ['Acabamento', 'Fosco texturizado']] },
  { id: 'a03', code: 'CAP-003', name: 'Capa de silicone', brand: 'Diversas', model: 'Capa de silicone', group: 'acessorios', sub: 'capinhas', price: 49.9, rank: 14,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13']), opt('Cor', ['Preto', 'Lilás', 'Verde-menta', 'Areia'])],
    art: { kind: 'case', style: 'silicone' }, tags: 'capa capinha case silicone macia',
    desc: 'Capa de silicone com toque macio e interior aveludado.',
    specs: [['Tipo de proteção', 'Silicone flexível'], ['Acabamento', 'Toque macio']] },
  { id: 'a04', code: 'CAP-004', name: 'Capa com anel suporte', brand: 'Diversas', model: 'Capa com anel', group: 'acessorios', sub: 'capinhas', price: 54.9, rank: 18,
    options: [opt(COMPAT, ['iPhone 15', 'Galaxy A55 5G', 'Galaxy A15', 'Redmi Note 13']), opt('Cor', ['Preto', 'Grafite'])],
    art: { kind: 'case', style: 'suporte' }, tags: 'capa capinha case anel suporte ring',
    desc: 'Capa com anel giratório que funciona como apoio para vídeos e chamadas.',
    specs: [['Tipo de proteção', 'Rígida com anel'], ['Acabamento', 'Fosco']] },

  /* ---------- Películas ---------- */
  { id: 'a05', code: 'PEL-001', name: 'Película de proteção', brand: 'Diversas', model: 'Película de vidro', group: 'acessorios', sub: 'peliculas', price: 29.9, rank: 3,
    options: [opt(COMPAT, ALL_MODELS)],
    art: { kind: 'photo', key: 'ph_film' }, tags: 'pelicula vidro protecao tela',
    desc: 'Película de vidro para a tela, com aplicação disponível na unidade (serviço demonstrativo).',
    specs: [['Tipo de proteção', 'Vidro para tela'], ['Acabamento', 'Alta definição']] },
  { id: 'a06', code: 'PEL-002', name: 'Película de privacidade', brand: 'Diversas', model: 'Película privacidade', group: 'acessorios', sub: 'peliculas', price: 49.9, rank: 15,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE', 'Galaxy A55 5G'])],
    art: { kind: 'film', style: 'privacidade' }, tags: 'pelicula privacidade vidro protecao tela',
    desc: 'Película que escurece a tela quando vista de lado.',
    specs: [['Tipo de proteção', 'Vidro com filtro de privacidade'], ['Acabamento', 'Escurecido lateral']] },
  { id: 'a07', code: 'PEL-003', name: 'Película para câmera', brand: 'Diversas', model: 'Película de câmera', group: 'acessorios', sub: 'peliculas', price: 24.9, rank: 20,
    options: [opt(COMPAT, ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE'])],
    art: { kind: 'film', style: 'camera' }, tags: 'pelicula camera lente protecao',
    desc: 'Protetor de vidro para o conjunto de câmeras traseiras.',
    specs: [['Tipo de proteção', 'Vidro para lentes'], ['Acabamento', 'Transparente']] },

  /* ---------- Energia ---------- */
  { id: 'a08', code: 'CAR-001', name: 'Carregador USB-C', brand: 'Diversas', model: 'Fonte USB-C', group: 'acessorios', sub: 'carregadores', price: 69.9, rank: 2, compat: ['Universal'],
    options: [opt('Potência', ['20 W', { v: '35 W', d: 30 }])],
    art: { kind: 'photo', key: 'ph_charger' }, tags: 'carregador fonte usb-c tomada rapido',
    desc: 'Fonte de tomada com saída USB-C. A potência informada é demonstrativa.',
    specs: [['Conexão', 'USB-C'], ['Portas', '1'], ['Compatibilidade', 'Aparelhos com carga via USB-C (a validar)']] },
  { id: 'a09', code: 'CAR-002', name: 'Fonte dupla USB-C + USB-A', brand: 'Diversas', model: 'Fonte dupla', group: 'acessorios', sub: 'carregadores', price: 89.9, rank: 16, compat: ['Universal'],
    options: [opt('Cor', ['Branco', 'Preto'])],
    art: { kind: 'brick' }, tags: 'carregador fonte adaptador usb-c usb-a duas portas tomada',
    desc: 'Fonte com duas saídas para carregar dois aparelhos ao mesmo tempo.',
    specs: [['Conexão', 'USB-C + USB-A'], ['Portas', '2'], ['Potência', '30 W (demonstrativo)']] },
  { id: 'a10', code: 'CAB-001', name: 'Cabo USB-C para USB-C', brand: 'Diversas', model: 'Cabo C-C', group: 'acessorios', sub: 'cabos', price: 39.9, rank: 6, compat: ['Universal', 'iPhone', 'Samsung Galaxy', 'Motorola', 'Xiaomi'],
    options: [opt('Comprimento', ['1 m', { v: '2 m', d: 10 }]), opt('Cor', ['Branco', 'Preto'])],
    art: { kind: 'cable', end: 'c' }, tags: 'cabo usb-c tipo c carregamento dados',
    desc: 'Cabo trançado USB-C nas duas pontas.',
    specs: [['Conexão', 'USB-C / USB-C'], ['Compatibilidade', 'Aparelhos com USB-C (a validar)']] },
  { id: 'a11', code: 'CAB-002', name: 'Cabo USB-C para Lightning', brand: 'Diversas', model: 'Cabo C-Lightning', group: 'acessorios', sub: 'cabos', price: 49.9, rank: 19, compat: ['iPhone'],
    options: [opt('Comprimento', ['1 m', { v: '2 m', d: 10 }]), opt('Cor', ['Branco'])],
    art: { kind: 'cable', end: 'l' }, tags: 'cabo lightning iphone usb-c',
    desc: 'Cabo para iPhones com conector Lightning, como o iPhone 13.',
    specs: [['Conexão', 'USB-C / Lightning'], ['Compatibilidade', 'iPhones com Lightning (ex.: iPhone 13)']] },
  { id: 'a12', code: 'CAR-003', name: 'Carregador sem fio', brand: 'Diversas', model: 'Base por indução', group: 'acessorios', sub: 'carregadores', price: 119.9, rank: 13, compat: ['Universal'],
    options: [opt('Cor', ['Preto', 'Branco'])],
    art: { kind: 'pad' }, tags: 'carregador sem fio wireless inducao qi',
    desc: 'Base de carregamento por indução para aparelhos compatíveis.',
    specs: [['Conexão', 'Sem fio + entrada USB-C'], ['Compatibilidade', 'Aparelhos com recarga sem fio (a validar)']] },
  { id: 'a13', code: 'ENE-001', name: 'Power bank', brand: 'Diversas', model: 'Bateria portátil', group: 'acessorios', sub: 'powerbanks', price: 149.9, rank: 9, compat: ['Universal'],
    options: [opt('Capacidade', ['10.000 mAh', { v: '20.000 mAh', d: 60 }]), opt('Cor', ['Preto', 'Branco'])],
    art: { kind: 'bank' }, tags: 'power bank bateria portatil carregador usb-c',
    desc: 'Bateria portátil com duas saídas USB-C.',
    specs: [['Conexão', '2x USB-C'], ['Portas', '2']] },

  /* ---------- Áudio ---------- */
  { id: 'a14', code: 'AUD-001', name: 'Fone sem fio', brand: 'Diversas', model: 'Fone TWS', group: 'acessorios', sub: 'fones', price: 99.9, rank: 4, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'photo', key: 'ph_buds' }, tags: 'fone sem fio bluetooth tws earbuds',
    desc: 'Fone intra-auricular Bluetooth com estojo de carregamento.',
    specs: [['Conexão', 'Bluetooth'], ['Estojo', 'Com carregamento']] },
  { id: 'a15', code: 'AUD-002', name: 'Fone com cancelamento de ruído', brand: 'Diversas', model: 'Headphone ANC', group: 'acessorios', sub: 'fones', price: 399.9, rank: 10, compat: ['Universal'],
    options: [opt('Cor', ['Preto', 'Prata'])],
    art: { kind: 'headphones' }, tags: 'fone headphone bluetooth cancelamento de ruido anc premium',
    desc: 'Headphone Bluetooth com cancelamento de ruído.',
    specs: [['Conexão', 'Bluetooth'], ['Recurso', 'Cancelamento de ruído']] },
  { id: 'a16', code: 'AUD-003', name: 'Fone com fio USB-C', brand: 'Diversas', model: 'Fone com fio', group: 'acessorios', sub: 'fones', price: 49.9, rank: 17, compat: ['Universal'],
    options: [opt('Cor', ['Branco', 'Preto'])],
    art: { kind: 'wired' }, tags: 'fone com fio usb-c earphone',
    desc: 'Fone com fio e conector USB-C, sem precisar de adaptador.',
    specs: [['Conexão', 'USB-C'], ['Microfone', 'Integrado']] },
  { id: 'a17', code: 'AUD-004', name: 'Caixa de som portátil', brand: 'Diversas', model: 'Caixa Bluetooth', group: 'acessorios', sub: 'caixas', price: 199.9, rank: 8, compat: ['Universal'],
    options: [opt('Cor', ['Preto', { v: 'Azul', hex: '#2f62c9' }, 'Amarelo'])],
    art: { kind: 'speaker' }, tags: 'caixa de som bluetooth portatil speaker',
    desc: 'Caixa de som Bluetooth portátil com alça.',
    specs: [['Conexão', 'Bluetooth'], ['Recarga', 'USB-C']] },

  /* ---------- Vestíveis ---------- */
  { id: 'a18', code: 'WEA-001', name: 'Smartwatch', brand: 'Diversas', model: 'Relógio inteligente', group: 'acessorios', sub: 'smartwatches', price: 349.9, rank: 11, compat: ['Universal'],
    options: [opt('Tamanho', ['41 mm', { v: '45 mm', d: 40 }]), opt('Cor', ['Preto', 'Prata', 'Rosa'])],
    exclude: [{ 'Tamanho': '45 mm', 'Cor': 'Rosa' }],
    art: { kind: 'watch' }, tags: 'smartwatch relogio inteligente bluetooth',
    desc: 'Relógio inteligente com notificações e monitor de atividades. A cor Rosa existe apenas em 41 mm nesta configuração.',
    specs: [['Conexão', 'Bluetooth'], ['Compatibilidade', 'Android e iOS (a validar)']] },
  { id: 'a19', code: 'WEA-002', name: 'Pulseira esportiva', brand: 'Diversas', model: 'Pulseira para smartwatch', group: 'acessorios', sub: 'pulseiras', price: 39.9, rank: 21,
    options: [opt('Tamanho', ['41 mm', '45 mm']), opt('Cor', ['Preto', 'Amarelo', 'Branco', 'Verde-menta'])],
    art: { kind: 'band' }, tags: 'pulseira smartwatch relogio esportiva',
    desc: 'Pulseira de silicone para o smartwatch da loja, nos tamanhos 41 e 45 mm.',
    specs: [['Material', 'Silicone'], ['Compatibilidade', 'Smartwatch da loja (demonstrativo)']] },

  /* ---------- Suportes, veicular, foto, conectividade ---------- */
  { id: 'a20', code: 'SUP-001', name: 'Suporte veicular magnético', brand: 'Diversas', model: 'Suporte de saída de ar', group: 'acessorios', sub: 'veicular', price: 59.9, rank: 22, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'carmount' }, tags: 'suporte veicular carro magnetico',
    desc: 'Suporte para saída de ar do carro com fixação magnética.',
    specs: [['Fixação', 'Saída de ar'], ['Tipo', 'Magnético']] },
  { id: 'a21', code: 'VEI-001', name: 'Carregador veicular USB-C', brand: 'Diversas', model: 'Carregador de carro', group: 'acessorios', sub: 'veicular', price: 49.9, rank: 23, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'carcharger' }, tags: 'carregador veicular carro usb-c',
    desc: 'Carregador para tomada 12 V do carro com duas saídas USB-C.',
    specs: [['Conexão', '2x USB-C'], ['Entrada', 'Tomada 12 V']] },
  { id: 'a22', code: 'FOT-001', name: 'Tripé com ring light', brand: 'Diversas', model: 'Ring light de mesa', group: 'acessorios', sub: 'foto', price: 89.9, rank: 24, compat: ['Universal'],
    options: [opt('Cor', ['Preto'])],
    art: { kind: 'ring' }, tags: 'tripe ring light foto video fotografia mobile',
    desc: 'Tripé de mesa com anel de luz para fotos e vídeos com o celular.',
    specs: [['Iluminação', 'Anel de LED'], ['Alimentação', 'USB']] },
  { id: 'a23', code: 'CON-001', name: 'Hub USB-C 4 em 1', brand: 'Diversas', model: 'Adaptador multiportas', group: 'acessorios', sub: 'adaptadores', price: 129.9, rank: 25, compat: ['Universal'],
    options: [opt('Cor', ['Cinza'])],
    art: { kind: 'hub' }, tags: 'hub adaptador usb-c hdmi usb-a conectividade',
    desc: 'Adaptador USB-C com saídas HDMI, USB-A e USB-C.',
    specs: [['Conexão', 'USB-C'], ['Saídas', 'HDMI, 2x USB-A, USB-C']] },
  { id: 'a24', code: 'SUP-002', name: 'Suporte de mesa articulado', brand: 'Diversas', model: 'Suporte de mesa', group: 'acessorios', sub: 'suportes', price: 44.9, rank: 26, compat: ['Universal'],
    options: [opt('Cor', ['Prata'])],
    art: { kind: 'desk' }, tags: 'suporte mesa celular apoio articulado',
    desc: 'Suporte dobrável de alumínio para apoiar o celular na mesa.',
    specs: [['Material', 'Alumínio'], ['Ajuste', 'Articulado']] },
];
/* compatibilidade derivada das opções */
BASE_PRODUCTS.forEach(p => {
  if (!p.compat) {
    const o = (p.options || []).find(o => o.name === COMPAT);
    p.compat = o ? [...new Set(o.values.map(v => MODEL_FAM[v.v]))] : null;
  }
});

const SERVICES = [
  { id: 's01', name: 'Troca de tela', icon: 'screen', desc: 'Substituição de tela trincada, manchada ou que não responde ao toque.' },
  { id: 's02', name: 'Troca de bateria', icon: 'battery', desc: 'Para aparelhos que descarregam rápido, desligam sozinhos ou estão estufados.' },
  { id: 's03', name: 'Conector de carga', icon: 'plug', desc: 'Quando o cabo fica frouxo, o carregamento falha ou só funciona em uma posição.' },
  { id: 's04', name: 'Câmera', icon: 'camera', desc: 'Câmera embaçada, tremendo, com manchas ou que não abre.' },
  { id: 's05', name: 'Áudio', icon: 'volume', desc: 'Alto-falante, microfone ou auricular com som baixo, chiado ou mudo.' },
  { id: 's06', name: 'Diagnóstico', icon: 'scan', desc: 'Avaliação técnica quando você não sabe exatamente o que o aparelho tem.' },
  { id: 's07', name: 'Software', icon: 'code', desc: 'Travamentos, atualização, backup e configuração do sistema.' },
  { id: 's08', name: 'Aplicação de película', icon: 'film', desc: 'Aplicação de película comprada na loja ou trazida pelo cliente.' },
  { id: 's09', name: 'Instalação de acessórios', icon: 'puzzle', desc: 'Ajuda para instalar suporte veicular, pareamento de fones e relógios.' },
  { id: 's10', name: 'Outros reparos', icon: 'tool', desc: 'Botões, vibração, biometria, sinal e outros problemas.' },
];
const svcByName = n => SERVICES.find(s => s.name === n);

const ORDER_STATUS = [
  { id: 'recebido', label: 'Recebido', tone: 'info' },
  { id: 'aguardando', label: 'Aguardando confirmação', tone: 'warn' },
  { id: 'confirmado', label: 'Confirmado', tone: 'info' },
  { id: 'separacao', label: 'Em separação', tone: 'info' },
  { id: 'pronto', label: 'Pronto para retirada', tone: 'go' },
  { id: 'concluido', label: 'Concluído', tone: 'ok' },
  { id: 'cancelado', label: 'Cancelado', tone: 'bad' },
];
const STOCK_APPLIED = new Set(['confirmado', 'separacao', 'pronto', 'concluido']);
const ORDER_OPEN = new Set(['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto']);
const SVC_STATUS = [
  { id: 'recebida', label: 'Solicitação recebida', tone: 'info' },
  { id: 'avaliacao', label: 'Aguardando avaliação', tone: 'warn' },
  { id: 'diagnostico', label: 'Em diagnóstico', tone: 'info' },
  { id: 'orcamento', label: 'Aguardando aprovação do orçamento', tone: 'warn' },
  { id: 'reparo', label: 'Em reparo', tone: 'info' },
  { id: 'retirada', label: 'Aguardando retirada', tone: 'go' },
  { id: 'concluido', label: 'Concluído', tone: 'ok' },
  { id: 'cancelado', label: 'Cancelado', tone: 'bad' },
];
const SVC_OPEN = new Set(['recebida', 'avaliacao', 'diagnostico', 'orcamento', 'reparo', 'retirada']);

/* ---------- variantes ---------- */
function variantsOf(p) {
  let combos = [{}];
  (p.options || []).forEach(o => {
    const next = [];
    combos.forEach(c => o.values.forEach(v => next.push({ ...c, [o.name]: v.v })));
    combos = next;
  });
  return combos.filter(c => !(p.exclude || []).some(ex => Object.keys(ex).every(k => c[k] === ex[k])));
}
const vkeyOf = (p, sel) => (p.options || []).map(o => sel[o.name]).join('|') || 'unico';
function selFromKey(p, key) { const parts = key.split('|'); const s = {}; (p.options || []).forEach((o, i) => s[o.name] = parts[i]); return s; }
function variantLabel(p, sel) { return (p.options || []).filter(o => o.values.length > 1 || o.name === COMPAT || o.name === 'Cor').map(o => sel[o.name]).filter(Boolean).join(' · '); }
function variantPrice(p, sel) {
  let v = p.price;
  (p.options || []).forEach(o => { const f = o.values.find(x => x.v === sel[o.name]); if (f && f.d) v += f.d; });
  return Math.round(v * 100) / 100;
}
function colorHex(p, name) {
  const o = (p.options || []).find(o => o.name === 'Cor');
  const f = o && o.values.find(v => v.v === name);
  return (f && f.hex) || COLOR_HEX[name] || '#3b3d42';
}
function skuOf(p, sel) {
  const ab = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  const parts = (p.options || []).filter(o => o.values.length > 1).map(o => ab(sel[o.name]));
  return [p.code, ...parts].join('-');
}

/* ---------- gerador determinístico ---------- */
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const CUSTOMERS_SEED = [
  ['c01', 'Juliana Ferreira', '(11) 90000-0101', 'juliana.f@example.com'],
  ['c02', 'Rafael Santos', '(11) 90000-0102', ''],
  ['c03', 'Camila Oliveira', '(11) 90000-0103', 'camila.o@example.com'],
  ['c04', 'Diego Almeida', '(11) 90000-0104', ''],
  ['c05', 'Larissa Costa', '(11) 90000-0105', 'larissa.c@example.com'],
  ['c06', 'Thiago Ribeiro', '(11) 90000-0106', ''],
  ['c07', 'Bianca Martins', '(11) 90000-0107', ''],
  ['c08', 'Lucas Pereira', '(11) 90000-0108', 'lucas.p@example.com'],
  ['c09', 'Fernanda Rocha', '(11) 90000-0109', ''],
  ['c10', 'Gustavo Lima', '(11) 90000-0110', ''],
  ['c11', 'Patrícia Gomes', '(11) 90000-0111', 'patricia.g@example.com'],
  ['c12', 'Mateus Carvalho', '(11) 90000-0112', ''],
];
/* [diasAtrás, horasAtrás, cliente, unidade, modalidade, status, pagamento, itens[[id, seleção, qtd]]] */
const ORDERS_SEED = [
  [29, 0, 'c02', 'itaim', 'retirada', 'concluido', 'pix', [['p05', { 'Armazenamento': '128 GB', 'Cor': 'Azul-escuro' }, 1], ['a05', { [COMPAT]: 'Galaxy A55 5G' }, 1]]],
  [27, 0, 'c03', 'suzano', 'retirada', 'concluido', 'cartao', [['a14', { 'Cor': 'Preto' }, 1], ['a08', { 'Potência': '20 W' }, 1]]],
  [26, 0, 'c04', 'carrao', 'entrega', 'concluido', 'cartao', [['p01', { 'Armazenamento': '256 GB', 'Cor': 'Preto' }, 1]]],
  [24, 0, 'c05', 'itaim', 'retirada', 'concluido', 'pix', [['a17', { 'Cor': 'Amarelo' }, 1]]],
  [22, 0, 'c06', 'suzano', 'retirada', 'concluido', 'retirada', [['p09', { 'Armazenamento': '128 GB', 'Cor': 'Preto' }, 1], ['a02', { [COMPAT]: 'Redmi Note 13', 'Cor': 'Preto' }, 1], ['a05', { [COMPAT]: 'Redmi Note 13' }, 1]]],
  [20, 0, 'c07', 'itaim', 'retirada', 'cancelado', 'pix', [['a15', { 'Cor': 'Preto' }, 1]]],
  [19, 0, 'c08', 'carrao', 'retirada', 'concluido', 'retirada', [['a10', { 'Comprimento': '1 m', 'Cor': 'Branco' }, 2], ['a08', { 'Potência': '20 W' }, 1]]],
  [17, 0, 'c01', 'itaim', 'retirada', 'concluido', 'pix', [['a03', { [COMPAT]: 'iPhone 15', 'Cor': 'Lilás' }, 1], ['a07', { [COMPAT]: 'iPhone 15' }, 1]]],
  [15, 0, 'c09', 'suzano', 'entrega', 'concluido', 'cartao', [['p07', { 'Armazenamento': '256 GB', 'Cor': 'Azul' }, 1]]],
  [13, 0, 'c10', 'itaim', 'retirada', 'concluido', 'cartao', [['a18', { 'Tamanho': '41 mm', 'Cor': 'Preto' }, 1], ['a19', { 'Tamanho': '41 mm', 'Cor': 'Amarelo' }, 1]]],
  [11, 0, 'c02', 'itaim', 'retirada', 'concluido', 'pix', [['a12', { 'Cor': 'Preto' }, 1]]],
  [9, 0, 'c11', 'carrao', 'retirada', 'concluido', 'retirada', [['p06', { 'Armazenamento': '128 GB', 'Cor': 'Preto' }, 1], ['a05', { [COMPAT]: 'Galaxy A15' }, 1], ['a04', { [COMPAT]: 'Galaxy A15', 'Cor': 'Preto' }, 1]]],
  [7, 0, 'c12', 'suzano', 'retirada', 'concluido', 'pix', [['a13', { 'Capacidade': '10.000 mAh', 'Cor': 'Preto' }, 1], ['a10', { 'Comprimento': '2 m', 'Cor': 'Preto' }, 1]]],
  [6, 0, 'c03', 'itaim', 'retirada', 'concluido', 'cartao', [['p02', { 'Condição': 'Novo', 'Armazenamento': '128 GB', 'Cor': 'Azul' }, 1]]],
  [5, 0, 'c08', 'carrao', 'retirada', 'concluido', 'pix', [['a14', { 'Cor': 'Preto' }, 1], ['a08', { 'Potência': '20 W' }, 1]]],
  [4, 0, 'c05', 'carrao', 'retirada', 'concluido', 'pix', [['a01', { [COMPAT]: 'iPhone 16', 'Cor': 'Transparente' }, 1], ['a05', { [COMPAT]: 'iPhone 16' }, 1]]],
  [3, 0, 'c06', 'itaim', 'entrega', 'concluido', 'cartao', [['a16', { 'Cor': 'Branco' }, 2]]],
  [2, 0, 'c08', 'suzano', 'retirada', 'pronto', 'retirada', [['p04', { 'Armazenamento': '256 GB', 'Cor': 'Grafite' }, 1], ['a06', { [COMPAT]: 'Galaxy S24 FE' }, 1]]],
  [1, 0, 'c10', 'itaim', 'retirada', 'separacao', 'pix', [['a17', { 'Cor': 'Preto' }, 1], ['a21', { 'Cor': 'Preto' }, 1]]],
  [1, 0, 'c09', 'carrao', 'retirada', 'confirmado', 'retirada', [['a22', { 'Cor': 'Preto' }, 1], ['a24', { 'Cor': 'Prata' }, 1]]],
  [0, 5, 'c07', 'itaim', 'retirada', 'concluido', 'pix', [['a14', { 'Cor': 'Preto' }, 1], ['a08', { 'Potência': '35 W' }, 1]]],
  [0, 3, 'c01', 'suzano', 'retirada', 'concluido', 'cartao', [['a09', { 'Cor': 'Branco' }, 1], ['a10', { 'Comprimento': '1 m', 'Cor': 'Branco' }, 1]]],
  [0, 1.5, 'c11', 'suzano', 'retirada', 'aguardando', 'pix', [['a11', { 'Comprimento': '1 m', 'Cor': 'Branco' }, 1]]],
  [0, 0.4, 'c12', 'itaim', 'retirada', 'recebido', 'pix', [['p10', { 'Armazenamento': '256 GB', 'Cor': 'Amarelo' }, 1], ['a08', { 'Potência': '35 W' }, 1]]],
];
/* [diasAtrás, cliente, marca, modelo, serviço, unidade, status, orçamento, descrição] */
const SERVICES_SEED = [
  [18, 'c02', 'Samsung', 'Galaxy A52', 'Troca de tela', 'itaim', 'concluido', 690, 'Tela trincada após queda; toque falhando no canto inferior.'],
  [12, 'c05', 'Apple', 'iPhone 12', 'Troca de bateria', 'carrao', 'concluido', 389.9, 'Bateria descarrega antes do meio-dia.'],
  [10, 'c10', 'Samsung', 'Galaxy A34', 'Troca de bateria', 'carrao', 'cancelado', 279.9, 'Cliente desistiu após o orçamento.'],
  [8, 'c06', 'Xiaomi', 'Redmi Note 11', 'Conector de carga', 'suzano', 'retirada', 189.9, 'Só carrega com o cabo em uma posição.'],
  [5, 'c01', 'Apple', 'iPhone 15', 'Câmera', 'itaim', 'reparo', 520, 'Câmera principal tremendo ao filmar.'],
  [3, 'c09', 'Motorola', 'Moto G54', 'Software', 'carrao', 'orcamento', 120, 'Aparelho travando e reiniciando sozinho.'],
  [2, 'c03', 'Samsung', 'Galaxy S21 FE', 'Áudio', 'suzano', 'diagnostico', null, 'Pessoas não me escutam nas ligações.'],
  [1, 'c12', 'Apple', 'iPhone 11', 'Diagnóstico', 'itaim', 'avaliacao', null, 'Aparelho esquenta muito e a bateria some.'],
  [0, 'c07', 'Motorola', 'Moto E13', 'Troca de tela', 'itaim', 'recebida', null, 'Tela com listras verdes depois de cair.'],
];

function buildSeed() {
  const now = Date.now();
  const R = rng(20261026);
  const H = 3600e3, D = 24 * H;
  const products = BASE_PRODUCTS.map(p => ({ ...p, active: true, createdAt: now - (p.isNew ? 5 : 60) * D }));
  /* estoque por unidade e variante */
  const stock = {};
  products.forEach(p => {
    const phone = p.group === 'celulares';
    variantsOf(p).forEach((sel, vi) => {
      const k = vkeyOf(p, sel);
      UNITS.forEach(u => {
        const r = R();
        let q;
        if (r < 0.05) q = 0; else if (r < 0.14) q = 1 + Math.floor(R() * 3); else q = phone ? 4 + Math.floor(R() * 5) : 4 + Math.floor(R() * 16);
        stock[`${p.id}|${k}|${u.id}`] = q;
      });
    });
    /* garante ao menos uma variante disponível em cada unidade */
    UNITS.forEach(u => {
      const keys = variantsOf(p).map(s => `${p.id}|${vkeyOf(p, s)}|${u.id}`);
      if (!keys.some(k => stock[k] > 0)) stock[keys[0]] = 4;
    });
  });
  /* casos demonstrativos */
  variantsOf(products.find(p => p.id === 'a03')).forEach(s => stock[`a03|${vkeyOf(BASE_PRODUCTS.find(p => p.id === 'a03'), s)}|carrao`] = 0);
  stock['a15|Preto|itaim'] = 2; stock['a15|Prata|itaim'] = 0;
  stock['p01|128 GB|Preto|itaim'] = 2; stock['p01|128 GB|Ultramarino|itaim'] = 0;
  stock['a01|iPhone 16|Transparente|itaim'] = 12;

  const customers = CUSTOMERS_SEED.map(([id, name, phone, email]) => ({ id, name, phone, email, createdAt: now - 40 * D }));
  const orders = [];
  ORDERS_SEED.forEach((o, i) => {
    const [dAgo, hAgo, cid, unitId, mode, status, pay, items] = o;
    const base = new Date(now - dAgo * D);
    if (dAgo > 0) base.setHours(10 + (i * 37) % 8, (i * 13) % 60, 0, 0);
    let created = dAgo > 0 ? base.getTime() : now - hAgo * H;
    const lines = items.map(([pid, sel, qty]) => {
      const p = BASE_PRODUCTS.find(x => x.id === pid);
      const full = { ...sel };
      (p.options || []).forEach(op => { if (!full[op.name]) full[op.name] = op.values[0].v; });
      const price = variantPrice(p, full);
      return { pid, vkey: vkeyOf(p, full), name: p.name, variant: variantLabel(p, full), price, qty, sku: skuOf(p, full) };
    });
    const total = Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
    const flow = ['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto', 'concluido'];
    const steps = status === 'cancelado' ? ['recebido', 'aguardando', 'cancelado'] : flow.slice(0, flow.indexOf(status) + 1);
    const span = dAgo > 0 ? 6 * H : Math.max(0.2, hAgo - 0.1) * H;
    const history = steps.map((s, j) => ({ s, at: created + Math.round(span * (j / Math.max(1, steps.length - 1))) }));
    orders.push({
      id: 'PED-' + (1021 + i), num: 1021 + i, customerId: cid, createdAt: created, unitId, mode,
      address: mode === 'entrega' ? 'Endereço fictício de demonstração' : '', pay, items: lines, total, status, history,
      stockApplied: STOCK_APPLIED.has(status), completedAt: status === 'concluido' ? history[history.length - 1].at : null, source: 'seed',
    });
  });
  const services = SERVICES_SEED.map((s, i) => {
    const [dAgo, cid, brand, model, svc, unitId, status, quote, desc] = s;
    const created = dAgo > 0 ? now - dAgo * D - (i * 7 % 5) * H : now - 2 * H;
    const flow = SVC_STATUS.map(x => x.id).filter(x => x !== 'cancelado');
    const steps = status === 'cancelado' ? ['recebida', 'avaliacao', 'diagnostico', 'orcamento', 'cancelado'] : flow.slice(0, flow.indexOf(status) + 1);
    const span = dAgo > 0 ? dAgo * D * 0.8 : 1.5 * H;
    const history = steps.map((st, j) => ({ s: st, at: created + Math.round(span * (j / Math.max(1, steps.length - 1))) }));
    return { id: 'OS-' + (2031 + i), num: 2031 + i, customerId: cid, brand, model, service: svc, unitId, status, createdAt: created, desc, quote: quote ? { value: quote, note: 'Valor demonstrativo registrado pela equipe.' } : null, history };
  });
  return {
    v: 3, seededAt: now, unitId: 'itaim', products, stock, customers, orders, services, cart: [],
    currentCustomerId: null, seq: { order: 1021 + ORDERS_SEED.length, service: 2031 + SERVICES_SEED.length, customer: 13, product: 1 },
  };
}
