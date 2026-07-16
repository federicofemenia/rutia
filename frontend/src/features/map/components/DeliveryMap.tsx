import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { DELIVERY_STATUS_CONFIG, type Coordinates, type Delivery } from '../../route';
import { MAP_CONFIG } from '../config/mapConfig';
import { createCurrentLocationIcon } from '../utils/createCurrentLocationIcon';
import { createDeliveryMarkerIcon } from '../utils/createDeliveryMarkerIcon';
import { hasCoordinates } from '../utils/hasCoordinates';
import './currentLocationIcon.css';
import './deliveryMarkerIcon.css';
import { MapBoundsController } from './MapBoundsController';

interface DeliveryMapProps {
  deliveries: Delivery[];
  currentLocation?: Coordinates;
  onSelectDelivery?: (delivery: Delivery) => void;
}

type StatusPaletteKey = 'warning' | 'info' | 'success' | 'error';

export function DeliveryMap({ deliveries, currentLocation, onSelectDelivery }: DeliveryMapProps) {
  const theme = useTheme();
  const center: [number, number] = [MAP_CONFIG.defaultCenter.latitude, MAP_CONFIG.defaultCenter.longitude];

  const markers = useMemo(
    () =>
      deliveries.flatMap((delivery, index) => {
        if (!hasCoordinates(delivery)) {
          return [];
        }
        return [{ delivery, order: index + 1 }];
      }),
    [deliveries],
  );

  const routePositions = useMemo<[number, number][]>(
    () => markers.map(({ delivery }) => [delivery.coordinates.latitude, delivery.coordinates.longitude]),
    [markers],
  );

  return (
    <MapContainer center={center} zoom={MAP_CONFIG.defaultZoom} style={{ flex: 1, width: '100%', minHeight: 0 }}>
      <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.attribution} maxZoom={MAP_CONFIG.maxZoom} />

      <MapBoundsController positions={routePositions} />

      {routePositions.length >= 2 && (
        <Polyline
          positions={routePositions}
          pathOptions={{ color: theme.palette.primary.main, weight: 3, opacity: 0.7, dashArray: '6 10' }}
        />
      )}

      {markers.map(({ delivery, order }) => {
        const config = DELIVERY_STATUS_CONFIG[delivery.status];
        const color = theme.palette[config.color as StatusPaletteKey].main;
        const position: [number, number] = [delivery.coordinates.latitude, delivery.coordinates.longitude];

        return (
          <Marker
            key={delivery.id}
            position={position}
            icon={createDeliveryMarkerIcon(order, color)}
            eventHandlers={{ click: () => onSelectDelivery?.(delivery) }}
          >
            <Popup>
              <Typography variant="subtitle2">Parada {order}</Typography>
              <Typography variant="body2">{delivery.address || '(sin dirección)'}</Typography>
              {delivery.postalCode && (
                <Typography variant="caption" color="text.secondary">
                  CP {delivery.postalCode}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {config.label}
              </Typography>
            </Popup>
          </Marker>
        );
      })}

      {currentLocation && (
        <Marker
          position={[currentLocation.latitude, currentLocation.longitude]}
          icon={createCurrentLocationIcon(theme.palette.primary.main)}
        />
      )}
    </MapContainer>
  );
}
