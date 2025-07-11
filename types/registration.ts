export type RegistrationStatus = 'Register' | 'Test' | 'Passed' | 'Rejected';
export type PaymentStatus = 'NOT PAID' | 'PAID';

export interface StudentRegistration {
  id: string;
  registration_number: string;
  name: string;
  gender: 'Ikhwan' | 'Akhwat';
  place_of_birth?: string;
  date_of_birth?: string;
  address: string;
  phone_number?: string;
  father_name?: string;
  mother_name?: string;
  wali_name?: string;
  school_info?: string;
  previous_education?: string;
  class_type: number;
  registration_date: string;
  status: RegistrationStatus;
  payment_status: PaymentStatus;
  test_date?: string;
  test_score?: number;
  test_notes?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRegistrationData {
  name: string;
  gender: 'Ikhwan' | 'Akhwat';
  place_of_birth?: string;
  date_of_birth?: string;
  address: string;
  phone_number: string;
  father_name?: string;
  mother_name?: string;
  wali_name?: string;
  school_info?: string;
  previous_education?: string;
  class_type: number;
}

export interface UpdateRegistrationData {
  id: string;
  status?: RegistrationStatus;
  payment_status?: PaymentStatus;
  test_date?: string;
  test_score?: number;
  test_notes?: string;
  notes?: string;
}

export interface RegistrationStats {
  total: number;
  register: number;
  test: number;
  passed: number;
  rejected: number;
} 