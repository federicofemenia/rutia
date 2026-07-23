import type { Coordinates } from './Coordinates.js';

export interface RouteStops {
  start: Coordinates;
  stops: Coordinates[];
  end: Coordinates;
}

export interface RouteLeg {
  /** Metros. */
  distance: number;
  /** Segundos. */
  duration: number;
  /** Índice en `stops`, o `null` cuando el origen del tramo es el punto de partida. */
  fromStopIndex: number | null;
  /** Índice en `stops`, o `null` cuando el destino del tramo es el punto de llegada final. */
  toStopIndex: number | null;
}

export interface RouteOptimizationResult {
  /** Orden óptimo de `stops`, por índice — mismo significado que antes. */
  order: number[];
  /** Metros, recorrido completo (partida -> todas las paradas en orden -> destino final). */
  totalDistance: number;
  /** Segundos, recorrido completo. */
  totalDuration: number;
  /** Un tramo por cada segmento consecutivo del recorrido, en orden de visita. */
  legs: RouteLeg[];
}

export interface RouteOptimizer {
  optimize(input: RouteStops): Promise<RouteOptimizationResult>;
}
