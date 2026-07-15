import { createApp } from './infrastructure/http/app.js';
import { env } from './infrastructure/config/env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`RUTIA backend escuchando en http://localhost:${env.port}`);
});
