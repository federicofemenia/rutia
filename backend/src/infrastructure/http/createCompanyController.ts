import type { Request, Response } from 'express';
import type { CreateCompany } from '../../application/CreateCompany.js';
import { toCompanyResponse } from './companyResponse.js';

export function createCreateCompanyController(useCase: CreateCompany) {
  return async function createCompanyController(req: Request, res: Response) {
    const { name, legalName, taxId, contactEmail } = req.body as {
      name?: unknown;
      legalName?: unknown;
      taxId?: unknown;
      contactEmail?: unknown;
    };

    if (typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El campo "name" es requerido.' });
      return;
    }

    try {
      const result = await useCase.execute({
        name,
        legalName: typeof legalName === 'string' ? legalName : null,
        taxId: typeof taxId === 'string' ? taxId : null,
        contactEmail: typeof contactEmail === 'string' ? contactEmail : null,
      });

      res.status(201).json({ company: toCompanyResponse(result.company), registrationCode: result.registrationCode });
    } catch (error) {
      console.error('Error al crear la empresa', error);
      res.status(500).json({ error: 'No se pudo crear la empresa.' });
    }
  };
}
