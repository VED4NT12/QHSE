import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { WorkflowActionDialogComponent } from '../../shared/components/workflow-action-dialog/workflow-action-dialog.component';
import { CapaRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-capa-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Universal Consolidated CAPA Tracker"
        subtitle="Single unified action registry consolidating corrective & preventive actions from all 8 modules"
        icon="task_alt"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Universal CAPA'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="simulateExport()" class="btn-export">
            <mat-icon>file_download</mat-icon> Export Ageing Report
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="openAddCapaModal()">
            <mat-icon>add_task</mat-icon> Log Corrective Action
          </button>
        </div>
      </app-page-header>

      <!-- Maker-Checker Governance Callout -->
      <div class="governance-banner mb-4">
        <mat-icon class="gov-icon">gavel</mat-icon>
        <div class="gov-text">
          <strong>Maker-Checker Safety Rule Active:</strong>
          <span>Under ISM Code rules, the individual assigned to implement an action cannot close it. Closure must be independently verified by an authorized HSEQ Superintendent or Department Head.</span>
        </div>
      </div>

      <!-- Filters & Search Row -->
      <div class="hseq-card filter-card mb-4">
        <div class="filter-top-row">
          <div class="search-input-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search by action description, CAPA reference, responsible person..." 
              class="custom-input" />
          </div>

          <div class="filter-grid">
            <div class="filter-item">
              <label class="filter-label">Originating Source</label>
              <select [(ngModel)]="sourceFilter" class="custom-select">
                <option value="ALL">All Source Modules</option>
                <option value="Inspection">Audit & Inspection</option>
                <option value="Near Miss">Near Miss</option>
                <option value="Incident">Incident Investigation</option>
                <option value="Safe Card">Safe Card / Observation</option>
                <option value="Management Visit">Management Visit</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">Priority Level</label>
              <select [(ngModel)]="priorityFilter" class="custom-select">
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">Action Status</label>
              <select [(ngModel)]="statusFilter" class="custom-select">
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Verification Pending">Verification Pending</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <button *ngIf="searchQuery || sourceFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL'"
                    mat-stroked-button (click)="resetFilters()" class="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Main Consolidated Register Table -->
      <div class="hseq-card">
        <div class="table-responsive" *ngIf="paginatedCapas().length > 0">
          <table class="hseq-table">
            <thead>
              <tr>
                <th (click)="toggleSort('referenceNo')" class="sortable-th">
                  CAPA ID
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th>Originating Source & Ref</th>
                <th>Action Description & Category</th>
                <th (click)="toggleSort('priority')" class="sortable-th">
                  Priority
                  <mat-icon class="sort-icon">{{ getSortIcon('priority') }}</mat-icon>
                </th>
                <th>Assignee & Dept</th>
                <th (click)="toggleSort('targetDate')" class="sortable-th">
                  Target Date
                  <mat-icon class="sort-icon">{{ getSortIcon('targetDate') }}</mat-icon>
                </th>
                <th (click)="toggleSort('status')" class="sortable-th">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                </th>
                <th class="text-right">Maker-Checker Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of paginatedCapas()">
                <td class="mono-ref"><strong>{{ c.referenceNo }}</strong></td>
                <td>
                  <span class="source-badge">{{ c.sourceModule }}</span>
                  <span class="block text-xs font-mono text-blue mt-1">{{ c.sourceReferenceNo }}</span>
                  <span class="text-xs text-muted block">{{ c.vesselName }}</span>
                </td>
                <td class="action-desc-cell">
                  <div class="desc-text">{{ c.actionDescription }}</div>
                  <span class="cat-tag">{{ c.actionCategory }}</span>
                  <div class="progress-note" *ngIf="c.progressNotes">
                    <strong>Latest Note:</strong> {{ c.progressNotes }}
                  </div>
                </td>
                <td>
                  <span class="priority-pill" [ngClass]="'prio-' + c.priority.toLowerCase()">
                    {{ c.priority }}
                  </span>
                </td>
                <td>
                  <span class="font-bold text-xs">{{ c.responsiblePerson }}</span>
                  <span class="text-xs text-muted block">{{ c.department }}</span>
                </td>
                <td>
                  <div class="date-wrap">
                    <span [class.text-red]="c.revisedDate">{{ c.revisedDate || c.targetDate }}</span>
                    <span *ngIf="c.revisedDate" class="revised-badge" [title]="c.extensionJustification || ''">
                      Extended
                    </span>
                  </div>
                </td>
                <td><app-status-badge [status]="c.status"></app-status-badge></td>
                <td class="text-right">
                  <!-- Action button based on current role and status -->
                  <button 
                    *ngIf="c.status === 'Open'" 
                    mat-stroked-button color="primary" class="btn-xs"
                    (click)="advanceStatus(c, 'In Progress')">
                    Start Action
                  </button>

                  <button 
                    *ngIf="c.status === 'In Progress'" 
                    mat-stroked-button color="accent" class="btn-xs"
                    (click)="advanceStatus(c, 'Verification Pending')">
                    Submit Evidence
                  </button>

                  <button 
                    *ngIf="c.status === 'Verification Pending'" 
                    mat-flat-button color="primary" class="btn-xs font-bold"
                    (click)="verifyAndClose(c)">
                    <mat-icon class="xs-icon">verified</mat-icon> Verify & Close
                  </button>

                  <span *ngIf="c.status === 'Closed'" class="verified-tag">
                    Closed by {{ c.verifiedBy || 'HSEQ Superintendent' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ getEndIndex() }} of {{ filteredCapas().length }} corrective actions</span>
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
          *ngIf="paginatedCapas().length === 0"
          icon="task_alt"
          title="No Corrective Actions Found"
          message="No CAPA records match the selected filters or search query. Adjust the filters above or log a new action."
          actionText="Log Corrective Action"
          (action)="openAddCapaModal()">
        </app-empty-state>
      </div>
    </div>

    <!-- Create CAPA Modal -->
    <app-modal
      [isOpen]="isAddModalOpen"
      title="Log New Corrective / Preventive Action (CAPA)"
      subtitle="Universal action item linked to safety finding or management observation"
      icon="task_alt"
      maxWidth="680px"
      (close)="isAddModalOpen = false">
      <div class="modal-form">
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Action Description *</label>
            <input type="text" [(ngModel)]="newCapa.actionDescription" placeholder="Actionable remedial step required" class="custom-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Source Module *</label>
            <select [(ngModel)]="newCapa.sourceModule" class="custom-select">
              <option value="Inspection">Audit & Inspection</option>
              <option value="Near Miss">Near Miss Investigation</option>
              <option value="Incident">Incident Investigation</option>
              <option value="Safe Card">Safe Card Observation</option>
              <option value="Management Visit">Management Visit</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Action Category</label>
            <select [(ngModel)]="newCapa.actionCategory" class="custom-select">
              <option value="Corrective">Corrective</option>
              <option value="Preventive">Preventive</option>
              <option value="Procedural Update">Procedural Update</option>
              <option value="Engineering Fix">Engineering Fix</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Vessel Asset *</label>
            <select [(ngModel)]="newCapa.vesselId" class="custom-select">
              <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }}</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Department *</label>
            <select [(ngModel)]="newCapa.department" class="custom-select">
              <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Assignee / Responsible Person *</label>
            <input type="text" [(ngModel)]="newCapa.responsiblePerson" placeholder="e.g. Chief Engineer" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Priority Level</label>
            <select [(ngModel)]="newCapa.priority" class="custom-select">
              <option value="Critical">Critical (Immediate)</option>
              <option value="High">High (7 Days)</option>
              <option value="Medium">Medium (14 Days)</option>
              <option value="Low">Low (30 Days)</option>
            </select>
          </div>
        </div>
      </div>

      <div modal-actions>
        <button mat-stroked-button (click)="isAddModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveCapa()">
          <mat-icon>check</mat-icon> Log CAPA Item
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .governance-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-left: 5px solid var(--primary);
      border-radius: var(--radius-sm);
      padding: 14px 18px;
    }
    .gov-icon { font-size: 26px; width: 26px; height: 26px; color: var(--primary); }
    .gov-text { font-size: 13px; color: var(--foreground); }
    .filter-card { padding: 16px 20px; }
    .filter-top-row { display: flex; flex-direction: column; gap: 14px; }
    .search-input-wrap { position: relative; width: 100%; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--muted-foreground); }
    .search-input-wrap .custom-input { padding-left: 38px; width: 100%; }
    .filter-grid { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
    .filter-item { display: flex; flex-direction: column; gap: 6px; min-width: 190px; flex: 1; }
    .filter-label { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .btn-reset { height: 38px !important; color: var(--muted-foreground) !important; }
    .source-badge {
      font-size: 11px;
      font-weight: 700;
      background: var(--accent);
      color: var(--primary);
      padding: 3px 7px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .text-blue { color: var(--primary); }
    .action-desc-cell { max-width: 320px; }
    .desc-text { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; line-height: 1.4; }
    .cat-tag { font-size: 11px; color: #475569; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; }
    .progress-note {
      font-size: 11.5px;
      color: #047857;
      background: #ecfdf5;
      padding: 4px 8px;
      border-radius: 4px;
      margin-top: 6px;
    }
    .priority-pill { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    .prio-critical { background: #fee2e2; color: #991b1b; }
    .prio-high { background: #ffedd5; color: #9a3412; }
    .prio-medium { background: #fef3c7; color: #92400e; }
    .prio-low { background: #d1fae5; color: #065f46; }
    .date-wrap { display: flex; flex-direction: column; font-size: 12.5px; font-weight: 600; }
    .revised-badge { font-size: 10px; font-weight: 700; background: #fee2e2; color: #b91c1c; padding: 1px 4px; border-radius: 3px; display: inline-block; margin-top: 2px; }
    .text-right { text-align: right; }
    .btn-xs { height: 32px !important; font-size: 11.5px !important; }
    .xs-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 2px; }
    .verified-tag { font-size: 11.5px; color: #059669; font-weight: 600; display: block; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sort-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-left: 4px; color: #94a3b8; }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .form-col { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 700; color: #475569; }
    .mb-4 { margin-bottom: 16px; }
    .mt-1 { margin-top: 2px; }
  `]
})
export class CapaListComponent {
  searchQuery: string = '';
  sourceFilter: string = 'ALL';
  priorityFilter: string = 'ALL';
  statusFilter: string = 'ALL';

  sortColumn: keyof CapaRecord = 'targetDate';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage: number = 1;
  pageSize: number = 6;

  isAddModalOpen: boolean = false;

  newCapa = {
    actionDescription: '',
    sourceModule: 'Inspection',
    actionCategory: 'Corrective',
    vesselId: 'VES-01',
    department: 'Deck Department',
    responsiblePerson: 'Chief Officer M. Lindqvist',
    priority: 'High'
  };

  constructor(
    public state: HseqStateService,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  filteredCapas = computed(() => {
    const list = this.state.capas();
    const vFilter = this.state.selectedVesselFilter();

    const filtered = list.filter(c => {
      const matchVessel = vFilter === 'ALL' || c.vesselId === vFilter;
      const matchSource = this.sourceFilter === 'ALL' || c.sourceModule === this.sourceFilter;
      const matchPriority = this.priorityFilter === 'ALL' || c.priority === this.priorityFilter;
      const matchStatus = this.statusFilter === 'ALL' || c.status === this.statusFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        c.referenceNo.toLowerCase().includes(q) ||
        c.actionDescription.toLowerCase().includes(q) ||
        c.responsiblePerson.toLowerCase().includes(q) ||
        c.sourceReferenceNo.toLowerCase().includes(q);

      return matchVessel && matchSource && matchPriority && matchStatus && matchSearch;
    });

    return filtered.sort((a, b) => {
      const valA = (a[this.sortColumn] || '').toString();
      const valB = (b[this.sortColumn] || '').toString();
      return this.sortDirection === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  });

  paginatedCapas = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCapas().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredCapas().length / this.pageSize) || 1);

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCapas().length);
  }

  toggleSort(col: keyof CapaRecord) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof CapaRecord): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery = '';
    this.sourceFilter = 'ALL';
    this.priorityFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.currentPage = 1;
  }

  advanceStatus(capa: CapaRecord, target: CapaRecord['status']) {
    this.state.updateCapaStatus(capa.id, target);
    this.notify.showSuccess('Status Updated', `CAPA ${capa.referenceNo} transitioned to "${target}".`);
  }

  verifyAndClose(capa: CapaRecord) {
    const dialogRef = this.dialog.open(WorkflowActionDialogComponent, {
      width: '520px',
      data: {
        title: 'Independent CAPA Verification & Closure',
        actionName: 'Approve & Close',
        recordRef: capa.referenceNo,
        currentStatus: capa.status,
        targetStatus: 'Closed',
        requiresJustification: true
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res?.confirmed) {
        this.state.updateCapaStatus(capa.id, 'Closed', res.comments);
        this.notify.showSuccess('CAPA Verified & Closed', `Action ${capa.referenceNo} verified and signed off under Maker-Checker governance.`);
      }
    });
  }

  openAddCapaModal() {
    this.isAddModalOpen = true;
  }

  saveCapa() {
    if (!this.newCapa.actionDescription) {
      this.notify.showError('Required Field', 'Please enter an action description.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newCapa.vesselId);
    const target = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    const newRec: CapaRecord = {
      id: `capa-${Date.now()}`,
      referenceNo: `CAPA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      sourceModule: this.newCapa.sourceModule as any,
      sourceReferenceNo: `MANUAL-${Math.floor(10 + Math.random() * 90)}`,
      vesselId: this.newCapa.vesselId,
      vesselName: vessel ? vessel.name : 'MV Pacific Voyager',
      department: this.newCapa.department,
      actionDescription: this.newCapa.actionDescription,
      actionCategory: this.newCapa.actionCategory as any,
      priority: this.newCapa.priority as any,
      responsiblePerson: this.newCapa.responsiblePerson,
      targetDate: target,
      status: 'Open',
      progressNotes: 'Action logged via Universal CAPA Tracker.'
    };

    // Push into state capas
    this.state.capas.update(curr => [newRec, ...curr]);
    this.isAddModalOpen = false;
    this.notify.showSuccess('CAPA Created', `Action item ${newRec.referenceNo} registered.`);
    this.newCapa.actionDescription = '';
  }

  simulateExport() {
    this.notify.showInfo('Report Generated', 'Fleet-wide CAPA Ageing & Closure Performance Report exported.');
  }
}
