/**
 * Formatea metros/segundos que ya vienen calculados por OSRM — no recalcula ninguna distancia ni
 * tiempo, solo elige cómo mostrar el número.
 */

/** < 1km en metros redondeados ("350 m"), >= 1km en km con un decimal ("2.7 km"). */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

/** < 1h en minutos ("8 min"), >= 1h en horas y minutos ("1 h 15 min"). */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}
