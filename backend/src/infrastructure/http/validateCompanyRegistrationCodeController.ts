import type { Request, Response } from 'express';
import type { ValidateCompanyRegistrationCode } from '../../application/ValidateCompanyRegistrationCode.js';

const GENERIC_ERROR = 'Código de registro inválido.';

export function createValidateCompanyRegistrationCodeController(useCase: ValidateCompanyRegistrationCode) {
  return async function validateCompanyRegistrationCodeController(req: Request, res: Response) {
    const { registrationCode } = req.body as { registrationCode?: unknown };

    if (typeof registrationCode !== 'string' || registrationCode.trim().length === 0) {
      res.status(400).json({ error: GENERIC_ERROR });
      return;
    }

    try {
      const result = await useCase.execute(registrationCode);

      if (!result) {
        res.status(404).json({ error: GENERIC_ERROR });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error al validar el código de registro', error);
      res.status(500).json({ error: 'No se pudo validar el código de registro.' });
    }
  };
}
