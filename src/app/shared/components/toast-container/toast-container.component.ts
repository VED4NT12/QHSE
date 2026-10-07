import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService, ToastNotification, ToastType } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="toast-viewport" role="region" aria-live="polite" aria-label="Notifications">
      <div 
        *ngFor="let toast of notificationService.toasts(); trackBy: trackById"
        class="toast-card"
        [ngClass]="'toast-' + toast.type"
        role="alert">
        
        <div class="toast-indicator"></div>

        <div class="toast-icon-wrap">
          <mat-icon class="toast-icon">{{ getIcon(toast.type) }}</mat-icon>
        </div>

        <div class="toast-body">
          <div class="toast-header-row">
            <span class="toast-title">{{ toast.title }}</span>
            <span class="toast-time">{{ toast.timestamp }}</span>
          </div>
          <p *ngIf="toast.message" class="toast-message">{{ toast.message }}</p>
        </div>

        <button 
          mat-icon-button 
          class="toast-close-btn" 
          (click)="notificationService.dismiss(toast.id)"
          aria-label="Dismiss notification">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-viewport {
      position: fixed;
      top: 20px;
      right: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      max-width: 420px;
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      position: relative;
      overflow: hidden;
      animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.2s ease;
    }

    .toast-card:hover {
      box-shadow: 0 14px 30px -4px rgba(15, 23, 42, 0.18);
      transform: translateY(-2px);
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .toast-indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
    }

    /* Type-specific colors */
    .toast-success .toast-indicator { background: var(--primary); }
    .toast-success .toast-icon-wrap { background: var(--accent); color: var(--primary); }

    .toast-error .toast-indicator { background: var(--destructive); }
    .toast-error .toast-icon-wrap { background: oklch(0.95 0.04 25); color: var(--destructive); }

    .toast-warning .toast-indicator { background: var(--secondary); }
    .toast-warning .toast-icon-wrap { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); }

    .toast-info .toast-indicator { background: var(--primary); }
    .toast-info .toast-icon-wrap { background: var(--accent); color: var(--primary); }

    .toast-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .toast-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .toast-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
    }

    .toast-time {
      font-size: 11px;
      color: #94a3b8;
      font-family: inherit;
      flex-shrink: 0;
    }

    .toast-message {
      font-size: 12.5px;
      color: #475569;
      line-height: 1.4;
      margin: 0;
    }

    .toast-close-btn {
      width: 28px !important;
      height: 28px !important;
      line-height: 28px !important;
      color: #94a3b8 !important;
      margin: -4px -6px 0 0;
      padding: 0 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease;
    }

    .toast-close-btn:hover {
      color: #334155 !important;
      background: #f1f5f9;
    }

    .toast-close-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 600px) {
      .toast-viewport {
        top: 12px;
        right: 12px;
        left: 12px;
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent {
  public notificationService = inject(NotificationService);

  getIcon(type: ToastType): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  trackById(index: number, item: ToastNotification): string {
    return item.id;
  }
}
