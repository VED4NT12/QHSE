import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { OnHireStore, OnHireInspection } from '../../core/stores/on-hire.store';

@Component({
  selector: 'app-on-hire-inspection-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="'Inspection: ' + (record()?.vesselName ?? '')"
        [subtitle]="'On Hire Inspection — ' + (record()?.dateOfInspection ?? '')"
        icon="manage_search"
        [breadcrumbs]="[{label: 'On Hire Inspection', link: '/on-hire-inspection'}, {label: 'Details'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button [routerLink]="['/on-hire-inspection/edit', record()?.id]">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button routerLink="/on-hire-inspection">
            <mat-icon>arrow_back</mat-icon> Back to List
          </button>
        </div>
      </app-page-header>

      @if (record()) {
        <!-- Summary Cards -->
        <div class="detail-summary-grid">
          <div class="detail-info-card">
            <div class="info-section-title"><mat-icon>info</mat-icon> Inspection Information</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Vessel Name</span>
                <span class="info-value">{{ record()!.vesselName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Vessel Type</span>
                <span class="info-value">{{ record()!.vesselType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Takeover Date</span>
                <span class="info-value">{{ record()!.takeoverDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date of Inspection</span>
                <span class="info-value">{{ record()!.dateOfInspection }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Category</span>
                <span class="info-value">{{ record()!.categoryOfInspection }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Inspectors</span>
                <span class="info-value">{{ record()!.inspectors || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span class="status-badge" [class]="'status-' + record()!.status.toLowerCase()">{{ record()!.status }}</span>
              </div>
            </div>
          </div>

          <div class="stats-card">
            <div class="info-section-title"><mat-icon>assessment</mat-icon> Findings Summary</div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Total Findings</span>
                <span class="stat-value total">{{ record()!.findingsTotal }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Closed</span>
                <span class="stat-value closed">{{ record()!.closedTotal }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Open</span>
                <span class="stat-value open">{{ record()!.findingsTotal - record()!.closedTotal }}</span>
              </div>
            </div>
            <div class="rating-breakdown">
              <div class="rating-row">
                <span class="r-label">High</span>
                <div class="r-bar-wrap">
                  <div class="r-bar r-bar-high" [style.width.%]="pct(record()!.findingsHigh, record()!.findingsTotal)"></div>
                </div>
                <span class="r-count">{{ record()!.findingsHigh }}</span>
              </div>
              <div class="rating-row">
                <span class="r-label">Medium</span>
                <div class="r-bar-wrap">
                  <div class="r-bar r-bar-medium" [style.width.%]="pct(record()!.findingsMedium, record()!.findingsTotal)"></div>
                </div>
                <span class="r-count">{{ record()!.findingsMedium }}</span>
              </div>
              <div class="rating-row">
                <span class="r-label">Low</span>
                <div class="r-bar-wrap">
                  <div class="r-bar r-bar-low" [style.width.%]="pct(record()!.findingsLow, record()!.findingsTotal)"></div>
                </div>
                <span class="r-count">{{ record()!.findingsLow }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Findings Table -->
        @if (record()?.findings && record()!.findings!.length > 0) {
          <div class="findings-section">
            <div class="findings-table-title">
              <mat-icon>list_alt</mat-icon>
              Inspection Findings
              <span class="count-badge">{{ record()!.findings!.length }}</span>
            </div>
            <div class="findings-table-wrap">
              <table class="findings-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Finding Description</th>
                    <th>Dept</th>
                    <th>Rating</th>
                    <th>Closure Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of record()!.findings!; track $index) {
                    <tr>
                      <td class="num-col">{{ $index + 1 }}</td>
                      <td class="desc-col">{{ f.findingDescription }}</td>
                      <td>{{ f.dept }}</td>
                      <td>
                        <span class="rating-badge" [class]="'rating-' + f.rating.toLowerCase()">{{ f.rating }}</span>
                      </td>
                      <td>{{ f.closureDate || '—' }}</td>
                      <td>
                        <span class="status-badge" [class]="'status-' + f.status.toLowerCase()">{{ f.status }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else {
          <div class="no-findings-card">
            <mat-icon>check_circle_outline</mat-icon>
            <span>No individual findings recorded for this inspection.</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .d-flex { display: flex; }
    .gap-2 { gap: 8px; }

    .detail-summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    @media (max-width: 768px) { .detail-summary-grid { grid-template-columns: 1fr; } }

    .detail-info-card, .stats-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      box-shadow: var(--shadow-2xs);
    }
    .info-section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13.5px; font-weight: 700;
      color: var(--foreground);
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border);
    }
    .info-section-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 11px; font-weight: 600; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; }
    .info-value { font-size: 13.5px; font-weight: 600; color: var(--foreground); }

    .status-badge {
      display: inline-block; font-size: 11px; font-weight: 700;
      padding: 3px 10px; border-radius: 9999px;
    }
    .status-open { background: oklch(0.92 0.06 25 / 0.5); color: oklch(0.45 0.18 25); }
    .status-closed { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }

    .stats-grid {
      display: flex; gap: 20px;
      margin-bottom: 16px;
    }
    .stat-item { flex: 1; text-align: center; }
    .stat-label { font-size: 11px; color: var(--muted-foreground); display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
    .stat-value { font-size: 30px; font-weight: 800; display: block; }
    .stat-value.total { color: var(--foreground); }
    .stat-value.closed { color: oklch(0.38 0.12 145); }
    .stat-value.open { color: oklch(0.48 0.18 25); }

    .rating-breakdown { display: flex; flex-direction: column; gap: 8px; }
    .rating-row { display: flex; align-items: center; gap: 10px; }
    .r-label { width: 50px; font-size: 12px; color: var(--muted-foreground); font-weight: 600; }
    .r-bar-wrap { flex: 1; height: 8px; background: var(--muted); border-radius: 4px; overflow: hidden; }
    .r-bar { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
    .r-bar-high { background: oklch(0.52 0.18 25); }
    .r-bar-medium { background: oklch(0.55 0.15 75); }
    .r-bar-low { background: oklch(0.42 0.12 145); }
    .r-count { width: 24px; font-size: 12px; font-weight: 700; color: var(--foreground); text-align: right; }

    .findings-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow-2xs);
    }
    .findings-table-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13.5px; font-weight: 700;
      color: var(--foreground);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--muted);
    }
    .findings-table-title mat-icon { color: var(--primary); }
    .count-badge {
      background: var(--primary); color: var(--primary-foreground);
      font-size: 11px; font-weight: 700;
      padding: 1px 7px; border-radius: 9999px;
    }
    .findings-table-wrap { overflow: auto; }
    .findings-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .findings-table th {
      background: var(--muted);
      padding: 9px 14px;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.4px;
      color: var(--muted-foreground);
      text-align: left;
    }
    .findings-table td { padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .num-col { width: 36px; color: var(--muted-foreground); font-weight: 700; }
    .desc-col { max-width: 500px; font-size: 13px; color: var(--foreground); line-height: 1.4; }

    .rating-badge {
      display: inline-block; font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 9999px;
    }
    .rating-high { background: oklch(0.92 0.07 25 / 0.5); color: oklch(0.42 0.18 25); }
    .rating-medium { background: oklch(0.94 0.07 75 / 0.5); color: oklch(0.42 0.15 75); }
    .rating-low { background: oklch(0.9 0.04 145 / 0.5); color: oklch(0.35 0.10 145); }

    .no-findings-card {
      display: flex; align-items: center; gap: 10px;
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 24px;
      color: var(--muted-foreground); font-size: 14px;
      box-shadow: var(--shadow-2xs);
    }
  `]
})
export class OnHireInspectionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(OnHireStore);
  readonly record = signal<OnHireInspection | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const fromStore = this.store.getById(id);
      if (fromStore) {
        this.record.set(fromStore);
        return;
      }
    }
    const all = this.store.records();
    if (all.length > 0) {
      this.record.set(all[0]);
    }
  }

  pct(val: number, total: number): number {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }
}
