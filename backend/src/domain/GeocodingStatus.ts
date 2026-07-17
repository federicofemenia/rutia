export const GeocodingStatus = {
  Pending: 'pending',
  Verified: 'verified',
  Ambiguous: 'ambiguous',
  NotFound: 'notFound',
} as const;

export type GeocodingStatus = (typeof GeocodingStatus)[keyof typeof GeocodingStatus];
