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
import { ManagementVisitRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-visits-list',
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
        title="Management Vessel Visit Scheduler"
        subtitle="Schedule and track shore management safety visits by Port Captains, Port Engineers, and HSEQ Superintendents (90-day cycle requirement)"
        icon="calendar_month"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Management Visits'}]">
        <div actions class="d-flex gap-2">
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="openScheduleModal()">
            <mat-icon>add</mat-icon> Schedule Management Visit
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards -->
      <div class="visit-stats-grid mb-4">
        <div class="vstat-card">
          <span class="vstat-lbl">90-Day Cycle Compliance</span>
          <span class="vstat-val text-green">91.6%</span>
          <span class="vstat-sub">Fleet-wide shore visits</span>
        </div>
        <div class="vstat-card">
          <span class="vstat-lbl">Visits Completed YTD</span>
          <span class="vstat-val text-blue">{{ state.managementVisits().length }}</span>
          <span class="vstat-sub">Supt. / Port Captain / Port Eng.</span>
        </div>
        <div class="vstat-card">
          <span class="vstat-lbl">Open Visit CAPAs</span>
          <span class="vstat-val text-amber">3 Actions</span>
          <span class="vstat-sub">Under technical closure</span>
        </div>
        <div class="vstat-card">
          <span class="vstat-lbl">Upcoming Next 30 Days</span>
          <span class="vstat-val text-indigo">2 Visits</span>
          <span class="vstat-sub">Scheduled boarding ports</span>
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
              placeholder="Search by visit ref, visitor name, vessel, location..." 
              class="custom-input" />
          </div>

          <div class="filter-controls">
            <select [(ngModel)]="roleFilter" class="custom-select">
              <option value="ALL">All Executive Roles</option>
              <option value="HSEQ Superintendent">HSEQ Superintendent</option>
              <option value="Port Captain">Port Captain</option>
              <option value="Port Engineer">Port Engineer</option>
            </select>

            <select [(ngModel)]="statusFilter" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Under Review">Under Review</option>
            </select>

            <button *ngIf="searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'" 
                    mat-stroked-button (click)="resetFilters()" class="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Visits Table -->
      <div class="hseq-card">
        <div class="table-responsive" *ngIf="paginatedVisits().length > 0">
          <table class="hseq-table">
            <thead>
              <tr>
                <th (click)="toggleSort('referenceNo')" class="sortable-th">
                  Visit Ref
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th>Role / Superintendent</th>
                <th>Vessel & Location</th>
                <th (click)="toggleSort('plannedDate')" class="sortable-th">
                  Planned Date
                  <mat-icon class="sort-icon">{{ getSortIcon('plannedDate') }}</mat-icon>
                </th>
                <th>Due Date (90-d Cycle)</th>
                <th>Scope & Checklist</th>
                <th>Findings / CAPA</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of paginatedVisits()">
                <td class="mono-ref font-bold">{{ v.referenceNo }}</td>
                <td>
                  <span class="role-badge" [ngClass]="getRoleClass(v.categoryRole)">
                    {{ v.categoryRole }}
                  </span>
                  <span class="font-bold text-xs block mt-1">{{ v.visitorName }}</span>
                </td>
                <td>
                  <span class="vessel-title">{{ v.vesselName }}</span>
                  <span class="text-xs text-muted block">{{ v.portLocation }}</span>
                </td>
                <td>{{ v.plannedDate }}</td>
                <td class="font-semibold">{{ v.dueDate }}</td>
                <td class="scope-cell">
                  <div class="scope-text">{{ v.purposeScope }}</div>
                  <span class="template-tag">{{ v.checklistTemplate }}</span>
                </td>
                <td>
                  <div class="findings-pill">
                    <span>{{ v.findingsCount }} Deficiencies</span>
                    <strong class="text-red">{{ v.openCapaCount }} CAPA Open</strong>
                  </div>
                </td>
                <td><app-status-badge [status]="v.status"></app-status-badge></td>
                <td class="text-right">
                  <button mat-stroked-button color="primary" class="btn-sm" (click)="viewReport(v)">
                    Visit Report
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ getEndIndex() }} of {{ filteredVisits().length }} visits</span>
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
          *ngIf="paginatedVisits().length === 0"
          icon="calendar_month"
          title="No Management Visits Found"
          message="No management visit records match the selected filters. Schedule a visit to maintain the mandatory 90-day governance cycle."
          actionText="Schedule Visit"
          (action)="openScheduleModal()">
        </app-empty-state>
      </div>
    </div>

    <!-- Schedule Visit Modal -->
    <app-modal
      [isOpen]="isScheduleModalOpen"
      title="Schedule Management Vessel Safety Visit"
      subtitle="Ensure mandatory 90-day shore management attendance under ISM Code §4"
      icon="calendar_month"
      maxWidth="680px"
      (close)="isScheduleModalOpen = false">
      <div class="modal-form">
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Superintendent / Visitor Role *</label>
            <select [(ngModel)]="newVisit.categoryRole" class="custom-select">
              <option value="HSEQ Superintendent">HSEQ Superintendent</option>
              <option value="Port Captain">Port Captain (Marine Operations)</option>
              <option value="Port Engineer">Port Engineer (Technical & Class)</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Visitor Full Name *</label>
            <input type="text" [(ngModel)]="newVisit.visitorName" placeholder="e.g. Capt. Marcus Sterling" class="custom-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Target Vessel *</label>
            <select [(ngModel)]="newVisit.vesselId" class="custom-select">
              <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }}</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Port / Boarding Location *</label>
            <input type="text" [(ngModel)]="newVisit.portLocation" placeholder="e.g. Port of Singapore, Anchor Berth 3" class="custom-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Planned Boarding Date *</label>
            <input type="date" [(ngModel)]="newVisit.plannedDate" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Checklist Template *</label>
            <select [(ngModel)]="newVisit.checklistTemplate" class="custom-select">
              <option value="Comprehensive Safety & Nav Audit">Comprehensive Safety & Nav Audit</option>
              <option value="Technical & Engine Room Machinery">Technical & Engine Room Machinery</option>
              <option value="Crew Welfare & Living Conditions">Crew Welfare & Living Conditions</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Purpose & Scope Summary *</label>
            <input type="text" [(ngModel)]="newVisit.purposeScope" placeholder="e.g. Semi-annual executive navigation assurance & safety walk" class="custom-input" />
          </div>
        </div>
      </div>

      <div modal-actions>
        <button mat-stroked-button (click)="isScheduleModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveVisit()">
          <mat-icon>check</mat-icon> Schedule Visit
        </button>
      </div>
    </app-modal>

    <!-- View Report Dialog Modal -->
    <app-modal
      [isOpen]="isReportModalOpen"
      [title]="'Management Visit Report - ' + (selectedVisit?.referenceNo || '')"
      [subtitle]="(selectedVisit?.visitorName || '') + ' • ' + (selectedVisit?.vesselName || '')"
      icon="description"
      maxWidth="720px"
      (close)="isReportModalOpen = false">
      <div class="report-content" *ngIf="selectedVisit">
        <div class="report-summary-box mb-3">
          <div class="rbox-item">
            <span class="rbox-label">Visitor Role</span>
            <strong>{{ selectedVisit.categoryRole }}</strong>
          </div>
          <div class="rbox-item">
            <span class="rbox-label">Boarding Port</span>
            <strong>{{ selectedVisit.portLocation }}</strong>
          </div>
          <div class="rbox-item">
            <span class="rbox-label">Visit Date</span>
            <strong>{{ selectedVisit.plannedDate }}</strong>
          </div>
          <div class="rbox-item">
            <span class="rbox-label">Status</span>
            <app-status-badge [status]="selectedVisit.status"></app-status-badge>
          </div>
        </div>

        <div class="report-section mb-3">
          <h4>Executive Scope & Agenda</h4>
          <p class="text-sm text-slate-700">{{ selectedVisit.purposeScope }}</p>
          <span class="template-tag">Audited with: {{ selectedVisit.checklistTemplate }}</span>
        </div>

        <div class="report-section mb-3">
          <h4>Findings & Deficiency Breakdown</h4>
          <div class="findings-stat-banner">
            <div class="f-box">
              <span class="f-num">{{ selectedVisit.findingsCount }}</span>
              <span class="f-lbl">Total Observations</span>
            </div>
            <div class="f-box">
              <span class="f-num text-red">{{ selectedVisit.openCapaCount }}</span>
              <span class="f-lbl">Corrective Actions Raised</span>
            </div>
            <div class="f-box">
              <span class="f-num text-green">100%</span>
              <span class="f-lbl">Master Debrief Completed</span>
            </div>
          </div>
        </div>

        <div class="report-section">
          <h4>Master Debriefing Notes</h4>
          <p class="text-xs text-muted mb-0">
            Formal debriefing conducted with Master and Chief Engineer. Immediate housekeeping concerns rectified on site; structural item entered into Fleet CAPA tracker with 14-day SLA.
          </p>
        </div>
      </div>

      <div modal-actions>
        <button mat-stroked-button (click)="isReportModalOpen = false">Close</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="downloadPdfReport()">
          <mat-icon>download</mat-icon> Download Formal PDF
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .visit-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .vstat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow-sm); }
    .vstat-lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .vstat-val { font-size: 24px; font-weight: 800; color: var(--foreground); }
    .vstat-sub { font-size: 11.5px; color: var(--muted-foreground); }
    .text-green { color: var(--primary); }
    .text-blue { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .text-indigo { color: var(--primary); }
    .role-badge { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; display: inline-block; }
    .role-captain { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .role-engineer { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); border: 1px solid oklch(0.88 0.06 78); }
    .role-hseq { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .vessel-title { font-weight: 700; color: var(--foreground); }
    .scope-cell { max-width: 280px; }
    .scope-text { font-size: 12.5px; font-weight: 600; color: #0f172a; margin-bottom: 2px; }
    .template-tag { font-size: 10.5px; color: #64748b; }
    .findings-pill { display: flex; flex-direction: column; font-size: 12px; }
    .text-red { color: #dc2626; }
    .text-right { text-align: right; }
    .btn-sm { height: 32px !important; font-size: 11.5px !important; }
    .filter-card { padding: 14px 20px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
    .search-input-wrap { position: relative; flex: 1; min-width: 280px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: #94a3b8; }
    .search-input-wrap .custom-input { padding-left: 38px; }
    .filter-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .btn-reset { height: 38px !important; color: #64748b !important; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sort-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-left: 4px; color: #94a3b8; }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .form-col { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 700; color: #475569; }
    .report-summary-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .rbox-item { display: flex; flex-direction: column; gap: 2px; }
    .rbox-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .report-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
    .report-section h4 { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .findings-stat-banner { display: flex; gap: 20px; margin-top: 8px; }
    .f-box { display: flex; flex-direction: column; }
    .f-num { font-size: 20px; font-weight: 800; color: #0f172a; }
    .f-lbl { font-size: 11px; color: #64748b; }
    .mb-4 { margin-bottom: 16px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-1 { margin-top: 2px; }
  `]
})
export class VisitsListComponent {
  searchQuery: string = '';
  roleFilter: string = 'ALL';
  statusFilter: string = 'ALL';

  sortColumn: keyof ManagementVisitRecord = 'plannedDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage: number = 1;
  pageSize: number = 5;

  isScheduleModalOpen: boolean = false;
  isReportModalOpen: boolean = false;
  selectedVisit?: ManagementVisitRecord;

  newVisit = {
    categoryRole: 'HSEQ Superintendent',
    visitorName: '',
    vesselId: 'VES-01',
    portLocation: '',
    plannedDate: new Date().toISOString().substring(0, 10),
    checklistTemplate: 'Comprehensive Safety & Nav Audit',
    purposeScope: ''
  };

  constructor(
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  filteredVisits = computed(() => {
    const list = this.state.managementVisits();
    const vFilter = this.state.selectedVesselFilter();

    const filtered = list.filter(v => {
      const matchVessel = vFilter === 'ALL' || v.vesselId === vFilter;
      const matchRole = this.roleFilter === 'ALL' || v.categoryRole.includes(this.roleFilter);
      const matchStatus = this.statusFilter === 'ALL' || v.status === this.statusFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        v.referenceNo.toLowerCase().includes(q) ||
        v.visitorName.toLowerCase().includes(q) ||
        v.vesselName.toLowerCase().includes(q) ||
        v.portLocation.toLowerCase().includes(q);

      return matchVessel && matchRole && matchStatus && matchSearch;
    });

    return filtered.sort((a, b) => {
      const valA = (a[this.sortColumn] || '').toString();
      const valB = (b[this.sortColumn] || '').toString();
      return this.sortDirection === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  });

  paginatedVisits = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredVisits().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredVisits().length / this.pageSize) || 1);

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredVisits().length);
  }

  getRoleClass(role: string): string {
    if (role.includes('Captain')) return 'role-captain';
    if (role.includes('Engineer')) return 'role-engineer';
    return 'role-hseq';
  }

  toggleSort(col: keyof ManagementVisitRecord) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof ManagementVisitRecord): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery = '';
    this.roleFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
  }

  openScheduleModal() {
    this.isScheduleModalOpen = true;
  }

  saveVisit() {
    if (!this.newVisit.visitorName || !this.newVisit.portLocation || !this.newVisit.purposeScope) {
      this.notify.showError('Required Fields', 'Please fill in Visitor Name, Port Location, and Purpose.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newVisit.vesselId);
    const dueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    this.state.addManagementVisit({
      referenceNo: `VISIT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
      categoryRole: this.newVisit.categoryRole as any,
      visitorName: this.newVisit.visitorName,
      vesselId: this.newVisit.vesselId,
      vesselName: vessel ? vessel.name : 'MV Pacific Voyager',
      portLocation: this.newVisit.portLocation,
      plannedDate: this.newVisit.plannedDate,
      dueDate: dueDate,
      status: 'Planned',
      purposeScope: this.newVisit.purposeScope,
      checklistTemplate: this.newVisit.checklistTemplate,
      findingsCount: 0,
      openCapaCount: 0
    });

    this.isScheduleModalOpen = false;
    this.notify.showSuccess('Visit Scheduled', `Management safety visit scheduled for ${vessel ? vessel.name : 'vessel'}.`);
    this.newVisit.visitorName = '';
    this.newVisit.portLocation = '';
    this.newVisit.purposeScope = '';
  }

  viewReport(v: ManagementVisitRecord) {
    this.selectedVisit = v;
    this.isReportModalOpen = true;
  }

  downloadPdfReport() {
    this.notify.showSuccess('Report Downloaded', `Management Visit Report for ${this.selectedVisit?.referenceNo} generated.`);
    this.isReportModalOpen = false;
  }
}
