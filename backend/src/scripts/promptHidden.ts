import { createInterface } from 'node:readline';

/** Pide un valor por stdin sin hacer eco de lo tipeado (para contraseñas) — nunca se imprime. */
export function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    // @ts-expect-error -- `_writeToOutput` no está en los tipos públicos de readline, pero es el
    // hook estándar para suprimir el eco de la terminal mientras el prompt sigue activo.
    rl._writeToOutput = (text: string) => {
      if (text.startsWith(question)) {
        process.stdout.write(question);
      }
    };

    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}
