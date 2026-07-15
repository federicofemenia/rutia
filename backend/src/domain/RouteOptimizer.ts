import type { Coordinates } from './Coordinates.js';

export interface RouteStops {
  start: Coordinates;
  stops: Coordinates[];
  end: Coordinates;
}

export interface RouteOptimizer {
  optimize(input: RouteStops): Promise<number[]>;
}
