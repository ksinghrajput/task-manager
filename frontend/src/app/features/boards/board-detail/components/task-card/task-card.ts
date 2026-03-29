import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Task } from '../../../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  host: {
    '[draggable]': 'true',
    '[style.cursor]': '"grab"',
    '[style.userSelect]': '"none"',
    '[style.display]': '"block"',
  },
  template: `
    <div class="task-card" (click)="clicked.emit(task)">
      <div class="task-header">
        <span class="priority-badge" [class]="'priority-' + task.priority">
          {{ priorityLabel(task.priority) }}
        </span>
        @if (task.due_date) {
          <span class="due-date" [class.overdue]="isOverdue()">
            📅 {{ formatDate(task.due_date) }}
          </span>
        }
      </div>
      <h4 class="task-title">{{ task.title }}</h4>
      @if (task.description) {
        <p class="task-desc">{{ task.description }}</p>
      }
      @if (task.labels && task.labels.length) {
        <div class="task-labels">
          @for (label of task.labels; track label) {
            <span class="label-tag">{{ label }}</span>
          }
        </div>
      }
      <div class="task-footer">
        @if (task.assignee_name) {
          <div class="assignee">
            <div class="assignee-avatar">{{ initials(task.assignee_name) }}</div>
            <span class="assignee-name">{{ task.assignee_name }}</span>
          </div>
        } @else {
          <span class="unassigned">Unassigned</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .task-card {
      background: white;
      border-radius: 10px;
      padding: 14px;
      cursor: grab;
      transition: box-shadow 0.15s, transform 0.1s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      border: 1px solid #f1f3f5;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .task-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); transform: translateY(-1px); }
    .task-header { display: flex; justify-content: space-between; align-items: center; }
    .priority-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 20px;
      text-transform: capitalize;
    }
    .priority-critical { background: #fef2f2; color: #dc2626; }
    .priority-high { background: #fff7ed; color: #ea580c; }
    .priority-medium { background: #eff6ff; color: #2563eb; }
    .priority-low { background: #f9fafb; color: #6b7280; }
    .due-date { font-size: 11px; color: #6b7280; }
    .due-date.overdue { color: #dc2626; font-weight: 600; }
    .task-title { font-size: 14px; font-weight: 600; color: #1a1a2e; margin: 0; line-height: 1.4; }
    .task-desc { font-size: 12px; color: #9ca3af; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .task-labels { display: flex; flex-wrap: wrap; gap: 4px; }
    .label-tag {
      font-size: 11px;
      background: #f0fdf4;
      color: #16a34a;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #bbf7d0;
    }
    .task-footer { display: flex; align-items: center; margin-top: 2px; }
    .assignee { display: flex; align-items: center; gap: 6px; }
    .assignee-avatar {
      width: 22px; height: 22px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      color: white;
    }
    .assignee-name { font-size: 12px; color: #6b7280; }
    .unassigned { font-size: 12px; color: #d1d5db; }
  `],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Output() clicked = new EventEmitter<Task>();

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    event.dataTransfer!.setData('taskId', this.task.id);
    event.dataTransfer!.setData('sourceColumnId', this.task.column_id);
    event.dataTransfer!.effectAllowed = 'move';
    (event.currentTarget as HTMLElement).style.opacity = '0.4';
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent) {
    (event.currentTarget as HTMLElement).style.opacity = '1';
  }

  priorityLabel(p: string) {
    const map: Record<string, string> = { critical: '🔴 Critical', high: '🟠 High', medium: '🔵 Medium', low: '⚪ Low' };
    return map[p] || p;
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isOverdue() {
    return this.task.due_date ? new Date(this.task.due_date) < new Date() : false;
  }

  initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
