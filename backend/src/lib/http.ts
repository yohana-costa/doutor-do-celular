// Erro com status HTTP. Os services lancam e o errorHandler devolve { error } com o status.
export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const naoEncontrado = (msg = 'Registro não encontrado.') => new HttpError(404, msg);
export const invalido = (msg: string, details?: unknown) => new HttpError(400, msg, details);
export const conflito = (msg: string, details?: unknown) => new HttpError(409, msg, details);
