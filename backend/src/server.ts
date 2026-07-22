import { createApp } from './infrastructure/http/app.js';
import { env } from './infrastructure/config/env.js';

const { app, database } = await createApp();

const server = app.listen(env.port, () => {
  console.log(`RUTIA backend escuchando en http://localhost:${env.port}`);
});

function shutdown(signal: string): void {
  console.log(`Recibida ${signal}, cerrando el servidor...`);

  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
