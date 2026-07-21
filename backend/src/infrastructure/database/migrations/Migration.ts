/**
 * Cada migración es una lista ordenada de sentencias independientes — nunca un único string con
 * varias sentencias separadas por `;`, para no depender de parsear SQL a mano (comentarios,
 * strings con `;` adentro, etc. lo pueden romper).
 */
export interface Migration {
  id: string;
  statements: string[];
}
