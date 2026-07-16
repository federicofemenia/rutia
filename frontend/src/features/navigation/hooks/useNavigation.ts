import { useCallback, useMemo } from 'react';
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
  const providers = useMemo(() => navigationService.getProviders(), []);
  const openNavigation = useCallback(
    (providerId: string, destination: NavigationDestination) => navigationService.openNavigation(providerId, destination),
    [],
  );

  return { providers, openNavigation };
}
