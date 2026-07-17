export interface DeliveryAddress {
  street: string;
  streetNumber?: string;
  postalCode?: string;
  locality: string;
  province: string;
  country: string;
  rawAddress?: string;
}
