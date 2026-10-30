export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  role: "customer" | "seller" | "admin";
}

export type AddressType = "home" | "work" | "studio" | "other";

export interface Address {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  type: AddressType;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerSession {
  userId: string;
  email: string;
  name: string;
  expiresAt: number;
}
