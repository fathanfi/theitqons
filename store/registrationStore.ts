import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { 
  StudentRegistration, 
  CreateRegistrationData, 
  UpdateRegistrationData, 
  RegistrationStats 
} from '@/types/registration';

interface RegistrationStore {
  registrations: StudentRegistration[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadRegistrations: () => Promise<void>;
  createRegistration: (data: CreateRegistrationData) => Promise<StudentRegistration | null>;
  updateRegistration: (data: UpdateRegistrationData) => Promise<void>;
  deleteRegistration: (id: string) => Promise<void>;
  getRegistrationStats: () => RegistrationStats;
  clearError: () => void;
}

export const useRegistrationStore = create<RegistrationStore>((set, get) => ({
  registrations: [],
  loading: false,
  error: null,

  loadRegistrations: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('student_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ registrations: data || [], loading: false });
    } catch (error) {
      console.error('Error loading registrations:', error);
      set({ error: 'Failed to load registrations', loading: false });
    }
  },

  createRegistration: async (registrationData: CreateRegistrationData) => {
    set({ loading: true, error: null });
    try {
      // For public registration, we need to ensure the user is not authenticated
      // or use a different approach. Let's try with explicit anon role
      const { data, error } = await supabase
        .from('student_registrations')
        .insert([{
          ...registrationData,
          // Ensure we're not sending any user-specific data
          approved_by: null,
          approved_at: null
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        // If RLS is still blocking, provide a helpful error message
        if (error.code === '42501') {
          throw new Error('Registration is temporarily unavailable. Please try again later or contact support.');
        }
        throw error;
      }

      const newRegistration: StudentRegistration = {
        id: data.id,
        registration_number: data.registration_number,
        name: data.name,
        gender: data.gender,
        place_of_birth: data.place_of_birth,
        date_of_birth: data.date_of_birth,
        address: data.address,
        phone_number: data.phone_number,
        father_name: data.father_name,
        mother_name: data.mother_name,
        wali_name: data.wali_name,
        school_info: data.school_info,
        previous_education: data.previous_education,
        registration_date: data.registration_date,
        status: data.status,
        test_date: data.test_date,
        test_score: data.test_score,
        test_notes: data.test_notes,
        approved_by: data.approved_by,
        approved_at: data.approved_at,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      set(state => ({
        registrations: [newRegistration, ...state.registrations],
        loading: false
      }));

      return newRegistration;
    } catch (error) {
      console.error('Error creating registration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create registration';
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  updateRegistration: async (updateData: UpdateRegistrationData) => {
    set({ loading: true, error: null });
    try {
      const updateFields: any = {};
      if (updateData.status !== undefined) updateFields.status = updateData.status;
      if (updateData.test_date !== undefined) updateFields.test_date = updateData.test_date;
      if (updateData.test_score !== undefined) updateFields.test_score = updateData.test_score;
      if (updateData.test_notes !== undefined) updateFields.test_notes = updateData.test_notes;
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

      const { data, error } = await supabase
        .from('student_registrations')
        .update(updateFields)
        .eq('id', updateData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedRegistration: StudentRegistration = {
        id: data.id,
        registration_number: data.registration_number,
        name: data.name,
        gender: data.gender,
        place_of_birth: data.place_of_birth,
        date_of_birth: data.date_of_birth,
        address: data.address,
        phone_number: data.phone_number,
        father_name: data.father_name,
        mother_name: data.mother_name,
        wali_name: data.wali_name,
        school_info: data.school_info,
        previous_education: data.previous_education,
        registration_date: data.registration_date,
        status: data.status,
        test_date: data.test_date,
        test_score: data.test_score,
        test_notes: data.test_notes,
        approved_by: data.approved_by,
        approved_at: data.approved_at,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      set(state => ({
        registrations: state.registrations.map(reg => 
          reg.id === updateData.id ? updatedRegistration : reg
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating registration:', error);
      set({ error: 'Failed to update registration', loading: false });
    }
  },

  deleteRegistration: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('student_registrations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        registrations: state.registrations.filter(reg => reg.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting registration:', error);
      set({ error: 'Failed to delete registration', loading: false });
    }
  },

  getRegistrationStats: () => {
    const { registrations } = get();
    const stats: RegistrationStats = {
      total: registrations.length,
      register: registrations.filter(r => r.status === 'Register').length,
      test: registrations.filter(r => r.status === 'Test').length,
      passed: registrations.filter(r => r.status === 'Passed').length,
      rejected: registrations.filter(r => r.status === 'Rejected').length
    };
    return stats;
  },

  clearError: () => {
    set({ error: null });
  }
})); 