export interface Point {
  id: string;
  name: string;
  description: string;
  point: number;
  created_at: string;
}

export interface StudentPoint {
  id: string;
  student_id: string;
  point_id: string;
  created_at: string;
  point?: Point;
  student?: {
    id: string;
    name: string;
  };
}