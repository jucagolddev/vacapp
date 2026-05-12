import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonButtons, IonMenuButton, IonIcon, IonBadge
} from '@ionic/angular/standalone';
import { TaskService, Annotation } from '../../core/services/task.service';
import { addIcons } from 'ionicons';
import {
  addOutline, removeOutline, checkmarkCircleOutline,
  shareSocialOutline, downloadOutline, flagOutline
} from 'ionicons/icons';

/**
 * @class ReviewComponent
 * @description Pantalla de revisión interactiva.
 * Muestra un documento central con anotaciones posicionales y un panel lateral de feedback.
 */
@Component({
  selector: 'app-review',
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
        <ion-title class="ion-text-center">Revisión y Feedback</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear">
            <ion-icon name="share-social-outline"></ion-icon>
          </ion-button>
          <ion-button fill="clear">
            <ion-icon name="download-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <main class="review-layout animate-fade-in">
        
        <!-- Center Canvas -->
        <div class="review-canvas">
          <div class="review-canvas__toolbar">
            <div class="review-doc-info">
              <h3>Design_Mockup_v3.pdf</h3>
              <span>V. 3.2 · Actualizado hace 2h</span>
            </div>
            <div class="review-zoom-controls">
              <ion-button fill="clear" size="small"><ion-icon name="remove-outline"></ion-icon></ion-button>
              <span>100%</span>
              <ion-button fill="clear" size="small"><ion-icon name="add-outline"></ion-icon></ion-button>
            </div>
          </div>

          <div class="review-doc-wrapper">
            <!-- Mock Document -->
            <div class="review-doc">
              <div class="review-doc__header">
                <div class="review-doc__logo"></div>
                <div class="review-doc__title">ProjectFlow Dashboard — Design Specification v3.0</div>
                <div class="review-doc__meta">Prepared by Design Team · May 2026 · Confidential</div>
              </div>
              
              <div class="review-doc__section">
                <h4>1. Executive Summary</h4>
                <p>The new dashboard introduces a Neo-Minimalist aesthetic with focus on high data density and clear actionable insights. By leveraging soft gradients, generous whitespace, and precise typography, we achieve a modern "Rustic-Luxe" feel.</p>
              </div>

              <div class="review-doc__section">
                <h4>2. Color Palette</h4>
                <div class="review-doc__colors">
                  <div class="color-chip" style="background:#1b4332">#1B4332</div>
                  <div class="color-chip" style="background:#40916c">#40916C</div>
                  <div class="color-chip" style="background:#d4a373; color: #1a1a1a">#D4A373</div>
                  <div class="color-chip" style="background:#bc4749">#BC4749</div>
                </div>
              </div>

              <div class="review-doc__section">
                <h4>3. Typography</h4>
                <div style="font-family: 'Outfit'; margin-top: 10px;">
                  <h1 style="margin:0">Outfit Bold (Headers)</h1>
                  <p style="font-family: 'Inter'; color: #666">Inter Regular (Body Copy for optimal readability)</p>
                </div>
              </div>

              <!-- Annotation Pins -->
              <div *ngFor="let ann of taskService.annotations()" 
                   class="annotation-pin"
                   [class.pin-critical]="ann.urgency === 'critical'"
                   [class.pin-suggestion]="ann.urgency === 'suggestion'"
                   [class.pin-resolved]="ann.urgency === 'resolved'"
                   [style.left.%]="ann.posX"
                   [style.top.%]="ann.posY">
                <div class="pin-avatar" [style.background]="ann.author.color">{{ ann.author.initials }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Sidebar (Feedback Panel) -->
        <aside class="review-sidebar">
          <div class="review-sidebar__header">
            <h3>Anotaciones</h3>
            <ion-badge color="tertiary">{{ taskService.annotations().length }}</ion-badge>
          </div>
          
          <div class="review-filters">
            <button class="filter-btn active">Todas</button>
            <button class="filter-btn">
              <span class="dot dot-critical"></span> Críticas
            </button>
            <button class="filter-btn">
              <span class="dot dot-resolved"></span> Resueltas
            </button>
          </div>

          <div class="annotation-list">
            <div *ngFor="let ann of taskService.annotations()" class="annotation-card" [class.resolved]="ann.resolved">
              
              <div class="annotation-card__header">
                <div class="flex items-center gap-2">
                  <div class="ann-avatar" [style.background]="ann.author.color">{{ ann.author.initials }}</div>
                  <div>
                    <span class="ann-author">{{ ann.author.name }}</span>
                    <span class="ann-time">{{ ann.timestamp | date:'shortTime' }}</span>
                  </div>
                </div>
                <span class="ann-urgency"
                  [class.u-critical]="ann.urgency === 'critical'"
                  [class.u-suggestion]="ann.urgency === 'suggestion'"
                  [class.u-resolved]="ann.urgency === 'resolved'">
                  {{ ann.urgency === 'critical' ? 'Crítica' : ann.urgency === 'suggestion' ? 'Sugerencia' : 'Resuelta' }}
                </span>
              </div>

              <p class="annotation-card__text">{{ ann.text }}</p>

              <div class="annotation-card__actions" *ngIf="!ann.resolved">
                <ion-button fill="clear" size="small" color="success" (click)="resolve(ann.id)">
                  <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon> Resolver
                </ion-button>
              </div>
              
            </div>
          </div>
        </aside>

      </main>
    </ion-content>
  `,
  styles: [`
    /* ═══════════════════════════════════════════ */
    /* REVIEW & FEEDBACK — Rustic-Luxe Integration */
    /* ═══════════════════════════════════════════ */

    .review-layout {
      display: flex;
      height: calc(100vh - 120px);
      gap: 20px;
      padding: 0 16px;
    }

    /* ─── CANVAS (LEFT) ─── */
    .review-canvas {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(8px);
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .review-canvas__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .review-doc-info h3 {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      color: var(--ion-color-dark, #1b4332);
      margin: 0;
    }
    .review-doc-info span {
      font-size: 0.75rem;
      color: var(--ion-color-medium, #6c757d);
    }

    .review-zoom-controls {
      display: flex;
      align-items: center;
      background: var(--ion-background-color, #FDFBF7);
      border-radius: 8px;
      padding: 2px;
    }
    .review-zoom-controls span {
      font-weight: 600;
      font-size: 0.85rem;
      min-width: 45px;
      text-align: center;
    }

    .review-doc-wrapper {
      flex: 1;
      overflow: auto;
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background: rgba(0,0,0,0.02);
    }

    /* ─── MOCK DOCUMENT ─── */
    .review-doc {
      background: #ffffff;
      width: 100%;
      max-width: 800px;
      min-height: 1000px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
      padding: 60px 50px;
      position: relative;
    }

    .review-doc__header {
      border-bottom: 2px solid var(--ion-color-primary, #1b4332);
      padding-bottom: 20px;
      margin-bottom: 40px;
    }

    .review-doc__logo {
      width: 40px;
      height: 40px;
      background: var(--ion-color-tertiary, #d4a373);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .review-doc__title {
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.8rem;
      color: var(--ion-color-dark, #1a1a1a);
      margin-bottom: 8px;
    }

    .review-doc__meta {
      font-size: 0.85rem;
      color: var(--ion-color-medium, #6c757d);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .review-doc__section {
      margin-bottom: 30px;
    }
    .review-doc__section h4 {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--ion-color-primary, #1b4332);
      margin: 0 0 12px;
    }
    .review-doc__section p {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #333;
    }

    .review-doc__colors {
      display: flex;
      gap: 12px;
      margin-top: 10px;
    }
    .color-chip {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      display: flex;
      align-items: flex-end;
      padding: 8px;
      color: white;
      font-weight: 600;
      font-size: 0.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    /* ─── PINS ─── */
    .annotation-pin {
      position: absolute;
      width: 34px;
      height: 34px;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: 10;
      transition: transform 0.2s;
    }
    .annotation-pin:hover {
      transform: translate(-50%, -50%) scale(1.15);
      z-index: 20;
    }
    .annotation-pin::after {
      content: '';
      position: absolute;
      top: -4px; left: -4px; right: -4px; bottom: -4px;
      border-radius: 50%;
      border: 2px solid;
      opacity: 0.4;
      animation: pulse 2s infinite;
    }

    .pin-critical::after { border-color: var(--ion-color-danger, #bc4749); }
    .pin-suggestion::after { border-color: var(--ion-color-warning, #dda15e); }
    .pin-resolved::after { border-color: var(--ion-color-success, #40916c); animation: none; opacity: 0; }
    .pin-resolved { opacity: 0.6; }

    .pin-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 0.75rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      position: relative;
      z-index: 2;
      border: 2px solid white;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    /* ─── SIDEBAR (RIGHT) ─── */
    .review-sidebar {
      width: 380px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .review-sidebar__header {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .review-sidebar__header h3 {
      margin: 0;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      color: var(--ion-color-dark, #1b4332);
    }

    .review-filters {
      display: flex;
      padding: 12px 24px;
      gap: 8px;
      overflow-x: auto;
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .filter-btn {
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.1);
      background: transparent;
      font-family: 'Outfit', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ion-color-medium, #6c757d);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .filter-btn.active {
      background: var(--ion-color-primary, #1b4332);
      color: white;
      border-color: var(--ion-color-primary, #1b4332);
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; }
    .dot-critical { background: var(--ion-color-danger, #bc4749); }
    .dot-resolved { background: var(--ion-color-success, #40916c); }

    .annotation-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .annotation-card {
      background: rgba(253, 251, 247, 0.5);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 16px;
      padding: 16px;
      transition: all 0.2s;
    }
    .annotation-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      background: #ffffff;
    }
    .annotation-card.resolved {
      opacity: 0.6;
      background: transparent;
    }

    .annotation-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .ann-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 0.75rem;
    }

    .ann-author {
      display: block;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--ion-color-dark, #1b4332);
    }
    .ann-time {
      font-size: 0.7rem;
      color: var(--ion-color-medium, #6c757d);
    }

    .ann-urgency {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .u-critical { background: rgba(188, 71, 73, 0.1); color: var(--ion-color-danger, #bc4749); }
    .u-suggestion { background: rgba(221, 161, 94, 0.15); color: var(--ion-color-warning, #dda15e); }
    .u-resolved { background: rgba(64, 145, 108, 0.1); color: var(--ion-color-success, #40916c); }

    .annotation-card__text {
      font-size: 0.9rem;
      line-height: 1.5;
      color: #333;
      margin: 0 0 12px;
    }

    .annotation-card__actions {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid rgba(0,0,0,0.05);
      padding-top: 8px;
      margin-top: 8px;
    }
  `]
})
export class ReviewComponent {
  taskService = inject(TaskService);

  constructor() {
    addIcons({
      addOutline, removeOutline, checkmarkCircleOutline,
      shareSocialOutline, downloadOutline, flagOutline
    });
  }

  resolve(id: string) {
    this.taskService.resolveAnnotation(id);
  }
}
