import { divIcon, type DivIcon } from 'leaflet';

const MARKER_SIZE = 28;

export function createDeliveryMarkerIcon(order: number, color: string): DivIcon {
  return divIcon({
    html: `<span class="delivery-marker-icon__badge" style="background-color:${color}">${order}</span>`,
    className: 'delivery-marker-icon',
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2],
  });
}
