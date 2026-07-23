import logoDark from '../assets/logo-dark.svg';
import logoFull from '../assets/logo-full.svg';
import logoIcon from '../assets/logo-icon.svg';
import logoIconWhite from '../assets/logo-icon-white.svg';
import logoLight from '../assets/logo-light.svg';

export const BRAND = {
  name: 'RUTIA',
  tagline: 'Inteligencia para repartir',
  version: '0.2.0',
  assets: {
    full: logoFull,
    light: logoLight,
    dark: logoDark,
    icon: logoIcon,
    iconWhite: logoIconWhite,
  },
} as const;
