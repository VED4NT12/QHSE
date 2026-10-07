import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PermitToWorkRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-permit-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    StatusBadgeComponent,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container" *ngIf="permit">
      <app-page-header
        [title]="permit.referenceNo + ' - ' + permit.permitType"
        [subtitle]="permit.vesselName + ' • ' + permit.worksiteLocation"
        icon="vpn_key"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Permits to Work', link: '/permits'},
          {label: permit.referenceNo}
        ]">
        <div actions class="d-flex gap-2">
          <button 
            *ngIf="permit.status === 'Approved'" 
            mat-flat-button color="primary" 
            class="btn-primary-action" 
            (click)="changeStatus('Active')">
            <mat-icon>play_arrow</mat-icon> Authorize & Activate Permit
          </button>

          <button 
            *ngIf="permit.status === 'Active'" 
            mat-stroked-button color="warn" 
            class="btn-secondary-action" 
            (click)="changeStatus('Suspended')">
            <mat-icon>pause_circle</mat-icon> Suspend Work
          </button>

          <button 
            *ngIf="permit.status === 'Active' || permit.status === 'Suspended'" 
            mat-flat-button color="primary" 
            class="btn-primary-action" 
            (click)="changeStatus('Closed')">
            <mat-icon>task_alt</mat-icon> Work Complete & Close Permit
          </button>
        </div>
      </app-page-header>

      <!-- Visual Authorization Flow Chart (As specifically required by the client document) -->
      <div class="hseq-card flowchart-card mb-4">
        <div class="flowchart-header">
          <span class="flow-title">Permit Authorization & Lifecycle Flow Chart</span>
          <span class="current-state-tag">Current State: <app-status-badge [status]="permit.status"></app-status-badge></span>
        </div>
        <div class="flow-chart-diagram">
          <div class="flow-node" [class.node-done]="isPastState('Draft')" [class.node-current]="permit.status === 'Draft'">
            <span class="node-title">1. Draft</span>
            <span class="node-sub">Performing Auth</span>
          </div>
          <mat-icon class="flow-arrow">arrow_forward</mat-icon>

          <div class="flow-node" [class.node-done]="isPastState('Requested')" [class.node-current]="permit.status === 'Requested'">
            <span class="node-title">2. Requested</span>
            <span class="node-sub">Link RA & TBT</span>
          </div>
          <mat-icon class="flow-arrow">arrow_forward</mat-icon>

          <div class="flow-node" [class.node-done]="isPastState('Approved')" [class.node-current]="permit.status === 'Approved'">
            <span class="node-title">3. Approved</span>
            <span class="node-sub">Approver Sign</span>
          </div>
          <mat-icon class="flow-arrow">arrow_forward</mat-icon>

          <div class="flow-node" [class.node-done]="permit.status === 'Active'" [class.node-current]="permit.status === 'Active'">
            <span class="node-title">4. Active (Work In Progress)</span>
            <span class="node-sub">Continuous Gas/Watch</span>
          </div>
          <mat-icon class="flow-arrow">arrow_forward</mat-icon>

          <div class="flow-node" [class.node-done]="permit.status === 'Closed'" [class.node-current]="permit.status === 'Closed'">
            <span class="node-title">5. Closed & Restored</span>
            <span class="node-sub">Site Restored</span>
          </div>
        </div>
      </div>

      <!-- Key Details Summary Grid -->
      <div class="summary-grid mb-4">
        <div class="hseq-card p-3">
          <div class="lbl">Permit Validity Period</div>
          <div class="val">{{ permit.startDateTime }}</div>
          <div class="sub">Expiry: {{ permit.expiryDateTime }} ({{ permit.validityHours }}h)</div>
        </div>
        <div class="hseq-card p-3">
          <div class="lbl">Associated Risk Assessment</div>
          <div class="val text-blue font-mono">{{ permit.linkedRaNumber }}</div>
          <div class="sub">Verified ALARP Compliance</div>
        </div>
        <div class="hseq-card p-3">
          <div class="lbl">Assigned Authorities</div>
          <div class="val">{{ permit.performingAuthority }}</div>
          <div class="sub">Approving Master: {{ permit.approvingAuthority }}</div>
        </div>
        <div class="hseq-card p-3">
          <div class="lbl">SIMOPS Coordination</div>
          <div class="val text-green">Clear (No Conflict)</div>
          <div class="sub">Hot work & bunkering restricted</div>
        </div>
      </div>

      <!-- Tabbed Verification Views -->
      <div class="hseq-card">
        <mat-tab-group>
          <!-- Tab 1: Atmospheric Gas Testing Readings -->
          <mat-tab label="Gas Testing Atmosphere Log ({{ permit.gasTestReadings.length }})">
            <div class="tab-body">
              <div class="gas-summary-alert mb-3">
                <mat-icon class="gas-icon">cloud</mat-icon>
                <div>
                  <strong>Mandatory Enclosed Space Gas Test Log</strong>
                  <p class="text-xs text-muted mb-0">Atmosphere verified prior to tank entry. Multi-gas detector calibrated and bump-tested.</p>
                </div>
              </div>

              <table class="hseq-table mb-4">
                <thead>
                  <tr>
                    <th>Gas Monitored</th>
                    <th>Measured Reading</th>
                    <th>Safe Working Limit</th>
                    <th>Qualified Tester</th>
                    <th>Recorded Timestamp</th>
                    <th>Safety Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let g of permit.gasTestReadings">
                    <td class="font-bold">{{ g.gasType }}</td>
                    <td class="gas-val font-mono">{{ g.reading }}</td>
                    <td>{{ g.safePermissibleRange }}</td>
                    <td>{{ g.testerName }}</td>
                    <td>{{ g.timestamp }}</td>
                    <td>
                      <span class="status-badge badge-success">
                        <mat-icon class="inline-icon">done</mat-icon> SAFE FOR ENTRY
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </mat-tab>

          <!-- Tab 2: LOTO Isolation & Precautions Checklist -->
          <mat-tab label="Isolation (LOTO) & Safety Precautions">
            <div class="tab-body">
              <div class="isolation-banner mb-4" *ngIf="permit.isolationLotoRequired">
                <div class="d-flex align-items-center gap-2">
                  <mat-icon class="lock-icon">lock</mat-icon>
                  <div>
                    <strong class="text-red">Energy Isolation / Lock-Out Tag-Out Required</strong>
                    <p class="mb-0 text-xs">{{ permit.isolationDetails }}</p>
                  </div>
                </div>
              </div>

              <h4 class="checklist-title">Pre-work Verification Precautions</h4>
              <div class="precautions-list">
                <div *ngFor="let item of permit.precautionsChecklist" class="precaution-item">
                  <mat-checkbox [(ngModel)]="item.checked" color="primary">
                    <span class="chk-label">{{ item.item }}</span>
                  </mat-checkbox>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Tab 3: Audit Trail -->
          <mat-tab label="Authorization Audit Log">
            <div class="tab-body">
              <div class="audit-stream">
                <div *ngFor="let entry of permit.auditTrail" class="audit-row">
                  <span class="audit-time font-mono">{{ entry.timestamp }}</span>
                  <span class="audit-action">{{ entry.action }}</span>
                  <span class="audit-actor">{{ entry.user }} ({{ entry.role }})</span>
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
    .flowchart-card { padding: 18px 24px; }
    .flowchart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .flow-title { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .current-state-tag { font-size: 13px; color: #475569; }
    .flow-chart-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow-x: auto;
      padding: 10px 0;
      gap: 10px;
    }
    .flow-node {
      flex: 1;
      min-width: 140px;
      padding: 12px 14px;
      border-radius: 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .flow-node.node-done { background: var(--accent); border-color: var(--primary); color: var(--primary); }
    .flow-node.node-current { background: var(--accent); border: 2px solid var(--primary); color: var(--primary); }
    .node-title { font-size: 13px; font-weight: 700; }
    .node-sub { font-size: 11px; color: var(--muted-foreground); }
    .flow-arrow { color: var(--muted-foreground); font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .p-3 { padding: 16px; }
    .lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .val { font-size: 16px; font-weight: 800; color: var(--foreground); margin: 4px 0; }
    .sub { font-size: 11.5px; color: var(--muted-foreground); }
    .tab-body { padding: 20px; }
    .gas-summary-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
    }
    .gas-icon { font-size: 26px; width: 26px; height: 26px; color: var(--primary); }
    .gas-val { font-size: 15px; font-weight: 800; color: var(--primary); }
    .inline-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-right: 2px; }
    .isolation-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .lock-icon { font-size: 28px; width: 28px; height: 28px; color: #dc2626; }
    .checklist-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .precautions-list { display: flex; flex-direction: column; gap: 8px; }
    .precaution-item {
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .chk-label { font-size: 13.5px; color: #1e293b; }
    .audit-stream { display: flex; flex-direction: column; gap: 8px; }
    .audit-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 14px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 12.5px;
    }
    .audit-time { color: #64748b; font-size: 11.5px; }
    .audit-action { font-weight: 700; color: #0f172a; flex: 1; }
    .audit-actor { color: #475569; }
    .mb-4 { margin-bottom: 16px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-0 { margin-bottom: 0; }
  `]
})
export class PermitDetailComponent implements OnInit {
  permit?: PermitToWorkRecord;

  constructor(
    private route: ActivatedRoute,
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.permit = this.state.permits().find(p => p.id === id) || this.state.permits()[0];
  }

  isPastState(st: string): boolean {
    const states = ['Draft', 'Requested', 'Approved', 'Active', 'Closed'];
    const currIdx = states.indexOf(this.permit?.status || 'Draft');
    const targetIdx = states.indexOf(st);
    return targetIdx < currIdx;
  }

  changeStatus(newStatus: PermitToWorkRecord['status']) {
    if (!this.permit) return;
    this.state.updatePermitStatus(this.permit.id, newStatus);
    this.permit = this.state.permits().find(p => p.id === this.permit!.id);
    this.notify.showSuccess('Permit Status Updated', `Permit ${this.permit?.referenceNo} moved to "${newStatus}". Electronic seal logged.`);
  }
}
