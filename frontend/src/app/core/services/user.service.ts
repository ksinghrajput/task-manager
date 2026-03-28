import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user.model';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<User[]>(`${API}/users`);
  }

  updateProfile(name: string, avatar?: string) {
    return this.http.patch<User>(`${API}/users/me`, { name, avatar });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<{ message: string }>(`${API}/users/me/password`, {
      currentPassword,
      newPassword,
    });
  }
}
