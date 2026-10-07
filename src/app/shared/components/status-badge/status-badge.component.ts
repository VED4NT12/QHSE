import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="status-badge" [ngClass]="badgeClass">
      <span class="indicator-dot"></span>
      {{ status }}
    </span>
  `,
  styles: [`
    .indicator-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'Open';

  get badgeClass(): string {
    const s = this.status?.toLowerCase().trim() || '';

    // 1. Critical / Overdue -> Red
    if (s.includes('critical') || s.includes('expired') || s.includes('overdue') || s.includes('danger') || s.includes('high')) {
      return 'badge-danger';
    }

    // 2. Completed / Closed -> Green
    if (s.includes('closed') || s.includes('completed') || s.includes('valid') || s.includes('safe') || s.includes('resolved') || s.includes('approved')) {
      return 'badge-success';
    }

    // 3. In Progress -> Blue
    if (s.includes('in progress') || s.includes('progress') || s.includes('investigat') || s.includes('scheduled') || s.includes('monitoring') || s.includes('submitted')) {
      return 'badge-info';
    }

    // 4. Draft -> Gray
    if (s.includes('draft') || s.includes('inactive') || s.includes('deprecated') || s.includes('archived') || s.includes('decommissioned')) {
      return 'badge-draft';
    }

    // 5. Open / Active / Pending -> Orange
    if (s.includes('open') || s.includes('active') || s.includes('pending') || s.includes('action') || s.includes('planned') || s.includes('review due') || s.includes('due')) {
      return 'badge-warning';
    }

    return 'badge-warning';
  }
}
