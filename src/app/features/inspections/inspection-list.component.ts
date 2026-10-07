import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InspectionRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-inspection-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Inspection & Audit Register"
        subtitle="Track vessel audits, vetting inspections, non-conformities, and finding closures"
        icon="fact_check"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Inspections'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="exportData('Excel')" class="btn-export">
            <mat-icon>table_view</mat-icon> Export Excel
          </button>
          <button mat-stroked-button (click)="exportData('PDF')" class="btn-export">
            <mat-icon>picture_as_pdf</mat-icon> Export PDF
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="showCreateModal = true">
            <mat-icon>add</mat-icon> Log New Inspection
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
                [(ngModel)]="searchTerm" 
                (ngModelChange)="currentPage = 1"
                placeholder="Search by vessel, reference, lead auditor..." 
                class="custom-input" />
            </div>
          </div>

          <div class="filter-item">
            <label class="filter-label">Inspection Type</label>
            <select [(ngModel)]="selectedType" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Inspection Types</option>
              <option value="Internal ISM Audit">Internal ISM Audit</option>
              <option value="Pre-vetting Inspection">Pre-vetting Inspection</option>
              <option value="Navigational Audit">Navigational Audit</option>
              <option value="Engine Room Survey">Engine Room Survey</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Overall Status</label>
            <select [(ngModel)]="selectedStatus" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Under Review">Under Review</option>
              <option value="Action Pending">Action Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Register Data Table -->
      <div class="hseq-card">
        <div class="table-responsive">
          <table class="hseq-table">
            <thead>
              <tr>
                <th class="sortable-th" [class.sorted]="sortCol === 'referenceNo'" (click)="toggleSort('referenceNo')">
                  Inspection Ref
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th class="sortable-th" [class.sorted]="sortCol === 'vesselName'" (click)="toggleSort('vesselName')">
                  Vessel / Department
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th>Type</th>
                <th class="sortable-th" [class.sorted]="sortCol === 'inspectionDate'" (click)="toggleSort('inspectionDate')">
                  Inspection Date
                  <mat-icon class="sort-icon">{{ getSortIcon('inspectionDate') }}</mat-icon>
                </th>
                <th>Lead Inspector</th>
                <th>Findings</th>
                <th class="sortable-th" [class.sorted]="sortCol === 'scorePercentage'" (click)="toggleSort('scorePercentage')">
                  Audit Score
                  <mat-icon class="sort-icon">{{ getSortIcon('scorePercentage') }}</mat-icon>
                </th>
                <th class="sortable-th" [class.sorted]="sortCol === 'overallStatus'" (click)="toggleSort('overallStatus')">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('overallStatus') }}</mat-icon>
                </th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="paginatedInspections().length > 0">
              <tr *ngFor="let item of paginatedInspections()" class="clickable-row" [routerLink]="['/inspections', item.id]">
                <td class="mono-ref">
                  <strong>{{ item.referenceNo }}</strong>
                </td>
                <td>
                  <span class="vessel-title">{{ item.vesselName }}</span>
                  <span class="text-muted block text-xs">{{ item.department }} &bull; {{ item.location }}</span>
                </td>
                <td>
                  <span class="type-pill">{{ item.inspectionType }}</span>
                </td>
                <td>{{ item.inspectionDate }}</td>
                <td>{{ item.leadInspector }}</td>
                <td>
                  <div class="findings-summary">
                    <span class="badge-findings">{{ item.findings.length }} Total</span>
                    <span *ngIf="getOpenFindings(item) > 0" class="badge-open">{{ getOpenFindings(item) }} Open</span>
                  </div>
                </td>
                <td>
                  <div class="score-badge" [class.score-good]="item.scorePercentage >= 90">
                    {{ item.scorePercentage }}%
                  </div>
                </td>
                <td>
                  <app-status-badge [status]="item.overallStatus"></app-status-badge>
                </td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button mat-icon-button [routerLink]="['/inspections', item.id]" matTooltip="View Detail & Findings">
                    <mat-icon color="primary">visibility</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state fallback -->
        <div *ngIf="filteredInspections().length === 0" class="p-4">
          <app-empty-state
            icon="search_off"
            title="No Inspections Match Your Criteria"
            description="Try clearing your search term or selecting 'All' inspection types."
            actionLabel="Reset Search"
            (actionClick)="resetSearch()">
          </app-empty-state>
        </div>

        <!-- Pagination Controls -->
        <div class="table-pagination-bar" *ngIf="filteredInspections().length > 0">
          <div class="pagination-meta">
            Showing <strong>{{ startIndex + 1 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ filteredInspections().length }}</strong> inspections
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

    <!-- Create Inspection Modal -->
    <app-modal
      [isOpen]="showCreateModal"
      title="Log New Inspection / Audit"
      subtitle="Register vetting inspection, ISM internal audit or navigational survey"
      icon="fact_check"
      (close)="showCreateModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="newVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Audited Department <span class="text-red">*</span></label>
          <select [(ngModel)]="newDepartment" class="custom-select">
            <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Audit Type <span class="text-red">*</span></label>
          <select [(ngModel)]="newInspectionType" class="custom-select">
            <option value="Internal ISM Audit">Internal ISM Audit</option>
            <option value="Pre-vetting Inspection">Pre-vetting Inspection</option>
            <option value="Navigational Audit">Navigational Audit</option>
            <option value="Engine Room Survey">Engine Room Survey</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Location Onboard</label>
          <input type="text" [(ngModel)]="newLocation" placeholder="e.g. Navigation Bridge, Main Deck, Steering Gear" class="custom-input" />
        </div>

        <div class="form-grid-2 mb-3">
          <div class="form-field-group">
            <label class="field-label">Lead Auditor Name</label>
            <input type="text" [(ngModel)]="newLeadInspector" class="custom-input" />
          </div>
          <div class="form-field-group">
            <label class="field-label">Compliance Score (%)</label>
            <input type="number" [(ngModel)]="newScore" min="50" max="100" class="custom-input" />
          </div>
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showCreateModal = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="submitNewInspection()">Register Audit</button>
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
    .vessel-title { font-weight: 700; color: var(--foreground); }
    .type-pill { font-size: 11px; font-weight: 600; background: var(--accent); color: var(--primary); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border); }
    .findings-summary { display: flex; gap: 6px; }
    .badge-findings { font-size: 11.5px; font-weight: 600; background: var(--muted); padding: 2px 6px; border-radius: 4px; color: var(--muted-foreground); }
    .badge-open { font-size: 11.5px; font-weight: 700; background: oklch(0.95 0.04 25); color: var(--destructive); padding: 2px 7px; border-radius: 4px; border: 1px solid oklch(0.88 0.08 25); }
    .score-badge { font-weight: 800; font-size: 13px; color: var(--secondary-foreground); }
    .score-good { color: var(--primary); }
    .clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .clickable-row:hover { background: var(--accent); }
    .text-right { text-align: right; }
    .text-red { color: #dc2626; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .p-4 { padding: 24px; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .page-indicator { font-size: 12.5px; color: #64748b; font-weight: 600; padding: 0 8px; }
  `]
})
export class InspectionListComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  searchTerm: string = '';
  selectedType: string = 'ALL';
  selectedStatus: string = 'ALL';

  sortCol: string = 'inspectionDate';
  sortAsc: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  // Create Modal
  showCreateModal: boolean = false;
  newVesselId: string = 'VES-01';
  newDepartment: string = 'Deck Department';
  newInspectionType: any = 'Internal ISM Audit';
  newLocation: string = 'Forward Mooring Station';
  newLeadInspector: string = 'Capt. R. Sterling (Auditor)';
  newScore: number = 94;

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

  readonly filteredInspections = computed(() => {
    const list = this.state.inspections();
    const vFilter = this.state.selectedVesselFilter();
    const term = this.searchTerm.toLowerCase().trim();

    let res = list.filter(i => {
      const matchVessel = vFilter === 'ALL' || i.vesselId === vFilter;
      const matchType = this.selectedType === 'ALL' || i.inspectionType === this.selectedType;
      const matchStatus = this.selectedStatus === 'ALL' || i.overallStatus === this.selectedStatus;
      const matchTerm = !term || 
        i.referenceNo.toLowerCase().includes(term) ||
        i.vesselName.toLowerCase().includes(term) ||
        i.leadInspector.toLowerCase().includes(term) ||
        i.department.toLowerCase().includes(term);

      return matchVessel && matchType && matchStatus && matchTerm;
    });

    const key = this.sortCol as keyof InspectionRecord;
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
    return Math.max(1, Math.ceil(this.filteredInspections().length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredInspections().length);
  }

  readonly paginatedInspections = computed(() => {
    return this.filteredInspections().slice(this.startIndex, this.endIndex);
  });

  getOpenFindings(ins: InspectionRecord): number {
    return ins.findings.filter(f => f.status !== 'Closed').length;
  }

  resetSearch() {
    this.searchTerm = '';
    this.selectedType = 'ALL';
    this.selectedStatus = 'ALL';
    this.currentPage = 1;
  }

  exportData(format: 'Excel' | 'PDF') {
    this.notify.showSuccess(`Audit Register Export (${format})`, `Exporting ${this.filteredInspections().length} inspection audit logs to verified ${format} report.`);
  }

  submitNewInspection() {
    const vessel = this.state.vessels().find(v => v.id === this.newVesselId);
    const newRecord = this.state.addInspection({
      vesselId: this.newVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      department: this.newDepartment,
      location: this.newLocation,
      inspectionType: this.newInspectionType,
      leadInspector: this.newLeadInspector,
      scorePercentage: this.newScore
    });

    this.showCreateModal = false;
    this.notify.showSuccess('Inspection Logged', `Audit ${newRecord.referenceNo} registered under ${newRecord.vesselName}.`);
  }
}
