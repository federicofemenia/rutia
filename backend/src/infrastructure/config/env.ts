function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export const env = {
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
  port: Number(process.env.PORT ?? 3000),
  databasePath: process.env.DATABASE_PATH ?? './data/rutia.sqlite',
  jwtSecret: requireEnv('JWT_SECRET'),
};
