import type { Request, Response } from 'express';
import type { UpdateCompanyRegistration } from '../../application/UpdateCompanyRegistration.js';
import { toCompanyResponse } from './companyResponse.js';

export function createUpdateCompanyRegistrationController(useCase: UpdateCompanyRegistration) {
  return async function updateCompanyRegistrationController(req: Request, res: Response) {
    const { companyId } = req.params;
    const { registrationEnabled } = req.body as { registrationEnabled?: unknown };

    if (typeof companyId !== 'string' || companyId.length === 0) {
      res.status(400).json({ error: 'Falta el id de la empresa.' });
      return;
    }
    if (typeof registrationEnabled !== 'boolean') {
      res.status(400).json({ error: 'El campo "registrationEnabled" debe ser booleano.' });
      return;
    }

    try {
      const company = await useCase.execute(companyId, registrationEnabled);

      if (!company) {
        res.status(404).json({ error: 'No se encontró la empresa.' });
        return;
      }

      res.status(200).json({ company: toCompanyResponse(company) });
    } catch (error) {
      console.error('Error al actualizar el registro de la empresa', error);
      res.status(500).json({ error: 'No se pudo actualizar el registro de la empresa.' });
    }
  };
}
