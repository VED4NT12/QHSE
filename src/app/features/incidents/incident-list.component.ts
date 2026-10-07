import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IncidentRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-incident-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Incident Investigation & Reporting Register"
        subtitle="Manage marine accidents, pollution leaks, machinery failures, and 5-Why root cause investigations"
        icon="report_problem"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Incidents'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportRegister()">
            <mat-icon>file_download</mat-icon> Export Register
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="showCreateModal = true">
            <mat-icon>add</mat-icon> Log New Incident
          </button>
        </div>
      </app-page-header>

      <!-- Filter Controls Strip -->
      <div class="hseq-card filter-card mb-4">
        <div class="filter-grid">
          <div class="filter-item">
            <label class="filter-label">Search Keyword / Ref</label>
            <div class="search-input-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="currentPage = 1"
                placeholder="Search description, vessel, location..." 
                class="custom-input" />
            </div>
          </div>

          <div class="filter-item">
            <label class="filter-label">Incident Classification</label>
            <select [(ngModel)]="classFilter" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Classifications</option>
              <option value="Equipment Breakdown">Equipment Breakdown</option>
              <option value="Pollution / Bunker Leak">Pollution / Bunker Leak</option>
              <option value="Cargo Contamination">Cargo Contamination</option>
              <option value="Navigational Near-Collision">Navigational Near-Collision</option>
              <option value="Machinery Fire">Machinery Fire</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Investigation Status</label>
            <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Pending">Action Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Register Table -->
      <div class="hseq-card">
        <div class="table-responsive">
          <table class="hseq-table">
            <thead>
              <tr>
                <th class="sortable-th" [class.sorted]="sortCol === 'referenceNo'" (click)="toggleSort('referenceNo')">
                  Incident ID
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th>Classification</th>
                <th class="sortable-th" [class.sorted]="sortCol === 'vesselName'" (click)="toggleSort('vesselName')">
                  Vessel / Location
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th class="sortable-th" [class.sorted]="sortCol === 'dateTime'" (click)="toggleSort('dateTime')">
                  Occurrence Date/Time
                  <mat-icon class="sort-icon">{{ getSortIcon('dateTime') }}</mat-icon>
                </th>
                <th>Actual vs Potential Severity</th>
                <th>Escalation State</th>
                <th>Investigation & CAPA</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody *ngIf="paginatedIncidents().length > 0">
              <tr *ngFor="let inc of paginatedIncidents()" class="clickable-row" [routerLink]="['/incidents', inc.id]">
                <td class="mono-ref"><strong>{{ inc.referenceNo }}</strong></td>
                <td>
                  <span class="classification-pill">{{ inc.classification }}</span>
                </td>
                <td>
                  <span class="vessel-title">{{ inc.vesselName }}</span>
                  <span class="text-xs text-muted block">{{ inc.department }} &bull; {{ inc.location }}</span>
                </td>
                <td>{{ inc.dateTime }}</td>
                <td>
                  <div class="severity-pair">
                    <span class="actual-sev">Actual: {{ inc.actualSeverity }}</span>
                    <span class="potential-sev">Potential: {{ inc.potentialSeverity }}</span>
                  </div>
                </td>
                <td>
                  <span *ngIf="inc.escalationRequired" class="escalated-pill">
                    <mat-icon class="pulse-icon">warning</mat-icon> Shore Escalated
                  </span>
                  <span *ngIf="!inc.escalationRequired" class="text-muted text-xs">Standard</span>
                </td>
                <td>
                  <div class="investigation-meta">
                    <span class="font-semibold text-xs">{{ inc.investigationTeam.length }} Investigators</span>
                    <span class="text-blue text-xs block font-mono">{{ inc.capaIds.length }} CAPAs Linked</span>
                  </div>
                </td>
                <td><app-status-badge [status]="inc.status"></app-status-badge></td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button mat-stroked-button color="primary" class="btn-sm" [routerLink]="['/incidents', inc.id]">
                    Investigation View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state fallback -->
        <div *ngIf="filteredIncidents().length === 0" class="p-4">
          <app-empty-state
            icon="search_off"
            title="No Incidents Found"
            description="No incident records match your active search filter criteria."
            actionLabel="Reset Search"
            (actionClick)="resetFilters()">
          </app-empty-state>
        </div>

        <!-- Pagination Controls -->
        <div class="table-pagination-bar" *ngIf="filteredIncidents().length > 0">
          <div class="pagination-meta">
            Showing <strong>{{ startIndex + 1 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ filteredIncidents().length }}</strong> incidents
          </div>

          <div class="pagination-controls">
            <button 
              class="page-btn" 
              [disabled]="currentPage === 1" 
              (click)="currentPage = currentPage - 1">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
            <button 
              class="page-btn" 
              [disabled]="currentPage >= totalPages" 
              (click)="currentPage = currentPage + 1">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Incident Modal -->
    <app-modal
      [isOpen]="showCreateModal"
      title="Log Marine Incident / Accident"
      subtitle="Initiate formal 5-Why root cause investigation and technical containment"
      icon="report_problem"
      iconColor="#dc2626"
      (close)="showCreateModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="newVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Department</label>
          <select [(ngModel)]="newDepartment" class="custom-select">
            <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Incident Classification <span class="text-red">*</span></label>
          <select [(ngModel)]="newClassification" class="custom-select">
            <option value="Equipment Breakdown">Equipment Breakdown</option>
            <option value="Pollution / Bunker Leak">Pollution / Bunker Leak</option>
            <option value="Cargo Contamination">Cargo Contamination</option>
            <option value="Navigational Near-Collision">Navigational Near-Collision</option>
            <option value="Machinery Fire">Machinery Fire</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Exact Onboard Location</label>
          <input type="text" [(ngModel)]="newLocation" placeholder="e.g. Engine Room 2nd Platform, Port Side" class="custom-input" />
        </div>

        <div class="form-grid-2 mb-3">
          <div class="form-field-group">
            <label class="field-label">Actual Severity</label>
            <select [(ngModel)]="newActualSeverity" class="custom-select">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div class="form-field-group">
            <label class="field-label">Potential Severity</label>
            <select [(ngModel)]="newPotentialSeverity" class="custom-select">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Incident Description & Containment Measures <span class="text-red">*</span></label>
          <textarea [(ngModel)]="newDescription" placeholder="Provide factual details of the occurrence..." class="custom-input textarea-tall"></textarea>
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showCreateModal = false">Cancel</button>
        <button mat-flat-button color="warn" (click)="submitNewIncident()">Register Incident Report</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .filter-card { padding: 16px 20px; }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .filter-item { display: flex; flex-direction: column; gap: 6px; }
    .filter-label { font-size: 11.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .classification-pill {
      font-size: 11.5px;
      font-weight: 700;
      background: #fee2e2;
      color: #991b1b;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .vessel-title { font-weight: 700; color: #0f172a; }
    .severity-pair { display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
    .actual-sev { font-weight: 700; color: #d97706; }
    .potential-sev { font-weight: 700; color: #dc2626; }
    .escalated-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      color: #dc2626;
      background: #fee2e2;
      padding: 3px 7px;
      border-radius: 4px;
    }
    .pulse-icon { font-size: 14px; width: 14px; height: 14px; }
    .clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .clickable-row:hover { background: var(--accent); }
    .text-right { text-align: right; }
    .text-blue { color: var(--primary); }
    .text-red { color: var(--destructive); }
    .textarea-tall { min-height: 75px; resize: vertical; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .p-4 { padding: 24px; }
    .page-indicator { font-size: 12.5px; color: #64748b; font-weight: 600; padding: 0 8px; }
  `]
})
export class IncidentListComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  searchQuery: string = '';
  classFilter: string = 'ALL';
  statusFilter: string = 'ALL';

  sortCol: string = 'dateTime';
  sortAsc: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  showCreateModal: boolean = false;
  newVesselId: string = 'VES-01';
  newDepartment: string = 'Engine Department';
  newClassification: any = 'Equipment Breakdown';
  newLocation: string = 'Engine Room Aux Boiler Flat';
  newActualSeverity: any = 'Medium';
  newPotentialSeverity: any = 'High';
  newDescription: string = '';

  toggleSort(col: string) {
    if (this.sortCol === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortCol = col;
      this.sortAsc = true;
    }
  }

  getSortIcon(col: string): string {
    if (this.sortCol !== col) return 'unfold_more';
    return this.sortAsc ? 'arrow_upward' : 'arrow_downward';
  }

  readonly filteredIncidents = computed(() => {
    const list = this.state.incidents();
    const vFilter = this.state.selectedVesselFilter();
    const q = this.searchQuery.toLowerCase().trim();

    let res = list.filter(inc => {
      const matchVessel = vFilter === 'ALL' || inc.vesselId === vFilter;
      const matchClass = this.classFilter === 'ALL' || inc.classification === this.classFilter;
      const matchStatus = this.statusFilter === 'ALL' || inc.status === this.statusFilter;
      const matchQuery = !q || 
        inc.referenceNo.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.vesselName.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q);

      return matchVessel && matchClass && matchStatus && matchQuery;
    });

    const key = this.sortCol as keyof IncidentRecord;
    const dir = this.sortAsc ? 1 : -1;
    res.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      return valA > valB ? dir : -dir;
    });

    return res;
  });

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredIncidents().length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredIncidents().length);
  }

  readonly paginatedIncidents = computed(() => {
    return this.filteredIncidents().slice(this.startIndex, this.endIndex);
  });

  resetFilters() {
    this.searchQuery = '';
    this.classFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
  }

  exportRegister() {
    this.notify.showSuccess('Incident Register Export', `Exported ${this.filteredIncidents().length} incident reports to verified compliance package.`);
  }

  submitNewIncident() {
    if (!this.newDescription.trim()) {
      this.notify.showWarning('Description Required', 'Please enter a description for the incident report.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newVesselId);
    const newRecord = this.state.addIncident({
      vesselId: this.newVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      department: this.newDepartment,
      location: this.newLocation,
      classification: this.newClassification,
      actualSeverity: this.newActualSeverity,
      potentialSeverity: this.newPotentialSeverity,
      description: this.newDescription
    });

    this.showCreateModal = false;
    this.newDescription = '';
    this.notify.showSuccess('Incident Report Logged', `Report ${newRecord.referenceNo} registered under 5-Why investigation.`);
  }
}
