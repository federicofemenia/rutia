import type { NavigationDestination, NavigationProvider } from './NavigationProvider';

export class GoogleMapsNavigationProvider implements NavigationProvider {
  readonly id = 'google-maps';
  readonly label = 'Google Maps';

  buildUrl(destination: NavigationDestination): string {
    const query = destination.coordinates
      ? `${destination.coordinates.latitude},${destination.coordinates.longitude}`
      : destination.address;

    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('destination', query);
    url.searchParams.set('travelmode', 'driving');
    return url.toString();
  }
}
