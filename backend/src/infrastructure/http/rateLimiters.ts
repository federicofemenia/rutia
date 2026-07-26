import { rateLimit } from 'express-rate-limit';

/**
 * In-memory (sin Redis) a propósito: un solo proceso, tráfico bajo — alcanza para frenar abuso
 * básico de estos dos endpoints públicos (probar códigos de empresa al azar, spamear registros).
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const validateRegistrationCodeRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo más tarde.' },
});

export const registerDriverRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo más tarde.' },
});
