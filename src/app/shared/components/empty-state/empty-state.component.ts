import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state-wrapper">
      <div class="empty-icon-circle">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-desc">{{ description }}</p>
      <div *ngIf="actionLabel" class="empty-action-wrap">
        <button mat-stroked-button color="primary" (click)="handleAction()">
          <mat-icon *ngIf="actionIcon">{{ actionIcon }}</mat-icon>
          <span>{{ actionLabel }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .empty-state-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 20px;
      text-align: center;
      background: #ffffff;
      border-radius: 8px;
    }
    .empty-icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-icon-circle mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .empty-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 6px 0;
    }
    .empty-desc {
      font-size: 13px;
      color: #64748b;
      max-width: 440px;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .empty-action-wrap button {
      font-weight: 600;
      height: 38px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'search_off';
  @Input() title: string = 'No records found';
  @Input() description: string = 'No records match your active search or filter criteria. Try resetting filters.';
  @Input() set message(val: string) { if (val) this.description = val; }

  @Input() actionLabel?: string = 'Reset Filters';
  @Input() set actionText(val: string | undefined) { if (val) this.actionLabel = val; }
  @Input() actionIcon?: string = 'add';
  @Input() actionLink?: string;

  @Output() actionClick = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  constructor(private router: Router) {}

  handleAction() {
    this.actionClick.emit();
    this.action.emit();
    if (this.actionLink) {
      this.router.navigateByUrl(this.actionLink);
    }
  }
}
