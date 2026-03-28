import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardService } from '../../core/services/board.service';
import { AuthService } from '../../core/services/auth.service';
import { Board } from '../../core/models/board.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Here's what's happening across your workspace</p>
        </div>
        <a routerLink="/boards/new" class="btn-primary">+ New Board</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#eef2ff">📋</div>
          <div class="stat-info">
            <div class="stat-value">{{ boards().length }}</div>
            <div class="stat-label">Active Boards</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f0fdf4">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalTasks() }}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalMembers() }}</div>
            <div class="stat-label">Team Members</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2>Recent Boards</h2>
          <a routerLink="/boards" class="link-all">View all</a>
        </div>

        @if (loading()) {
          <div class="loading-grid">
            @for (i of [1,2,3,4]; track i) {
              <div class="board-skeleton"></div>
            }
          </div>
        } @else if (boards().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No boards yet</h3>
            <p>Create your first board to get started</p>
            <a routerLink="/boards/new" class="btn-primary">Create Board</a>
          </div>
        } @else {
          <div class="boards-grid">
            @for (board of boards().slice(0, 4); track board.id) {
              <a [routerLink]="['/boards', board.id]" class="board-card" [style.border-top-color]="board.color">
                <div class="board-card-header">
                  <span class="board-icon">{{ board.icon }}</span>
                  <span class="board-role" [class]="board.my_role">{{ board.my_role }}</span>
                </div>
                <h3 class="board-name">{{ board.name }}</h3>
                @if (board.description) {
                  <p class="board-desc">{{ board.description }}</p>
                }
                <div class="board-meta">
                  <span class="meta-item">📝 {{ board.task_count }} tasks</span>
                  <span class="meta-item">👤 {{ board.member_count }} members</span>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1100px; }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .dashboard-header h1 { font-size: 26px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
    .subtitle { color: #6b7280; font-size: 14px; margin: 0; }
    .btn-primary {
      padding: 9px 18px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: background 0.15s;
    }
    .btn-primary:hover { background: #4f46e5; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .stat-value { font-size: 28px; font-weight: 700; color: #1a1a2e; }
    .stat-label { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .section { margin-bottom: 32px; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-header h2 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .link-all { font-size: 13px; color: #6366f1; text-decoration: none; font-weight: 500; }
    .link-all:hover { text-decoration: underline; }
    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .board-skeleton {
      height: 140px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      border-radius: 12px;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { to { background-position: -200% 0; } }
    .board-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      border-top: 4px solid #6366f1;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .board-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .board-card-header { display: flex; justify-content: space-between; align-items: center; }
    .board-icon { font-size: 22px; }
    .board-role {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
      text-transform: capitalize;
    }
    .board-role.admin { background: #fef3c7; color: #d97706; }
    .board-role.member { background: #ede9fe; color: #7c3aed; }
    .board-role.viewer { background: #f3f4f6; color: #6b7280; }
    .board-name { font-size: 15px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .board-desc { font-size: 13px; color: #6b7280; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .board-meta { display: flex; gap: 12px; margin-top: 4px; }
    .meta-item { font-size: 12px; color: #9ca3af; }
    .empty-state {
      text-align: center;
      padding: 60px 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
    .empty-state p { color: #6b7280; font-size: 14px; margin: 0 0 20px; }
  `],
})
export class DashboardComponent implements OnInit {
  private boardService = inject(BoardService);

  boards = signal<Board[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.boardService.getBoards().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  totalTasks() { return this.boards().reduce((s, b) => s + (b.task_count || 0), 0); }
  totalMembers() {
    const ids = new Set(this.boards().map(b => b.owner_id));
    return ids.size;
  }
}
