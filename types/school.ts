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
  username: string;
  password: string;
  email: string;
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

export interface Exam {
  id: string;
  name: string;
  description: string;
  levelId: string;
  status: boolean;
  createdAt: string;
  level?: Level;
}

export interface NameValuePair {
  name: string;
  value: string;
}

export interface SchoolSettings {
  id: string;
  name: string;
  accountNumber: string;
  principalName: string;
  establishedYear: number;
  address: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  email: string;
  websiteUrl: string;
  facilities: NameValuePair[];
  studentCount: NameValuePair[];
  staffCount: NameValuePair[];
  schoolCode: string;
  latitude: number;
  longitude: number;
  bankAccount: NameValuePair[];
  createdAt: string;
  updatedAt: string;
}