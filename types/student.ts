export interface Badge {
  id: string;
  icon: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  assigned_at?: string;
}

export interface Redemption {
  id: string;
  studentId: string;
  reward_name: string;
  points: number;
  redeemed_at: string;
  icon: string;
}

export type Gender = "Ikhwan" | "Akhwat";

export interface Class {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Level {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface StoryAction {
  id: string;
  storyId: string;
  sessionId: string;
  studentId: string;
  actionType: string;
  points: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  address: string;
  class_id: string;
  level_id: string;
  father_name?: string;
  mother_name?: string;
  wali_name?: string;
  school_info?: string;
  profileImageUrl: string;
  badges: Badge[];
  redemptions: Redemption[];
  status: boolean;
  class?: Class;
  level?: Level;
  placeOfBirth?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  lastAchievement?: string;
  totalPages?: number;
  registration_number?: string;
  national_id?: string;
  family_id?: string;
  joined_date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}