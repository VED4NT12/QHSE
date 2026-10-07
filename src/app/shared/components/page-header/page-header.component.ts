import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="page-header-container">
      <div class="header-left">
        <div class="breadcrumbs" *ngIf="breadcrumbs && breadcrumbs.length > 0">
          <span *ngFor="let crumb of breadcrumbs; let last = last" class="breadcrumb-item">
            <a *ngIf="!last && crumb.link" [routerLink]="crumb.link">{{ crumb.label }}</a>
            <span *ngIf="last || !crumb.link" class="current-crumb">{{ crumb.label }}</span>
            <mat-icon *ngIf="!last" class="crumb-separator">chevron_right</mat-icon>
          </span>
        </div>
        <div class="title-row">
          <div class="icon-avatar" *ngIf="icon">
            <mat-icon>{{ icon }}</mat-icon>
          </div>
          <div>
            <h1 class="page-title">{{ title }}</h1>
            <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </div>
      <div class="header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header-container {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--muted-foreground);
      margin-bottom: 2px;
    }
    .breadcrumb-item {
      display: flex;
      align-items: center;
    }
    .breadcrumb-item a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }
    .breadcrumb-item a:hover {
      text-decoration: underline;
    }
    .current-crumb {
      color: var(--muted-foreground);
      font-weight: 600;
    }
    .crumb-separator {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--muted-foreground);
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .icon-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: var(--accent);
      color: var(--primary);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-2xs);
    }
    .icon-avatar mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .page-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.2px;
      margin: 0;
      line-height: 1.2;
    }
    .page-subtitle {
      font-size: 12px;
      color: var(--muted-foreground);
      margin-top: 1px;
      margin-bottom: 0;
      line-height: 1.2;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() breadcrumbs?: { label: string; link?: string }[];
}
