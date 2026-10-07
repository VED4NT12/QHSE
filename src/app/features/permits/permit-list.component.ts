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
import { PermitToWorkRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-permit-list',
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
        title="Permit to Work (PTW) Register"
        subtitle="Manage safety authorizations, Confined Space gas testing, LOTO isolation, and SIMOPS coordination"
        icon="vpn_key"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Permit to Work'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportRegister()">
            <mat-icon>file_download</mat-icon> Export Active PTWs
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="showCreateModal = true">
            <mat-icon>add</mat-icon> Request New Permit
          </button>
        </div>
      </app-page-header>

      <!-- PTW Status Filter Cards -->
      <div class="ptw-status-grid mb-4">
        <div 
          class="status-summary-card active-card" 
          [class.card-selected]="statusFilter === 'Active'"
          (click)="setStatusFilter('Active')">
          <div class="card-left">
            <span class="count">{{ getCount('Active') }}</span>
            <span class="label">Live Active Permits</span>
          </div>
          <mat-icon class="card-icon text-green">verified</mat-icon>
        </div>

        <div 
          class="status-summary-card pending-card" 
          [class.card-selected]="statusFilter === 'Approved'"
          (click)="setStatusFilter('Approved')">
          <div class="card-left">
            <span class="count">{{ getCount('Approved') }}</span>
            <span class="label">Approved (Pre-Work Pending)</span>
          </div>
          <mat-icon class="card-icon text-blue">pending_actions</mat-icon>
        </div>

        <div 
          class="status-summary-card all-card" 
          [class.card-selected]="statusFilter === 'ALL'"
          (click)="setStatusFilter('ALL')">
          <div class="card-left">
            <span class="count">{{ state.permits().length }}</span>
            <span class="label">Total Issued Permits</span>
          </div>
          <mat-icon class="card-icon text-slate">list_alt</mat-icon>
        </div>
      </div>

      <!-- Filter Controls Strip -->
      <div class="hseq-card filter-card mb-4">
        <div class="filter-grid">
          <div class="filter-item">
            <label class="filter-label">Search Work Description / Ref / Location</label>
            <div class="search-input-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="currentPage = 1"
                placeholder="Search permit ref, task, location..." 
                class="custom-input" />
            </div>
          </div>

          <div class="filter-item">
            <label class="filter-label">Permit Category</label>
            <select [(ngModel)]="categoryFilter" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Categories</option>
              <option value="Hot Work (Enclosed/Open)">Hot Work</option>
              <option value="Confined Space Entry">Confined Space Entry</option>
              <option value="Electrical Isolation Work">Electrical Isolation</option>
              <option value="Working Aloft / Overboard">Working Aloft / Overboard</option>
              <option value="Cold Work">Cold Work</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Operational Status</label>
            <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Approved">Approved</option>
              <option value="Suspended">Suspended</option>
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
                  Permit ID
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th>Permit Type</th>
                <th class="sortable-th" [class.sorted]="sortCol === 'vesselName'" (click)="toggleSort('vesselName')">
                  Vessel / Worksite
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th>Work Description</th>
                <th>Mandatory Linkages</th>
                <th>Authorities (Perf / Appr)</th>
                <th class="sortable-th" [class.sorted]="sortCol === 'startDateTime'" (click)="toggleSort('startDateTime')">
                  Validity Window
                  <mat-icon class="sort-icon">{{ getSortIcon('startDateTime') }}</mat-icon>
                </th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody *ngIf="paginatedPermits().length > 0">
              <tr *ngFor="let p of paginatedPermits()" class="clickable-row" [routerLink]="['/permits', p.id]">
                <td class="mono-ref"><strong>{{ p.referenceNo }}</strong></td>
                <td>
                  <span class="ptw-type-tag" [ngClass]="getPermitTypeClass(p.permitType)">
                    {{ p.permitType }}
                  </span>
                </td>
                <td>
                  <span class="vessel-title">{{ p.vesselName }}</span>
                  <span class="text-muted block text-xs">{{ p.worksiteLocation }}</span>
                </td>
                <td class="desc-cell">{{ p.workDescription }}</td>
                <td>
                  <div class="link-flags">
                    <span class="flag-pill">RA: {{ p.linkedRaNumber }}</span>
                    <span class="flag-pill" *ngIf="p.gasTestingRequired">Gas Tested</span>
                    <span class="flag-pill" *ngIf="p.isolationLotoRequired">LOTO Locked</span>
                  </div>
                </td>
                <td>
                  <span class="block text-xs font-semibold">Perf: {{ p.performingAuthority }}</span>
                  <span class="block text-xs text-muted">Auth: {{ p.approvingAuthority }}</span>
                </td>
                <td>
                  <div class="time-window">
                    <span>{{ p.startDateTime }}</span>
                    <span class="text-xs text-muted">to {{ p.expiryDateTime }} ({{ p.validityHours }}h)</span>
                  </div>
                </td>
                <td><app-status-badge [status]="p.status"></app-status-badge></td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button mat-stroked-button color="primary" class="btn-sm" [routerLink]="['/permits', p.id]">
                    Open Flow
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state fallback -->
        <div *ngIf="filteredPermits().length === 0" class="p-4">
          <app-empty-state
            icon="search_off"
            title="No Permits Found"
            description="No permit records match your active search or status filters."
            actionLabel="Reset Search"
            (actionClick)="resetFilters()">
          </app-empty-state>
        </div>

        <!-- Pagination Controls -->
        <div class="table-pagination-bar" *ngIf="filteredPermits().length > 0">
          <div class="pagination-meta">
            Showing <strong>{{ startIndex + 1 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ filteredPermits().length }}</strong> permits
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

    <!-- Request New Permit Modal -->
    <app-modal
      [isOpen]="showCreateModal"
      title="Request Permit to Work (PTW)"
      subtitle="Initiate formal safety authorization for high-risk operation"
      icon="vpn_key"
      iconColor="oklch(0.6420 0.1691 38.5815)"
      (close)="showCreateModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="newVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Permit Category <span class="text-red">*</span></label>
          <select [(ngModel)]="newPermitType" class="custom-select">
            <option value="Hot Work (Enclosed/Open)">Hot Work (Enclosed / Open Deck)</option>
            <option value="Confined Space Entry">Confined Space Entry (Tanks, Holds)</option>
            <option value="Electrical Isolation Work">Electrical Isolation / High Voltage</option>
            <option value="Working Aloft / Overboard">Working Aloft / Overboard</option>
            <option value="Cold Work">Cold Work / Heavy Lifting</option>
          </select>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Worksite Location <span class="text-red">*</span></label>
          <input type="text" [(ngModel)]="newLocation" placeholder="e.g. Engine Room 2nd Platform, Steering Gear" class="custom-input" />
        </div>

        <div class="form-grid-2 mb-3">
          <div class="form-field-group">
            <label class="field-label">Performing Authority</label>
            <input type="text" [(ngModel)]="newPerfAuth" class="custom-input" />
          </div>
          <div class="form-field-group">
            <label class="field-label">Validity Hours</label>
            <input type="number" [(ngModel)]="newValidityHours" min="1" max="24" class="custom-input" />
          </div>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Work Scope & Precautions <span class="text-red">*</span></label>
          <textarea [(ngModel)]="newDescription" placeholder="State work scope, tools, and isolations..." class="custom-input textarea-tall"></textarea>
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showCreateModal = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="submitNewPermit()">Issue & Activate Permit</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .ptw-status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .status-summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: all 0.15s ease;
    }
    .status-summary-card:hover {
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .card-selected {
      border-color: var(--primary) !important;
      background: var(--accent) !important;
    }
    .count { font-size: 24px; font-weight: 800; color: var(--foreground); line-height: 1.1; }
    .label { font-size: 11.5px; font-weight: 600; color: var(--muted-foreground); margin-top: 4px; display: block; }
    .card-icon { font-size: 28px; width: 28px; height: 28px; }
    .text-green { color: var(--primary); }
    .text-blue { color: var(--primary); }
    .text-slate { color: var(--muted-foreground); }
    .text-red { color: var(--destructive); }

    .filter-card { padding: 16px 20px; }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .filter-item { display: flex; flex-direction: column; gap: 6px; }
    .filter-label { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.5px; }

    .ptw-type-tag { font-size: 11.5px; font-weight: 700; padding: 4px 8px; border-radius: var(--radius-sm); display: inline-block; }
    .type-hot { background: oklch(0.95 0.04 25); color: var(--destructive); }
    .type-confined { background: oklch(0.95 0.04 60); color: oklch(0.45 0.14 50); }
    .type-elec { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); }
    .type-aloft { background: var(--accent); color: var(--primary); }
    .type-cold { background: var(--muted); color: var(--foreground); }

    .vessel-title { font-weight: 700; color: var(--foreground); }
    .desc-cell { max-width: 260px; font-size: 12.5px; line-height: 1.4; }
    .link-flags { display: flex; flex-wrap: wrap; gap: 4px; }
    .flag-pill { font-size: 10px; font-weight: 700; background: var(--accent); color: var(--primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); }
    .time-window { font-size: 12px; font-weight: 600; color: var(--foreground); }
    .clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .clickable-row:hover { background: var(--accent); }
    .text-right { text-align: right; }
    .textarea-tall { min-height: 75px; resize: vertical; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .p-4 { padding: 24px; }
    .page-indicator { font-size: 12.5px; color: #64748b; font-weight: 600; padding: 0 8px; }
  `]
})
export class PermitListComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  searchQuery: string = '';
  categoryFilter: string = 'ALL';
  statusFilter: string = 'ALL';

  sortCol: string = 'startDateTime';
  sortAsc: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  showCreateModal: boolean = false;
  newVesselId: string = 'VES-01';
  newPermitType: any = 'Hot Work (Enclosed/Open)';
  newLocation: string = 'Engine Room 2nd Platform';
  newPerfAuth: string = 'Bosun D. Silva';
  newValidityHours: number = 8;
  newDescription: string = 'Pipe spool replacement and structural bracket welding.';

  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.currentPage = 1;
  }

  getCount(status: string): number {
    return this.state.permits().filter(p => p.status === status).length;
  }

  getPermitTypeClass(type: string): string {
    if (type.includes('Hot Work')) return 'type-hot';
    if (type.includes('Confined')) return 'type-confined';
    if (type.includes('Electrical')) return 'type-elec';
    if (type.includes('Aloft')) return 'type-aloft';
    return 'type-cold';
  }

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

  readonly filteredPermits = computed(() => {
    const list = this.state.permits();
    const vFilter = this.state.selectedVesselFilter();
    const q = this.searchQuery.toLowerCase().trim();

    let res = list.filter(p => {
      const matchVessel = vFilter === 'ALL' || p.vesselId === vFilter;
      const matchCat = this.categoryFilter === 'ALL' || p.permitType === this.categoryFilter;
      const matchStatus = this.statusFilter === 'ALL' || p.status === this.statusFilter;
      const matchQ = !q || 
        p.referenceNo.toLowerCase().includes(q) ||
        p.workDescription.toLowerCase().includes(q) ||
        p.worksiteLocation.toLowerCase().includes(q) ||
        p.vesselName.toLowerCase().includes(q);

      return matchVessel && matchCat && matchStatus && matchQ;
    });

    const key = this.sortCol as keyof PermitToWorkRecord;
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
    return Math.max(1, Math.ceil(this.filteredPermits().length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredPermits().length);
  }

  readonly paginatedPermits = computed(() => {
    return this.filteredPermits().slice(this.startIndex, this.endIndex);
  });

  resetFilters() {
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
  }

  exportRegister() {
    this.notify.showSuccess('Permit Register Export', `Exported ${this.filteredPermits().length} active permits to daily operations safety log.`);
  }

  submitNewPermit() {
    if (!this.newDescription.trim()) {
      this.notify.showWarning('Description Required', 'Please provide the work description.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newVesselId);
    const newRecord = this.state.addPermit({
      vesselId: this.newVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      permitType: this.newPermitType,
      worksiteLocation: this.newLocation,
      performingAuthority: this.newPerfAuth,
      validityHours: this.newValidityHours,
      workDescription: this.newDescription
    });

    this.showCreateModal = false;
    this.notify.showSuccess('PTW Authorized', `Permit ${newRecord.referenceNo} issued and active.`);
  }
}
