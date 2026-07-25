import type { Client } from '@libsql/client';
import express from 'express';
import { AuthenticateUser } from '../../application/AuthenticateUser.js';
import { ExtractAddressFromImage } from '../../application/ExtractAddressFromImage.js';
import { GetDriverRouteSession } from '../../application/GetDriverRouteSession.js';
import { GetRouteSession } from '../../application/GetRouteSession.js';
import { OptimizeRoute } from '../../application/OptimizeRoute.js';
import { SaveRouteSession } from '../../application/SaveRouteSession.js';
import { GeminiVisionAddressExtractor } from '../ai/GeminiVisionAddressExtractor.js';
import { JwtTokenService } from '../auth/JwtTokenService.js';
import { env } from '../config/env.js';
import { createDatabase } from '../database/createDatabase.js';
import { SqliteRouteSessionRepository } from '../repositories/SqliteRouteSessionRepository.js';
import { SqliteUserRepository } from '../repositories/SqliteUserRepository.js';
import { GoogleRoutesOptimizer } from '../routing/GoogleRoutesOptimizer.js';
import { createAuthMiddleware } from './authMiddleware.js';
import { createExtractAddressController } from './extractAddressController.js';
import { createGetDriverRouteSessionController } from './getDriverRouteSessionController.js';
import { createGetRouteSessionController } from './getRouteSessionController.js';
import { createLoginController } from './loginController.js';
import { createOptimizeRouteController } from './optimizeRouteController.js';
import { requireAdminMiddleware } from './requireAdminMiddleware.js';
import { createSaveRouteSessionController } from './saveRouteSessionController.js';
import cors from 'cors';

export interface CreatedApp {
  app: express.Express;
  database: Client;
}

export async function createApp(): Promise<CreatedApp> {
  const database = await createDatabase(env.database);
  const userRepository = new SqliteUserRepository(database);
  const routeSessionRepository = new SqliteRouteSessionRepository(database);
  const tokenService = new JwtTokenService(env.jwtSecret);
  const authenticateUser = new AuthenticateUser(userRepository, tokenService);
  const saveRouteSession = new SaveRouteSession(routeSessionRepository);
  const getRouteSession = new GetRouteSession(routeSessionRepository);
  const getDriverRouteSession = new GetDriverRouteSession(userRepository, routeSessionRepository);

  const extractor = new GeminiVisionAddressExtractor(env.geminiApiKey, env.geminiModel);
  const extractAddressFromImage = new ExtractAddressFromImage(extractor);

  const routeOptimizer = new GoogleRoutesOptimizer(env.googleMapsApiKey);
  const optimizeRoute = new OptimizeRoute(routeOptimizer);

  const requireAuth = createAuthMiddleware(tokenService);

  const app = express();
  app.use(
  cors({
    origin(origin, callback) {
      // Además de localhost, se permite cualquier IP de red privada (192.168.x.x, 10.x.x.x,
      // 172.16-31.x.x) en el puerto de Vite — necesario para probar la PWA desde el celular en la
      // misma red durante desarrollo (cámara/geolocalización no siempre funcionan bien vía
      // localhost tunneleado). No aplica en producción: ninguna IP privada llega a Render/Vercel.
      const isLocalNetworkDevOrigin =
        !!origin && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):5173$/.test(
          origin,
        );

      if (!origin || isLocalNetworkDevOrigin || origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin no permitido: ${origin}`));
    },
    credentials: true,
  }),
);
  app.use(express.json({ limit: '10mb' }));

  app.post('/api/auth/login', createLoginController(authenticateUser));
  app.post('/api/addresses/extract', requireAuth, createExtractAddressController(extractAddressFromImage));
  app.post('/api/routes/optimize', requireAuth, createOptimizeRouteController(optimizeRoute));
  app.put('/api/route-session', requireAuth, createSaveRouteSessionController(saveRouteSession));
  app.get('/api/route-session', requireAuth, createGetRouteSessionController(getRouteSession));
  app.get(
    '/api/admin/drivers/:name/route-session',
    requireAuth,
    requireAdminMiddleware,
    createGetDriverRouteSessionController(getDriverRouteSession),
  );

  return { app, database };
}
