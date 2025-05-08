import { create } from 'zustand';
import { Point, StudentPoint } from '@/types/points';
import { supabase } from '@/lib/supabase';

interface PointsStore {
  points: Point[];
  studentPoints: StudentPoint[];
  loadPoints: () => Promise<void>;
  loadStudentPoints: () => Promise<void>;
  addPoint: (point: Omit<Point, 'id' | 'createdAt'>) => Promise<void>;
  updatePoint: (point: Point) => Promise<void>;
  deletePoint: (id: string) => Promise<void>;
  addStudentPoint: (studentId: string, pointId: string) => Promise<void>;
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
        point:points(*)
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
    const { data, error } = await supabase
      .from('student_points')
      .insert([{
        student_id: studentId,
        point_id: pointId
      }])
      .select(`
        *,
        point:points(*)
      `)
      .single();

    if (data && !error) {
      set(state => ({
        studentPoints: [data, ...state.studentPoints]
      }));
    }
  }
}));