export interface Point {
  id: string;
  name: string;
  description: string;
  point: number;
  createdAt: string;
}

export interface StudentPoint {
  id: string;
  studentId: string;
  pointId: string;
  createdAt: string;
  point?: Point;
}