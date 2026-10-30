import app from './app';
import { config } from './config/env';

// Servidor local de desenvolvimento. Na Vercel quem atende e api/index.ts.
app.listen(config.port, () => {
  console.log(`Doutor do Celular, API em http://localhost:${config.port}`);
  console.log(`   Ambiente: ${config.nodeEnv}`);
  console.log(`   Health: http://localhost:${config.port}/api/health`);
});
