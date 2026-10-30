// Funcao serverless da Vercel: toda chamada a /api/* cai aqui (rewrite em vercel.json)
// e e atendida pelo mesmo app Express do desenvolvimento local, sem listen.
import app from '../backend/src/app';

export default app;
