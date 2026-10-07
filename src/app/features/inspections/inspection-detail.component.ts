import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { WorkflowActionDialogComponent } from '../../shared/components/workflow-action-dialog/workflow-action-dialog.component';
import { InspectionRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-inspection-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    StatusBadgeComponent,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container" *ngIf="record">
      <app-page-header
        [title]="record.referenceNo + ' - ' + record.inspectionType"
        [subtitle]="record.vesselName + ' • ' + record.department + ' • ' + record.location"
        icon="fact_check"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Inspections', link: '/inspections'},
          {label: record.referenceNo}
        ]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="escalateFinding()" class="btn-escalate" *ngIf="record.overallStatus !== 'Closed'">
            <mat-icon color="warn">warning</mat-icon> Escalate Overdue
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="openWorkflowModal()" *ngIf="record.overallStatus !== 'Closed'">
            <mat-icon>verified</mat-icon> Sign-off & Close Inspection
          </button>
        </div>
      </app-page-header>

      <!-- Workflow Lifecycle Stepper Bar -->
      <div class="workflow-stepper mb-4">
        <div class="stepper-step completed">
          <div class="stepper-circle"><mat-icon class="check-icon">check</mat-icon></div>
          <span>1. Inspection Raised</span>
        </div>
        <div class="stepper-line completed"></div>
        <div class="stepper-step completed">
          <div class="stepper-circle"><mat-icon class="check-icon">check</mat-icon></div>
          <span>2. Lead Auditor Review</span>
        </div>
        <div class="stepper-line" [class.completed]="record.overallStatus === 'Closed'"></div>
        <div class="stepper-step" [class.active]="record.overallStatus === 'Action Pending'" [class.completed]="record.overallStatus === 'Closed'">
          <div class="stepper-circle">3</div>
          <span>3. Corrective Action Verification</span>
        </div>
        <div class="stepper-line" [class.completed]="record.overallStatus === 'Closed'"></div>
        <div class="stepper-step" [class.active]="record.overallStatus === 'Closed'">
          <div class="stepper-circle">4</div>
          <span>4. Formal Audit Sign-off</span>
        </div>
      </div>

      <!-- Overview Cards Grid -->
      <div class="overview-grid mb-4">
        <div class="hseq-card info-card">
          <div class="info-label">Inspection Date</div>
          <div class="info-val">{{ record.inspectionDate }}</div>
          <div class="info-sub">Lead: {{ record.leadInspector }}</div>
        </div>
        <div class="hseq-card info-card">
          <div class="info-label">Audit Score</div>
          <div class="info-val text-blue">{{ record.scorePercentage }}% Pass</div>
          <div class="info-sub">ISM Checklist Verified</div>
        </div>
        <div class="hseq-card info-card">
          <div class="info-label">Total Findings Logged</div>
          <div class="info-val text-amber">{{ record.findings.length }} Items</div>
          <div class="info-sub">{{ getPendingCount() }} Pending Action</div>
        </div>
        <div class="hseq-card info-card">
          <div class="info-label">Lifecycle Status</div>
          <div class="info-val">
            <app-status-badge [status]="record.overallStatus"></app-status-badge>
          </div>
          <div class="info-sub">Audit trail: {{ record.auditTrail.length }} logged events</div>
        </div>
      </div>

      <!-- Tabbed Workspace -->
      <div class="hseq-card">
        <mat-tab-group>
          <!-- Tab 1: Findings & CAPA Sub-forms -->
          <mat-tab label="Audit Findings & Actions ({{ record.findings.length }})">
            <div class="tab-body">
              <div class="section-title-bar">
                <h3>Recorded Non-Conformities & Observations</h3>
                <span class="text-muted text-xs">Each high severity finding automatically links to the Fleet CAPA Tracker</span>
              </div>

              <div *ngFor="let finding of record.findings; let idx = index" class="finding-card">
                <div class="finding-header">
                  <div class="finding-title-wrap">
                    <span class="finding-num">Finding #{{ idx + 1 }}</span>
                    <span class="finding-cat">{{ finding.category }}</span>
                  </div>
                  <div class="finding-badges">
                    <span class="severity-pill" [ngClass]="'severity-' + finding.severity.toLowerCase()">
                      {{ finding.severity }} Severity (Rating: {{ finding.riskRating }})
                    </span>
                    <app-status-badge [status]="finding.status"></app-status-badge>
                  </div>
                </div>

                <div class="finding-desc">
                  <strong>Observation / Deficiency:</strong>
                  <p>{{ finding.description }}</p>
                </div>

                <div class="finding-action-box">
                  <div class="action-item">
                    <span class="action-lbl">Immediate Action Taken:</span>
                    <span class="action-txt">{{ finding.immediateAction }}</span>
                  </div>
                  <div class="action-meta-row">
                    <div><strong>Assigned To:</strong> {{ finding.responsiblePerson }}</div>
                    <div><strong>Target Date:</strong> {{ finding.targetDate }}</div>
                    <div>
                      <strong>CAPA Status:</strong> 
                      <span class="capa-flag" *ngIf="finding.capaRequired">Linked to Universal CAPA Tracker</span>
                      <span *ngIf="!finding.capaRequired" class="text-muted">Direct Close</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Attachments & Evidence -->
          <mat-tab label="Photographic Evidence ({{ record.attachments.length }})">
            <div class="tab-body">
              <div class="attachments-grid">
                <div *ngFor="let att of record.attachments" class="attachment-item">
                  <mat-icon class="att-icon">image</mat-icon>
                  <div class="att-details">
                    <span class="att-name">{{ att.fileName }}</span>
                    <span class="att-meta">{{ att.fileSize }} &bull; Uploaded by {{ att.uploadedBy }} on {{ att.uploadedAt }}</span>
                  </div>
                  <button mat-icon-button color="primary" matTooltip="Download Evidence"><mat-icon>download</mat-icon></button>
                </div>
              </div>
              <div class="upload-simulation-zone">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <div class="upload-text">
                  <strong>Click or Drag files to attach evidence</strong>
                  <span>Supports JPG, PNG, PDF inspection checklists up to 25MB</span>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Non-editable Audit Trail -->
          <mat-tab label="System Audit Log ({{ record.auditTrail.length }})">
            <div class="tab-body">
              <div class="timeline-container">
                <div *ngFor="let audit of record.auditTrail" class="timeline-entry">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-action">{{ audit.action }}</span>
                      <span class="timeline-time">{{ audit.timestamp }}</span>
                    </div>
                    <span class="timeline-user">Executed by <strong>{{ audit.user }}</strong> ({{ audit.role }})</span>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-escalate { height: 42px !important; border-color: #fca5a5 !important; color: #b91c1c !important; font-weight: 600 !important; }
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .info-card { padding: 16px; }
    .info-label { font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .info-val { font-size: 18px; font-weight: 800; color: #0f172a; margin: 4px 0; }
    .info-sub { font-size: 12px; color: #94a3b8; }
    .tab-body { padding: 24px; }
    .section-title-bar { margin-bottom: 20px; }
    .section-title-bar h3 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .finding-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 16px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .finding-title-wrap { display: flex; align-items: center; gap: 10px; }
    .finding-num { font-size: 12px; font-weight: 800; background: var(--primary); color: var(--primary-foreground); padding: 3px 8px; border-radius: 4px; }
    .finding-cat { font-size: 14px; font-weight: 700; color: var(--primary); }
    .finding-badges { display: flex; align-items: center; gap: 8px; }
    .severity-pill { font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
    .severity-high { background: #ffedd5; color: #9a3412; }
    .severity-medium { background: #fef3c7; color: #92400e; }
    .severity-low { background: #d1fae5; color: #065f46; }
    .finding-desc { font-size: 13.5px; color: #334155; margin-bottom: 14px; line-height: 1.5; }
    .finding-action-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .action-item { margin-bottom: 8px; font-size: 13px; }
    .action-lbl { font-weight: 700; color: #475569; margin-right: 6px; }
    .action-meta-row {
      display: flex;
      align-items: center;
      gap: 20px;
      font-size: 12px;
      color: #475569;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8px;
      flex-wrap: wrap;
    }
    .capa-flag { color: var(--primary); font-weight: 700; }
    .check-icon { font-size: 16px; width: 16px; height: 16px; }
    .attachments-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .attachment-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--card);
    }
    .att-icon { font-size: 28px; width: 28px; height: 28px; color: var(--primary); }
    .att-details { display: flex; flex-direction: column; flex: 1; }
    .att-name { font-size: 13px; font-weight: 700; color: var(--foreground); }
    .att-meta { font-size: 11.5px; color: var(--muted-foreground); }
    .upload-simulation-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-sm);
      padding: 30px;
      text-align: center;
      background: var(--card);
      cursor: pointer;
    }
    .upload-icon { font-size: 36px; width: 36px; height: 36px; color: var(--muted-foreground); }
    .upload-text { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; font-size: 13px; color: var(--muted-foreground); }
    .timeline-container { position: relative; padding-left: 20px; border-left: 2px solid var(--border); }
    .timeline-entry { position: relative; margin-bottom: 20px; }
    .timeline-dot {
      position: absolute;
      left: -26px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--card);
    }
    .timeline-content { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .timeline-action { font-size: 13px; font-weight: 700; color: #0f172a; }
    .timeline-time { font-size: 11px; color: #94a3b8; }
    .timeline-user { font-size: 12px; color: #64748b; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class InspectionDetailComponent implements OnInit {
  record?: InspectionRecord;

  constructor(
    private route: ActivatedRoute,
    public state: HseqStateService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.record = this.state.inspections().find(i => i.id === id) || this.state.inspections()[0];
  }

  getPendingCount(): number {
    return this.record?.findings.filter(f => f.status !== 'Closed').length || 0;
  }

  escalateFinding() {
    this.notify.showWarning('Escalation Sent', 'High-risk finding escalated to Technical Superintendent & HSEQ Manager.');
  }

  openWorkflowModal() {
    if (!this.record) return;
    const dialogRef = this.dialog.open(WorkflowActionDialogComponent, {
      width: '520px',
      data: {
        title: 'Formal Inspection Sign-off & Closure',
        actionName: 'Sign-off and Close',
        recordRef: this.record.referenceNo,
        currentStatus: this.record.overallStatus,
        targetStatus: 'Closed',
        requiresJustification: true
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res?.confirmed && this.record) {
        this.state.updateInspectionStatus(this.record.id, 'Closed');
        this.record = this.state.inspections().find(i => i.id === this.record!.id);
        this.notify.showSuccess('Inspection Closed', `Audit ${this.record?.referenceNo} signed off and closed under ISM Code.`);
      }
    });
  }
}
