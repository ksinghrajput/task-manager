import { Request } from 'express';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  owner_id: string;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  column_id: string;
  board_id: string;
  assignee_id?: string;
  reporter_id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  due_date?: Date;
  position: number;
  labels: string[];
  attachments: string[];
  created_at: Date;
  updated_at: Date;
}

export interface BoardMember {
  board_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: Date;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}
