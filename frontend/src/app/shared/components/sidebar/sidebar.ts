import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand">
          <span class="brand-icon">⚡</span>
          <span class="brand-name">TaskFlow</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/boards" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>My Boards</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Workspace</div>
          <a routerLink="/boards" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🗂️</span>
            <span>All Projects</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        @if (auth.user()) {
          <div class="user-info">
            <div class="user-avatar">{{ initials() }}</div>
            <div class="user-details">
              <div class="user-name">{{ auth.user()!.name }}</div>
              <div class="user-email">{{ auth.user()!.email }}</div>
            </div>
          </div>
          <button class="logout-btn" (click)="auth.logout()">Sign out</button>
        }
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      background: #1a1a2e;
      color: #c8ccd4;
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
    }
    .sidebar-header {
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: white;
    }
    .brand-icon { font-size: 22px; }
    .brand-name { font-size: 18px; font-weight: 700; color: white; }
    .sidebar-nav {
      flex: 1;
      padding: 12px 8px;
      overflow-y: auto;
    }
    .nav-section { margin-bottom: 20px; }
    .nav-section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: rgba(255,255,255,0.35);
      padding: 0 12px;
      margin-bottom: 6px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: #c8ccd4;
      font-size: 14px;
      transition: background 0.15s, color 0.15s;
      cursor: pointer;
    }
    .nav-item:hover { background: rgba(255,255,255,0.07); color: white; }
    .nav-item.active { background: rgba(99,102,241,0.2); color: #818cf8; }
    .nav-icon { font-size: 16px; width: 20px; text-align: center; }
    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .user-avatar {
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
      flex-shrink: 0;
    }
    .user-details { overflow: hidden; }
    .user-name { font-size: 13px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { font-size: 11px; color: rgba(255,255,255,0.4); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .logout-btn {
      width: 100%;
      padding: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      color: #c8ccd4;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .logout-btn:hover { background: rgba(255,255,255,0.1); color: white; }
  `],
})
export class SidebarComponent {
  auth = inject(AuthService);
  initials() {
    const name = this.auth.user()?.name || '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
