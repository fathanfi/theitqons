import { create } from 'zustand';
import { AcademicYear, Teacher, Class, Level, Group } from '@/types/school';
import { Badge } from '@/types/student';
import { supabase } from '@/lib/supabase';

interface SchoolStore {
  academicYears: AcademicYear[];
  teachers: Teacher[];
  classes: Class[];
  levels: Level[];
  groups: Group[];
  badges: Badge[];
  
  // Academic Year actions
  loadAcademicYears: () => Promise<void>;
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'createdAt'>) => Promise<void>;
  updateAcademicYear: (year: AcademicYear) => Promise<void>;
  setAcademicYearStatus: (id: string, status: boolean) => Promise<void>;
  
  // Teacher actions
  loadTeachers: () => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt' | 'roles'>, roles: string[]) => Promise<void>;
  updateTeacher: (teacher: Teacher) => Promise<void>;
  setTeacherStatus: (id: string, status: boolean) => Promise<void>;
  
  // Class actions
  loadClasses: () => Promise<void>;
  addClass: (class_: Omit<Class, 'id' | 'createdAt' | 'teacher'>) => Promise<void>;
  updateClass: (class_: Class) => Promise<void>;
  
  // Level actions
  loadLevels: () => Promise<void>;
  addLevel: (level: Omit<Level, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updateLevel: (level: Level) => Promise<void>;
  setLevelStatus: (id: string, status: boolean) => Promise<void>;
  reorderLevel: (id: string, newOrder: number) => Promise<void>;

  // Group actions
  loadGroups: (academicYearId: string) => Promise<void>;
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Promise<void>;
  updateGroup: (group: Group) => Promise<void>;

  // Badge actions
  loadBadges: () => Promise<void>;
  addBadge: (badge: Omit<Badge, 'id'>) => Promise<void>;
  updateBadge: (badge: Badge) => Promise<void>;
}

export const useSchoolStore = create<SchoolStore>((set, get) => ({
  academicYears: [],
  teachers: [],
  classes: [],
  levels: [],
  groups: [],
  badges: [],

  // Academic Year actions
  loadAcademicYears: async () => {
    const { data } = await supabase
      .from('academic_years')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      set({ academicYears: data.map(year => ({
        id: year.id,
        name: year.name,
        startDate: year.start_date,
        endDate: year.end_date,
        status: year.status,
        createdAt: year.created_at
      }))});
    }
  },

  addAcademicYear: async (year) => {
    const { data, error } = await supabase
      .from('academic_years')
      .insert([{
        name: year.name,
        start_date: year.startDate,
        end_date: year.endDate,
        status: year.status
      }])
      .select()
      .single();

    if (data && !error) {
      const newYear: AcademicYear = {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status,
        createdAt: data.created_at
      };

      set(state => ({
        academicYears: [newYear, ...state.academicYears]
      }));
    }
  },

  updateAcademicYear: async (year) => {
    const { error } = await supabase
      .from('academic_years')
      .update({
        name: year.name,
        start_date: year.startDate,
        end_date: year.endDate,
        status: year.status
      })
      .eq('id', year.id);

    if (!error) {
      set(state => ({
        academicYears: state.academicYears.map(y => 
          y.id === year.id ? year : y
        )
      }));
    }
  },

  setAcademicYearStatus: async (id, status) => {
    const { error } = await supabase
      .from('academic_years')
      .update({ status })
      .eq('id', id);

    if (!error) {
      set(state => ({
        academicYears: state.academicYears.map(year =>
          year.id === id ? { ...year, status } : year
        )
      }));
    }
  },

  // Teacher actions
  loadTeachers: async () => {
    const { data: teachers } = await supabase
      .from('teachers')
      .select('*, teacher_roles(role)');

    if (teachers) {
      set({
        teachers: teachers.map(teacher => ({
          id: teacher.id,
          name: teacher.name,
          address: teacher.address,
          dateOfBirth: teacher.date_of_birth,
          placeOfBirth: teacher.place_of_birth,
          phone: teacher.phone,
          joinDate: teacher.join_date,
          gender: teacher.gender,
          status: teacher.status,
          roles: teacher.teacher_roles.map((tr: any) => tr.role),
          createdAt: teacher.created_at,
          username: teacher.username,
          password: teacher.password
        }))
      });
    }
  },

  addTeacher: async (teacher, roles) => {
    const { data, error } = await supabase
      .from('teachers')
      .insert([{
        name: teacher.name,
        address: teacher.address,
        date_of_birth: teacher.dateOfBirth,
        place_of_birth: teacher.placeOfBirth,
        phone: teacher.phone,
        join_date: teacher.joinDate,
        gender: teacher.gender,
        status: teacher.status,
        username: teacher.username,
        password: teacher.password
      }])
      .select()
      .single();

    if (data && !error) {
      // Add roles
      const rolePromises = roles.map(role =>
        supabase
          .from('teacher_roles')
          .insert([{ teacher_id: data.id, role }])
      );

      await Promise.all(rolePromises);

      const newTeacher: Teacher = {
        id: data.id,
        name: data.name,
        address: data.address,
        dateOfBirth: data.date_of_birth,
        placeOfBirth: data.place_of_birth,
        phone: data.phone,
        joinDate: data.join_date,
        gender: data.gender,
        status: data.status,
        roles,
        createdAt: data.created_at,
        username: data.username,
        password: data.password
      };

      set(state => ({
        teachers: [...state.teachers, newTeacher]
      }));
    }
  },

  updateTeacher: async (teacher) => {
    const { error } = await supabase
      .from('teachers')
      .update({
        name: teacher.name,
        address: teacher.address,
        date_of_birth: teacher.dateOfBirth,
        place_of_birth: teacher.placeOfBirth,
        phone: teacher.phone,
        join_date: teacher.joinDate,
        gender: teacher.gender,
        status: teacher.status,
        username: teacher.username,
        password: teacher.password
      })
      .eq('id', teacher.id);

    if (!error) {
      // Update roles
      await supabase
        .from('teacher_roles')
        .delete()
        .eq('teacher_id', teacher.id);

      const rolePromises = teacher.roles.map(role =>
        supabase
          .from('teacher_roles')
          .insert([{ teacher_id: teacher.id, role }])
      );

      await Promise.all(rolePromises);

      set(state => ({
        teachers: state.teachers.map(t =>
          t.id === teacher.id ? teacher : t
        )
      }));
    }
  },

  setTeacherStatus: async (id, status) => {
    const { error } = await supabase
      .from('teachers')
      .update({ status })
      .eq('id', id);

    if (!error) {
      set(state => ({
        teachers: state.teachers.map(teacher =>
          teacher.id === id ? { ...teacher, status } : teacher
        )
      }));
    }
  },

  // Class actions
  loadClasses: async () => {
    const { data } = await supabase
      .from('classes')
      .select(`
        *,
        teacher:teachers(*)
      `);

    if (data) {
      set({
        classes: data.map(class_ => ({
          id: class_.id,
          name: class_.name,
          description: class_.description,
          teacherId: class_.teacher_id,
          teacher: class_.teacher ? {
            id: class_.teacher.id,
            name: class_.teacher.name,
            address: class_.teacher.address,
            dateOfBirth: class_.teacher.date_of_birth,
            placeOfBirth: class_.teacher.place_of_birth,
            phone: class_.teacher.phone,
            joinDate: class_.teacher.join_date,
            gender: class_.teacher.gender,
            status: class_.teacher.status,
            roles: [],
            createdAt: class_.teacher.created_at,
            username: class_.teacher.username,
            password: class_.teacher.password
          } : undefined,
          createdAt: class_.created_at
        }))
      });
    }
  },

  addClass: async (class_) => {
    const { data, error } = await supabase
      .from('classes')
      .insert([{
        name: class_.name,
        description: class_.description,
        teacher_id: class_.teacherId
      }])
      .select(`
        *,
        teacher:teachers(*)
      `)
      .single();

    if (data && !error) {
      const newClass: Class = {
        id: data.id,
        name: data.name,
        description: data.description,
        teacherId: data.teacher_id,
        teacher: data.teacher ? {
          id: data.teacher.id,
          name: data.teacher.name,
          address: data.teacher.address,
          dateOfBirth: data.teacher.date_of_birth,
          placeOfBirth: data.teacher.place_of_birth,
          phone: data.teacher.phone,
          joinDate: data.teacher.join_date,
          gender: data.teacher.gender,
          status: data.teacher.status,
          roles: [],
          createdAt: data.teacher.created_at
        } : undefined,
        createdAt: data.created_at
      };

      set(state => ({
        classes: [...state.classes, newClass]
      }));
    }
  },

  updateClass: async (class_) => {
    const { error } = await supabase
      .from('classes')
      .update({
        name: class_.name,
        description: class_.description,
        teacher_id: class_.teacherId
      })
      .eq('id', class_.id);

    if (!error) {
      set(state => ({
        classes: state.classes.map(c =>
          c.id === class_.id ? class_ : c
        )
      }));
    }
  },

  // Level actions
  loadLevels: async () => {
    const { data } = await supabase
      .from('levels')
      .select('*')
      .order('order', { ascending: true });

    if (data) {
      set({
        levels: data.map(level => ({
          id: level.id,
          name: level.name,
          description: level.description,
          status: level.status,
          order: level.order,
          createdAt: level.created_at
        }))
      });
    }
  },

  addLevel: async (level) => {
    // Get the maximum order
    const { data: maxOrderData } = await supabase
      .from('levels')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.order || 0) + 1;

    const { data, error } = await supabase
      .from('levels')
      .insert([{
        name: level.name,
        description: level.description,
        status: level.status,
        order: nextOrder
      }])
      .select()
      .single();

    if (data && !error) {
      const newLevel: Level = {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        order: data.order,
        createdAt: data.created_at
      };

      set(state => ({
        levels: [...state.levels, newLevel].sort((a, b) => a.order - b.order)
      }));
    }
  },

  updateLevel: async (level) => {
    const { error } = await supabase
      .from('levels')
      .update({
        name: level.name,
        description: level.description,
        status: level.status,
        order: level.order
      })
      .eq('id', level.id);

    if (!error) {
      set(state => ({
        levels: state.levels.map(l =>
          l.id === level.id ? level : l
        ).sort((a, b) => a.order - b.order)
      }));
    }
  },

  setLevelStatus: async (id, status) => {
    const { error } = await supabase
      .from('levels')
      .update({ status })
      .eq('id', id);

    if (!error) {
      set(state => ({
        levels: state.levels.map(level =>
          level.id === id ? { ...level, status } : level
        )
      }));
    }
  },

  reorderLevel: async (id: string, newOrder: number) => {
    const levels = get().levels;
    const level = levels.find(l => l.id === id);
    if (!level) return;

    const oldOrder = level.order;
    
    // Optimistically update the UI
    set(state => ({
      levels: state.levels.map(l => {
        if (l.id === id) {
          return { ...l, order: newOrder };
        }
        if (newOrder > oldOrder && l.order > oldOrder && l.order <= newOrder) {
          return { ...l, order: l.order - 1 };
        }
        if (newOrder < oldOrder && l.order >= newOrder && l.order < oldOrder) {
          return { ...l, order: l.order + 1 };
        }
        return l;
      }).sort((a, b) => a.order - b.order)
    }));

    try {
      // Update orders of levels between old and new positions
      await supabase
        .rpc('update_level_orders', {
          old_order: oldOrder,
          new_order: newOrder,
          level_id: id
        });
    } catch (error) {
      // If there's an error, reload the levels to get the correct order
      await get().loadLevels();
    }
  },

  // Group actions
  loadGroups: async (academicYearId) => {
    const { data } = await supabase
      .from('groups')
      .select(`
        *,
        academic_year:academic_years(*),
        class:classes(*),
        teacher:teachers(*),
        students:group_students(student_id)
      `)
      .eq('academic_year_id', academicYearId);

    if (data) {
      set({
        groups: data.map(group => ({
          id: group.id,
          name: group.name,
          academicYearId: group.academic_year_id,
          classId: group.class_id,
          teacherId: group.teacher_id,
          createdAt: group.created_at,
          academicYear: group.academic_year,
          class: group.class,
          teacher: group.teacher,
          students: group.students.map((s: any) => s.student_id)
        }))
      });
    }
  },

  addGroup: async (group) => {
    const { data, error } = await supabase
      .from('groups')
      .insert([{
        name: group.name,
        academic_year_id: group.academicYearId,
        class_id: group.classId,
        teacher_id: group.teacherId
      }])
      .select(`
        *,
        academic_year:academic_years(*),
        class:classes(*),
        teacher:teachers(*)
      `)
      .single();

    if (data && !error) {
      // Add students to group
      if (group.students && group.students.length > 0) {
        const studentRecords = group.students.map(studentId => ({
          group_id: data.id,
          student_id: studentId
        }));

        await supabase
          .from('group_students')
          .insert(studentRecords);
      }

      const newGroup: Group = {
        id: data.id,
        name: data.name,
        academicYearId: data.academic_year_id,
        classId: data.class_id,
        teacherId: data.teacher_id,
        createdAt: data.created_at,
        academicYear: data.academic_year,
        class: data.class,
        teacher: data.teacher,
        students: group.students
      };

      set(state => ({
        groups: [...state.groups, newGroup]
      }));
    }
  },

  updateGroup: async (group) => {
    const { error } = await supabase
      .from('groups')
      .update({
        name: group.name,
        class_id: group.classId,
        teacher_id: group.teacherId
      })
      .eq('id', group.id);

    if (!error) {
      // Update students
      await supabase
        .from('group_students')
        .delete()
        .eq('group_id', group.id);

      if (group.students && group.students.length > 0) {
        const studentRecords = group.students.map(studentId => ({
          group_id: group.id,
          student_id: studentId
        }));

        await supabase
          .from('group_students')
          .insert(studentRecords);
      }

      set(state => ({
        groups: state.groups.map(g =>
          g.id === group.id ? group : g
        )
      }));
    }
  },

  // Badge actions
  loadBadges: async () => {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('id', { ascending: false });
    if (data && !error) {
      set({ badges: data });
    }
  },

  addBadge: async (badge) => {
    const { data, error } = await supabase
      .from('badges')
      .insert([badge])
      .select()
      .single();
    if (data && !error) {
      set(state => ({ badges: [data, ...state.badges] }));
    }
  },

  updateBadge: async (badge) => {
    const { data, error } = await supabase
      .from('badges')
      .update({
        icon: badge.icon,
        description: badge.description
      })
      .eq('id', badge.id)
      .select()
      .single();
    if (data && !error) {
      set(state => ({
        badges: state.badges.map(b => b.id === badge.id ? data : b)
      }));
    }
  },
}));