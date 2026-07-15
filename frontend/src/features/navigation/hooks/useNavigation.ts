import { GoogleMapsNavigationProvider } from '../providers/GoogleMapsNavigationProvider';
import type { NavigationDestination, NavigationProvider } from '../providers/NavigationProvider';
import { WazeNavigationProvider } from '../providers/WazeNavigationProvider';
import { NavigationService } from '../services/NavigationService';

const navigationService = new NavigationService([new GoogleMapsNavigationProvider(), new WazeNavigationProvider()]);

interface UseNavigationResult {
  providers: NavigationProvider[];
  openNavigation: (providerId: string, destination: NavigationDestination) => void;
}

export function useNavigation(): UseNavigationResult {
  return {
    providers: navigationService.getProviders(),
    openNavigation: (providerId, destination) => navigationService.openNavigation(providerId, destination),
  };
}
