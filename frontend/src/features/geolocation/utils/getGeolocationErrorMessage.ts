export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case GeolocationPositionError.PERMISSION_DENIED:
      return 'Permiso de ubicación denegado. Habilitalo desde la configuración del navegador.';
    case GeolocationPositionError.POSITION_UNAVAILABLE:
      return 'No se pudo determinar tu ubicación actual.';
    case GeolocationPositionError.TIMEOUT:
      return 'Se agotó el tiempo de espera para obtener tu ubicación. Probá de nuevo.';
    default:
      return 'Ocurrió un error inesperado al obtener tu ubicación.';
  }
}
