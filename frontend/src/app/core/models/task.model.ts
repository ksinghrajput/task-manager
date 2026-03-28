export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  column_id: string;
  board_id: string;
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  reporter_id: string;
  reporter_name?: string;
  priority: Priority;
  due_date?: string;
  position: number;
  labels: string[];
  attachments: string[];
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  column_id: string;
  board_id: string;
  assignee_id?: string;
  priority?: Priority;
  due_date?: string;
  labels?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  column_id?: string;
  assignee_id?: string | null;
  priority?: Priority;
  due_date?: string;
  labels?: string[];
}
