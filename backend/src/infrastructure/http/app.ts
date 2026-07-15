import express from 'express';
import { ExtractAddressFromImage } from '../../application/ExtractAddressFromImage.js';
import { OptimizeRoute } from '../../application/OptimizeRoute.js';
import { env } from '../config/env.js';
import { GeminiVisionAddressExtractor } from '../ai/GeminiVisionAddressExtractor.js';
import { NominatimGeocoder } from '../geocoding/NominatimGeocoder.js';
import { OSRMRouteOptimizer } from '../routing/OSRMRouteOptimizer.js';
import { createExtractAddressController } from './extractAddressController.js';
import { createOptimizeRouteController } from './optimizeRouteController.js';

export function createApp() {
  const extractor = new GeminiVisionAddressExtractor(env.geminiApiKey, env.geminiModel);
  const extractAddressFromImage = new ExtractAddressFromImage(extractor);

  const geocoder = new NominatimGeocoder();
  const routeOptimizer = new OSRMRouteOptimizer();
  const optimizeRoute = new OptimizeRoute(geocoder, routeOptimizer);

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.post('/api/addresses/extract', createExtractAddressController(extractAddressFromImage));
  app.post('/api/routes/optimize', createOptimizeRouteController(optimizeRoute));

  return app;
}
