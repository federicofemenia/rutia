import type { Coordinates } from '../../route';

export interface NavigationDestination {
  address: string;
  coordinates?: Coordinates;
}

export interface NavigationProvider {
  readonly id: string;
  readonly label: string;
  buildUrl(destination: NavigationDestination): string;
}
