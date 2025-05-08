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

export interface Student {
  id: string;
  name: string;
  gender: Gender;
  address: string;
  group: string;
  teacher: string;
  class: string;
  level: string;
  profileImageUrl: string;
  badges: Badge[];
  redemptions: Redemption[];
  status: boolean;
}