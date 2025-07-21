import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Payment, CreatePaymentData, UpdatePaymentData } from '@/types/payment';

interface PaymentStore {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPayments: (studentId?: string) => Promise<void>;
  createPayment: (data: CreatePaymentData) => Promise<Payment | null>;
  updatePayment: (data: UpdatePaymentData) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  clearError: () => void;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],
  loading: false,
  error: null,

  loadPayments: async (studentId?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          students:student_id (
            id,
            name,
            gender,
            address,
            class_id,
            level_id,
            status
          )
        `)
        .order('date', { ascending: false });

      if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const payments: Payment[] = (data || []).map(payment => ({
        id: payment.id,
        date: payment.date,
        name: payment.name,
        total: payment.total,
        type: payment.type,
        photo_url: payment.photo_url,
        akad: payment.akad || [],
        student_id: payment.student_id,
        note: payment.note,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        students: payment.students
      }));

      set({ payments, loading: false });
    } catch (error) {
      console.error('Error loading payments:', error);
      set({ error: 'Failed to load payments', loading: false });
    }
  },

  createPayment: async (paymentData: CreatePaymentData) => {
    set({ loading: true, error: null });
    try {
      const insertData: any = {
        date: paymentData.date,
        name: paymentData.name,
        total: paymentData.total,
        type: paymentData.type,
        photo_url: paymentData.photo_url || null,
        akad: paymentData.akad,
        note: paymentData.note || null
      };

      // Only include student_id if it's not empty
      if (paymentData.student_id && paymentData.student_id.trim() !== '') {
        insertData.student_id = paymentData.student_id;
      }

      const { data, error } = await supabase
        .from('payments')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newPayment: Payment = {
        id: data.id,
        date: data.date,
        name: data.name,
        total: data.total,
        type: data.type,
        photo_url: data.photo_url,
        akad: data.akad || [],
        student_id: data.student_id,
        note: data.note,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      set(state => ({
        payments: [newPayment, ...state.payments],
        loading: false
      }));

      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment';
      set({ error: errorMessage, loading: false });
      return null;
    }
  },

  updatePayment: async (updateData: UpdatePaymentData) => {
    set({ loading: true, error: null });
    try {
      const updateFields: any = {};
      if (updateData.date !== undefined) updateFields.date = updateData.date;
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.total !== undefined) updateFields.total = updateData.total;
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.photo_url !== undefined) updateFields.photo_url = updateData.photo_url || null;
      if (updateData.akad !== undefined) updateFields.akad = updateData.akad;
      if (updateData.student_id !== undefined) {
        updateFields.student_id = updateData.student_id && updateData.student_id.trim() !== '' 
          ? updateData.student_id 
          : null;
      }
      if (updateData.note !== undefined) updateFields.note = updateData.note || null;

      const { data, error } = await supabase
        .from('payments')
        .update(updateFields)
        .eq('id', updateData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedPayment: Payment = {
        id: data.id,
        date: data.date,
        name: data.name,
        total: data.total,
        type: data.type,
        photo_url: data.photo_url,
        akad: data.akad || [],
        student_id: data.student_id,
        note: data.note,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      set(state => ({
        payments: state.payments.map(payment => 
          payment.id === updateData.id ? updatedPayment : payment
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating payment:', error);
      set({ error: 'Failed to update payment', loading: false });
    }
  },

  deletePayment: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        payments: state.payments.filter(payment => payment.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting payment:', error);
      set({ error: 'Failed to delete payment', loading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  }
})); 