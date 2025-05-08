import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface BillingSettings {
  id: string;
  academicYearId: string;
  monthlyPrice: number;
  billingTarget: number;
  targetPercentage: number;
  startYear: number;
  endYear: number;
  createdAt: string;
  updatedAt: string;
}

interface BillingRecord {
  id: string;
  academicYearId: string;
  studentId: string;
  month: string;
  status: 'paid' | 'unpaid';
  createdAt: string;
  updatedAt: string;
}

interface BillingStore {
  settings: BillingSettings | null;
  records: BillingRecord[];
  loadSettings: (academicYearId: string) => Promise<void>;
  saveSettings: (settings: Omit<BillingSettings, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSettings: (settings: BillingSettings) => Promise<void>;
  loadRecords: (academicYearId: string) => Promise<void>;
  saveBillingRecords: (records: { academicYearId: string; studentId: string; month: string; status: 'paid' | 'unpaid' }[]) => Promise<void>;
}

export const useBillingStore = create<BillingStore>((set) => ({
  settings: null,
  records: [],

  loadSettings: async (academicYearId: string) => {
    const { data } = await supabase
      .from('billing_settings')
      .select('*')
      .eq('academic_year_id', academicYearId)
      .single();

    if (data) {
      set({
        settings: {
          id: data.id,
          academicYearId: data.academic_year_id,
          monthlyPrice: data.monthly_price,
          billingTarget: data.billing_target,
          targetPercentage: data.target_percentage,
          startYear: data.start_year,
          endYear: data.end_year,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      });
    }
  },

  saveSettings: async (settings) => {
    const { data, error } = await supabase
      .from('billing_settings')
      .insert([{
        academic_year_id: settings.academicYearId,
        monthly_price: settings.monthlyPrice,
        billing_target: settings.billingTarget,
        target_percentage: settings.targetPercentage,
        start_year: settings.startYear,
        end_year: settings.endYear
      }])
      .select()
      .single();

    if (data && !error) {
      set({
        settings: {
          id: data.id,
          academicYearId: data.academic_year_id,
          monthlyPrice: data.monthly_price,
          billingTarget: data.billing_target,
          targetPercentage: data.target_percentage,
          startYear: data.start_year,
          endYear: data.end_year,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      });
    }
  },

  updateSettings: async (settings) => {
    const { data, error } = await supabase
      .from('billing_settings')
      .update({
        monthly_price: settings.monthlyPrice,
        billing_target: settings.billingTarget,
        target_percentage: settings.targetPercentage,
        start_year: settings.startYear,
        end_year: settings.endYear,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)
      .select()
      .single();

    if (data && !error) {
      set({
        settings: {
          id: data.id,
          academicYearId: data.academic_year_id,
          monthlyPrice: data.monthly_price,
          billingTarget: data.billing_target,
          targetPercentage: data.target_percentage,
          startYear: data.start_year,
          endYear: data.end_year,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      });
    }
  },

  loadRecords: async (academicYearId: string) => {
    const { data } = await supabase
      .from('billing_records')
      .select('*')
      .eq('academic_year_id', academicYearId);

    if (data) {
      set({
        records: data.map(record => ({
          id: record.id,
          academicYearId: record.academic_year_id,
          studentId: record.student_id,
          month: record.month,
          status: record.status,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }))
      });
    }
  },

  saveBillingRecords: async (records) => {
    // First, delete existing records for these students and months
    for (const record of records) {
      await supabase
        .from('billing_records')
        .delete()
        .eq('academic_year_id', record.academicYearId)
        .eq('student_id', record.studentId)
        .eq('month', record.month);
    }

    // Then insert new records
    const { data, error } = await supabase
      .from('billing_records')
      .insert(records.map(record => ({
        academic_year_id: record.academicYearId,
        student_id: record.studentId,
        month: record.month,
        status: record.status
      })))
      .select();

    if (data && !error) {
      set(state => ({
        records: [
          ...state.records.filter(r => 
            !records.some(newR => 
              r.academicYearId === newR.academicYearId && 
              r.studentId === newR.studentId && 
              r.month === newR.month
            )
          ),
          ...data.map(record => ({
            id: record.id,
            academicYearId: record.academic_year_id,
            studentId: record.student_id,
            month: record.month,
            status: record.status,
            createdAt: record.created_at,
            updatedAt: record.updated_at
          }))
        ]
      }));
    }
  }
}));