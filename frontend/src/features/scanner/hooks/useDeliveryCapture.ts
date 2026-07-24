import { useCallback, useEffect, useRef, useState } from 'react';
import { type CameraStatus, useCamera } from '../../camera';
import { useExtractAddress } from '../../address-extraction';
import { useAutoReoptimize, useRoute } from '../../route';
import { type DeliveryDraft, ScannerPhase } from '../types';

interface UseDeliveryCaptureResult {
  phase: ScannerPhase;
  videoRef: ReturnType<typeof useCamera>['videoRef'];
  cameraStatus: CameraStatus;
  cameraErrorMessage: string | null;
  requestCameraAccess: () => Promise<void>;
  errorMessage: string | null;
  draft: DeliveryDraft | null;
  updateDraft: (patch: Partial<DeliveryDraft>) => void;
  captureAndExtract: () => Promise<void>;
  retry: () => Promise<void>;
  confirmDelivery: () => void;
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
  const { session, addDelivery, routeSummary } = useRoute();
  const { triggerAutoReoptimize } = useAutoReoptimize();

  const [phase, setPhase] = useState<ScannerPhase>(ScannerPhase.Capturing);
  const [draft, setDraft] = useState<DeliveryDraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const capturedPhotoRef = useRef<string | null>(null);

  useEffect(() => {
    if (cameraStatus === 'idle') {
      requestAccess();
    }
  }, [cameraStatus, requestAccess]);

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

      setDraft(result);
      setPhase(ScannerPhase.Reviewing);
    },
    [extract],
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

  const updateDraft = useCallback((patch: Partial<DeliveryDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const confirmDelivery = useCallback(() => {
    if (!draft) {
      return;
    }

    const newDelivery = addDelivery({ address: draft });
    setDraft(null);
    setErrorMessage(null);
    capturedPhotoRef.current = null;
    setPhase(ScannerPhase.Capturing);

    // Si la ruta ya se había optimizado antes, esta entrega nueva todavía no participa del orden
    // ni de las distancias — se recalcula sola, sin interrumpir el escaneo. Si es la primera vez
    // (routeSummary null), no hay nada que recalcular todavía: eso lo dispara "Terminar y
    // optimizar" al final del lote.
    if (routeSummary) {
      void triggerAutoReoptimize([...session.deliveries, newDelivery]);
    }
  }, [draft, addDelivery, routeSummary, triggerAutoReoptimize, session.deliveries]);

  return {
    phase,
    videoRef,
    cameraStatus,
    cameraErrorMessage,
    requestCameraAccess: requestAccess,
    errorMessage,
    draft,
    updateDraft,
    captureAndExtract,
    retry,
    confirmDelivery,
  };
}
