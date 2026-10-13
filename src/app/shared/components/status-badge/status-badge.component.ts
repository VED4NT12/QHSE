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

    // 1. Expired -> Dark Red
    if (s.includes('expired')) {
      return 'badge-expired';
    }

    // 2. Critical / Overdue / Suspended / Cancelled / Rejected -> Red
    if (s.includes('critical') || s.includes('overdue') || s.includes('danger') || s.includes('high') || s.includes('suspend') || s.includes('cancel') || s.includes('reject')) {
      return 'badge-danger';
    }

    // 3. Completed / Closed / Approved / Safe / Valid -> Green
    if (s.includes('closed') || s.includes('completed') || s.includes('valid') || s.includes('safe') || s.includes('resolved') || s.includes('approved')) {
      return 'badge-success';
    }

    // 4. Draft / Inactive / Deprecated / Archived -> Gray
    if (s.includes('draft') || s.includes('inactive') || s.includes('deprecated') || s.includes('archived') || s.includes('decommissioned')) {
      return 'badge-draft';
    }

    // 5. Under Review / Review / Pending / Open / Active -> Orange / Amber
    if (s.includes('review') || s.includes('pending') || s.includes('open') || s.includes('action') || s.includes('planned') || s.includes('due') || s.includes('active')) {
      return 'badge-warning';
    }

    // 6. In Progress / Requested / Extended -> Blue
    if (s.includes('in progress') || s.includes('progress') || s.includes('investigat') || s.includes('scheduled') || s.includes('monitoring') || s.includes('submitted') || s.includes('request') || s.includes('extend')) {
      return 'badge-info';
    }

    return 'badge-warning';
  }
}
