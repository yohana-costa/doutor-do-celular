import multer from 'multer';
import path from 'path';
import { HttpError } from '../lib/http';

const PERMITIDAS = ['.jpg', '.jpeg', '.png', '.webp'];

// Foto de produto em memoria (sem disco: a API roda como funcao serverless).
// O painel ja reduz a foto no navegador antes de enviar; 4 MB fica abaixo do
// limite de corpo de 4,5 MB das funcoes da Vercel.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (PERMITIDAS.includes(ext) && /^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Apenas imagens são permitidas (jpg, png ou webp).'));
  },
  limits: { fileSize: 4 * 1024 * 1024 },
});
