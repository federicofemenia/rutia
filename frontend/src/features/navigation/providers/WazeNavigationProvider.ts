import type { NavigationDestination, NavigationProvider } from './NavigationProvider';

export class WazeNavigationProvider implements NavigationProvider {
  readonly id = 'waze';
  readonly label = 'Waze';

  buildUrl(destination: NavigationDestination): string {
    const url = new URL('https://waze.com/ul');

    if (destination.coordinates) {
      url.searchParams.set('ll', `${destination.coordinates.latitude},${destination.coordinates.longitude}`);
    } else {
      url.searchParams.set('q', destination.address);
    }

    url.searchParams.set('navigate', 'yes');
    return url.toString();
  }
}
