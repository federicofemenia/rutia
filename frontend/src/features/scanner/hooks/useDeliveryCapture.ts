import { useCallback, useEffect, useRef, useState } from 'react';
import { type CameraStatus, useCamera } from '../../camera';
import { useExtractAddress } from '../../address-extraction';
import { type PlaceSelection, usePlacesAutocomplete } from '../../places';
import { useRoute } from '../../route';
import { type DeliveryDraft, ScannerPhase } from '../types';

interface UseDeliveryCaptureResult {
  phase: ScannerPhase;
  videoRef: ReturnType<typeof useCamera>['videoRef'];
  cameraStatus: CameraStatus;
  cameraErrorMessage: string | null;
  requestCameraAccess: () => Promise<void>;
  errorMessage: string | null;
  draft: DeliveryDraft | null;
  captureAndExtract: () => Promise<void>;
  retry: () => Promise<void>;
  confirmDelivery: (selection: PlaceSelection) => void;
  /** Descarta el draft en revisión (dirección mal leída/ambigua) y vuelve a la cámara sin cargar nada. */
  cancelReview: () => void;
}

export function useDeliveryCapture(): UseDeliveryCaptureResult {
  const {
    videoRef,
    status: cameraStatus,
    errorMessage: cameraErrorMessage,
    requestAccess,
    capturePhoto,
  } = useCamera();
  const { extract } = useExtractAddress();
  const { search, selectSuggestion } = usePlacesAutocomplete();
  const { addDelivery } = useRoute();

  const [phase, setPhase] = useState<ScannerPhase>(ScannerPhase.Capturing);
  const [draft, setDraft] = useState<DeliveryDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const capturedPhotoRef = useRef<string | null>(null);

  useEffect(() => {
    if (cameraStatus === 'idle') {
      requestAccess();
    }
  }, [cameraStatus, requestAccess]);

  const addDeliveryFromSelection = useCallback(
    (selection: PlaceSelection) => {
      addDelivery({ address: selection.address, coordinates: selection.coordinates });
      setDraft(null);
      setErrorMessage(null);
      capturedPhotoRef.current = null;
      setPhase(ScannerPhase.Capturing);
    },
    [addDelivery],
  );

  const runExtraction = useCallback(
    async (photo: string) => {
      setPhase(ScannerPhase.Extracting);
      setErrorMessage(null);

      const result = await extract(photo);

      if (!result) {
        setErrorMessage('No se pudo extraer la dirección. Probá de nuevo.');
        setPhase(ScannerPhase.Error);
        return;
      }

      // Auto-confirmación: si Gemini está seguro de lo que leyó Y Places encuentra una única
      // coincidencia sin ambigüedad para esa búsqueda, se agrega la entrega directo — sin pasarle
      // la revisión manual al chofer. Si Gemini no está seguro, o Places no encuentra nada, o
      // encuentra varias posibles, se cae al flujo normal (mostrar el picker de Places).
      if (!result.needsUserConfirmation && result.query.trim()) {
        const suggestions = await search(result.query);

        if (suggestions.length === 1) {
          const selection = await selectSuggestion(suggestions[0]);

          if (selection) {
            addDeliveryFromSelection(selection);
            return;
          }
        }
      }

      setDraft(result);
      setPhase(ScannerPhase.Reviewing);
    },
    [extract, search, selectSuggestion, addDeliveryFromSelection],
  );

  const captureAndExtract = useCallback(async () => {
    const photo = capturePhoto();

    if (!photo) {
      setErrorMessage('No se pudo capturar la foto. Esperá a que la cámara termine de cargar e intentá de nuevo.');
      setPhase(ScannerPhase.Error);
      return;
    }

    capturedPhotoRef.current = photo;
    await runExtraction(photo);
  }, [capturePhoto, runExtraction]);

  const retry = useCallback(async () => {
    const photo = capturedPhotoRef.current;

    if (!photo) {
      await captureAndExtract();
      return;
    }

    await runExtraction(photo);
  }, [captureAndExtract, runExtraction]);

  const cancelReview = useCallback(() => {
    setDraft(null);
    setErrorMessage(null);
    capturedPhotoRef.current = null;
    setPhase(ScannerPhase.Capturing);
  }, []);

  return {
    phase,
    videoRef,
    cameraStatus,
    cameraErrorMessage,
    requestCameraAccess: requestAccess,
    errorMessage,
    draft,
    captureAndExtract,
    retry,
    confirmDelivery: addDeliveryFromSelection,
    cancelReview,
  };
}
