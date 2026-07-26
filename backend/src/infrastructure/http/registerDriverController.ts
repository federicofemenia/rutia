import type { Request, Response } from 'express';
import type { RegisterDriver, RegisterDriverFailureReason } from '../../application/RegisterDriver.js';

const FAILURE_RESPONSES: Record<RegisterDriverFailureReason, { status: number; error: string }> = {
  'invalid-registration-token': { status: 401, error: 'El registro expiró o el enlace no es válido. Volvé a empezar.' },
  'company-unavailable': { status: 401, error: 'El registro expiró o el enlace no es válido. Volvé a empezar.' },
  'password-mismatch': { status: 400, error: 'Las contraseñas no coinciden.' },
  'weak-password': { status: 400, error: 'La contraseña es demasiado corta.' },
  'username-taken': { status: 409, error: 'Ese nombre de usuario ya está en uso.' },
};

export function createRegisterDriverController(useCase: RegisterDriver) {
  return async function registerDriverController(req: Request, res: Response) {
    // Se leen únicamente estos 4 campos — nada más del body puede llegar al caso de uso, así que
    // no hay forma de que el cliente cuele `role`/`companyId`/`active`/`passwordHash`.
    const { username, password, passwordConfirmation, registrationToken } = req.body as {
      username?: unknown;
      password?: unknown;
      passwordConfirmation?: unknown;
      registrationToken?: unknown;
    };

    if (
      typeof username !== 'string' ||
      username.trim().length === 0 ||
      typeof password !== 'string' ||
      typeof passwordConfirmation !== 'string' ||
      typeof registrationToken !== 'string' ||
      registrationToken.length === 0
    ) {
      res.status(400).json({ error: 'Faltan campos requeridos.' });
      return;
    }

    try {
      const result = await useCase.execute({ username, password, passwordConfirmation, registrationToken });

      if (!result.success) {
        const { status, error } = FAILURE_RESPONSES[result.reason];
        res.status(status).json({ error });
        return;
      }

      res.status(201).json({
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          role: result.user.role,
          companyId: result.user.companyId,
          companyName: result.companyName,
        },
      });
    } catch (error) {
      console.error('Error al registrar el chofer', error);
      res.status(500).json({ error: 'No se pudo completar el registro.' });
    }
  };
}
