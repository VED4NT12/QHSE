import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RiskAssessmentRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-risk-assessment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container" *ngIf="ra">
      <app-page-header
        [title]="ra.referenceNo + ' - ' + ra.activityTitle"
        [subtitle]="ra.vesselName + ' • ' + ra.department"
        icon="rule"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Risk Assessments', link: '/risk-assessment'},
          {label: ra.referenceNo}
        ]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="simulatePrint()" class="btn-export">
            <mat-icon>print</mat-icon> Printable JSA
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="acknowledge()">
            <mat-icon>verified</mat-icon> Electronic Approval Sign-Off
          </button>
        </div>
      </app-page-header>

      <!-- Key Metadata Row -->
      <div class="hseq-card ra-meta-grid mb-4">
        <div class="meta-item">
          <span class="meta-lbl">Validity & Review Window</span>
          <span class="meta-val">{{ ra.assessmentDate }} to {{ ra.validityExpiryDate }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Risk Mitigation Result</span>
          <span class="meta-val text-green">Critical &rarr; Low Risk (ALARP Verified)</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Lead Assessor & Approver</span>
          <span class="meta-val">{{ ra.leadAssessor }} &bull; {{ ra.approver }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-lbl">Permit Linkage</span>
          <span class="meta-val text-blue font-mono">{{ ra.linkedPermits.join(', ') }}</span>
        </div>
      </div>

      <!-- Structured Step-by-Step Risk Table -->
      <div class="hseq-card">
        <div class="hseq-card-header">
          <div class="title-wrap">
            <mat-icon class="card-icon text-blue">table_chart</mat-icon>
            <div>
              <h3 class="card-heading">Hazard Identification & Control Measures Breakdown</h3>
              <span class="card-subheading">Maritime Job Safety Analysis (JSA) per IMO & OCIMF Guidelines</span>
            </div>
          </div>
          <span class="status-badge badge-success">ALARP Achieved</span>
        </div>

        <div class="table-responsive">
          <table class="hseq-table">
            <thead>
              <tr>
                <th style="width: 50px;">Step</th>
                <th style="width: 220px;">Work Sequence & Hazard</th>
                <th>Initial Risk (L &times; C)</th>
                <th>Hierarchy & Control Measures</th>
                <th>Residual Risk (L &times; C)</th>
                <th>ALARP</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let step of ra.steps">
                <td class="font-bold text-center">{{ step.stepNumber }}</td>
                <td>
                  <strong class="text-sm block">{{ step.stepDescription }}</strong>
                  <span class="hazard-desc block mt-1"><strong>Hazards:</strong> {{ step.hazards }}</span>
                  <span class="text-xs text-muted block mt-1">Affects: {{ step.affectedEntities }}</span>
                </td>
                <td>
                  <div class="matrix-calc-badge badge-crit">
                    <span>{{ step.initialLikelihood }} &times; {{ step.initialConsequence }} = <strong>{{ step.initialRating }}</strong></span>
                    <span class="rating-name">Critical Risk</span>
                  </div>
                </td>
                <td>
                  <div class="controls-box">
                    <span class="hierarchy-pill">{{ step.hierarchy }} Control</span>
                    <div class="control-text">
                      <strong>Existing Controls:</strong> {{ step.existingControls }}
                    </div>
                    <div class="control-text mt-1 text-blue">
                      <strong>Additional Controls:</strong> {{ step.additionalControls }}
                    </div>
                  </div>
                </td>
                <td>
                  <div class="matrix-calc-badge badge-low">
                    <span>{{ step.residualLikelihood }} &times; {{ step.residualConsequence }} = <strong>{{ step.residualRating }}</strong></span>
                    <span class="rating-name">Low Residual Risk</span>
                  </div>
                </td>
                <td>
                  <span class="alarp-flag">
                    <mat-icon class="check-sm">check_circle</mat-icon> ALARP
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Linked Documents & Permits -->
      <div class="grid-2col mt-4">
        <div class="hseq-card p-3">
          <h4 class="font-bold mb-2">Linked Fleet Operating Procedures (DMS)</h4>
          <div *ngFor="let proc of ra.linkedProcedures" class="doc-link-pill">
            <mat-icon class="doc-icon">description</mat-icon>
            <span>{{ proc }}</span>
          </div>
        </div>

        <div class="hseq-card p-3">
          <h4 class="font-bold mb-2">Permit to Work Interlock</h4>
          <div *ngFor="let p of ra.linkedPermits" class="permit-interlock-pill">
            <mat-icon class="ptw-icon">vpn_key</mat-icon>
            <div>
              <strong>{{ p }}</strong>
              <span class="block text-xs">Pre-requisite safety condition before PTW authorization</span>
            </div>
            <button mat-button color="primary" [routerLink]="['/permits', 'PTW-01']">Open PTW</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .ra-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      padding: 16px 20px;
    }
    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-lbl { font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .meta-val { font-size: 14px; font-weight: 700; color: var(--foreground); }
    .text-green { color: var(--primary); }
    .text-blue { color: var(--primary); }
    .title-wrap { display: flex; align-items: center; gap: 12px; }
    .card-icon { font-size: 28px; width: 28px; height: 28px; }
    .card-heading { font-size: 16px; font-weight: 700; color: var(--foreground); margin: 0; }
    .card-subheading { font-size: 11.5px; color: var(--muted-foreground); }
    .hazard-desc { font-size: 12px; color: var(--destructive); background: oklch(0.95 0.04 25); padding: 4px 6px; border-radius: 4px; }
    .matrix-calc-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }
    .badge-crit { background: oklch(0.95 0.04 25); color: var(--destructive); border: 1px solid oklch(0.88 0.08 25); }
    .badge-low { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .rating-name { font-size: 10px; text-transform: uppercase; }
    .controls-box { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; }
    .hierarchy-pill {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--primary);
      background: var(--accent);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      display: inline-block;
      width: fit-content;
    }
    .control-text { line-height: 1.4; color: var(--foreground); }
    .alarp-flag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--primary);
    }
    .check-sm { font-size: 16px; width: 16px; height: 16px; }
    .grid-2col { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
    .p-3 { padding: 16px; }
    .doc-link-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
    }
    .doc-icon { font-size: 20px; width: 20px; height: 20px; color: var(--primary); }
    .permit-interlock-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .ptw-icon { color: var(--primary); font-size: 24px; width: 24px; height: 24px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-2 { margin-bottom: 8px; }
    .mt-4 { margin-top: 16px; }
    .mt-1 { margin-top: 4px; }
  `]
})
export class RiskAssessmentDetailComponent implements OnInit {
  ra?: RiskAssessmentRecord;

  constructor(
    private route: ActivatedRoute,
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.ra = this.state.riskAssessments().find(r => r.id === id) || this.state.riskAssessments()[0];
  }

  acknowledge() {
    this.notify.showSuccess('Electronic Sign-Off Logged', `Master electronic approval logged for ${this.ra?.referenceNo}. JSA remains Active.`);
  }

  simulatePrint() {
    this.notify.showInfo('Report Generated', 'Official OCIMF-compliant Job Safety Analysis document exported to PDF.');
  }
}
