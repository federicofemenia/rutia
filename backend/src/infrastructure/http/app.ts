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
import { NominatimGeocoder } from '../geocoding/NominatimGeocoder.js';
import { SqliteRouteSessionRepository } from '../repositories/SqliteRouteSessionRepository.js';
import { SqliteUserRepository } from '../repositories/SqliteUserRepository.js';
import { OSRMRouteOptimizer } from '../routing/OSRMRouteOptimizer.js';
import { createAuthMiddleware } from './authMiddleware.js';
import { createExtractAddressController } from './extractAddressController.js';
import { createGetDriverRouteSessionController } from './getDriverRouteSessionController.js';
import { createGetRouteSessionController } from './getRouteSessionController.js';
import { createLoginController } from './loginController.js';
import { createOptimizeRouteController } from './optimizeRouteController.js';
import { requireAdminMiddleware } from './requireAdminMiddleware.js';
import { createSaveRouteSessionController } from './saveRouteSessionController.js';

export function createApp() {
  const database = createDatabase(env.databasePath);
  const userRepository = new SqliteUserRepository(database);
  const routeSessionRepository = new SqliteRouteSessionRepository(database);
  const tokenService = new JwtTokenService(env.jwtSecret);
  const authenticateUser = new AuthenticateUser(userRepository, tokenService);
  const saveRouteSession = new SaveRouteSession(routeSessionRepository);
  const getRouteSession = new GetRouteSession(routeSessionRepository);
  const getDriverRouteSession = new GetDriverRouteSession(userRepository, routeSessionRepository);

  const extractor = new GeminiVisionAddressExtractor(env.geminiApiKey, env.geminiModel);
  const extractAddressFromImage = new ExtractAddressFromImage(extractor);

  const geocoder = new NominatimGeocoder();
  const routeOptimizer = new OSRMRouteOptimizer();
  const optimizeRoute = new OptimizeRoute(geocoder, routeOptimizer);

  const requireAuth = createAuthMiddleware(tokenService);

  const app = express();
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

  return app;
}
