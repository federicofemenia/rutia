import type { Client } from '@libsql/client';
import express from 'express';
import { AuthenticateUser } from '../../application/AuthenticateUser.js';
import { CreateCompany } from '../../application/CreateCompany.js';
import { CreateCompanyAdmin } from '../../application/CreateCompanyAdmin.js';
import { ExtractAddressFromImage } from '../../application/ExtractAddressFromImage.js';
import { FinishRouteSession } from '../../application/FinishRouteSession.js';
import { GetCompanyDrivers } from '../../application/GetCompanyDrivers.js';
import { GetDriverRouteSession } from '../../application/GetDriverRouteSession.js';
import { GetRouteSession } from '../../application/GetRouteSession.js';
import { OptimizeRoute } from '../../application/OptimizeRoute.js';
import { RegenerateRegistrationCode } from '../../application/RegenerateRegistrationCode.js';
import { RegisterDriver } from '../../application/RegisterDriver.js';
import { SaveRouteSession } from '../../application/SaveRouteSession.js';
import { UpdateCompanyRegistration } from '../../application/UpdateCompanyRegistration.js';
import { UpdateCompanyStatus } from '../../application/UpdateCompanyStatus.js';
import { ValidateCompanyRegistrationCode } from '../../application/ValidateCompanyRegistrationCode.js';
import { GeminiVisionAddressExtractor } from '../ai/GeminiVisionAddressExtractor.js';
import { JwtTokenService } from '../auth/JwtTokenService.js';
import { env } from '../config/env.js';
import { createDatabase } from '../database/createDatabase.js';
import { SqliteCompanyRepository } from '../repositories/SqliteCompanyRepository.js';
import { SqliteRouteSessionRepository } from '../repositories/SqliteRouteSessionRepository.js';
import { SqliteUserRepository } from '../repositories/SqliteUserRepository.js';
import { GoogleRoutesOptimizer } from '../routing/GoogleRoutesOptimizer.js';
import { UserRole } from '../../domain/UserRole.js';
import { createAuthMiddleware } from './authMiddleware.js';
import { createCreateCompanyAdminController } from './createCompanyAdminController.js';
import { createCreateCompanyController } from './createCompanyController.js';
import { createExtractAddressController } from './extractAddressController.js';
import { createFinishRouteSessionController } from './finishRouteSessionController.js';
import { createGetCompanyDriversController } from './getCompanyDriversController.js';
import { createGetDriverRouteSessionController } from './getDriverRouteSessionController.js';
import { createGetRouteSessionController } from './getRouteSessionController.js';
import { createLoginController } from './loginController.js';
import { createOptimizeRouteController } from './optimizeRouteController.js';
import { registerDriverRateLimiter, validateRegistrationCodeRateLimiter } from './rateLimiters.js';
import { createRegenerateRegistrationCodeController } from './regenerateRegistrationCodeController.js';
import { createRegisterDriverController } from './registerDriverController.js';
import { requireRole } from './requireRoleMiddleware.js';
import { createSaveRouteSessionController } from './saveRouteSessionController.js';
import { createUpdateCompanyRegistrationController } from './updateCompanyRegistrationController.js';
import { createUpdateCompanyStatusController } from './updateCompanyStatusController.js';
import { createValidateCompanyRegistrationCodeController } from './validateCompanyRegistrationCodeController.js';
import cors from 'cors';

export interface CreatedApp {
  app: express.Express;
  database: Client;
}

export async function createApp(): Promise<CreatedApp> {
  const database = await createDatabase(env.database);
  const userRepository = new SqliteUserRepository(database);
  const companyRepository = new SqliteCompanyRepository(database);
  const routeSessionRepository = new SqliteRouteSessionRepository(database);
  const tokenService = new JwtTokenService(env.jwtSecret);
  const authenticateUser = new AuthenticateUser(userRepository, companyRepository, tokenService);
  const saveRouteSession = new SaveRouteSession(routeSessionRepository);
  const getRouteSession = new GetRouteSession(routeSessionRepository);
  const finishRouteSession = new FinishRouteSession(routeSessionRepository);
  const getDriverRouteSession = new GetDriverRouteSession(userRepository, routeSessionRepository);
  const getCompanyDrivers = new GetCompanyDrivers(userRepository, routeSessionRepository);
  const validateCompanyRegistrationCode = new ValidateCompanyRegistrationCode(
    companyRepository,
    tokenService,
    env.jwtSecret,
  );
  const registerDriver = new RegisterDriver(userRepository, companyRepository, tokenService);
  const createCompany = new CreateCompany(companyRepository, env.jwtSecret);
  const createCompanyAdmin = new CreateCompanyAdmin(userRepository, companyRepository);
  const regenerateRegistrationCode = new RegenerateRegistrationCode(companyRepository, env.jwtSecret);
  const updateCompanyRegistration = new UpdateCompanyRegistration(companyRepository);
  const updateCompanyStatus = new UpdateCompanyStatus(companyRepository);

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
  app.post(
    '/api/auth/company-registration/validate',
    validateRegistrationCodeRateLimiter,
    createValidateCompanyRegistrationCodeController(validateCompanyRegistrationCode),
  );
  app.post('/api/auth/register-driver', registerDriverRateLimiter, createRegisterDriverController(registerDriver));
  app.post('/api/addresses/extract', requireAuth, createExtractAddressController(extractAddressFromImage));
  app.post('/api/routes/optimize', requireAuth, createOptimizeRouteController(optimizeRoute));
  app.put('/api/route-session', requireAuth, createSaveRouteSessionController(saveRouteSession));
  app.get('/api/route-session', requireAuth, createGetRouteSessionController(getRouteSession));
  app.post('/api/route-session/finish', requireAuth, createFinishRouteSessionController(finishRouteSession));
  app.get(
    '/api/admin/drivers/:driverId/route-session',
    requireAuth,
    requireRole(UserRole.SuperAdmin, UserRole.CompanyAdmin),
    createGetDriverRouteSessionController(getDriverRouteSession),
  );

  app.get(
    '/api/company/drivers',
    requireAuth,
    requireRole(UserRole.CompanyAdmin),
    createGetCompanyDriversController(getCompanyDrivers),
  );

  app.post(
    '/api/admin/companies',
    requireAuth,
    requireRole(UserRole.SuperAdmin),
    createCreateCompanyController(createCompany),
  );
  app.post(
    '/api/admin/companies/:companyId/admins',
    requireAuth,
    requireRole(UserRole.SuperAdmin),
    createCreateCompanyAdminController(createCompanyAdmin),
  );
  app.post(
    '/api/admin/companies/:companyId/registration-code/regenerate',
    requireAuth,
    requireRole(UserRole.SuperAdmin),
    createRegenerateRegistrationCodeController(regenerateRegistrationCode),
  );
  app.patch(
    '/api/admin/companies/:companyId/registration',
    requireAuth,
    requireRole(UserRole.SuperAdmin),
    createUpdateCompanyRegistrationController(updateCompanyRegistration),
  );
  app.patch(
    '/api/admin/companies/:companyId/status',
    requireAuth,
    requireRole(UserRole.SuperAdmin),
    createUpdateCompanyStatusController(updateCompanyStatus),
  );

  return { app, database };
}
