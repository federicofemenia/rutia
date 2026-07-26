import type { Request, Response } from 'express';
import type { GetCompanyDrivers } from '../../application/GetCompanyDrivers.js';

export function createGetCompanyDriversController(useCase: GetCompanyDrivers) {
  return async function getCompanyDriversController(req: Request, res: Response) {
    // El companyId sale siempre del token verificado (`req.auth`), nunca de query/params/body —
    // así un COMPANY_ADMIN solo puede ver los choferes de su propia empresa.
    const companyId = req.auth?.companyId;

    if (!companyId) {
      res.status(403).json({ error: 'No tenés una empresa asociada.' });
      return;
    }

    try {
      const overview = await useCase.execute(companyId);
      res.status(200).json({
        drivers: overview.map(({ driver, hasActiveRoute }) => ({
          id: driver.id,
          name: driver.name,
          active: driver.active,
          hasActiveRoute,
        })),
      });
    } catch (error) {
      console.error('Error al listar los choferes de la empresa', error);
      res.status(500).json({ error: 'No se pudo obtener la lista de choferes.' });
    }
  };
}
