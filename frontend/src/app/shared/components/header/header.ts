import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  template: `
    <header class="header">
      <div class="header-left">
        <div class="breadcrumb">
          <span class="breadcrumb-greeting">Good day, {{ firstName() }}</span>
        </div>
      </div>
      <div class="header-right">
        <div class="header-avatar">{{ initials() }}</div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      height: 60px;
      background: white;
      border-bottom: 1px solid #e8eaed;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
    }
    .breadcrumb-greeting {
      font-size: 15px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .header-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: white;
      cursor: pointer;
    }
  `],
})
export class HeaderComponent {
  auth = inject(AuthService);
  initials() {
    const name = this.auth.user()?.name || '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  firstName() {
    return this.auth.user()?.name?.split(' ')[0] || 'there';
  }
}
