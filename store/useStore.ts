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
  loadInitialData: () => Promise<void>;
  loadStudents: () => Promise<void>;
}

export const useStore = create<StudentStore>((set, get) => ({
  students: [],
  badges: [],

  loadStudents: async () => {
    try {
      const { data: students } = await supabase
        .from('students')
        .select(`
          *,
          badges:student_badges(
            badge:badges(*)
          ),
          redemptions(*)
        `);

      const transformedStudents = students?.map(student => ({
        ...student,
        badges: student.badges?.map((sb: any) => sb.badge) || [],
        redemptions: student.redemptions || []
      })) || [];

      set({ students: transformedStudents });
    } catch (error) {
      console.error('Error loading students:', error);
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
          id: student.id,
          name: student.name,
          gender: student.gender,
          address: student.address,
          class_id: student.class_id,
          level_id: student.level_id,
          father_name: student.father_name,
          mother_name: student.mother_name,
          wali_name: student.wali_name,
          school_info: student.school_info,
          status: student.status
        }])
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        students: [...state.students, { ...data, badges: [], redemptions: [] }]
      }));
    } catch (error) {
      console.error('Error adding student:', error);
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
          status: student.status
        })
        .eq('id', student.id);

      if (error) throw error;

      set(state => ({
        students: state.students.map(s =>
          s.id === student.id ? student : s
        )
      }));
    } catch (error) {
      console.error('Error updating student:', error);
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
      // First update the database
      const { error } = await supabase
        .from('students')
        .update({ level_id: level.id })
        .eq('id', studentId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('student_badges')
        .insert([{
          student_id: studentId,
          badge_id: badge.id
        }]);

      if (error) throw error;

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
      const { error } = await supabase
        .from('student_badges')
        .delete()
        .eq('student_id', studentId)
        .eq('badge_id', badgeId);

      if (error) throw error;

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
    }
  }
}));