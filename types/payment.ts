export type PaymentType = 'cash' | 'bsi ziswaf' | 'bsi pptq' | 'other';

export type AkadType = 'spp' | 'reg ulang' | 'reg baru' | 'sedekah' | 'zakat' | 'wakaf' | 'infaq' | 'other';

export interface AkadItem {
  type: AkadType;
  amount: number;
  description?: string;
}

export interface Payment {
  id: string;
  date: string;
  name: string;
  total: number;
  type: PaymentType;
  photo_url?: string;
  akad: AkadItem[];
  student_id?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  date: string;
  name: string;
  total: number;
  type: PaymentType;
  photo_url?: string;
  akad: AkadItem[];
  student_id?: string;
  note?: string;
}

export interface UpdatePaymentData {
  id: string;
  date?: string;
  name?: string;
  total?: number;
  type?: PaymentType;
  photo_url?: string;
  akad?: AkadItem[];
  student_id?: string;
  note?: string;
} 