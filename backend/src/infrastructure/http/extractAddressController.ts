import type { Request, Response } from 'express';
import type { ExtractAddressFromImage } from '../../application/ExtractAddressFromImage.js';

export function createExtractAddressController(useCase: ExtractAddressFromImage) {
  return async function extractAddressController(req: Request, res: Response) {
    const { image } = req.body as { image?: unknown };

    if (typeof image !== 'string' || image.length === 0) {
      res.status(400).json({ error: 'El campo "image" es requerido.' });
      return;
    }

    try {
      const result = await useCase.execute(image);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error al extraer la dirección', error);
      res.status(502).json({ error: 'No se pudo extraer la dirección de la imagen.' });
    }
  };
}
