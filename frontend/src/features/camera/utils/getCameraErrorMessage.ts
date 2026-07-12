export function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Permiso de cámara denegado. Habilitalo desde la configuración del navegador.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No se encontró ninguna cámara disponible en este dispositivo.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'No se pudo acceder a la cámara. Puede estar siendo utilizada por otra aplicación.';
      default:
        return 'Ocurrió un error inesperado al intentar acceder a la cámara.';
    }
  }

  return 'Ocurrió un error inesperado al intentar acceder a la cámara.';
}
