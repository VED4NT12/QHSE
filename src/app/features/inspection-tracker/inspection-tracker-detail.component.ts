import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { InspectionStore, InspectionTrackerRecord } from '../../core/stores/inspection.store';

@Component({
  selector: 'app-inspection-tracker-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="rec()?.vesselName + ' — ' + (rec()?.typeOfInspection || rec()?.inspectionType)"
        [subtitle]="rec()?.period + ' | ' + (rec()?.categoryOfInspection || rec()?.inspectionCategory) + ' Inspection'"
        icon="fact_check"
        [breadcrumbs]="[{label: 'Inspection Tracker', link: '/inspection-tracker'}, {label: 'Details'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button [routerLink]="['/inspection-tracker/edit', rec()?.id]">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button routerLink="/inspection-tracker">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>
      </app-page-header>

      @if (rec()) {
        <div class="detail-grid">
          <!-- Inspection Info Card -->
          <div class="info-card">
            <div class="card-title"><mat-icon>info</mat-icon> Inspection Details</div>
            <div class="info-table">
              <div class="info-row"><span class="lbl">Vessel</span><span class="val fw">{{ rec()!.vesselName }}</span></div>
              <div class="info-row"><span class="lbl">Vessel Type</span><span class="val">{{ rec()!.vesselType }}</span></div>
              <div class="info-row"><span class="lbl">Takeover Date</span><span class="val">{{ rec()!.takeoverDate }}</span></div>
              <div class="info-row"><span class="lbl">Inspection Category</span>
                <span class="cat-badge" [class]="'cat-' + (rec()?.categoryOfInspection || rec()?.inspectionCategory || 'Internal').toLowerCase()">
                  {{ rec()?.categoryOfInspection || rec()?.inspectionCategory }}
                </span>
              </div>
              <div class="info-row"><span class="lbl">Inspection Type</span><span class="val"><strong>{{ rec()!.typeOfInspection || rec()!.inspectionType }}</strong></span></div>
              <div class="info-row"><span class="lbl">Period</span><span class="val">{{ rec()!.period }}</span></div>
              <div class="info-row"><span class="lbl">Date of Inspection</span><span class="val">{{ rec()!.dateOfInspection | date:'dd-MMM-yyyy' }}</span></div>
              <div class="info-row"><span class="lbl">Next Inspection</span><span class="val">{{ rec()!.nextInspectionDate | date:'dd-MMM-yyyy' }}</span></div>
              <div class="info-row"><span class="lbl">PIC Name</span><span class="val">{{ rec()!.picName }}</span></div>
              <div class="info-row"><span class="lbl">PIC Role</span><span class="val">{{ rec()!.picRole }}</span></div>
              <div class="info-row"><span class="lbl">Status</span>
                <span class="status-badge" [class]="'status-' + rec()!.status.toLowerCase()">{{ rec()!.status }}</span>
              </div>
            </div>
          </div>

          <!-- Findings Summary -->
          <div class="findings-summary-card">
            <div class="card-title"><mat-icon>assessment</mat-icon> Findings Summary</div>
            <div class="findings-grid">
              <div class="f-stat">
                <div class="f-val total">{{ rec()!.findingsTotal }}</div>
                <div class="f-lbl">Total Findings</div>
              </div>
              <div class="f-stat">
                <div class="f-val closed">{{ rec()!.closedTotal }}</div>
                <div class="f-lbl">Closed</div>
              </div>
              <div class="f-stat">
                <div class="f-val open">{{ rec()!.findingsTotal - rec()!.closedTotal }}</div>
                <div class="f-lbl">Open</div>
              </div>
            </div>
            <div class="rating-bars">
              <div class="r-row">
                <span class="r-lbl">High</span>
                <div class="r-bar-wrap"><div class="r-bar r-high" [style.width.%]="pct(rec()!.findingsHigh, rec()!.findingsTotal)"></div></div>
                <span class="r-cnt high">{{ rec()!.findingsHigh }}</span>
              </div>
              <div class="r-row">
                <span class="r-lbl">Medium</span>
                <div class="r-bar-wrap"><div class="r-bar r-med" [style.width.%]="pct(rec()!.findingsMedium, rec()!.findingsTotal)"></div></div>
                <span class="r-cnt med">{{ rec()!.findingsMedium }}</span>
              </div>
              <div class="r-row">
                <span class="r-lbl">Low</span>
                <div class="r-bar-wrap"><div class="r-bar r-low" [style.width.%]="pct(rec()!.findingsLow, rec()!.findingsTotal)"></div></div>
                <span class="r-cnt low">{{ rec()!.findingsLow }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Findings Table -->
        @if (rec()?.findings && rec()!.findings!.length > 0) {
          <div class="findings-section">
            <div class="section-title"><mat-icon>list_alt</mat-icon> Detailed Findings <span class="count-pill">{{ rec()!.findings!.length }}</span></div>
            <table class="findings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Area of Concern</th>
                  <th>Sub-AOC</th>
                  <th>Finding Description</th>
                  <th>Rating</th>
                  <th>Corrective Action</th>
                  <th>Closure Date</th>
                  <th>Status</th>
                  <th>PIC</th>
                </tr>
              </thead>
              <tbody>
                @for (f of rec()!.findings!; track $index) {
                  <tr>
                    <td class="num">{{ $index + 1 }}</td>
                    <td><span class="aoc-chip">{{ f.aoc }}</span></td>
                    <td class="sub-aoc">{{ f.subAoc }}</td>
                    <td class="desc">{{ f.findingDescription }}</td>
                    <td><span class="rating-badge" [class]="'rating-' + f.rating.toLowerCase()">{{ f.rating }}</span></td>
                    <td class="action-text">{{ f.correctiveAction || '—' }}</td>
                    <td>{{ f.closureDate || '—' }}</td>
                    <td><span class="status-badge" [class]="'status-' + f.status.toLowerCase()">{{ f.status }}</span></td>
                    <td class="pic-text">{{ f.picDetails }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="no-findings">
            <mat-icon>check_circle_outline</mat-icon>
            <span>No detailed findings logged for this inspection.</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 1300px; margin: 0 auto; }
    .d-flex { display: flex; } .gap-2 { gap: 8px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-card, .findings-summary-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow-2xs); }
    .card-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: var(--foreground); margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
    .card-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .info-table { display: flex; flex-direction: column; gap: 10px; }
    .info-row { display: flex; align-items: center; gap: 10px; }
    .lbl { width: 150px; font-size: 11.5px; font-weight: 600; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; flex-shrink: 0; }
    .val { font-size: 13.5px; color: var(--foreground); } .fw { font-weight: 700; }
    .cat-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .cat-external { background: oklch(0.92 0.04 265 / 0.5); color: oklch(0.38 0.12 265); }
    .cat-internal { background: oklch(0.92 0.04 230 / 0.5); color: oklch(0.38 0.12 230); }
    .status-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; }
    .status-open { background: oklch(0.92 0.06 25 / 0.5); color: oklch(0.45 0.18 25); }
    .status-closed, .status-completed { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }
    .findings-grid { display: flex; gap: 20px; margin-bottom: 16px; }
    .f-stat { flex: 1; text-align: center; }
    .f-val { font-size: 32px; font-weight: 800; line-height: 1; } .f-val.total { color: var(--foreground); } .f-val.closed { color: oklch(0.38 0.12 145); } .f-val.open { color: oklch(0.48 0.18 25); }
    .f-lbl { font-size: 11px; color: var(--muted-foreground); margin-top: 4px; text-transform: uppercase; }
    .rating-bars { display: flex; flex-direction: column; gap: 8px; }
    .r-row { display: flex; align-items: center; gap: 10px; }
    .r-lbl { width: 50px; font-size: 12px; color: var(--muted-foreground); font-weight: 600; }
    .r-bar-wrap { flex: 1; height: 8px; background: var(--muted); border-radius: 4px; overflow: hidden; }
    .r-bar { height: 100%; border-radius: 4px; }
    .r-high { background: oklch(0.52 0.18 25); } .r-med { background: oklch(0.55 0.15 75); } .r-low { background: oklch(0.42 0.12 145); }
    .r-cnt { width: 24px; font-size: 12px; font-weight: 700; text-align: right; }
    .r-cnt.high { color: oklch(0.42 0.18 25); } .r-cnt.med { color: oklch(0.42 0.15 75); } .r-cnt.low { color: oklch(0.35 0.12 145); }
    .findings-section { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-2xs); }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: var(--foreground); padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--muted); }
    .section-title mat-icon { color: var(--primary); }
    .count-pill { background: var(--primary); color: var(--primary-foreground); font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 9999px; }
    .findings-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .findings-table th { background: var(--muted); padding: 9px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted-foreground); text-align: left; white-space: nowrap; }
    .findings-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .num { width: 32px; color: var(--muted-foreground); font-weight: 700; }
    .aoc-chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: oklch(0.93 0.03 230 / 0.5); color: oklch(0.38 0.10 230); }
    .sub-aoc { font-size: 12px; color: var(--muted-foreground); max-width: 120px; }
    .desc { max-width: 380px; font-size: 13px; color: var(--foreground); line-height: 1.4; }
    .action-text { max-width: 200px; font-size: 12px; color: var(--muted-foreground); }
    .pic-text { font-size: 12px; max-width: 120px; }
    .rating-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .rating-high { background: oklch(0.92 0.07 25 / 0.5); color: oklch(0.42 0.18 25); }
    .rating-medium { background: oklch(0.94 0.07 75 / 0.5); color: oklch(0.42 0.15 75); }
    .rating-low { background: oklch(0.9 0.04 145 / 0.5); color: oklch(0.35 0.10 145); }
    .no-findings { display: flex; align-items: center; gap: 10px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; color: var(--muted-foreground); font-size: 14px; }
  `]
})
export class InspectionTrackerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(InspectionStore);
  readonly rec = signal<InspectionTrackerRecord | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const fromStore = this.store.getById(id);
      if (fromStore) {
        this.rec.set(fromStore);
        return;
      }
    }
    const all = this.store.records();
    if (all.length > 0) {
      this.rec.set(all[0]);
    }
  }

  pct(val: number, total: number): number {
    return total > 0 ? Math.round((val / total) * 100) : 0;
  }
}
