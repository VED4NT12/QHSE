import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RiskAssessmentRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-risk-assessment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Risk Assessment & JSA (HIRA) Register"
        subtitle="Manage marine operational hazard identifications, Hierarchy of Controls, ALARP compliance, and PTW linkages"
        icon="rule"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Risk Assessments'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="exportRegister()" class="btn-export">
            <mat-icon>file_download</mat-icon> Export Register
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="openCreateModal()">
            <mat-icon>add</mat-icon> Create Risk Assessment
          </button>
        </div>
      </app-page-header>

      <!-- KPI Overview Cards -->
      <div class="stats-grid mb-4">
        <div class="stat-card">
          <span class="stat-lbl">Active Risk Assessments</span>
          <span class="stat-val text-blue">{{ getActiveCount() }}</span>
          <span class="stat-sub">ALARP Verified</span>
        </div>
        <div class="stat-card">
          <span class="stat-lbl">Under Formal Review</span>
          <span class="stat-val text-amber">{{ getReviewCount() }}</span>
          <span class="stat-sub">Sign-off pending</span>
        </div>
        <div class="stat-card">
          <span class="stat-lbl">High/Critical Mitigated</span>
          <span class="stat-val text-green">100%</span>
          <span class="stat-sub">Zero unmitigated hazards</span>
        </div>
        <div class="stat-card">
          <span class="stat-lbl">Linked to Active PTW</span>
          <span class="stat-val text-indigo">{{ state.permits().length }}</span>
          <span class="stat-sub">Mandatory permit interlock</span>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="hseq-card filter-card mb-4">
        <div class="filter-row">
          <div class="search-input-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search by RA reference, activity title, lead assessor..." 
              class="custom-input" />
          </div>

          <div class="filter-controls">
            <select [(ngModel)]="typeFilter" class="custom-select">
              <option value="ALL">All Assessment Types</option>
              <option value="Operational">Operational</option>
              <option value="Task-Based">Task-Based</option>
              <option value="Dynamic">Dynamic</option>
              <option value="Emergency Response">Emergency Response</option>
            </select>

            <select [(ngModel)]="statusFilter" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>

            <button *ngIf="searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'" 
                    mat-stroked-button (click)="resetFilters()" class="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Main Register Table -->
      <div class="hseq-card">
        <div class="table-responsive" *ngIf="paginatedAssessments().length > 0">
          <table class="hseq-table">
            <thead>
              <tr>
                <th (click)="toggleSort('referenceNo')" class="sortable-th">
                  RA Reference
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th (click)="toggleSort('activityTitle')" class="sortable-th">
                  Activity / Operation Title
                  <mat-icon class="sort-icon">{{ getSortIcon('activityTitle') }}</mat-icon>
                </th>
                <th>Vessel / Dept</th>
                <th>Assessment Type</th>
                <th>Work Steps</th>
                <th>Initial &rarr; Residual Risk</th>
                <th>Approver</th>
                <th (click)="toggleSort('status')" class="sortable-th">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                </th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ra of paginatedAssessments()" class="clickable-row" [routerLink]="['/risk-assessment', ra.id]">
                <td class="mono-ref"><strong>{{ ra.referenceNo }}</strong></td>
                <td>
                  <span class="font-bold text-sm block">{{ ra.activityTitle }}</span>
                  <span class="text-xs text-muted">Valid: {{ ra.assessmentDate }} to {{ ra.validityExpiryDate }}</span>
                </td>
                <td>
                  <span class="vessel-title">{{ ra.vesselName }}</span>
                  <span class="text-xs text-muted block">{{ ra.department }}</span>
                </td>
                <td><span class="type-pill">{{ ra.assessmentType }}</span></td>
                <td>
                  <span class="step-count-badge">{{ ra.steps.length }} Hazard Steps</span>
                </td>
                <td>
                  <div class="risk-reduction-flow">
                    <span class="risk-badge badge-crit">{{ ra.maxInitialRisk }}</span>
                    <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                    <span class="risk-badge badge-low">{{ ra.maxResidualRisk }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-semibold text-xs">{{ ra.approver }}</span>
                  <span class="text-xs text-muted block">Lead: {{ ra.leadAssessor }}</span>
                </td>
                <td><app-status-badge [status]="ra.status"></app-status-badge></td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button mat-stroked-button color="primary" class="btn-sm" [routerLink]="['/risk-assessment', ra.id]">
                    View JSA Matrix
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ getEndIndex() }} of {{ filteredAssessments().length }} risk assessments</span>
            <div class="pagination-controls">
              <button class="page-btn" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
                Previous
              </button>
              <button *ngFor="let page of getPages()" 
                      class="page-btn" 
                      [class.active]="currentPage === page" 
                      (click)="currentPage = page">
                {{ page }}
              </button>
              <button class="page-btn" [disabled]="currentPage === totalPages()" (click)="currentPage = currentPage + 1">
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <app-empty-state 
          *ngIf="paginatedAssessments().length === 0"
          icon="rule"
          title="No Risk Assessments Found"
          message="No risk assessments match the selected search criteria or vessel filter. Try adjusting your query or log a new HIRA/JSA."
          actionText="Create Risk Assessment"
          (action)="openCreateModal()">
        </app-empty-state>
      </div>
    </div>

    <!-- Create Risk Assessment Modal -->
    <app-modal 
      [isOpen]="isCreateModalOpen"
      title="Create Marine Risk Assessment (HIRA / JSA)"
      subtitle="Define activity hazard identification, initial consequence level, and Hierarchy of Controls"
      icon="rule"
      maxWidth="720px"
      (close)="isCreateModalOpen = false">
      <div class="modal-form">
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Activity / Operation Title *</label>
            <input type="text" [(ngModel)]="newRa.activityTitle" placeholder="e.g. Enclosed Space Tank Cleaning, Bunkering Operation" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Assessment Type *</label>
            <select [(ngModel)]="newRa.assessmentType" class="custom-select">
              <option value="Task-Based">Task-Based JSA</option>
              <option value="Operational">Operational Procedure</option>
              <option value="Dynamic">Dynamic Field Assessment</option>
              <option value="Emergency Response">Emergency Response</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Vessel Asset *</label>
            <select [(ngModel)]="newRa.vesselId" class="custom-select">
              <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }}</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Responsible Department *</label>
            <select [(ngModel)]="newRa.department" class="custom-select">
              <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Lead Assessor *</label>
            <input type="text" [(ngModel)]="newRa.leadAssessor" placeholder="Name & Rank" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Designated Approver (Master / C/E) *</label>
            <input type="text" [(ngModel)]="newRa.approver" placeholder="e.g. Master Capt. A. Kumar" class="custom-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Initial Unmitigated Risk Severity</label>
            <select [(ngModel)]="newRa.maxInitialRisk" class="custom-select">
              <option value="Critical">Critical (Stop Work if unmitigated)</option>
              <option value="High">High (Requires Executive Approval)</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Target Residual Risk (ALARP)</label>
            <select [(ngModel)]="newRa.maxResidualRisk" class="custom-select">
              <option value="Low">Low (Acceptable with standard PPE & Toolbox talk)</option>
              <option value="Medium">Medium (Supervised operation)</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Mandatory Hierarchy of Controls Applied</label>
            <select [(ngModel)]="newRa.hierarchy" class="custom-select">
              <option value="Engineering Controls">Engineering Controls (Ventilation, Isolation)</option>
              <option value="Administrative Controls">Administrative Controls (Checklists, Permits)</option>
              <option value="Substitution">Substitution (Safer Solvent / Lower Voltage)</option>
              <option value="PPE">PPE (Specialized SCBA / Chemical Suits)</option>
              <option value="Elimination">Elimination</option>
            </select>
          </div>
        </div>
      </div>

      <div modal-actions>
        <button mat-stroked-button (click)="isCreateModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveRiskAssessment()">
          <mat-icon>check</mat-icon> Save & Activate JSA
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow-sm); }
    .stat-lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .stat-val { font-size: 24px; font-weight: 800; color: var(--foreground); }
    .stat-sub { font-size: 11.5px; color: var(--muted-foreground); }
    .text-blue { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .text-green { color: var(--primary); }
    .text-indigo { color: var(--primary); }
    .filter-card { padding: 14px 20px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
    .search-input-wrap { position: relative; flex: 1; min-width: 280px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--muted-foreground); }
    .search-input-wrap .custom-input { padding-left: 38px; }
    .filter-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .btn-reset { height: 38px !important; color: var(--muted-foreground) !important; }
    .vessel-title { font-weight: 700; color: var(--foreground); }
    .type-pill { font-size: 11.5px; font-weight: 600; background: var(--accent); color: var(--primary); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border); }
    .step-count-badge { font-size: 11.5px; font-weight: 700; background: var(--muted); padding: 3px 8px; border-radius: 4px; color: var(--foreground); }
    .risk-reduction-flow { display: flex; align-items: center; gap: 6px; }
    .risk-badge { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; }
    .badge-crit { background: oklch(0.95 0.04 25); color: var(--destructive); border: 1px solid oklch(0.88 0.08 25); }
    .badge-low { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .arrow-icon { font-size: 14px; width: 14px; height: 14px; color: var(--muted-foreground); }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: var(--accent); }
    .text-right { text-align: right; }
    .btn-sm { height: 32px !important; font-size: 12px !important; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sort-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-left: 4px; color: #94a3b8; }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .form-col { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 700; color: #475569; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class RiskAssessmentListComponent {
  searchQuery: string = '';
  typeFilter: string = 'ALL';
  statusFilter: string = 'ALL';
  sortColumn: keyof RiskAssessmentRecord = 'referenceNo';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage: number = 1;
  pageSize: number = 5;

  isCreateModalOpen: boolean = false;

  newRa = {
    activityTitle: '',
    assessmentType: 'Task-Based',
    vesselId: 'VES-01',
    department: 'Deck Department',
    leadAssessor: 'Chief Officer M. Lindqvist',
    approver: 'Master Capt. A. Kumar',
    maxInitialRisk: 'High',
    maxResidualRisk: 'Low',
    hierarchy: 'Administrative Controls'
  };

  constructor(
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  filteredAssessments = computed(() => {
    let list = this.state.riskAssessments();
    const vFilter = this.state.selectedVesselFilter();

    list = list.filter(ra => {
      const matchVessel = vFilter === 'ALL' || ra.vesselId === vFilter;
      const matchType = this.typeFilter === 'ALL' || ra.assessmentType === this.typeFilter;
      const matchStatus = this.statusFilter === 'ALL' || ra.status === this.statusFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        ra.referenceNo.toLowerCase().includes(q) ||
        ra.activityTitle.toLowerCase().includes(q) ||
        ra.leadAssessor.toLowerCase().includes(q) ||
        ra.vesselName.toLowerCase().includes(q);

      return matchVessel && matchType && matchStatus && matchSearch;
    });

    return list.sort((a, b) => {
      const valA = (a[this.sortColumn] || '').toString();
      const valB = (b[this.sortColumn] || '').toString();
      return this.sortDirection === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  });

  paginatedAssessments = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAssessments().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredAssessments().length / this.pageSize) || 1);

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredAssessments().length);
  }

  getActiveCount(): number {
    return this.state.riskAssessments().filter(r => r.status === 'Active').length;
  }

  getReviewCount(): number {
    return this.state.riskAssessments().filter(r => r.status === 'Under Review').length;
  }

  toggleSort(col: keyof RiskAssessmentRecord) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof RiskAssessmentRecord): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery = '';
    this.typeFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
  }

  openCreateModal() {
    this.isCreateModalOpen = true;
  }

  saveRiskAssessment() {
    if (!this.newRa.activityTitle) {
      this.notify.showError('Required Field', 'Please provide an activity or operation title.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newRa.vesselId);
    const today = new Date().toISOString().substring(0, 10);
    const expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    this.state.addRiskAssessment({
      referenceNo: `RA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      vesselId: this.newRa.vesselId,
      vesselName: vessel ? vessel.name : 'MV Pacific Voyager',
      department: this.newRa.department,
      activityTitle: this.newRa.activityTitle,
      assessmentType: this.newRa.assessmentType as any,
      assessmentDate: today,
      validityExpiryDate: expiry,
      leadAssessor: this.newRa.leadAssessor,
      approver: this.newRa.approver,
      maxInitialRisk: this.newRa.maxInitialRisk as any,
      maxResidualRisk: this.newRa.maxResidualRisk as any,
      status: 'Active',
      linkedPermits: ['PTW-2026-0012'],
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Toolbox talk, gas testing and isolation verification',
          hazards: 'Toxic gas atmosphere, mechanical pinch point',
          affectedEntities: 'Entry team, standby watchman',
          initialLikelihood: 4,
          initialConsequence: 4,
          initialRating: 16,
          existingControls: 'Multi-gas detector sampling, Lockout/Tagout applied',
          additionalControls: 'Continuous forced air ventilation, safety harness',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          hierarchy: 'Engineering',
          alarpAchieved: true
        }
      ]
    });

    this.isCreateModalOpen = false;
    this.notify.showSuccess('Risk Assessment Created', `JSA for "${this.newRa.activityTitle}" is now active.`);
    this.newRa.activityTitle = '';
  }

  exportRegister() {
    this.notify.showInfo('Export Complete', 'Risk Assessment & JSA Register exported to Excel (simulated).');
  }
}
