import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-brand">
        <div class="brand-logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">TaskFlow</span>
        </div>
        <p class="brand-tagline">Enterprise-grade project management</p>
      </div>
      <div class="auth-content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 420px 1fr;
      background: #f4f5f7;
    }
    .auth-brand {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 48px;
      color: white;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .logo-icon {
      font-size: 40px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      color: rgba(255,255,255,0.65);
      font-size: 15px;
      text-align: center;
    }
    .auth-content {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px;
    }
    @media (max-width: 768px) {
      .auth-layout { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `],
})
export class AuthLayoutComponent {}
