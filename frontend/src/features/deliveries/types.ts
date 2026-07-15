export const ScannerPhase = {
  Capturing: 'capturing',
  Extracting: 'extracting',
  Reviewing: 'reviewing',
  Error: 'error',
} as const;

export type ScannerPhase = (typeof ScannerPhase)[keyof typeof ScannerPhase];

export interface Delivery {
  id: string;
  address: string;
  postalCode: string;
  createdAt: string;
}

export interface DeliveryDraft {
  address: string;
  postalCode: string;
}
