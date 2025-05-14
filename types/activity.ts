export interface ActivityLog {
  id: string;
  student_id: string;
  action_type: string;
  message: string;
  related_id: string;
  metadata: {
    [key: string]: any;
  };
  created_at: string;
  created_by: string;
} 