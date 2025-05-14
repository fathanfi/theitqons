import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { SchoolSettings } from '@/types/school';

function toSnakeCase(obj: Partial<SchoolSettings>): any {
  return {
    id: obj.id,
    name: obj.name,
    account_number: obj.accountNumber,
    principal_name: obj.principalName,
    established_year: obj.establishedYear,
    address: obj.address,
    city: obj.city,
    state_province: obj.stateProvince,
    postal_code: obj.postalCode,
    country: obj.country,
    phone_number: obj.phoneNumber,
    email: obj.email,
    website_url: obj.websiteUrl,
    facilities: obj.facilities,
    student_count: obj.studentCount,
    staff_count: obj.staffCount,
    school_code: obj.schoolCode,
    latitude: obj.latitude,
    longitude: obj.longitude,
    bank_account: obj.bankAccount,
    created_at: obj.createdAt,
    updated_at: obj.updatedAt,
  };
}

function toCamelCase(row: any): SchoolSettings {
  return {
    id: row.id,
    name: row.name,
    accountNumber: row.account_number,
    principalName: row.principal_name,
    establishedYear: row.established_year,
    address: row.address,
    city: row.city,
    stateProvince: row.state_province,
    postalCode: row.postal_code,
    country: row.country,
    phoneNumber: row.phone_number,
    email: row.email,
    websiteUrl: row.website_url,
    facilities: row.facilities,
    studentCount: row.student_count,
    staffCount: row.staff_count,
    schoolCode: row.school_code,
    latitude: row.latitude,
    longitude: row.longitude,
    bankAccount: row.bank_account,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface SchoolSettingsStore {
  schoolSettings: SchoolSettings | null;
  loadSchoolSettings: () => Promise<void>;
  saveOrUpdateSchoolSettings: (settings: Partial<SchoolSettings>) => Promise<{ error?: any }>;
  deleteSchoolSettings: (id: string) => Promise<{ error?: any }>;
}

export const useSchoolSettingsStore = create<SchoolSettingsStore>((set) => ({
  schoolSettings: null,

  loadSchoolSettings: async () => {
    const { data } = await supabase.from('school_settings').select('*').single();
    if (data) set({ schoolSettings: toCamelCase(data) });
  },

  saveOrUpdateSchoolSettings: async (settings) => {
    try {
      // First, check if a record exists
      const { data: existingData } = await supabase
        .from('school_settings')
        .select('id')
        .single();

      let result;
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('school_settings')
          .update(toSnakeCase(settings))
          .eq('id', existingData.id)
          .select()
          .single();
      } else {
        // Insert new record with a generated UUID
        const newSettings = {
          ...toSnakeCase(settings),
          id: crypto.randomUUID() // Generate a new UUID for the record
        };
        result = await supabase
          .from('school_settings')
          .insert([newSettings])
          .select()
          .single();
      }

      if (result.data) {
        set({ schoolSettings: toCamelCase(result.data) });
        return { error: null };
      }
      return { error: result.error };
    } catch (error) {
      return { error };
    }
  },

  deleteSchoolSettings: async (id) => {
    const { error } = await supabase.from('school_settings').delete().eq('id', id);
    set({ schoolSettings: null });
    return { error };
  },
}));
