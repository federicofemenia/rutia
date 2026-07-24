import type { ExtractedAddressQuery } from '../address-extraction';

export const ScannerPhase = {
  Capturing: 'capturing',
  Extracting: 'extracting',
  Reviewing: 'reviewing',
  Error: 'error',
} as const;

export type ScannerPhase = (typeof ScannerPhase)[keyof typeof ScannerPhase];

export type DeliveryDraft = ExtractedAddressQuery;
