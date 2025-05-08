export interface Badge {
  id: string;
  icon: string;
  description: string;
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
}