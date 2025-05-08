export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: boolean;
  createdAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  address: string;
  dateOfBirth: string;
  placeOfBirth: string;
  phone: string;
  joinDate: string;
  gender: "Ikhwan" | "Akhwat";
  status: boolean;
  roles: string[];
  createdAt: string;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacher?: Teacher;
  createdAt: string;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  status: boolean;
  order: number;
  createdAt: string;
}

export interface Group {
  id: string;
  academicYearId: string;
  classId: string;
  teacherId: string;
  name: string;
  createdAt: string;
  academicYear?: AcademicYear;
  class?: Class;
  teacher?: Teacher;
  students?: string[];
}