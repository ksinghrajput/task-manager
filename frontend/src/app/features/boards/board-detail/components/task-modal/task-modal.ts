import { Component, Input, Output, EventEmitter, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Task, UpdateTaskDto, Comment } from '../../../../../core/models/task.model';
import { Column } from '../../../../../core/models/column.model';
import { User } from '../../../../../core/models/user.model';
import { TaskService } from '../../../../../core/services/task.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="task-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="task-id">TASK-{{ task.id.substring(0, 8).toUpperCase() }}</div>
          <div class="header-actions">
            <button class="delete-btn" (click)="onDelete()">🗑️ Delete</button>
            <button class="close-btn" (click)="close.emit()">✕</button>
          </div>
        </div>

        <div class="modal-body">
          <div class="modal-main">
            <!-- Title -->
            @if (editingTitle()) {
              <input class="title-input" [value]="task.title"
                #titleInput
                (blur)="saveTitle(titleInput.value)"
                (keydown.enter)="saveTitle(titleInput.value)"
                (keydown.escape)="editingTitle.set(false)"
                autofocus />
            } @else {
              <h2 class="task-title" (click)="editingTitle.set(true)">{{ task.title }}</h2>
            }

            <!-- Description -->
            <div class="section">
              <label class="section-label">Description</label>
              @if (editingDesc()) {
                <textarea class="desc-textarea" [value]="task.description || ''"
                  #descInput rows="4"
                  placeholder="Add a description..."
                  (blur)="saveDesc(descInput.value)"
                  autofocus></textarea>
              } @else {
                <div class="desc-content" (click)="editingDesc.set(true)">
                  {{ task.description || 'Click to add description...' }}
                </div>
              }
            </div>

            <!-- Comments -->
            <div class="section">
              <label class="section-label">Comments ({{ task.comments?.length || 0 }})</label>
              <div class="comments-list">
                @for (comment of task.comments; track comment.id) {
                  <div class="comment">
                    <div class="comment-avatar">{{ initials(comment.user_name || '') }}</div>
                    <div class="comment-content">
                      <div class="comment-meta">
                        <span class="comment-author">{{ comment.user_name }}</span>
                        <span class="comment-time">{{ formatDate(comment.created_at) }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                    </div>
                  </div>
                }
              </div>
              <div class="add-comment">
                <textarea class="comment-input" [(ngModel)]="newComment" placeholder="Write a comment..."
                  rows="2" [ngModelOptions]="{standalone: true}"></textarea>
                <button class="btn-comment" [disabled]="!newComment.trim() || saving()"
                  (click)="addComment()">
                  {{ saving() ? 'Posting...' : 'Post' }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-sidebar">
            <!-- Status/Column -->
            <div class="sidebar-field">
              <label>Status</label>
              <select [value]="task.column_id" (change)="onColumnChange($event)">
                @for (col of columns; track col.id) {
                  <option [value]="col.id">{{ col.name }}</option>
                }
              </select>
            </div>

            <!-- Priority -->
            <div class="sidebar-field">
              <label>Priority</label>
              <select [value]="task.priority" (change)="onPriorityChange($event)">
                <option value="critical">🔴 Critical</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>

            <!-- Assignee -->
            <div class="sidebar-field">
              <label>Assignee</label>
              <select [value]="task.assignee_id || ''" (change)="onAssigneeChange($event)">
                <option value="">Unassigned</option>
                @for (member of members; track member.id) {
                  <option [value]="member.id">{{ member.name }}</option>
                }
              </select>
            </div>

            <!-- Due Date -->
            <div class="sidebar-field">
              <label>Due Date</label>
              <input type="date" [value]="dueDateValue()"
                (change)="onDueDateChange($event)" />
            </div>

            <!-- Labels -->
            <div class="sidebar-field">
              <label>Labels</label>
              <div class="labels-list">
                @for (label of task.labels; track label) {
                  <span class="label-chip">
                    {{ label }}
                    <button (click)="removeLabel(label)">×</button>
                  </span>
                }
              </div>
              <input class="label-input" placeholder="Add label + Enter"
                (keydown.enter)="addLabel($event)" />
            </div>

            <!-- Meta -->
            <div class="sidebar-meta">
              <div class="meta-row">
                <span class="meta-key">Reporter</span>
                <span class="meta-val">{{ task.reporter_name }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">Created</span>
                <span class="meta-val">{{ formatDate(task.created_at) }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-key">Updated</span>
                <span class="meta-val">{{ formatDate(task.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }
    .task-modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 820px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 64px rgba(0,0,0,0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #f1f3f5;
      flex-shrink: 0;
    }
    .task-id { font-size: 12px; font-weight: 600; color: #9ca3af; letter-spacing: 0.5px; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .delete-btn {
      padding: 6px 12px;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    .delete-btn:hover { background: #fee2e2; }
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
    .modal-body {
      display: grid;
      grid-template-columns: 1fr 240px;
      overflow: hidden;
      flex: 1;
    }
    .modal-main {
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .task-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0;
      cursor: text;
      padding: 4px 0;
      border-bottom: 2px solid transparent;
    }
    .task-title:hover { border-bottom-color: #e5e7eb; }
    .title-input {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      border: none;
      outline: none;
      border-bottom: 2px solid #6366f1;
      width: 100%;
      padding: 4px 0;
      background: transparent;
    }
    .section { display: flex; flex-direction: column; gap: 8px; }
    .section-label { font-size: 13px; font-weight: 600; color: #374151; }
    .desc-content {
      font-size: 14px;
      color: #6b7280;
      cursor: text;
      padding: 8px;
      border-radius: 6px;
      min-height: 40px;
      border: 1.5px solid transparent;
      line-height: 1.6;
    }
    .desc-content:hover { border-color: #e5e7eb; background: #f9fafb; }
    .desc-textarea {
      padding: 10px;
      border: 1.5px solid #6366f1;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      resize: vertical;
      font-family: inherit;
      color: #1a1a2e;
    }
    .comments-list { display: flex; flex-direction: column; gap: 12px; }
    .comment { display: flex; gap: 10px; }
    .comment-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }
    .comment-content { flex: 1; }
    .comment-meta { display: flex; gap: 8px; align-items: baseline; margin-bottom: 4px; }
    .comment-author { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .comment-time { font-size: 11px; color: #9ca3af; }
    .comment-text { font-size: 13px; color: #374151; margin: 0; line-height: 1.5; }
    .add-comment { display: flex; flex-direction: column; gap: 8px; }
    .comment-input {
      padding: 10px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      resize: none;
      font-family: inherit;
    }
    .comment-input:focus { border-color: #6366f1; }
    .btn-comment {
      align-self: flex-end;
      padding: 7px 16px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-comment:disabled { opacity: 0.5; cursor: not-allowed; }
    /* Sidebar */
    .modal-sidebar {
      padding: 24px 20px;
      border-left: 1px solid #f1f3f5;
      overflow-y: auto;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sidebar-field { display: flex; flex-direction: column; gap: 6px; }
    .sidebar-field label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .sidebar-field select, .sidebar-field input[type="date"] {
      padding: 8px 10px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      background: white;
      cursor: pointer;
    }
    .sidebar-field select:focus, .sidebar-field input[type="date"]:focus { border-color: #6366f1; }
    .labels-list { display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; }
    .label-chip {
      font-size: 11px;
      background: #f0fdf4;
      color: #16a34a;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid #bbf7d0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .label-chip button { background: none; border: none; cursor: pointer; color: #16a34a; font-size: 13px; padding: 0; line-height: 1; }
    .label-input {
      padding: 6px 10px;
      border: 1.5px solid #e5e7eb;
      border-radius: 6px;
      font-size: 12px;
      outline: none;
    }
    .label-input:focus { border-color: #6366f1; }
    .sidebar-meta { padding-top: 8px; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 8px; }
    .meta-row { display: flex; justify-content: space-between; }
    .meta-key { font-size: 12px; color: #9ca3af; }
    .meta-val { font-size: 12px; color: #374151; font-weight: 500; }
  `],
})
export class TaskModalComponent implements OnInit {
  @Input({ required: true }) task!: Task;
  @Input() columns: Column[] = [];
  @Input() members: User[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<Task>();
  @Output() deleted = new EventEmitter<string>();

  private taskService = inject(TaskService);

  editingTitle = signal(false);
  editingDesc = signal(false);
  saving = signal(false);
  newComment = '';

  ngOnInit() {
    if (this.task.id) {
      this.taskService.getTask(this.task.id).subscribe({
        next: (t) => { this.task = t; },
      });
    }
  }

  saveTitle(title: string) {
    this.editingTitle.set(false);
    if (title.trim() && title !== this.task.title) {
      this.taskService.updateTask(this.task.id, { title: title.trim() }).subscribe({
        next: (t) => { this.task = { ...this.task, ...t }; this.updated.emit(this.task); },
      });
    }
  }

  saveDesc(description: string) {
    this.editingDesc.set(false);
    if (description !== (this.task.description || '')) {
      this.taskService.updateTask(this.task.id, { description }).subscribe({
        next: (t) => { this.task = { ...this.task, ...t }; },
      });
    }
  }

  onColumnChange(event: Event) {
    const column_id = (event.target as HTMLSelectElement).value;
    this.taskService.updateTask(this.task.id, { column_id }).subscribe({
      next: (t) => { this.task = { ...this.task, ...t }; this.updated.emit(this.task); },
    });
  }

  onPriorityChange(event: Event) {
    const priority = (event.target as HTMLSelectElement).value as Task['priority'];
    this.taskService.updateTask(this.task.id, { priority }).subscribe({
      next: (t) => { this.task = { ...this.task, ...t }; this.updated.emit(this.task); },
    });
  }

  onAssigneeChange(event: Event) {
    const assignee_id = (event.target as HTMLSelectElement).value || null;
    this.taskService.updateTask(this.task.id, { assignee_id } as UpdateTaskDto).subscribe({
      next: (t) => { this.task = { ...this.task, ...t }; this.updated.emit(this.task); },
    });
  }

  onDueDateChange(event: Event) {
    const due_date = (event.target as HTMLInputElement).value;
    this.taskService.updateTask(this.task.id, { due_date: due_date || undefined }).subscribe({
      next: (t) => { this.task = { ...this.task, ...t }; },
    });
  }

  addLabel(event: Event) {
    const input = event.target as HTMLInputElement;
    const label = input.value.trim();
    if (label && !this.task.labels?.includes(label)) {
      const labels = [...(this.task.labels || []), label];
      this.taskService.updateTask(this.task.id, { labels }).subscribe({
        next: (t) => { this.task = { ...this.task, ...t }; input.value = ''; },
      });
    }
  }

  removeLabel(label: string) {
    const labels = this.task.labels.filter(l => l !== label);
    this.taskService.updateTask(this.task.id, { labels }).subscribe({
      next: (t) => { this.task = { ...this.task, ...t }; },
    });
  }

  addComment() {
    if (!this.newComment.trim()) return;
    this.saving.set(true);
    this.taskService.addComment(this.task.id, this.newComment).subscribe({
      next: (comment) => {
        this.task = { ...this.task, comments: [...(this.task.comments || []), comment] };
        this.newComment = '';
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  onDelete() {
    if (confirm('Delete this task? This cannot be undone.')) {
      this.taskService.deleteTask(this.task.id).subscribe({
        next: () => { this.deleted.emit(this.task.id); this.close.emit(); },
      });
    }
  }

  dueDateValue() {
    return this.task.due_date ? this.task.due_date.substring(0, 10) : '';
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
