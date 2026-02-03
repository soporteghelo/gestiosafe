
export enum FileType {
  EXCEL = 'Excel',
  WORD = 'Word',
  PDF = 'PDF',
  PPT = 'PPT'
}

export interface Template {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sector: string; // Nueva columna
  fileType: string[];
  rating: number;
  imageUrl: string;
  isPopular?: boolean;
  isNew?: boolean;
  link?: string; // Link de descarga
}

export interface CartItem extends Template {
  quantity: number;
}

export interface CustomerData {
  email: string;
  docType: string;
  docNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
}

export type PaymentMethod = 'CARD' | 'WALLET';
