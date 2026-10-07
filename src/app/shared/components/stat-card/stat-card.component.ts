import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card" [class.alert-state]="isAlert">
      <div class="stat-icon-wrapper" [ngStyle]="{'background-color': iconBgColor, 'color': iconColor}">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="stat-content">
        <span class="stat-label">{{ label }}</span>
        <div class="stat-value-row">
          <span class="stat-value">{{ value }}</span>
          <span *ngIf="trendText" class="stat-trend" [class.trend-positive]="trendPositive" [class.trend-negative]="!trendPositive">
            {{ trendText }}
          </span>
        </div>
        <span *ngIf="subtext" class="stat-subtext">{{ subtext }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 11px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: var(--shadow-2xs);
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .stat-card:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }
    .stat-card.alert-state {
      border-left: 3px solid var(--destructive);
    }
    .stat-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrapper mat-icon {
      font-size: 19px;
      width: 19px;
      height: 19px;
    }
    .stat-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 1px;
    }
    .stat-value-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .stat-value {
      font-size: 21px;
      font-weight: 800;
      color: var(--foreground);
      line-height: 1.1;
      letter-spacing: -0.3px;
    }
    .stat-trend {
      font-size: 11px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
    }
    .trend-positive {
      color: var(--primary);
      background: var(--accent);
      border: 1px solid var(--border);
    }
    .trend-negative {
      color: var(--destructive);
      background: oklch(0.95 0.04 25);
    }
    .stat-subtext {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-top: 1px;
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = 'analytics';
  @Input() iconBgColor: string = 'var(--accent)';
  @Input() iconColor: string = 'var(--primary)';
  @Input() trendText?: string;
  @Input() trendPositive: boolean = true;
  @Input() subtext?: string;
  @Input() isAlert: boolean = false;
}
