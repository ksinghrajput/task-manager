import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-card">
      <div class="card-header">
        <h1>Welcome back</h1>
        <p>Sign in to your workspace</p>
      </div>

      @if (error()) {
        <div class="alert alert-error">{{ error() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="form-group">
          <label for="email">Email address</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="you@company.com"
            autocomplete="email"
            [class.invalid]="form.get('email')?.touched && form.get('email')?.invalid"
          />
          @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
            <span class="field-error">Email is required</span>
          }
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder="Enter your password"
            autocomplete="current-password"
            [class.invalid]="form.get('password')?.touched && form.get('password')?.invalid"
          />
          @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
            <span class="field-error">Password is required</span>
          }
        </div>

        <button type="submit" class="btn-primary" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Signing in... }
          @else { Sign in }
        </button>
      </form>

      <p class="auth-link">
        Don't have an account? <a routerLink="/auth/register">Create one</a>
      </p>
    </div>
  `,
  styles: [`
    .login-card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .card-header { margin-bottom: 28px; }
    .card-header h1 { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 6px; }
    .card-header p { color: #6b7280; font-size: 14px; margin: 0; }
    .alert { padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
    .alert-error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .auth-form { display: flex; flex-direction: column; gap: 18px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 600; color: #374151; }
    input {
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      color: #1a1a2e;
      outline: none;
      transition: border-color 0.15s;
    }
    input:focus { border-color: #6366f1; }
    input.invalid { border-color: #dc2626; }
    .field-error { font-size: 12px; color: #dc2626; }
    .btn-primary {
      padding: 11px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .auth-link { text-align: center; margin-top: 20px; font-size: 14px; color: #6b7280; }
    .auth-link a { color: #6366f1; font-weight: 600; text-decoration: none; }
    .auth-link a:hover { text-decoration: underline; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  error = signal('');

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (msg) => {
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
