import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonButtons, IonMenuButton, IonIcon, IonBadge
} from '@ionic/angular/standalone';
import { TaskService, Task } from '../../core/services/task.service';
import { addIcons } from 'ionicons';
import {
  addOutline, filterOutline, gridOutline, personAddOutline,
  listOutline, swapHorizontalOutline, chatboxOutline,
  trashOutline, checkmarkCircleOutline, ellipsisVerticalOutline,
  flagOutline, timeOutline, chevronForwardOutline
} from 'ionicons/icons';

/**
 * @class KanbanComponent
 * @description Tablero Kanban interactivo con drag-and-drop nativo.
 * Permite mover tareas entre columnas, ver detalles y gestionar prioridades.
 */
@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [
    CommonModule, IonContent, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonMenuButton, IonButton, IonIcon, IonBadge
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title class="ion-text-center">Tablero Kanban</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="toggleView()">
            <ion-icon [name]="viewMode() === 'board' ? 'list-outline' : 'grid-outline'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <main class="vac-container animate-fade-in">

        <!-- Header -->
        <div class="vac-page-header mt-4">
          <div class="vac-header-flex">
            <div>
              <h1 class="vac-page-title">Sprint 14 — Tablero</h1>
              <p class="vac-page-subtitle">
                <ion-icon name="grid-outline" class="icon-mr-sm"></ion-icon>
                {{ totalTasks() }} tareas · {{ completedTasks() }} completadas
              </p>
            </div>
            <div class="kanban-actions">
              <ion-button fill="outline" color="medium" size="small">
                <ion-icon name="filter-outline" slot="start"></ion-icon>
                Filtrar
              </ion-button>
              <ion-button fill="solid" color="primary" size="small">
                <ion-icon name="add-outline" slot="start"></ion-icon>
                Nueva Tarea
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="kanban-board">
          <div
            *ngFor="let col of columns"
            class="kanban-column"
            [attr.data-status]="col.id"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event, col.id)">

            <!-- Column Header -->
            <div class="kanban-column__header">
              <div class="kanban-column__title-row">
                <span class="kanban-column__dot" [style.background]="col.color"></span>
                <span class="kanban-column__title">{{ col.label }}</span>
                <ion-badge [color]="col.badgeColor" class="kanban-column__count">
                  {{ getTasksForColumn(col.id).length }}
                </ion-badge>
              </div>
            </div>

            <!-- Task Cards -->
            <div class="kanban-column__body">
              <div
                *ngFor="let task of getTasksForColumn(col.id); trackBy: trackById"
                class="kanban-card"
                [class.kanban-card--high]="task.priority === 'high'"
                [class.kanban-card--blocked]="task.status === 'blocked'"
                draggable="true"
                (dragstart)="onDragStart($event, task)"
                (dragend)="onDragEnd($event)"
                (contextmenu)="onContextMenu($event, task)">

                <!-- Priority + Tags -->
                <div class="kanban-card__top-row">
                  <span class="kanban-card__priority"
                    [class.priority-high]="task.priority === 'high'"
                    [class.priority-medium]="task.priority === 'medium'"
                    [class.priority-low]="task.priority === 'low'">
                    <ion-icon name="flag-outline"></ion-icon>
                    {{ task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja' }}
                  </span>
                  <button class="kanban-card__menu-btn" (click)="onContextMenu($event, task)">
                    <ion-icon name="ellipsis-vertical-outline"></ion-icon>
                  </button>
                </div>

                <!-- Title & Description -->
                <h4 class="kanban-card__title">{{ task.title }}</h4>
                <p class="kanban-card__desc">{{ task.description }}</p>

                <!-- Tags -->
                <div class="kanban-card__tags">
                  <span *ngFor="let tag of task.tags" class="kanban-card__tag">{{ tag }}</span>
                </div>

                <!-- Progress Bar -->
                <div class="kanban-card__progress-bar" *ngIf="task.progress > 0 && task.progress < 100">
                  <div class="kanban-card__progress-fill" [style.width.%]="task.progress"></div>
                </div>

                <!-- Footer: Avatar + Subtasks -->
                <div class="kanban-card__footer">
                  <div class="kanban-card__avatar" [style.background]="task.assignee.color">
                    {{ task.assignee.initials }}
                  </div>
                  <div class="kanban-card__meta">
                    <span *ngIf="task.subtasks" class="kanban-card__subtask-count">
                      <ion-icon name="checkmark-circle-outline"></ion-icon>
                      {{ task.subtasks.completed }}/{{ task.subtasks.total }}
                    </span>
                    <span *ngIf="task.dueDate" class="kanban-card__due">
                      <ion-icon name="time-outline"></ion-icon>
                      {{ task.dueDate }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Empty state -->
              <div class="kanban-column__empty" *ngIf="getTasksForColumn(col.id).length === 0">
                <ion-icon name="add-outline"></ion-icon>
                <span>Sin tareas</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Context Menu -->
        <div class="kanban-context-menu"
          *ngIf="contextMenuVisible()"
          [style.left.px]="contextMenuPos().x"
          [style.top.px]="contextMenuPos().y">
          <button class="ctx-item" (click)="ctxAction('assign')">
            <ion-icon name="person-add-outline"></ion-icon> Asignar
          </button>
          <button class="ctx-item" (click)="ctxAction('subtask')">
            <ion-icon name="list-outline"></ion-icon> Añadir Subtarea
          </button>
          <button class="ctx-item" (click)="ctxAction('status')">
            <ion-icon name="swap-horizontal-outline"></ion-icon> Cambiar Estado
          </button>
          <button class="ctx-item" (click)="ctxAction('comment')">
            <ion-icon name="chatbox-outline"></ion-icon> Comentar
          </button>
          <div class="ctx-divider"></div>
          <button class="ctx-item ctx-item--danger" (click)="ctxAction('delete')">
            <ion-icon name="trash-outline"></ion-icon> Eliminar
          </button>
        </div>

      </main>
    </ion-content>
  `,
  styles: [`
    /* ═══════════════════════════════════════════ */
    /* KANBAN BOARD — Rustic-Luxe Integration      */
    /* ═══════════════════════════════════════════ */

    .kanban-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .kanban-board {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding: 16px 0 32px;
      min-height: calc(100vh - 220px);
      scroll-snap-type: x mandatory;
    }

    /* ─── COLUMN ─── */
    .kanban-column {
      min-width: 280px;
      max-width: 320px;
      flex: 1;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(8px);
      border-radius: 20px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      border: 2px solid transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      scroll-snap-align: start;
    }

    .kanban-column.drag-over {
      border-color: var(--ion-color-success, #40916c);
      background: rgba(64, 145, 108, 0.08);
      box-shadow: 0 0 24px rgba(64, 145, 108, 0.15);
    }

    .kanban-column__header {
      padding: 8px 6px 12px;
    }

    .kanban-column__title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .kanban-column__dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .kanban-column__title {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--ion-color-dark, #1b4332);
      flex: 1;
    }

    .kanban-column__count {
      font-size: 0.72rem;
      --padding-start: 8px;
      --padding-end: 8px;
    }

    .kanban-column__body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 100px;
    }

    .kanban-column__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: var(--ion-color-medium, #a3b18a);
      font-size: 0.85rem;
      gap: 8px;
      opacity: 0.6;
    }
    .kanban-column__empty ion-icon { font-size: 1.5rem; }

    /* ─── TASK CARD ─── */
    .kanban-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 14px;
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      cursor: grab;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      animation: cardSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
    }

    @keyframes cardSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .kanban-card:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .kanban-card:active {
      cursor: grabbing;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
      transform: scale(1.02);
    }

    .kanban-card--high {
      border-left: 3px solid var(--ion-color-danger, #bc4749);
    }

    .kanban-card--blocked {
      opacity: 0.75;
      border-left: 3px solid var(--ion-color-warning, #dda15e);
    }

    .kanban-card.dragging {
      opacity: 0.4;
      transform: rotate(2deg) scale(0.95);
    }

    .kanban-card__top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .kanban-card__priority {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kanban-card__priority ion-icon { font-size: 0.75rem; }

    .priority-high {
      background: rgba(188, 71, 73, 0.12);
      color: var(--ion-color-danger, #bc4749);
    }
    .priority-medium {
      background: rgba(221, 161, 94, 0.15);
      color: var(--ion-color-warning, #dda15e);
    }
    .priority-low {
      background: rgba(64, 145, 108, 0.12);
      color: var(--ion-color-success, #40916c);
    }

    .kanban-card__menu-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--ion-color-medium, #a3b18a);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .kanban-card__menu-btn:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--ion-color-dark, #1b4332);
    }

    .kanban-card__title {
      font-family: 'Outfit', sans-serif;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--ion-color-dark, #1b4332);
      margin: 0 0 4px;
      line-height: 1.3;
    }

    .kanban-card__desc {
      font-size: 0.78rem;
      color: var(--ion-color-medium, #6c757d);
      line-height: 1.4;
      margin: 0 0 10px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .kanban-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .kanban-card__tag {
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(27, 67, 50, 0.08);
      color: var(--ion-color-primary, #1b4332);
      letter-spacing: 0.3px;
    }

    .kanban-card__progress-bar {
      height: 4px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 2px;
      margin-bottom: 10px;
      overflow: hidden;
    }

    .kanban-card__progress-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--ion-color-primary, #1b4332), var(--ion-color-success, #40916c));
      transition: width 0.5s ease;
    }

    .kanban-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .kanban-card__avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      font-weight: 700;
      color: white;
    }

    .kanban-card__meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .kanban-card__subtask-count,
    .kanban-card__due {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 0.7rem;
      color: var(--ion-color-medium, #a3b18a);
      font-weight: 600;
    }
    .kanban-card__subtask-count ion-icon,
    .kanban-card__due ion-icon { font-size: 0.85rem; }

    /* ─── CONTEXT MENU ─── */
    .kanban-context-menu {
      position: fixed;
      z-index: 9999;
      background: #ffffff;
      border-radius: 14px;
      padding: 6px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(0, 0, 0, 0.08);
      min-width: 200px;
      animation: ctxFadeIn 0.2s ease;
    }

    @keyframes ctxFadeIn {
      from { opacity: 0; transform: scale(0.95) translateY(-4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .ctx-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: none;
      border-radius: 10px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--ion-color-dark, #1b4332);
      cursor: pointer;
      transition: all 0.2s;
    }
    .ctx-item ion-icon { font-size: 1.1rem; color: var(--ion-color-medium); }
    .ctx-item:hover {
      background: rgba(27, 67, 50, 0.06);
    }
    .ctx-item--danger { color: var(--ion-color-danger, #bc4749); }
    .ctx-item--danger ion-icon { color: var(--ion-color-danger, #bc4749); }

    .ctx-divider {
      height: 1px;
      background: rgba(0, 0, 0, 0.06);
      margin: 4px 8px;
    }
  `]
})
export class KanbanComponent {
  private taskService = inject(TaskService);

  viewMode = signal<'board' | 'list'>('board');
  contextMenuVisible = signal(false);
  contextMenuPos = signal({ x: 0, y: 0 });
  contextMenuTask = signal<Task | null>(null);

  columns = [
    { id: 'backlog' as const, label: 'Backlog', color: '#a3b18a', badgeColor: 'medium' },
    { id: 'todo' as const, label: 'Por Hacer', color: '#3b82f6', badgeColor: 'primary' },
    { id: 'in-progress' as const, label: 'En Progreso', color: '#dda15e', badgeColor: 'warning' },
    { id: 'done' as const, label: 'Terminado', color: '#40916c', badgeColor: 'success' },
    { id: 'blocked' as const, label: 'Bloqueado', color: '#bc4749', badgeColor: 'danger' },
  ];

  totalTasks = computed(() => this.taskService.tasks().length);
  completedTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'done').length);

  private draggedTaskId: string | null = null;

  constructor() {
    addIcons({
      addOutline, filterOutline, gridOutline, personAddOutline,
      listOutline, swapHorizontalOutline, chatboxOutline,
      trashOutline, checkmarkCircleOutline, ellipsisVerticalOutline,
      flagOutline, timeOutline, chevronForwardOutline
    });
  }

  getTasksForColumn(status: Task['status']): Task[] {
    return this.taskService.tasksByStatus()[status];
  }

  trackById(index: number, task: Task): string {
    return task.id;
  }

  toggleView() {
    this.viewMode.update(m => m === 'board' ? 'list' : 'board');
  }

  // ─── Drag & Drop ───
  onDragStart(event: DragEvent, task: Task) {
    this.draggedTaskId = task.id;
    const el = event.target as HTMLElement;
    el.classList.add('dragging');
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.hideContextMenu();
  }

  onDragEnd(event: DragEvent) {
    (event.target as HTMLElement).classList.remove('dragging');
    this.draggedTaskId = null;
    document.querySelectorAll('.kanban-column').forEach(el => el.classList.remove('drag-over'));
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const col = (event.target as HTMLElement).closest('.kanban-column');
    if (col && !col.classList.contains('drag-over')) {
      document.querySelectorAll('.kanban-column').forEach(el => el.classList.remove('drag-over'));
      col.classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent) {
    const col = (event.target as HTMLElement).closest('.kanban-column');
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (col && relatedTarget && !col.contains(relatedTarget)) {
      col.classList.remove('drag-over');
    }
  }

  onDrop(event: DragEvent, newStatus: Task['status']) {
    event.preventDefault();
    document.querySelectorAll('.kanban-column').forEach(el => el.classList.remove('drag-over'));
    const taskId = event.dataTransfer?.getData('text/plain');
    if (taskId) {
      this.taskService.moveTask(taskId, newStatus);
    }
  }

  // ─── Context Menu ───
  onContextMenu(event: Event, task: Task) {
    event.preventDefault();
    event.stopPropagation();
    const e = event as MouseEvent;
    this.contextMenuTask.set(task);
    this.contextMenuPos.set({ x: e.clientX, y: e.clientY });
    this.contextMenuVisible.set(true);
  }

  @HostListener('document:click')
  hideContextMenu() {
    this.contextMenuVisible.set(false);
  }

  ctxAction(action: string) {
    this.hideContextMenu();
    // Placeholder for future actions
  }
}
