export interface QurbanEdition {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface QurbanAnimal {
  id: string;
  name: string;
  type: string;
  price: number;
  weight: number;
  description: string;
  status: 'available' | 'reserved' | 'sold' | 'slaughtered';
  qurban_edition_id: string;
  for_whom: string;
  location: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface QurbanSedekah {
  id: string;
  name: string;
  from_who: string;
  via: string;
  qurban_edition_id: string;
  total: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  donate_date: string;
  created_at: string;
  updated_at: string;
}

export interface QurbanOperasional {
  id: string;
  name: string;
  description: string;
  qurban_edition_id: string;
  budget: number;
  reality: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface QurbanMyQurban {
  id: string;
  user_id: string;
  qurban_animal_id: string;
  qurban_edition_id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  animal?: QurbanAnimal;
  edition?: QurbanEdition;
}

export type Qurbanku = {
  id: string;
  animal_id: string;
  qurban_edition_id: string;
  process: {
    payment?: {
      status: 'pending' | 'paid' | 'failed';
      total: number;
      payment_date?: string;
    };
    slaughter?: {
      status: 'pending' | 'scheduled' | 'completed';
      date?: string;
      location?: string;
    };
    distribution?: {
      status: 'pending' | 'in_progress' | 'completed';
      date?: string;
      location?: string;
      beneficiaries?: number;
    };
  };
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  animal?: QurbanAnimal;
  edition?: QurbanEdition;
}; 