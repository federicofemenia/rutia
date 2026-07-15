import express from 'express';
import { ExtractAddressFromImage } from '../../application/ExtractAddressFromImage.js';
import { env } from '../config/env.js';
import { GeminiVisionAddressExtractor } from '../ai/GeminiVisionAddressExtractor.js';
import { createExtractAddressController } from './extractAddressController.js';

export function createApp() {
  const extractor = new GeminiVisionAddressExtractor(env.geminiApiKey, env.geminiModel);
  const extractAddressFromImage = new ExtractAddressFromImage(extractor);

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.post('/api/addresses/extract', createExtractAddressController(extractAddressFromImage));

  return app;
}
