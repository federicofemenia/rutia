import type { Request, Response } from 'express';
import type { CreateCompanyAdmin, CreateCompanyAdminFailureReason } from '../../application/CreateCompanyAdmin.js';

const FAILURE_RESPONSES: Record<CreateCompanyAdminFailureReason, { status: number; error: string }> = {
  'company-not-found': { status: 404, error: 'No se encontró la empresa.' },
  'weak-password': { status: 400, error: 'La contraseña es demasiado corta.' },
  'username-taken': { status: 409, error: 'Ese nombre de usuario ya está en uso.' },
};

export function createCreateCompanyAdminController(useCase: CreateCompanyAdmin) {
  return async function createCompanyAdminController(req: Request, res: Response) {
    const { companyId } = req.params;
    const { username, password } = req.body as { username?: unknown; password?: unknown };

    if (typeof companyId !== 'string' || companyId.length === 0) {
      res.status(400).json({ error: 'Falta el id de la empresa.' });
      return;
    }
    if (typeof username !== 'string' || username.trim().length === 0 || typeof password !== 'string') {
      res.status(400).json({ error: 'Faltan campos requeridos.' });
      return;
    }

    try {
      const result = await useCase.execute({ companyId, username, password });

      if (!result.success) {
        const { status, error } = FAILURE_RESPONSES[result.reason];
        res.status(status).json({ error });
        return;
      }

      res.status(201).json({
        user: { id: result.user.id, name: result.user.name, role: result.user.role, companyId: result.user.companyId },
      });
    } catch (error) {
      console.error('Error al crear el admin de la empresa', error);
      res.status(500).json({ error: 'No se pudo crear el admin de la empresa.' });
    }
  };
}
