export interface Column {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  created_at?: string;
}

export interface CreateColumnDto {
  board_id: string;
  name: string;
  color?: string;
}
