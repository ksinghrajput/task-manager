import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task, CreateTaskDto, UpdateTaskDto, Comment } from '../models/task.model';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private http: HttpClient) {}

  getTask(id: string) {
    return this.http.get<Task>(`${API}/tasks/${id}`);
  }

  createTask(dto: CreateTaskDto) {
    return this.http.post<Task>(`${API}/tasks`, dto);
  }

  updateTask(id: string, dto: UpdateTaskDto) {
    return this.http.patch<Task>(`${API}/tasks/${id}`, dto);
  }

  deleteTask(id: string) {
    return this.http.delete<{ message: string }>(`${API}/tasks/${id}`);
  }

  addComment(taskId: string, content: string) {
    return this.http.post<Comment>(`${API}/tasks/${taskId}/comments`, { content });
  }
}
