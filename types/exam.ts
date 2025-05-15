export interface Exam {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItqonExam {
  id: string;
  examId: string;
  studentId: string;
  teacherId: string;
  examDate: string;
  tahfidzScore?: 'Outstanding' | 'Very Good' | 'Good' | 'Need Improvement' | 'Bad' | 'Very Bad';
  tajwidScore?: 'Outstanding' | 'Very Good' | 'Good' | 'Need Improvement' | 'Bad' | 'Very Bad';
  status?: 'Scheduled' | 'Passed' | 'Failed';
  createdAt: string;
  updatedAt: string;
  exam?: Exam;
  student?: {
    id: string;
    name: string;
  };
  teacher?: {
    id: string;
    name: string;
  };
}