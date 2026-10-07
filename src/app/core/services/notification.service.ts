import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _toasts = signal<ToastNotification[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(type: ToastType, title: string, message?: string, duration: number = 4500): string {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newToast: ToastNotification = {
      id,
      type,
      title,
      message,
      timestamp,
      duration
    };

    // Add to stack (newest on top)
    this._toasts.update(list => [newToast, ...list]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  showSuccess(title: string, message?: string, duration: number = 4500): string {
    return this.show('success', title, message, duration);
  }

  showError(title: string, message?: string, duration: number = 5500): string {
    return this.show('error', title, message, duration);
  }

  showWarning(title: string, message?: string, duration: number = 5000): string {
    return this.show('warning', title, message, duration);
  }

  showInfo(title: string, message?: string, duration: number = 4500): string {
    return this.show('info', title, message, duration);
  }

  dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  clearAll(): void {
    this._toasts.set([]);
  }
}
