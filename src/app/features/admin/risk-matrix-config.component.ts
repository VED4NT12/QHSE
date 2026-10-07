import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-risk-matrix-config',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Risk Matrix & Workflow Rule Configuration"
        subtitle="Configure company-approved 5x5 risk rating methodologies, stage sequences, and automated escalation timers"
        icon="tune"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Configuration'}]">
        <div actions class="d-flex gap-2">
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveConfig()">
            <mat-icon>save</mat-icon> Save Configuration
          </button>
        </div>
      </app-page-header>

      <!-- Risk Matrix 5x5 Visualizer -->
      <div class="hseq-card mb-4">
        <div class="hseq-card-header">
          <div class="card-title-group">
            <mat-icon class="card-icon text-blue">grid_on</mat-icon>
            <div>
              <h3 class="card-heading">Standard Company 5x5 Risk Matrix Setup</h3>
              <span class="card-subheading">Single source of truth driving Risk Assessment, Near Miss, Incident, and Injury calculations</span>
            </div>
          </div>
          <span class="status-badge badge-success">Company Approved Standard</span>
        </div>

        <div class="hseq-card-body">
          <div class="matrix-preview-grid">
            <div class="axis-y-title">PROBABILITY / LIKELIHOOD</div>
            <div class="matrix-table-wrap">
              <div class="matrix-row" *ngFor="let l of [5, 4, 3, 2, 1]">
                <div class="y-label">{{ getLikelihoodName(l) }} ({{ l }})</div>
                <div 
                  *ngFor="let c of [1, 2, 3, 4, 5]" 
                  class="m-cell" 
                  [ngClass]="getCellClass(l * c)"
                  [class.selected-cell]="selectedCell && selectedCell.l === l && selectedCell.c === c"
                  (click)="inspectCell(l, c)">
                  <span class="m-score">{{ l * c }}</span>
                  <span class="m-text">{{ getLevelName(l * c) }}</span>
                </div>
              </div>
              <div class="matrix-row header-row">
                <div class="y-label"></div>
                <div *ngFor="let c of [1, 2, 3, 4, 5]" class="x-label">{{ getConsequenceName(c) }} ({{ c }})</div>
              </div>
              <div class="axis-x-title">SEVERITY / CONSEQUENCE</div>
            </div>
          </div>

          <!-- Interactive Cell Inspector -->
          <div class="cell-inspector mt-4" *ngIf="selectedCell">
            <div class="inspector-badge" [ngClass]="'badge-' + selectedCell.level.toLowerCase()">
              {{ selectedCell.level }} Risk (Score: {{ selectedCell.score }})
            </div>
            <div class="inspector-details">
              <strong>Likelihood:</strong> {{ getLikelihoodName(selectedCell.l) }} ({{ selectedCell.l }}) &bull;
              <strong>Consequence:</strong> {{ getConsequenceName(selectedCell.c) }} ({{ selectedCell.c }})
              <div class="inspector-rule mt-1">
                <strong>Mandatory Control Mandate:</strong> {{ getMandate(selectedCell.score) }}
              </div>
            </div>
          </div>

          <!-- Color Threshold Legend -->
          <div class="threshold-legend mt-4">
            <div class="legend-chip chip-low">Low (Score 1 - 4): Routine Controls & PPE</div>
            <div class="legend-chip chip-med">Medium (Score 5 - 9): Department Review Required</div>
            <div class="legend-chip chip-high">High (Score 10 - 16): Superintendent Sign-off</div>
            <div class="legend-chip chip-crit">Critical (Score 17 - 25): Stop Work & Director Notification</div>
          </div>
        </div>
      </div>

      <!-- Workflow Stage & Escalation Rules Engine -->
      <div class="hseq-card">
        <div class="hseq-card-header">
          <div class="card-title-group">
            <mat-icon class="card-icon text-amber">alt_route</mat-icon>
            <div>
              <h3 class="card-heading">Standard 6-Stage HSEQ Workflow Engine</h3>
              <span class="card-subheading">Shared state machine enforced across all 8 reporting modules</span>
            </div>
          </div>
        </div>
        <div class="hseq-card-body">
          <div class="workflow-sequence-flow">
            <div class="flow-stage-card" *ngFor="let st of stages; let i = index">
              <div class="stage-num">{{ i + 1 }}</div>
              <div class="stage-body">
                <span class="stage-title">{{ st.name }}</span>
                <span class="stage-actor">{{ st.actor }}</span>
                <span class="stage-sla">SLA: {{ st.sla }}</span>
              </div>
              <mat-icon *ngIf="i < stages.length - 1" class="stage-arrow">arrow_forward</mat-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .card-title-group { display: flex; align-items: center; gap: 12px; }
    .card-icon { font-size: 28px; width: 28px; height: 28px; }
    .text-blue { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .card-heading { font-size: 16px; font-weight: 700; color: var(--foreground); margin: 0; }
    .card-subheading { font-size: 11.5px; color: var(--muted-foreground); }
    .matrix-preview-grid { display: flex; gap: 12px; margin-top: 10px; }
    .axis-y-title {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 1px;
      padding-left: 6px;
    }
    .axis-x-title {
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 1px;
      margin-top: 8px;
      padding-left: 150px;
    }
    .matrix-table-wrap { flex: 1; }
    .matrix-row { display: grid; grid-template-columns: 150px repeat(5, 1fr); gap: 6px; margin-bottom: 6px; align-items: center; }
    .y-label { font-size: 11.5px; font-weight: 600; text-align: right; padding-right: 10px; color: #475569; }
    .x-label { font-size: 11px; font-weight: 600; text-align: center; color: #475569; }
    .m-cell {
      height: 48px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    .m-cell:hover { transform: scale(1.04); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .m-cell.selected-cell { outline: 3px solid var(--primary); }
    .m-score { font-size: 14px; font-weight: 800; }
    .m-text { font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .cell-low { background-color: #a7f3d0; color: #065f46; }
    .cell-med { background-color: #fde68a; color: #92400e; }
    .cell-high { background-color: #fdba74; color: #9a3412; }
    .cell-critical { background-color: #fca5a5; color: #991b1b; }
    .threshold-legend { display: flex; flex-wrap: wrap; gap: 10px; }
    .legend-chip { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
    .chip-low { background: #d1fae5; color: #065f46; }
    .chip-med { background: #fef3c7; color: #92400e; }
    .chip-high { background: #ffedd5; color: #9a3412; }
    .chip-crit { background: #fee2e2; color: #991b1b; }
    .cell-inspector {
      display: flex;
      align-items: center;
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 18px;
    }
    .inspector-badge { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
    .badge-low { background: #d1fae5; color: #065f46; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .inspector-details { font-size: 13px; color: #1e293b; }
    .inspector-rule { font-size: 12px; color: #475569; }
    .workflow-sequence-flow { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 10px 0; }
    .flow-stage-card {
      min-width: 140px;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    }
    .stage-num { font-size: 10px; font-weight: 800; background: var(--primary); color: var(--primary-foreground); width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stage-title { font-size: 12.5px; font-weight: 700; color: var(--foreground); }
    .stage-actor { font-size: 11px; color: var(--primary); }
    .stage-sla { font-size: 10.5px; color: var(--muted-foreground); font-weight: 600; }
    .stage-arrow { color: var(--muted-foreground); font-size: 18px; width: 18px; height: 18px; }
    .mb-4 { margin-bottom: 16px; }
    .mt-4 { margin-top: 16px; }
    .mt-1 { margin-top: 4px; }
  `]
})
export class RiskMatrixConfigComponent {
  stages = [
    { name: '1. Report', actor: 'Vessel Crew / Finder', sla: 'Immediate' },
    { name: '2. Review', actor: 'HSEQ Officer / Dept Head', sla: '24 Hours' },
    { name: '3. Investigation', actor: 'Safety Investigation Team', sla: '72 Hours' },
    { name: '4. Action Log', actor: 'Assigned Actionee', sla: 'Within 7 Days' },
    { name: '5. Verification', actor: 'Independent Superintendent', sla: 'Prior to Closure' },
    { name: '6. Formal Closure', actor: 'Approver / Master', sla: 'Final Sign-off' }
  ];

  selectedCell: { l: number; c: number; score: number; level: string } | null = {
    l: 4,
    c: 4,
    score: 16,
    level: 'High'
  };

  constructor(private notify: NotificationService) {}

  getLikelihoodName(l: number): string {
    return ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'][l - 1];
  }

  getConsequenceName(c: number): string {
    return ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'][c - 1];
  }

  getCellClass(score: number): string {
    if (score <= 4) return 'cell-low';
    if (score <= 9) return 'cell-med';
    if (score <= 16) return 'cell-high';
    return 'cell-critical';
  }

  getLevelName(score: number): string {
    if (score <= 4) return 'Low';
    if (score <= 9) return 'Medium';
    if (score <= 16) return 'High';
    return 'Critical';
  }

  inspectCell(l: number, c: number) {
    const score = l * c;
    this.selectedCell = {
      l,
      c,
      score,
      level: this.getLevelName(score)
    };
  }

  getMandate(score: number): string {
    if (score <= 4) return 'Standard company operating procedures and standard PPE apply. Proceed under routine watchkeeping.';
    if (score <= 9) return 'Toolbox talk mandatory before task execution. Designated supervisor review required.';
    if (score <= 16) return 'Formal Permit to Work (PTW) required with written Superintendent sign-off prior to task authorization.';
    return 'IMMEDIATE STOP WORK. Master and Shore DPA notification mandatory before any work can proceed.';
  }

  saveConfig() {
    this.notify.showSuccess('Configuration Saved', '5x5 Risk Matrix thresholds, SLAs, and escalation timers successfully saved to master config.');
  }
}
