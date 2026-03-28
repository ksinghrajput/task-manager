import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Column, CreateColumnDto } from '../models/column.model';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ColumnService {
  constructor(private http: HttpClient) {}

  createColumn(dto: CreateColumnDto) {
    return this.http.post<Column>(`${API}/columns`, dto);
  }

  updateColumn(id: string, dto: Partial<CreateColumnDto>) {
    return this.http.patch<Column>(`${API}/columns/${id}`, dto);
  }

  deleteColumn(id: string) {
    return this.http.delete<{ message: string }>(`${API}/columns/${id}`);
  }
}
