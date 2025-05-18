import { create } from 'zustand';
import { Student, Badge, Level, Redemption } from '@/types/student';
import { supabase } from '@/lib/supabase';

interface StudentStore {
  students: Student[];
  badges: Badge[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  moveStudentToLevel: (studentId: string, level: Level) => Promise<void>;
  addBadge: (badge: Badge) => Promise<void>;
  deleteBadge: (id: string) => Promise<void>;
  addBadgeToStudent: (studentId: string, badge: Badge) => Promise<void>;
  removeBadgeFromStudent: (studentId: string, badgeId: string) => Promise<void>;
  redeemPoints: (studentId: string, redemption: Redemption) => Promise<void>;
  deleteRedemption: (redemptionId: string) => Promise<void>;
  loadInitialData: () => Promise<void>;
  loadStudents: () => Promise<void>;
}

export const useStore = create<StudentStore>((set, get) => ({
  students: [],
  badges: [],

  loadStudents: async () => {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          *,
          badges:student_badges(
            badge:badges(*)
          ),
          redemptions(*)
        `);

      if (error) throw error;

      const transformedStudents = students?.map(student => ({
        id: student.id,
        name: student.name,
        gender: student.gender || 'Ikhwan',
        address: student.address || '',
        class_id: student.class_id || '',
        level_id: student.level_id || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        wali_name: student.wali_name || '',
        school_info: student.school_info || '',
        profileImageUrl: student.profile_image_url || '',
        status: student.status ?? true,
        placeOfBirth: student.place_of_birth || '',
        dateOfBirth: student.date_of_birth || '',
        phoneNumber: student.phone_number || '',
        lastAchievement: student.last_achievement || '',
        totalPages: student.total_pages || 0,
        registration_number: student.registration_number || '',
        national_id: student.national_id || '',
        family_id: student.family_id || '',
        joined_date: student.joined_date || '',
        notes: student.notes || '',
        badges: student.badges?.map((sb: any) => sb.badge) || [],
        redemptions: student.redemptions || [],
        createdAt: student.created_at,
        updatedAt: student.updated_at
      })) || [];

      set({ students: transformedStudents });
    } catch (error) {
      console.error('Error loading students:', error);
      throw error;
    }
  },

  loadInitialData: async () => {
    try {
      // Load students with their badges
      await get().loadStudents();

      // Load badges
      const { data: badges } = await supabase
        .from('badges')
        .select('*');

      set({ badges: badges || [] });
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  },

  addStudent: async (student) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: student.name,
          gender: student.gender,
          address: student.address,
          class_id: student.class_id,
          level_id: student.level_id,
          father_name: student.father_name,
          mother_name: student.mother_name,
          wali_name: student.wali_name,
          school_info: student.school_info,
          profile_image_url: student.profileImageUrl,
          status: student.status,
          place_of_birth: student.placeOfBirth,
          date_of_birth: student.dateOfBirth,
          phone_number: student.phoneNumber,
          last_achievement: student.lastAchievement,
          total_pages: student.totalPages || 0,
          registration_number: student.registration_number,
          national_id: student.national_id,
          family_id: student.family_id,
          joined_date: student.joined_date,
          notes: student.notes
        }])
        .select()
        .single();

      if (error) throw error;

      const transformedStudent = {
        ...data,
        gender: data.gender || 'Ikhwan',
        address: data.address || '',
        class_id: data.class_id || '',
        level_id: data.level_id || '',
        father_name: data.father_name || '',
        mother_name: data.mother_name || '',
        wali_name: data.wali_name || '',
        school_info: data.school_info || '',
        profileImageUrl: data.profile_image_url || '',
        status: data.status ?? true,
        placeOfBirth: data.place_of_birth || '',
        dateOfBirth: data.date_of_birth || '',
        phoneNumber: data.phone_number || '',
        lastAchievement: data.last_achievement || '',
        totalPages: data.total_pages || 0,
        registration_number: data.registration_number || '',
        national_id: data.national_id || '',
        family_id: data.family_id || '',
        joined_date: data.joined_date || '',
        notes: data.notes || '',
        badges: [],
        redemptions: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      set(state => ({
        students: [transformedStudent, ...state.students]
      }));
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  updateStudent: async (student) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: student.name,
          gender: student.gender,
          address: student.address,
          class_id: student.class_id,
          level_id: student.level_id,
          father_name: student.father_name,
          mother_name: student.mother_name,
          wali_name: student.wali_name,
          school_info: student.school_info,
          profile_image_url: student.profileImageUrl,
          status: student.status,
          place_of_birth: student.placeOfBirth,
          date_of_birth: student.dateOfBirth,
          phone_number: student.phoneNumber,
          last_achievement: student.lastAchievement,
          total_pages: student.totalPages || 0,
          registration_number: student.registration_number,
          national_id: student.national_id,
          family_id: student.family_id,
          joined_date: student.joined_date,
          notes: student.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', student.id);

      if (error) throw error;

      const transformedStudent = {
        ...student,
        gender: student.gender || 'Ikhwan',
        address: student.address || '',
        class_id: student.class_id || '',
        level_id: student.level_id || '',
        father_name: student.father_name || '',
        mother_name: student.mother_name || '',
        wali_name: student.wali_name || '',
        school_info: student.school_info || '',
        profileImageUrl: student.profileImageUrl || '',
        status: student.status ?? true,
        placeOfBirth: student.placeOfBirth || '',
        dateOfBirth: student.dateOfBirth || '',
        phoneNumber: student.phoneNumber || '',
        lastAchievement: student.lastAchievement || '',
        totalPages: student.totalPages || 0,
        registration_number: student.registration_number || '',
        national_id: student.national_id || '',
        family_id: student.family_id || '',
        joined_date: student.joined_date || '',
        notes: student.notes || ''
      };

      set(state => ({
        students: state.students.map(s =>
          s.id === student.id ? transformedStudent : s
        )
      }));
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  deleteStudent: async (id) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        students: state.students.filter(student => student.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  },

  moveStudentToLevel: async (studentId, level) => {
    try {
      // Get student details for logging
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // First update the database
      const { error } = await supabase
        .from('students')
        .update({ level_id: level.id })
        .eq('id', studentId);

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: studentId,
        action_type: 'itqon_level_updated',
        message: `${student.name} moved to level ${level.name}`,
        related_id: level.id,
        metadata: {
          student_name: student.name,
          level_name: level.name,
          level_id: level.id
        }
      });

      // Then update the local state
      set(state => ({
        students: state.students.map(student =>
          student.id === studentId 
            ? { 
                ...student, 
                level_id: level.id,
                level: {
                  id: level.id,
                  name: level.name,
                  created_at: level.created_at,
                  updated_at: level.updated_at
                }
              } 
            : student
        )
      }));
    } catch (error) {
      console.error('Error moving student:', error);
      // Reload students to ensure we have the correct state
      await get().loadStudents();
    }
  },

  addBadge: async (badge) => {
    try {
      const { data, error } = await supabase
        .from('badges')
        .insert([{
          id: badge.id,
          icon: badge.icon,
          description: badge.description
        }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        badges: [...state.badges, data]
      }));
    } catch (error) {
      console.error('Error adding badge:', error);
    }
  },

  deleteBadge: async (id) => {
    try {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        badges: state.badges.filter(badge => badge.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting badge:', error);
    }
  },

  addBadgeToStudent: async (studentId, badge) => {
    try {
      // Get student details for logging
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const { error } = await supabase
        .from('student_badges')
        .insert([{
          student_id: studentId,
          badge_id: badge.id
        }]);

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: studentId,
        action_type: 'student_badge_added',
        message: `Added badge "${badge.description}" (${badge.icon}) to ${student.name}`,
        related_id: badge.id,
        metadata: {
          student_name: student.name,
          badge_description: badge.description,
          badge_icon: badge.icon
        }
      });

      set(state => ({
        students: state.students.map(student =>
          student.id === studentId
            ? { ...student, badges: [...student.badges, badge] }
            : student
        )
      }));
    } catch (error) {
      console.error('Error assigning badge:', error);
    }
  },

  removeBadgeFromStudent: async (studentId, badgeId) => {
    try {
      // Get student and badge details for logging
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('*')
        .eq('id', badgeId)
        .single();

      if (badgeError) throw badgeError;

      const { error } = await supabase
        .from('student_badges')
        .delete()
        .eq('student_id', studentId)
        .eq('badge_id', badgeId);

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: studentId,
        action_type: 'student_badge_removed',
        message: `Removed badge "${badge.description}" (${badge.icon}) from ${student.name}`,
        related_id: badgeId,
        metadata: {
          student_name: student.name,
          badge_description: badge.description,
          badge_icon: badge.icon
        }
      });

      set(state => ({
        students: state.students.map(student =>
          student.id === studentId
            ? { ...student, badges: student.badges.filter(b => b.id !== badgeId) }
            : student
        )
      }));
    } catch (error) {
      console.error('Error removing badge:', error);
    }
  },

  redeemPoints: async (studentId, redemption) => {
    try {
      // Get student details for logging
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Add redemption record
      const { data: redemptionData, error: redemptionError } = await supabase
        .from('redemptions')
        .insert([{
          id: redemption.id,
          student_id: studentId,
          reward_name: redemption.reward_name,
          points: redemption.points,
          icon: redemption.icon,
          redeemed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (redemptionError) throw redemptionError;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: studentId,
        action_type: 'points_redeemed',
        message: `${student.name} redeemed ${redemption.points} points for ${redemption.reward_name}`,
        related_id: redemption.id,
        metadata: {
          reward_name: redemption.reward_name,
          points: redemption.points,
          student_name: student.name
        }
      });

      set(state => ({
        students: state.students.map(s =>
          s.id === studentId
            ? {
                ...s,
                redemptions: [...(s.redemptions || []), redemptionData]
              }
            : s
        )
      }));
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  },

  deleteRedemption: async (redemptionId) => {
    try {
      // Get redemption details before deletion for logging
      const { data: redemption, error: fetchError } = await supabase
        .from('redemptions')
        .select(`
          *,
          student:students(name)
        `)
        .eq('id', redemptionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('redemptions')
        .delete()
        .eq('id', redemptionId);

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: redemption.student_id,
        action_type: 'redemption_deleted',
        message: `Removed redemption of ${redemption.points} points for ${redemption.reward_name} from ${redemption.student.name}`,
        related_id: redemption.id,
        metadata: {
          reward_name: redemption.reward_name,
          points: redemption.points,
          student_name: redemption.student.name
        }
      });

      set(state => ({
        students: state.students.map(s =>
          s.id === redemption.student_id
            ? {
                ...s,
                redemptions: s.redemptions.filter(r => r.id !== redemptionId)
              }
            : s
        )
      }));
    } catch (error) {
      console.error('Error deleting redemption:', error);
      throw error;
    }
  }
}));