export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Delivery {
  id: string;
  address: string;
  postalCode: string;
  createdAt: string;
  coordinates?: Coordinates;
}

export interface RouteSession {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deliveries: Delivery[];
}
