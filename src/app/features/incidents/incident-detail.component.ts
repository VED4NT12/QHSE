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
import { IncidentRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    StatusBadgeComponent,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container" *ngIf="incident">
      <app-page-header
        [title]="incident.referenceNo + ' - ' + incident.classification"
        [subtitle]="incident.vesselName + ' • ' + incident.location"
        icon="report_problem"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Incidents', link: '/incidents'},
          {label: incident.referenceNo}
        ]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="simulateReportDownload()" class="btn-export">
            <mat-icon>print</mat-icon> Printable Incident Report
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="notifyClosed()">
            <mat-icon>verified</mat-icon> Complete Management Review
          </button>
        </div>
      </app-page-header>

      <!-- Severity & Escalation Summary Banner -->
      <div class="hseq-card summary-banner mb-4">
        <div class="banner-stat">
          <span class="stat-lbl">Actual Severity</span>
          <span class="stat-val text-amber">{{ incident.actualSeverity }} Severity</span>
        </div>
        <div class="banner-stat">
          <span class="stat-lbl">Potential Severity</span>
          <span class="stat-val text-red">{{ incident.potentialSeverity }} Consequence</span>
        </div>
        <div class="banner-stat">
          <span class="stat-lbl">Escalation Status</span>
          <span class="stat-val text-blue">Notified Shore Emergency Response</span>
        </div>
        <div class="banner-stat">
          <span class="stat-lbl">Investigation Team</span>
          <span class="stat-val">{{ incident.investigationTeam.length }} Key Officers</span>
        </div>
        <div class="banner-stat">
          <span class="stat-lbl">Lifecycle Status</span>
          <div class="stat-val"><app-status-badge [status]="incident.status"></app-status-badge></div>
        </div>
      </div>

      <!-- Tabbed Investigation Workspace -->
      <div class="hseq-card">
        <mat-tab-group>
          <!-- Tab 1: 5-Why Structured Root Cause Analysis -->
          <mat-tab label="5-Why Root Cause Investigation">
            <div class="tab-body">
              <div class="why-tree-header mb-4">
                <h3>Structured 5-Why Investigation Diagram</h3>
                <p class="text-xs text-muted mb-0">Systematic breakdown identifying organizational, procedural and equipment failure modes</p>
              </div>

              <div class="five-why-chain">
                <div class="why-node">
                  <div class="why-badge">Why 1</div>
                  <div class="why-content">
                    <span class="why-question">Why did the turnbuckle tensioner fail during voyage?</span>
                    <p class="why-answer">{{ incident.fiveWhyAnalysis.why1 }}</p>
                  </div>
                </div>

                <div class="why-arrow"><mat-icon>south</mat-icon></div>

                <div class="why-node">
                  <div class="why-badge">Why 2</div>
                  <div class="why-content">
                    <span class="why-question">Why did the thread shear under dynamic sea loads?</span>
                    <p class="why-answer">{{ incident.fiveWhyAnalysis.why2 }}</p>
                  </div>
                </div>

                <div class="why-arrow"><mat-icon>south</mat-icon></div>

                <div class="why-node">
                  <div class="why-badge">Why 3</div>
                  <div class="why-content">
                    <span class="why-question">Why were fatigue micro-fractures not identified in advance?</span>
                    <p class="why-answer">{{ incident.fiveWhyAnalysis.why3 }}</p>
                  </div>
                </div>

                <div class="why-arrow"><mat-icon>south</mat-icon></div>

                <div class="why-node">
                  <div class="why-badge">Why 4</div>
                  <div class="why-content">
                    <span class="why-question">Why was ultrasonic NDT testing omitted?</span>
                    <p class="why-answer">{{ incident.fiveWhyAnalysis.why4 }}</p>
                  </div>
                </div>

                <div class="why-arrow"><mat-icon>south</mat-icon></div>

                <div class="why-node root-cause-node">
                  <div class="why-badge root-badge">Root Cause</div>
                  <div class="why-content">
                    <span class="why-question text-red font-bold">Identified Systemic Root Cause:</span>
                    <p class="why-answer font-semibold">{{ incident.fiveWhyAnalysis.rootCause }}</p>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 2: Event Details & Evidence -->
          <mat-tab label="Event Narrative & Evidence ({{ incident.attachments.length }})">
            <div class="tab-body">
              <div class="narrative-box mb-4">
                <h4>Chronological Event Narrative</h4>
                <p>{{ incident.description }}</p>
                <div class="immediate-response-callout">
                  <strong>Immediate Action / Response Taken:</strong>
                  <p class="mb-0">{{ incident.immediateResponse }}</p>
                </div>
              </div>

              <h4>Evidence & Photographic Documentation</h4>
              <div class="att-list">
                <div *ngFor="let att of incident.attachments" class="att-row">
                  <mat-icon class="att-icon">attachment</mat-icon>
                  <div class="att-meta">
                    <span class="att-title">{{ att.fileName }}</span>
                    <span class="att-sub">{{ att.fileSize }} &bull; Uploaded by {{ att.uploadedBy }}</span>
                  </div>
                  <button mat-icon-button color="primary"><mat-icon>download</mat-icon></button>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Management Review & Fleet Communication -->
          <mat-tab label="Management Review & CAPA Linkage">
            <div class="tab-body">
              <div class="review-box mb-4">
                <h4>HSEQ Director & Master Final Review Notes</h4>
                <p>{{ incident.finalReviewNotes }}</p>
              </div>

              <h4>Associated Corrective Action Plans</h4>
              <div class="linked-capa-card" *ngFor="let capaId of incident.capaIds">
                <mat-icon class="capa-icon">task_alt</mat-icon>
                <div class="capa-info">
                  <span class="capa-id font-mono">{{ capaId }}</span>
                  <span class="capa-desc">Universal Fleet Action Tracker Entry</span>
                </div>
                <button mat-stroked-button color="primary" routerLink="/capa">Open in CAPA Tracker</button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .summary-banner {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 18px 24px;
      background: #ffffff;
    }
    .banner-stat { display: flex; flex-direction: column; }
    .stat-lbl { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .stat-val { font-size: 15px; font-weight: 800; color: var(--foreground); margin-top: 4px; }
    .text-amber { color: var(--secondary-foreground); }
    .text-red { color: var(--destructive); }
    .text-blue { color: var(--primary); }
    .tab-body { padding: 24px; }
    .five-why-chain { display: flex; flex-direction: column; align-items: center; max-width: 800px; margin: 0 auto; }
    .why-node {
      display: flex;
      align-items: stretch;
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--card);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .why-badge {
      background: var(--primary);
      color: var(--primary-foreground);
      font-weight: 800;
      font-size: 13px;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 90px;
    }
    .why-content { padding: 12px 16px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .why-question { font-size: 12px; font-weight: 700; color: var(--muted-foreground); }
    .why-answer { font-size: 13.5px; color: var(--foreground); margin: 0; line-height: 1.4; }
    .why-arrow { color: var(--muted-foreground); height: 28px; display: flex; align-items: center; justify-content: center; }
    .root-cause-node { border: 2px solid var(--destructive); background: oklch(0.95 0.04 25); }
    .root-badge { background: var(--destructive); }
    .narrative-box { background: var(--muted); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; }
    .immediate-response-callout { background: var(--accent); border-left: 4px solid var(--primary); padding: 10px 14px; border-radius: 4px; margin-top: 12px; font-size: 13px; color: var(--foreground); }
    .att-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .att-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 6px; }
    .att-icon { font-size: 24px; width: 24px; height: 24px; color: var(--muted-foreground); }
    .att-meta { display: flex; flex-direction: column; flex: 1; }
    .att-title { font-size: 13px; font-weight: 700; color: var(--foreground); }
    .att-sub { font-size: 11px; color: var(--muted-foreground); }
    .review-box { background: var(--accent); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; color: var(--primary); font-size: 13.5px; }
    .linked-capa-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid var(--border); border-radius: var(--radius-sm); margin-bottom: 8px; background: var(--card); }
    .capa-icon { color: var(--primary); font-size: 24px; width: 24px; height: 24px; }
    .capa-info { display: flex; flex-direction: column; flex: 1; }
    .capa-id { font-size: 13px; font-weight: 700; color: var(--primary); }
    .capa-desc { font-size: 12px; color: var(--muted-foreground); }
    .mb-4 { margin-bottom: 16px; }
    .mb-0 { margin-bottom: 0; }
  `]
})
export class IncidentDetailComponent implements OnInit {
  incident?: IncidentRecord;

  constructor(
    private route: ActivatedRoute,
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.incident = this.state.incidents().find(i => i.id === id) || this.state.incidents()[0];
  }

  simulateReportDownload() {
    this.notify.showSuccess('Report Generated', 'Official ISM Maritime Incident Report PDF downloaded.');
  }

  notifyClosed() {
    if (this.incident) {
      this.state.updateIncidentStatus(this.incident.id, 'Closed');
      this.incident = this.state.incidents().find(i => i.id === this.incident!.id);
      this.notify.showSuccess('Management Review Complete', `Incident investigation ${this.incident?.referenceNo} signed off and closed.`);
    }
  }
}
