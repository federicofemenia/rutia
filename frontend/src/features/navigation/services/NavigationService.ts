import type { NavigationDestination, NavigationProvider } from '../providers/NavigationProvider';

export class NavigationService {
  private readonly providers: NavigationProvider[];

  constructor(providers: NavigationProvider[]) {
    this.providers = providers;
  }

  getProviders(): NavigationProvider[] {
    return this.providers;
  }

  openNavigation(providerId: string, destination: NavigationDestination): void {
    const provider = this.providers.find((candidate) => candidate.id === providerId);

    if (!provider) {
      throw new Error(`Proveedor de navegación desconocido: ${providerId}`);
    }

    const link = document.createElement('a');
    link.href = provider.buildUrl(destination);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
