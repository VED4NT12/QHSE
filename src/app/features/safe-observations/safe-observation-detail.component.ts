import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ObservationStore, SafeObservationCard } from '../../core/stores/observation.store';

@Component({
  selector: 'app-safe-observation-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="card()?.cardType + ' — ' + card()?.whatWasObserved"
        [subtitle]="card()?.vesselName + ' | ' + (card()?.date | date:'dd-MMM-yyyy') + ' at ' + card()?.time"
        icon="assignment_turned_in"
        [breadcrumbs]="[{label: 'Safe Observations', link: '/safe-observations'}, {label: 'Details'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button [routerLink]="['/safe-observations/edit', card()?.id]">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button routerLink="/safe-observations">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>
      </app-page-header>

      @if (card()) {
        <div class="detail-grid">
          <!-- Card Type Header -->
          <div class="card-type-banner" [class]="'ctype-banner-' + card()!.cardType.replace(' ', '-').toLowerCase()">
            <mat-icon>{{ getCardIcon(card()!.cardType) }}</mat-icon>
            <span class="ct-label">{{ card()!.cardType }}</span>
          </div>

          <!-- Basic Info -->
          <div class="info-card full-width">
            <div class="card-title"><mat-icon>info</mat-icon> Observation Details</div>
            <div class="info-grid">
              <div class="info-item"><span class="lbl">Vessel</span><span class="val fw">{{ card()!.vesselName }}</span></div>
              <div class="info-item"><span class="lbl">Date</span><span class="val">{{ card()!.date | date:'dd-MMM-yyyy' }}</span></div>
              <div class="info-item"><span class="lbl">Time</span><span class="val">{{ card()!.time }}</span></div>
              <div class="info-item"><span class="lbl">Card Type</span>
                <span class="card-type-badge" [class]="'ctype-' + card()!.cardType.replace(' ', '-').toLowerCase()">{{ card()!.cardType }}</span>
              </div>
              <div class="info-item"><span class="lbl">What Was Observed</span><span class="val fw">{{ card()!.whatWasObserved || '—' }}</span></div>
              <div class="info-item"><span class="lbl">Hazard Hunt Category</span><span class="val">{{ card()!.hazardHuntCategory || '—' }}</span></div>
            </div>
          </div>

          <!-- Description -->
          <div class="info-card full-width">
            <div class="card-title"><mat-icon>description</mat-icon> Detailed Description</div>
            <p class="desc-text">{{ card()!.detailedDescription }}</p>
          </div>

          <!-- Response Info -->
          <div class="info-card">
            <div class="card-title"><mat-icon>fact_check</mat-icon> Response & Attitude</div>
            <div class="info-grid">
              <div class="info-item"><span class="lbl">Stopped Work?</span>
                <span class="yn-badge" [class]="'yn-' + card()!.stoppedWork.toLowerCase()">{{ card()!.stoppedWork }}</span>
              </div>
              <div class="info-item"><span class="lbl">Situation Discussed?</span>
                <span class="yn-badge" [class]="'yn-' + card()!.situationDiscussed.toLowerCase()">{{ card()!.situationDiscussed }}</span>
              </div>
              <div class="info-item"><span class="lbl">Work Continued Safely?</span>
                <span class="yn-badge" [class]="'yn-' + card()!.workContinuedSafely.toLowerCase()">{{ card()!.workContinuedSafely }}</span>
              </div>
              <div class="info-item"><span class="lbl">Attitude of Persons</span>
                <span class="attitude-badge" [class]="'att-' + card()!.attitudeOfPersons.toLowerCase()">{{ card()!.attitudeOfPersons }}</span>
              </div>
            </div>
          </div>

          <!-- Root Cause Analysis -->
          <div class="info-card">
            <div class="card-title"><mat-icon>search</mat-icon> Root Cause Analysis</div>
            <div class="rca-table">
              <div class="rca-row"><span class="rca-lbl">Procedures / Comms / Training</span><span class="rca-val">{{ card()!.proceduresCommunications || '—' }}</span></div>
              <div class="rca-row"><span class="rca-lbl">Engineering</span><span class="rca-val">{{ card()!.engineering || '—' }}</span></div>
              <div class="rca-row"><span class="rca-lbl">Environment</span><span class="rca-val">{{ card()!.environment || '—' }}</span></div>
              <div class="rca-row"><span class="rca-lbl">People</span><span class="rca-val">{{ card()!.people || '—' }}</span></div>
              <div class="rca-row"><span class="rca-lbl">PPE Not Used</span><span class="rca-val">{{ card()!.ppeNotUsed || '—' }}</span></div>
              <div class="rca-row"><span class="rca-lbl">Tools & Equipment</span><span class="rca-val">{{ card()!.toolsAndEquipment || '—' }}</span></div>
            </div>
          </div>

          <!-- Corrective Actions -->
          <div class="info-card full-width">
            <div class="card-title"><mat-icon>build</mat-icon> Corrective Actions Taken</div>
            <div class="info-item" style="margin-bottom: 12px;">
              <span class="lbl">Action Taken?</span>
              <span class="yn-badge" [class]="'yn-' + card()!.correctiveActionTaken.toLowerCase()">{{ card()!.correctiveActionTaken }}</span>
            </div>
            <p class="action-text">{{ card()!.actionsTaken }}</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .d-flex { display: flex; } .gap-2 { gap: 8px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full-width { grid-column: 1 / -1; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

    .card-type-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: var(--radius); font-size: 16px; font-weight: 700; grid-column: 1 / -1; }
    .card-type-banner mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .ctype-banner-unsafe-act { background: oklch(0.93 0.06 25 / 0.2); color: oklch(0.38 0.18 25); border: 1px solid oklch(0.80 0.08 25 / 0.3); }
    .ctype-banner-unsafe-condition { background: oklch(0.96 0.06 75 / 0.2); color: oklch(0.38 0.15 75); border: 1px solid oklch(0.80 0.08 75 / 0.3); }
    .ctype-banner-safe-act { background: oklch(0.92 0.05 145 / 0.2); color: oklch(0.32 0.12 145); border: 1px solid oklch(0.80 0.06 145 / 0.3); }
    .ctype-banner-safe-condition { background: oklch(0.92 0.04 200 / 0.2); color: oklch(0.32 0.10 200); border: 1px solid oklch(0.80 0.06 200 / 0.3); }

    .info-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow-2xs); }
    .card-title { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: var(--foreground); margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
    .card-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .lbl { font-size: 11px; font-weight: 600; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; }
    .val { font-size: 13.5px; color: var(--foreground); } .fw { font-weight: 700; }

    .desc-text { font-size: 13.5px; color: var(--foreground); line-height: 1.6; margin: 0; }
    .action-text { font-size: 13.5px; color: var(--foreground); line-height: 1.6; margin: 0; }

    .rca-table { display: flex; flex-direction: column; gap: 8px; }
    .rca-row { display: flex; gap: 12px; align-items: flex-start; }
    .rca-lbl { width: 200px; flex-shrink: 0; font-size: 12px; font-weight: 600; color: var(--muted-foreground); }
    .rca-val { font-size: 13px; color: var(--foreground); }

    .card-type-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .ctype-unsafe-act { background: oklch(0.93 0.06 25 / 0.5); color: oklch(0.42 0.18 25); }
    .ctype-unsafe-condition { background: oklch(0.94 0.06 75 / 0.5); color: oklch(0.42 0.15 75); }
    .ctype-safe-act { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }
    .ctype-safe-condition { background: oklch(0.9 0.04 200 / 0.5); color: oklch(0.35 0.10 200); }

    .yn-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; }
    .yn-yes { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }
    .yn-no { background: oklch(0.92 0.06 25 / 0.5); color: oklch(0.42 0.18 25); }
    .yn-na { background: var(--muted); color: var(--muted-foreground); }

    .attitude-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; }
    .att-receptive { background: oklch(0.9 0.05 145 / 0.4); color: oklch(0.35 0.12 145); }
    .att-dismissive { background: oklch(0.94 0.06 75 / 0.4); color: oklch(0.42 0.15 75); }
    .att-aggressive { background: oklch(0.92 0.07 25 / 0.4); color: oklch(0.42 0.18 25); }
    .att-na { background: var(--muted); color: var(--muted-foreground); }
  `]
})
export class SafeObservationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(ObservationStore);
  readonly card = signal<SafeObservationCard | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const fromStore = this.store.getById(id);
      if (fromStore) {
        this.card.set(fromStore);
        return;
      }
    }
    // Fallback if not found
    const all = this.store.records();
    if (all.length > 0) {
      this.card.set(all[0]);
    }
  }

  getCardIcon(type: string): string {
    switch (type) {
      case 'Unsafe Act': return 'person_off';
      case 'Unsafe Condition': return 'report_problem';
      case 'Safe Act': return 'thumb_up';
      case 'Safe Condition': return 'check_circle';
      default: return 'assignment_turned_in';
    }
  }
}
