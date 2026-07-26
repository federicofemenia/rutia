import type { Request, Response } from 'express';
import type { RegenerateRegistrationCode } from '../../application/RegenerateRegistrationCode.js';
import { toCompanyResponse } from './companyResponse.js';

export function createRegenerateRegistrationCodeController(useCase: RegenerateRegistrationCode) {
  return async function regenerateRegistrationCodeController(req: Request, res: Response) {
    const { companyId } = req.params;

    if (typeof companyId !== 'string' || companyId.length === 0) {
      res.status(400).json({ error: 'Falta el id de la empresa.' });
      return;
    }

    try {
      const result = await useCase.execute(companyId);

      if (!result) {
        res.status(404).json({ error: 'No se encontró la empresa.' });
        return;
      }

      res.status(200).json({ company: toCompanyResponse(result.company), registrationCode: result.registrationCode });
    } catch (error) {
      console.error('Error al regenerar el código de registro', error);
      res.status(500).json({ error: 'No se pudo regenerar el código de registro.' });
    }
  };
}
