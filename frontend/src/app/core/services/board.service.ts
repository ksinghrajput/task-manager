import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Board, CreateBoardDto } from '../models/board.model';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class BoardService {
  constructor(private http: HttpClient) {}

  getBoards() {
    return this.http.get<Board[]>(`${API}/boards`);
  }

  getBoard(id: string) {
    return this.http.get<Board>(`${API}/boards/${id}`);
  }

  createBoard(dto: CreateBoardDto) {
    return this.http.post<Board>(`${API}/boards`, dto);
  }

  updateBoard(id: string, dto: Partial<CreateBoardDto>) {
    return this.http.patch<Board>(`${API}/boards/${id}`, dto);
  }

  deleteBoard(id: string) {
    return this.http.delete<{ message: string }>(`${API}/boards/${id}`);
  }

  addMember(boardId: string, email: string, role: string = 'member') {
    return this.http.post<{ message: string }>(`${API}/boards/${boardId}/members`, {
      email,
      role,
    });
  }

  getActivity(boardId: string) {
    return this.http.get<unknown[]>(`${API}/boards/${boardId}/activity`);
  }
}
