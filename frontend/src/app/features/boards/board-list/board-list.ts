import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BoardService } from '../../../core/services/board.service';
import { Board, CreateBoardDto } from '../../../core/models/board.model';

const BOARD_COLORS = [
  '#6366f1', '#0057FF', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4',
];

const BOARD_ICONS = ['📋', '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '🛠️', '📊', '🎨'];

@Component({
  selector: 'app-board-list',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <div class="board-list">
      <div class="page-header">
        <div>
          <h1>My Boards</h1>
          <p class="subtitle">{{ boards().length }} workspace{{ boards().length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-primary" (click)="showModal.set(true)">+ New Board</button>
      </div>

      @if (loading()) {
        <div class="boards-grid">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="board-skeleton"></div>
          }
        </div>
      } @else if (boards().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🗂️</div>
          <h3>No boards yet</h3>
          <p>Create your first board to start managing projects</p>
          <button class="btn-primary" (click)="showModal.set(true)">Create your first board</button>
        </div>
      } @else {
        <div class="boards-grid">
          @for (board of boards(); track board.id) {
            <a [routerLink]="['/boards', board.id]" class="board-card" [style.border-top-color]="board.color">
              <div class="board-card-header">
                <span class="board-icon">{{ board.icon }}</span>
                <div class="board-actions">
                  <span class="board-role" [class]="board.my_role">{{ board.my_role }}</span>
                </div>
              </div>
              <h3 class="board-name">{{ board.name }}</h3>
              @if (board.description) {
                <p class="board-desc">{{ board.description }}</p>
              }
              <div class="board-footer">
                <div class="board-meta">
                  <span>📝 {{ board.task_count }}</span>
                  <span>👥 {{ board.member_count }}</span>
                </div>
                <span class="board-date">{{ formatDate(board.updated_at) }}</span>
              </div>
            </a>
          }
          <button class="board-card new-board-card" (click)="showModal.set(true)">
            <span class="plus-icon">+</span>
            <span>New Board</span>
          </button>
        </div>
      }
    </div>

    <!-- Create Board Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create New Board</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <form [formGroup]="boardForm" (ngSubmit)="createBoard()" class="modal-form">
            <div class="form-group">
              <label>Board Name *</label>
              <input formControlName="name" type="text" placeholder="e.g. Product Roadmap"
                [class.invalid]="boardForm.get('name')?.touched && boardForm.get('name')?.invalid" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" placeholder="What is this board for?" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                @for (color of boardColors; track color) {
                  <button type="button" class="color-swatch"
                    [style.background]="color"
                    [class.selected]="boardForm.get('color')?.value === color"
                    (click)="boardForm.patchValue({ color })">
                  </button>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Icon</label>
              <div class="icon-picker">
                @for (icon of boardIcons; track icon) {
                  <button type="button" class="icon-swatch"
                    [class.selected]="boardForm.get('icon')?.value === icon"
                    (click)="boardForm.patchValue({ icon })">{{ icon }}</button>
                }
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="creating()">
                @if (creating()) { Creating... } @else { Create Board }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .board-list { max-width: 1200px; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .page-header h1 { font-size: 26px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
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
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
    .btn-secondary {
      padding: 9px 18px;
      background: white;
      color: #374151;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover { background: #f9fafb; }
    .boards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
    .board-skeleton {
      height: 160px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
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
      gap: 10px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      transition: box-shadow 0.15s, transform 0.15s;
      cursor: pointer;
    }
    .board-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.12); transform: translateY(-2px); }
    .new-board-card {
      border: 2px dashed #d1d5db;
      border-top: 2px dashed #d1d5db;
      background: transparent;
      justify-content: center;
      align-items: center;
      min-height: 160px;
      flex-direction: column;
      gap: 8px;
      color: #9ca3af;
      font-size: 14px;
      font-weight: 600;
      box-shadow: none;
    }
    .new-board-card:hover { border-color: #6366f1; color: #6366f1; background: #f5f3ff; transform: translateY(-2px); }
    .plus-icon { font-size: 28px; font-weight: 300; }
    .board-card-header { display: flex; justify-content: space-between; align-items: center; }
    .board-icon { font-size: 24px; }
    .board-role {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      text-transform: capitalize;
    }
    .board-role.admin { background: #fef3c7; color: #d97706; }
    .board-role.member { background: #ede9fe; color: #7c3aed; }
    .board-role.viewer { background: #f3f4f6; color: #6b7280; }
    .board-name { font-size: 16px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .board-desc { font-size: 13px; color: #6b7280; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }
    .board-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
    .board-meta { display: flex; gap: 12px; font-size: 12px; color: #9ca3af; }
    .board-date { font-size: 11px; color: #d1d5db; }
    .empty-state {
      text-align: center;
      padding: 80px 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .empty-icon { font-size: 56px; margin-bottom: 16px; }
    .empty-state h3 { font-size: 20px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
    .empty-state p { color: #6b7280; margin: 0 0 24px; }
    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }
    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f3f4f6;
    }
    .modal-header h2 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #9ca3af; padding: 4px; }
    .modal-close:hover { color: #1a1a2e; }
    .modal-form { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 600; color: #374151; }
    input, textarea {
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
      resize: vertical;
    }
    input:focus, textarea:focus { border-color: #6366f1; }
    input.invalid { border-color: #dc2626; }
    .color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 28px; height: 28px;
      border-radius: 50%;
      border: 3px solid transparent;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: #1a1a2e; transform: scale(1.15); }
    .icon-picker { display: flex; gap: 6px; flex-wrap: wrap; }
    .icon-swatch {
      width: 36px; height: 36px;
      font-size: 18px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.1s;
    }
    .icon-swatch:hover { border-color: #6366f1; }
    .icon-swatch.selected { border-color: #6366f1; background: #f5f3ff; }
    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding-top: 4px;
      border-top: 1px solid #f3f4f6;
    }
  `],
})
export class BoardListComponent implements OnInit {
  private boardService = inject(BoardService);
  private fb = inject(FormBuilder);

  boards = signal<Board[]>([]);
  loading = signal(true);
  showModal = signal(false);
  creating = signal(false);

  boardColors = BOARD_COLORS;
  boardIcons = BOARD_ICONS;

  boardForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    color: ['#6366f1'],
    icon: ['📋'],
  });

  ngOnInit() {
    this.loadBoards();
  }

  loadBoards() {
    this.boardService.getBoards().subscribe({
      next: (boards) => { this.boards.set(boards); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  createBoard() {
    if (this.boardForm.invalid) { this.boardForm.markAllAsTouched(); return; }
    this.creating.set(true);
    const dto = this.boardForm.value as CreateBoardDto;
    this.boardService.createBoard(dto).subscribe({
      next: (board) => {
        this.boards.update(b => [board, ...b]);
        this.closeModal();
        this.creating.set(false);
      },
      error: () => this.creating.set(false),
    });
  }

  closeModal() {
    this.showModal.set(false);
    this.boardForm.reset({ name: '', description: '', color: '#6366f1', icon: '📋' });
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
