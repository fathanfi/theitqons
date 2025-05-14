import { create } from 'zustand';
import { Point, StudentPoint } from '@/types/points';
import { supabase } from '@/lib/supabase';

interface PointsStore {
  points: Point[];
  studentPoints: StudentPoint[];
  loadPoints: () => Promise<void>;
  loadStudentPoints: () => Promise<void>;
  addPoint: (point: Omit<Point, 'id' | 'created_at'>) => Promise<void>;
  updatePoint: (point: Point) => Promise<void>;
  deletePoint: (id: string) => Promise<void>;
  addStudentPoint: (studentId: string, pointId: string) => Promise<void>;
  deleteStudentPoint: (id: string) => Promise<void>;
}

export const usePointsStore = create<PointsStore>((set, get) => ({
  points: [],
  studentPoints: [],

  loadPoints: async () => {
    const { data } = await supabase
      .from('points')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      set({ points: data });
    }
  },

  loadStudentPoints: async () => {
    const { data } = await supabase
      .from('student_points')
      .select(`
        *,
        point:points(*),
        student:students(*)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      set({ studentPoints: data });
    }
  },

  addPoint: async (point) => {
    const { data, error } = await supabase
      .from('points')
      .insert([point])
      .select()
      .single();

    if (data && !error) {
      set(state => ({
        points: [data, ...state.points]
      }));
    }
  },

  updatePoint: async (point) => {
    const { error } = await supabase
      .from('points')
      .update({
        name: point.name,
        description: point.description,
        point: point.point
      })
      .eq('id', point.id);

    if (!error) {
      set(state => ({
        points: state.points.map(p =>
          p.id === point.id ? point : p
        )
      }));
    }
  },

  deletePoint: async (id) => {
    const { error } = await supabase
      .from('points')
      .delete()
      .eq('id', id);

    if (!error) {
      set(state => ({
        points: state.points.filter(point => point.id !== id)
      }));
    }
  },

  addStudentPoint: async (studentId, pointId) => {
    try {
      const { data, error } = await supabase
        .from('student_points')
        .insert([{
          student_id: studentId,
          point_id: pointId
        }])
        .select(`
          *,
          point:points(*),
          student:students(*)
        `)
        .single();

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: studentId,
        action_type: 'student_point_added',
        message: `Added ${data.point.point} points to ${data.student.name} for ${data.point.name}`,
        related_id: data.id,
        metadata: {
          point_name: data.point.name,
          points: data.point.point,
          student_name: data.student.name
        }
      });

      set(state => ({
        studentPoints: [data, ...state.studentPoints]
      }));
    } catch (error) {
      console.error('Error adding student point:', error);
      throw error;
    }
  },

  deleteStudentPoint: async (id) => {
    try {
      // Get student point details before deletion for logging
      const { data: studentPoint, error: fetchError } = await supabase
        .from('student_points')
        .select(`
          *,
          point:points(*),
          student:students(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('student_points')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        student_id: studentPoint.student_id,
        action_type: 'student_point_deleted',
        message: `Removed ${studentPoint.point.point} points from ${studentPoint.student.name} for ${studentPoint.point.name}`,
        related_id: studentPoint.id,
        metadata: {
          point_name: studentPoint.point.name,
          points: studentPoint.point.point,
          student_name: studentPoint.student.name
        }
      });

      set(state => ({
        studentPoints: state.studentPoints.filter(sp => sp.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting student point:', error);
      throw error;
    }
  }
}));