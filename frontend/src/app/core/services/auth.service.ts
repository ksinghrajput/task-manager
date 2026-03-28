import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(localStorage.getItem('accessToken'));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) {
    if (this._token()) {
      this.loadCurrentUser();
    }
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/auth/login`, { email, password }).pipe(
      tap((res) => this.handleAuthSuccess(res)),
      catchError((err) => throwError(() => err.error?.message || 'Login failed'))
    );
  }

  register(name: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${API}/auth/register`, { name, email, password }).pipe(
      tap((res) => this.handleAuthSuccess(res)),
      catchError((err) => throwError(() => err.error?.message || 'Registration failed'))
    );
  }

  logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    this.http.post(`${API}/auth/logout`, { refreshToken }).subscribe();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  loadCurrentUser() {
    this.http
      .get<User>(`${API}/auth/me`)
      .pipe(catchError(() => throwError(() => null)))
      .subscribe({
        next: (user) => this._user.set(user),
        error: () => this.logout(),
      });
  }

  updateUser(user: User) {
    this._user.set(user);
  }

  private handleAuthSuccess(res: AuthResponse) {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    this._token.set(res.accessToken);
    this._user.set(res.user);
  }
}
