import { divIcon, type DivIcon } from 'leaflet';

const MARKER_SIZE = 18;

export function createCurrentLocationIcon(color: string): DivIcon {
  return divIcon({
    html: `<span class="current-location-icon__dot" style="background-color:${color}"></span>`,
    className: 'current-location-icon',
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
  });
}
