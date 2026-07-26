import type { Request, Response } from 'express';
import type { UpdateCompanyStatus } from '../../application/UpdateCompanyStatus.js';
import { toCompanyResponse } from './companyResponse.js';

export function createUpdateCompanyStatusController(useCase: UpdateCompanyStatus) {
  return async function updateCompanyStatusController(req: Request, res: Response) {
    const { companyId } = req.params;
    const { active } = req.body as { active?: unknown };

    if (typeof companyId !== 'string' || companyId.length === 0) {
      res.status(400).json({ error: 'Falta el id de la empresa.' });
      return;
    }
    if (typeof active !== 'boolean') {
      res.status(400).json({ error: 'El campo "active" debe ser booleano.' });
      return;
    }

    try {
      const company = await useCase.execute(companyId, active);

      if (!company) {
        res.status(404).json({ error: 'No se encontró la empresa.' });
        return;
      }

      res.status(200).json({ company: toCompanyResponse(company) });
    } catch (error) {
      console.error('Error al actualizar el estado de la empresa', error);
      res.status(500).json({ error: 'No se pudo actualizar el estado de la empresa.' });
    }
  };
}
