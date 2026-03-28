import { User } from './user.model';
import { Column } from './column.model';
import { Task } from './task.model';

export interface Board {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  owner_id: string;
  owner_name?: string;
  is_archived: boolean;
  member_count?: number;
  task_count?: number;
  my_role?: 'admin' | 'member' | 'viewer';
  created_at: string;
  updated_at: string;
  columns?: Column[];
  tasks?: Task[];
  members?: User[];
}

export interface CreateBoardDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}
