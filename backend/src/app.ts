import express from 'express';
import { config } from './config/env';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { uploadsDir } from './lib/storage';
import authRoutes from './routes/auth.routes';
import lojaRoutes from './routes/loja.routes';
import contaRoutes from './routes/conta.routes';
import gestaoRoutes from './routes/gestao.routes';

// App Express sem listen: usado pela funcao serverless da Vercel (api/index.ts)
// e pelo servidor local (server.ts). Sem estado em memoria e sem tarefas em segundo plano.
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
// Front e API no mesmo dominio (/api): nao ha CORS.
app.use(express.json({ limit: '1mb' }));
app.use(logger);

// Fotos gravadas em disco (dev local e VPS). Na Vercel ficam no Blob.
if (!config.blobToken) app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true }));

app.use('/api/auth', authRoutes);
app.use('/api/loja', lojaRoutes);
app.use('/api/conta', contaRoutes);
app.use('/api/gestao', gestaoRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use(errorHandler);

export default app;
