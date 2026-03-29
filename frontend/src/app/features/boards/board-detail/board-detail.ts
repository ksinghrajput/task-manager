import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Board } from '../../../core/models/board.model';
import { Column } from '../../../core/models/column.model';
import { Task, CreateTaskDto } from '../../../core/models/task.model';
import { User } from '../../../core/models/user.model';
import { BoardService } from '../../../core/services/board.service';
import { TaskService } from '../../../core/services/task.service';
import { ColumnService } from '../../../core/services/column.service';
import { KanbanColumnComponent } from './components/kanban-column/kanban-column';
import { TaskModalComponent } from './components/task-modal/task-modal';

@Component({
  selector: 'app-board-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, KanbanColumnComponent, TaskModalComponent],
  template: `
    <div class="board-detail">
      <!-- Board Header -->
      <div class="board-header">
        <div class="board-nav">
          <a routerLink="/boards" class="back-link">← Boards</a>
          <span class="breadcrumb-sep">/</span>
          @if (board()) {
            <span class="board-breadcrumb">
              {{ board()!.icon }} {{ board()!.name }}
            </span>
          }
        </div>
        <div class="board-actions">
          <div class="members-stack">
            @for (member of members().slice(0, 4); track member.id) {
              <div class="member-avatar" [title]="member.name">{{ initials(member.name) }}</div>
            }
            @if (members().length > 4) {
              <div class="member-avatar more">+{{ members().length - 4 }}</div>
            }
          </div>
          <button class="btn-secondary" (click)="showAddColumn.set(!showAddColumn())">
            + Column
          </button>
          <button class="btn-primary" (click)="openAddTask(null)">+ Add Task</button>
        </div>
      </div>

      <!-- Board Description -->
      @if (board()?.description) {
        <p class="board-desc">{{ board()!.description }}</p>
      }

      <!-- Filter Bar -->
      <div class="filter-bar">
        <input class="search-input" [(ngModel)]="searchQuery" placeholder="🔍 Search tasks..."
          [ngModelOptions]="{standalone: true}" />
        <select class="filter-select" [(ngModel)]="priorityFilter" [ngModelOptions]="{standalone: true}">
          <option value="">All priorities</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🔵 Medium</option>
          <option value="low">⚪ Low</option>
        </select>
        <select class="filter-select" [(ngModel)]="assigneeFilter" [ngModelOptions]="{standalone: true}">
          <option value="">All assignees</option>
          @for (m of members(); track m.id) {
            <option [value]="m.id">{{ m.name }}</option>
          }
        </select>
        <span class="task-total">{{ filteredTasks().length }} tasks</span>
      </div>

      <!-- Kanban Board -->
      @if (loading()) {
        <div class="board-loading">
          <div class="spinner-lg"></div>
          <span>Loading board...</span>
        </div>
      } @else {
        <div class="kanban-board">
          @for (column of columns(); track column.id) {
            <app-kanban-column
              [column]="column"
              [tasks]="tasksForColumn(column.id)"
              (addTask)="openAddTask($event)"
              (taskClicked)="openTask($event)"
              (taskDropped)="moveTask($event)"
            />
          }

          <!-- Add Column Inline -->
          @if (showAddColumn()) {
            <div class="new-column-card">
              <input class="new-col-input" [formControl]="newColumnCtrl"
                placeholder="Column name" (keydown.enter)="addColumn()"
                (keydown.escape)="showAddColumn.set(false)" autofocus />
              <div class="new-col-actions">
                <button class="btn-primary-sm" (click)="addColumn()" [disabled]="!newColumnCtrl.value?.trim()">Add</button>
                <button class="btn-ghost-sm" (click)="showAddColumn.set(false)">Cancel</button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Add Task Modal -->
    @if (showAddTask()) {
      <div class="modal-overlay" (click)="showAddTask.set(false)">
        <div class="add-task-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create Task</h2>
            <button class="close-btn" (click)="showAddTask.set(false)">✕</button>
          </div>
          <form [formGroup]="taskForm" (ngSubmit)="createTask()" class="task-form">
            <div class="form-group">
              <label>Title *</label>
              <input formControlName="title" type="text" placeholder="What needs to be done?" autofocus />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" placeholder="Add details..." rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Column</label>
                <select formControlName="column_id">
                  @for (col of columns(); track col.id) {
                    <option [value]="col.id">{{ col.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select formControlName="priority">
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Assignee</label>
                <select formControlName="assignee_id">
                  <option value="">Unassigned</option>
                  @for (m of members(); track m.id) {
                    <option [value]="m.id">{{ m.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input formControlName="due_date" type="date" />
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showAddTask.set(false)">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="taskForm.invalid || creatingTask()">
                {{ creatingTask() ? 'Creating...' : 'Create Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Task Detail Modal -->
    @if (selectedTask()) {
      <app-task-modal
        [task]="selectedTask()!"
        [columns]="columns()"
        [members]="members()"
        (close)="selectedTask.set(null)"
        (updated)="onTaskUpdated($event)"
        (deleted)="onTaskDeleted($event)"
      />
    }
  `,
  styles: [`
    .board-detail { display: flex; flex-direction: column; height: calc(100vh - 60px - 48px); }
    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .board-nav { display: flex; align-items: center; gap: 8px; }
    .back-link { font-size: 14px; color: #6366f1; text-decoration: none; font-weight: 500; }
    .back-link:hover { text-decoration: underline; }
    .breadcrumb-sep { color: #d1d5db; }
    .board-breadcrumb { font-size: 16px; font-weight: 700; color: #1a1a2e; }
    .board-actions { display: flex; align-items: center; gap: 10px; }
    .members-stack { display: flex; flex-direction: row-reverse; }
    .member-avatar {
      width: 30px; height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: white;
      margin-left: -8px;
      cursor: default;
    }
    .member-avatar.more { background: #e5e7eb; color: #6b7280; }
    .btn-primary {
      padding: 8px 16px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: #4f46e5; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      padding: 8px 16px;
      background: white;
      color: #374151;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-secondary:hover { background: #f9fafb; }
    .board-desc { font-size: 13px; color: #6b7280; margin: 0 0 12px; }
    .filter-bar {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 16px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .search-input {
      padding: 8px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      min-width: 200px;
      background: white;
    }
    .search-input:focus { border-color: #6366f1; }
    .filter-select {
      padding: 8px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      background: white;
      cursor: pointer;
    }
    .filter-select:focus { border-color: #6366f1; }
    .task-total { font-size: 13px; color: #9ca3af; margin-left: auto; }
    .board-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex: 1;
      color: #6b7280;
    }
    .spinner-lg {
      width: 32px; height: 32px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .kanban-board {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      flex: 1;
      padding-bottom: 16px;
      align-items: flex-start;
    }
    .kanban-board::-webkit-scrollbar { height: 6px; }
    .kanban-board::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 3px; }
    .kanban-board::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
    .new-column-card {
      background: #f8f9fb;
      border-radius: 12px;
      width: 260px;
      min-width: 260px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .new-col-input {
      padding: 10px 12px;
      border: 1.5px solid #6366f1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .new-col-actions { display: flex; gap: 6px; }
    .btn-primary-sm {
      padding: 6px 14px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost-sm {
      padding: 6px 14px;
      background: transparent;
      border: none;
      font-size: 13px;
      color: #6b7280;
      cursor: pointer;
      border-radius: 6px;
    }
    .btn-ghost-sm:hover { background: #e5e7eb; }
    /* Add Task Modal */
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
    .add-task-modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f3f5;
    }
    .modal-header h2 { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0; }
    .close-btn {
      width: 30px; height: 30px;
      border: none;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #6b7280;
    }
    .close-btn:hover { background: #e5e7eb; }
    .task-form { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    label { font-size: 13px; font-weight: 600; color: #374151; }
    input[type=text], input[type=date], textarea, select {
      padding: 9px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s;
      font-family: inherit;
      background: white;
    }
    input:focus, textarea:focus, select:focus { border-color: #6366f1; }
    textarea { resize: vertical; }
    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding-top: 4px;
      border-top: 1px solid #f1f3f5;
    }
  `],
})
export class BoardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private columnService = inject(ColumnService);
  private fb = inject(FormBuilder);

  board = signal<Board | null>(null);
  columns = signal<Column[]>([]);
  tasks = signal<Task[]>([]);
  members = signal<User[]>([]);
  loading = signal(true);
  showAddTask = signal(false);
  showAddColumn = signal(false);
  selectedTask = signal<Task | null>(null);
  creatingTask = signal(false);

  searchQuery = '';
  priorityFilter = '';
  assigneeFilter = '';

  newColumnCtrl = this.fb.control('');

  taskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    column_id: ['', Validators.required],
    priority: ['medium'],
    assignee_id: [''],
    due_date: [''],
  });

  filteredTasks = computed(() => {
    return this.tasks().filter(t => {
      const matchSearch = !this.searchQuery ||
        t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchPriority = !this.priorityFilter || t.priority === this.priorityFilter;
      const matchAssignee = !this.assigneeFilter || t.assignee_id === this.assigneeFilter;
      return matchSearch && matchPriority && matchAssignee;
    });
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.boardService.getBoard(id).subscribe({
      next: (board) => {
        this.board.set(board);
        this.columns.set(board.columns || []);
        this.tasks.set(board.tasks || []);
        this.members.set(board.members || []);
        if (board.columns?.length) {
          this.taskForm.patchValue({ column_id: board.columns[0].id });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  tasksForColumn(columnId: string): Task[] {
    return this.filteredTasks().filter(t => t.column_id === columnId);
  }

  openAddTask(column: Column | null) {
    if (column) this.taskForm.patchValue({ column_id: column.id });
    this.showAddTask.set(true);
  }

  openTask(task: Task) {
    this.selectedTask.set(task);
  }

  createTask() {
    if (this.taskForm.invalid) return;
    this.creatingTask.set(true);
    const v = this.taskForm.value;
    const dto: CreateTaskDto = {
      title: v.title!,
      description: v.description || undefined,
      column_id: v.column_id!,
      board_id: this.board()!.id,
      assignee_id: v.assignee_id || undefined,
      priority: v.priority as Task['priority'],
      due_date: v.due_date || undefined,
    };
    this.taskService.createTask(dto).subscribe({
      next: (task) => {
        this.tasks.update(t => [...t, task]);
        this.showAddTask.set(false);
        this.taskForm.reset({ priority: 'medium', column_id: this.columns()[0]?.id });
        this.creatingTask.set(false);
      },
      error: () => this.creatingTask.set(false),
    });
  }

  moveTask(event: { task: Task; columnId: string }) {
    const prev = this.tasks();
    this.tasks.update(tasks =>
      tasks.map(t => t.id === event.task.id ? { ...t, column_id: event.columnId } : t)
    );
    this.taskService.updateTask(event.task.id, { column_id: event.columnId }).subscribe({
      next: (updated) => {
        this.tasks.update(tasks =>
          tasks.map(t => t.id === updated.id ? { ...t, ...updated } : t)
        );
      },
      error: () => this.tasks.set(prev),
    });
  }

  addColumn() {
    const name = this.newColumnCtrl.value?.trim();
    if (!name) return;
    this.columnService.createColumn({ board_id: this.board()!.id, name }).subscribe({
      next: (col) => {
        this.columns.update(c => [...c, col]);
        this.newColumnCtrl.reset();
        this.showAddColumn.set(false);
      },
    });
  }

  onTaskUpdated(task: Task) {
    this.tasks.update(tasks => tasks.map(t => t.id === task.id ? { ...t, ...task } : t));
  }

  onTaskDeleted(taskId: string) {
    this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
