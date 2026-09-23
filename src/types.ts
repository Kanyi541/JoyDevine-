export interface AutoPart {
  id: string;
  itemName: string;
  ybNo: string;        // JoyDivine YB inventory numbering
  oem: string;         // OEM Part code
  des: string;         // Description & vehicle compatibility details
  category: string;
  brand: string;
  priceKes: number;
  buyingPriceKes?: number;
  stock: number;
  imageUrl: string;
  condition: 'Brand New' | 'OEM Replacement' | 'Heavy Duty';
  warrantyMonths?: number;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface POSSaleItem {
  part: AutoPart;
  quantity: number;
  unitPriceKes: number;
  subtotalKes: number;
}

export interface POSSaleRecord {
  id: string;
  receiptNumber: string;
  timestamp: string;
  items: POSSaleItem[];
  totalKes: number;
  paymentMethod: 'M-PESA' | 'CASH' | 'CARD' | 'CREDIT/INVOICE';
  mpesaRef?: string;
  customerName?: string;
  customerPhone?: string;
  cashierName: string;
  notes?: string;
}

export interface StoredImageRecord {
  id: string;
  key: string;       // YB No or OEM or Item Name normalized
  imageUrl: string;
  label: string;
  addedAt: string;
}

export type UserRole = 'admin' | 'cashier';

export interface POSUser {
  id: string;
  username: string; // e.g. "Devine2026"
  displayName: string;
  password: string; // password credential stored in posUsers in Firestore
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}
