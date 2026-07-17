import type { Request, Response } from 'express';
import type { AuthenticateUser } from '../../application/AuthenticateUser.js';

export function createLoginController(useCase: AuthenticateUser) {
  return async function loginController(req: Request, res: Response) {
    const { name, password } = req.body as { name?: unknown; password?: unknown };

    if (typeof name !== 'string' || name.trim().length === 0 || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Los campos "name" y "password" son requeridos.' });
      return;
    }

    try {
      const result = await useCase.execute({ name, password });

      if (!result) {
        res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        return;
      }

      res.status(200).json({
        token: result.token,
        user: { id: result.user.id, name: result.user.name, role: result.user.role },
      });
    } catch (error) {
      console.error('Error al autenticar', error);
      res.status(500).json({ error: 'No se pudo iniciar sesión.' });
    }
  };
}
