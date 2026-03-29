import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Column } from '../../../../../core/models/column.model';
import { Task } from '../../../../../core/models/task.model';
import { TaskCardComponent } from '../task-card/task-card';

@Component({
  selector: 'app-kanban-column',
  standalone: true,
  imports: [TaskCardComponent],
  template: `
    <div class="kanban-column">
      <div class="column-header">
        <div class="column-title-group">
          <div class="column-color-dot" [style.background]="column.color"></div>
          <span class="column-name">{{ column.name }}</span>
          <span class="task-count">{{ tasks.length }}</span>
        </div>
        <div class="column-actions">
          <button class="col-btn" (click)="addTask.emit(column)" title="Add task">+</button>
        </div>
      </div>

      <div class="task-list"
        [class.drag-over]="isDragOver"
        (dragenter)="onDragEnter($event)"
        (dragleave)="onDragLeave($event)"
        (dragover)="onDragOver($event)"
        (drop)="onDrop($event)">
        @for (task of tasks; track task.id) {
          <app-task-card [task]="task" (clicked)="taskClicked.emit($event)" />
        }
        @if (tasks.length === 0) {
          <div class="empty-drop-hint">
            <span>Drop tasks here</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .kanban-column {
      background: #f8f9fb;
      border-radius: 12px;
      width: 280px;
      min-width: 280px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 200px);
    }
    .column-header {
      padding: 14px 14px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .column-title-group { display: flex; align-items: center; gap: 8px; }
    .column-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .column-name { font-size: 13px; font-weight: 700; color: #374151; }
    .task-count {
      font-size: 11px;
      font-weight: 600;
      background: #e5e7eb;
      color: #6b7280;
      padding: 1px 7px;
      border-radius: 12px;
    }
    .column-actions { display: flex; gap: 4px; }
    .col-btn {
      width: 26px; height: 26px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      font-weight: 400;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.1s, color 0.1s;
      line-height: 1;
    }
    .col-btn:hover { background: #e5e7eb; color: #374151; }
    .task-list {
      padding: 4px 10px 10px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 60px;
    }
    .task-list.drag-over { background: rgba(99,102,241,0.05); border-radius: 8px; }
    .empty-drop-hint {
      min-height: 60px;
      border: 2px dashed #e5e7eb;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d1d5db;
      font-size: 13px;
      pointer-events: none;
    }
  `],
})
export class KanbanColumnComponent {
  @Input({ required: true }) column!: Column;
  @Input() tasks: Task[] = [];
  @Output() addTask = new EventEmitter<Column>();
  @Output() taskClicked = new EventEmitter<Task>();
  @Output() taskDropped = new EventEmitter<{ task: Task; columnId: string }>();

  isDragOver = false;
  private dragCounter = 0;

  onDragEnter(event: DragEvent) {
    event.preventDefault();
    this.dragCounter++;
    this.isDragOver = true;
  }

  onDragLeave(_event: DragEvent) {
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isDragOver = false;
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragCounter = 0;
    this.isDragOver = false;
    const taskId = event.dataTransfer?.getData('taskId');
    const sourceColumnId = event.dataTransfer?.getData('sourceColumnId');
    if (taskId && sourceColumnId !== this.column.id) {
      this.taskDropped.emit({ task: { id: taskId } as Task, columnId: this.column.id });
    }
  }
}
