import { Alert, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map,
  Polyline,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import { useMemo, useState } from 'react';
import {
  DELIVERY_STATUS_CONFIG,
  DeliveryStatus,
  FAILURE_REASON_LABELS,
  formatLocalityLine,
  formatStreetLine,
  type Coordinates,
  type Delivery,
  type RouteSummaryInfo,
} from '../../route';
import { MAP_CONFIG } from '../config/mapConfig';
import { hasCoordinates } from '../utils/hasCoordinates';
import { MapBoundsController } from './MapBoundsController';

interface DeliveryMapProps {
  deliveries: Delivery[];
  currentLocation?: Coordinates;
  /** Geometría real del recorrido (`encodedPolyline`), si ya se optimizó — nunca se recalcula acá. */
  routeSummary?: RouteSummaryInfo | null;
  onSelectDelivery?: (delivery: Delivery) => void;
}

type StatusPaletteKey = 'warning' | 'info' | 'success' | 'error';

interface DeliveryMarkerProps {
  delivery: Delivery & { coordinates: Coordinates };
  order: number;
  color: string;
  statusLabel: string;
  isSelected: boolean;
  onSelect: (delivery: Delivery) => void;
  onClose: () => void;
}

function DeliveryMarker({ delivery, order, color, statusLabel, isSelected, onSelect, onClose }: DeliveryMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: delivery.coordinates.latitude, lng: delivery.coordinates.longitude }}
        onClick={() => onSelect(delivery)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid #ffffff',
            boxShadow: '0 1px 4px rgba(15, 23, 42, 0.35)',
            backgroundColor: color,
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {order}
        </div>
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={onClose}>
          <Typography variant="subtitle2">Parada {order}</Typography>
          <Typography variant="body2">{formatStreetLine(delivery.address) || '(sin dirección)'}</Typography>
          {formatLocalityLine(delivery.address) && (
            <Typography variant="caption" color="text.secondary">
              {formatLocalityLine(delivery.address)}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {statusLabel}
          </Typography>
          {delivery.status === DeliveryStatus.Failed && delivery.failureReasonCode && (
            <Typography variant="caption" color="error" sx={{ display: 'block' }}>
              {FAILURE_REASON_LABELS[delivery.failureReasonCode]}
              {delivery.failureReasonDetail ? `: ${delivery.failureReasonDetail}` : ''}
            </Typography>
          )}
        </InfoWindow>
      )}
    </>
  );
}

export function DeliveryMap({ deliveries, currentLocation, routeSummary, onSelectDelivery }: DeliveryMapProps) {
  const theme = useTheme();
  const loadingStatus = useApiLoadingStatus();
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

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

  const positions = useMemo(() => markers.map(({ delivery }) => delivery.coordinates), [markers]);

  const handleSelect = (delivery: Delivery) => {
    setSelectedDeliveryId(delivery.id);
    onSelectDelivery?.(delivery);
  };

  return (
    <>
      {(loadingStatus === APILoadingStatus.FAILED || loadingStatus === APILoadingStatus.AUTH_FAILURE) && (
        <Alert severity="error" sx={{ flexShrink: 0 }}>
          No se pudo cargar el mapa. Probá de nuevo más tarde.
        </Alert>
      )}

      <Map
        mapId={MAP_CONFIG.mapId}
        defaultCenter={{ lat: MAP_CONFIG.defaultCenter.latitude, lng: MAP_CONFIG.defaultCenter.longitude }}
        defaultZoom={MAP_CONFIG.defaultZoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        style={{ flex: 1, width: '100%', height: '55dvh', minHeight: '55dvh' }}
      >
        <MapBoundsController positions={positions} />

        {routeSummary?.encodedPolyline && (
          <Polyline
            encodedPath={routeSummary.encodedPolyline}
            strokeColor={theme.palette.primary.main}
            strokeOpacity={0.7}
            strokeWeight={3}
          />
        )}

        {markers.map(({ delivery, order }) => {
          const config = DELIVERY_STATUS_CONFIG[delivery.status];
          const color = theme.palette[config.color as StatusPaletteKey].main;

          return (
            <DeliveryMarker
              key={delivery.id}
              delivery={delivery}
              order={order}
              color={color}
              statusLabel={config.label}
              isSelected={selectedDeliveryId === delivery.id}
              onSelect={handleSelect}
              onClose={() => setSelectedDeliveryId(null)}
            />
          );
        })}

        {currentLocation && (
          <AdvancedMarker position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '3px solid #ffffff',
                boxShadow: `0 0 0 4px ${theme.palette.primary.main}40, 0 1px 4px rgba(15, 23, 42, 0.35)`,
                backgroundColor: theme.palette.primary.main,
              }}
            />
          </AdvancedMarker>
        )}
      </Map>
    </>
  );
}
