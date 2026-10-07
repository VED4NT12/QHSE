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
import { InjuryRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-injury-list',
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
        title="Injury & Occupational Health Register"
        subtitle="Track medical treatment cases (MTC), first aid cases (FAC), lost-time injuries (LTI), and return-to-work clearances"
        icon="personal_injury"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Injury Reports'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportRegister()">
            <mat-icon>file_download</mat-icon> Export Register
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="showCreateModal = true">
            <mat-icon>add</mat-icon> Log Injury Case
          </button>
        </div>
      </app-page-header>

      <!-- KPI Pill Strip -->
      <div class="injury-kpis mb-4">
        <div class="kpi-pill">
          <span class="kpi-lbl">Fleet Lost Time Injuries (LTI)</span>
          <span class="kpi-num text-green">0 Cases</span>
          <span class="kpi-sub">Target Zero Maintained</span>
        </div>
        <div class="kpi-pill">
          <span class="kpi-lbl">Medical Treatment Cases (MTC)</span>
          <span class="kpi-num text-amber">1 Case</span>
          <span class="kpi-sub">Full duty resumed</span>
        </div>
        <div class="kpi-pill">
          <span class="kpi-lbl">First Aid Cases (FAC)</span>
          <span class="kpi-num text-blue">1 Case</span>
          <span class="kpi-sub">Minor deck laceration</span>
        </div>
        <div class="kpi-pill">
          <span class="kpi-lbl">Restricted Work Days</span>
          <span class="kpi-num">3 Days</span>
          <span class="kpi-sub">Zero lost days YTD</span>
        </div>
      </div>

      <!-- Filter Controls Strip -->
      <div class="hseq-card filter-card mb-4">
        <div class="filter-grid">
          <div class="filter-item">
            <label class="filter-label">Search Crew / Ref / Location</label>
            <div class="search-input-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="currentPage = 1"
                placeholder="Search injured person, rank, vessel..." 
                class="custom-input" />
            </div>
          </div>

          <div class="filter-item">
            <label class="filter-label">Severity Classification</label>
            <select [(ngModel)]="classFilter" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Classifications</option>
              <option value="First Aid Case (FAC)">First Aid Case (FAC)</option>
              <option value="Medical Treatment Case (MTC)">Medical Treatment Case (MTC)</option>
              <option value="Restricted Work Case (RWC)">Restricted Work Case (RWC)</option>
              <option value="Lost Time Injury (LTI)">Lost Time Injury (LTI)</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Return to Work Status</label>
            <select [(ngModel)]="rtwFilter" (ngModelChange)="currentPage = 1" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Full Duty Resumed">Full Duty Resumed</option>
              <option value="Restricted Duty">Restricted Duty</option>
              <option value="Pending Clearance">Pending Clearance</option>
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
                  Injury Ref
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th class="sortable-th" [class.sorted]="sortCol === 'injuredPersonName'" (click)="toggleSort('injuredPersonName')">
                  Injured Crew & Rank
                  <mat-icon class="sort-icon">{{ getSortIcon('injuredPersonName') }}</mat-icon>
                </th>
                <th class="sortable-th" [class.sorted]="sortCol === 'vesselName'" (click)="toggleSort('vesselName')">
                  Vessel / Location
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th>Classification</th>
                <th>Affected Body Part & Type</th>
                <th>Days Lost / Restricted</th>
                <th>Return to Work Status</th>
                <th>Status</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody *ngIf="paginatedInjuries().length > 0">
              <tr *ngFor="let inj of paginatedInjuries()" class="clickable-row" (click)="viewDetail(inj)">
                <td class="mono-ref"><strong>{{ inj.referenceNo }}</strong></td>
                <td>
                  <span class="font-bold text-sm block">{{ inj.injuredPersonName }}</span>
                  <span class="text-xs text-muted">{{ inj.rank }}</span>
                </td>
                <td>
                  <span class="vessel-title">{{ inj.vesselName }}</span>
                  <span class="text-xs text-muted block">{{ inj.location }}</span>
                </td>
                <td>
                  <span class="class-tag" [ngClass]="getClassTag(inj.severityClassification)">
                    {{ inj.severityClassification }}
                  </span>
                </td>
                <td>
                  <div class="body-info">
                    <span class="part-badge">{{ inj.affectedBodyPart }}</span>
                    <span class="text-xs text-muted block">{{ inj.injuryType }}</span>
                  </div>
                </td>
                <td>
                  <div class="days-pill">
                    <span>Lost: <strong>{{ inj.daysLost }}</strong> d</span>
                    <span>Restricted: <strong>{{ inj.restrictedDays }}</strong> d</span>
                  </div>
                </td>
                <td>
                  <span class="rtw-badge" [ngClass]="inj.returnToWorkStatus === 'Full Duty Resumed' ? 'rtw-full' : 'rtw-restricted'">
                    {{ inj.returnToWorkStatus }}
                  </span>
                </td>
                <td><app-status-badge [status]="inj.status"></app-status-badge></td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button mat-icon-button color="primary" (click)="viewDetail(inj)" matTooltip="View Medical Clearance">
                    <mat-icon>medical_services</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty state fallback -->
        <div *ngIf="filteredInjuries().length === 0" class="p-4">
          <app-empty-state
            icon="search_off"
            title="No Injury Cases Found"
            description="No medical cases match your current filters."
            actionLabel="Reset Search"
            (actionClick)="resetFilters()">
          </app-empty-state>
        </div>

        <!-- Pagination Controls -->
        <div class="table-pagination-bar" *ngIf="filteredInjuries().length > 0">
          <div class="pagination-meta">
            Showing <strong>{{ startIndex + 1 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ filteredInjuries().length }}</strong> cases
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

    <!-- Log Injury Modal -->
    <app-modal
      [isOpen]="showCreateModal"
      title="Log Occupational Injury / Medical Case"
      subtitle="Register seafarer injury, first aid treatment, or return-to-work clearance"
      icon="personal_injury"
      iconColor="#dc2626"
      (close)="showCreateModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="newVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>

        <div class="form-grid-2 mb-3">
          <div class="form-field-group">
            <label class="field-label">Injured Seafarer Name <span class="text-red">*</span></label>
            <input type="text" [(ngModel)]="newName" placeholder="Full name" class="custom-input" />
          </div>
          <div class="form-field-group">
            <label class="field-label">Rank / Position <span class="text-red">*</span></label>
            <input type="text" [(ngModel)]="newRank" placeholder="e.g. AB Seaman, 2nd Engineer" class="custom-input" />
          </div>
        </div>

        <div class="form-grid-2 mb-3">
          <div class="form-field-group">
            <label class="field-label">Classification <span class="text-red">*</span></label>
            <select [(ngModel)]="newClassification" class="custom-select">
              <option value="First Aid Case (FAC)">First Aid Case (FAC)</option>
              <option value="Medical Treatment Case (MTC)">Medical Treatment Case (MTC)</option>
              <option value="Restricted Work Case (RWC)">Restricted Work Case (RWC)</option>
              <option value="Lost Time Injury (LTI)">Lost Time Injury (LTI)</option>
            </select>
          </div>
          <div class="form-field-group">
            <label class="field-label">Affected Body Part</label>
            <select [(ngModel)]="newBodyPart" class="custom-select">
              <option value="Hand / Fingers">Hand / Fingers</option>
              <option value="Back / Spine">Back / Spine</option>
              <option value="Eye / Face">Eye / Face</option>
              <option value="Foot / Ankle">Foot / Ankle</option>
              <option value="Head">Head</option>
              <option value="Shoulder / Arm">Shoulder / Arm</option>
            </select>
          </div>
        </div>

        <div class="form-field-group mb-3">
          <label class="field-label">Onboard Location & Activity</label>
          <input type="text" [(ngModel)]="newLocation" placeholder="e.g. Forecastle Deck during Mooring" class="custom-input" />
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showCreateModal = false">Cancel</button>
        <button mat-flat-button color="warn" (click)="submitNewInjury()">Record Injury Report</button>
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
    .injury-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .kpi-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .kpi-lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .kpi-num { font-size: 20px; font-weight: 800; color: var(--foreground); }
    .kpi-sub { font-size: 11px; color: var(--muted-foreground); }
    .text-green { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .text-blue { color: var(--primary); }
    .text-red { color: var(--destructive); }
    .vessel-title { font-weight: 700; color: var(--foreground); }
    .class-tag { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-sm); }
    .class-lti { background: oklch(0.95 0.04 25); color: var(--destructive); border: 1px solid oklch(0.88 0.08 25); }
    .class-mtc { background: oklch(0.95 0.04 60); color: oklch(0.45 0.14 50); }
    .class-fac { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .part-badge { font-size: 11.5px; font-weight: 600; background: var(--muted); padding: 2px 6px; border-radius: 4px; color: var(--foreground); }
    .days-pill { display: flex; flex-direction: column; font-size: 12px; }
    .rtw-badge { font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: var(--radius-sm); }
    .rtw-full { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .rtw-restricted { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); border: 1px solid oklch(0.88 0.06 78); }
    .clickable-row { cursor: pointer; transition: background 0.15s ease; }
    .clickable-row:hover { background: var(--accent); }
    .text-right { text-align: right; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .p-4 { padding: 24px; }
    .page-indicator { font-size: 12.5px; color: #64748b; font-weight: 600; padding: 0 8px; }
  `]
})
export class InjuryListComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  searchQuery: string = '';
  classFilter: string = 'ALL';
  rtwFilter: string = 'ALL';

  sortCol: string = 'dateTime';
  sortAsc: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  showCreateModal: boolean = false;
  newVesselId: string = 'VES-01';
  newName: string = '';
  newRank: string = 'Ordinary Seaman (OS)';
  newClassification: any = 'First Aid Case (FAC)';
  newBodyPart: any = 'Hand / Fingers';
  newLocation: string = 'Forward Mooring Deck';

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

  readonly filteredInjuries = computed(() => {
    const list = this.state.injuries();
    const vFilter = this.state.selectedVesselFilter();
    const q = this.searchQuery.toLowerCase().trim();

    let res = list.filter(inj => {
      const matchVessel = vFilter === 'ALL' || inj.vesselId === vFilter;
      const matchClass = this.classFilter === 'ALL' || inj.severityClassification === this.classFilter;
      const matchRtw = this.rtwFilter === 'ALL' || inj.returnToWorkStatus === this.rtwFilter;
      const matchQ = !q || 
        inj.referenceNo.toLowerCase().includes(q) ||
        inj.injuredPersonName.toLowerCase().includes(q) ||
        inj.rank.toLowerCase().includes(q) ||
        inj.vesselName.toLowerCase().includes(q);

      return matchVessel && matchClass && matchRtw && matchQ;
    });

    const key = this.sortCol as keyof InjuryRecord;
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
    return Math.max(1, Math.ceil(this.filteredInjuries().length / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredInjuries().length);
  }

  readonly paginatedInjuries = computed(() => {
    return this.filteredInjuries().slice(this.startIndex, this.endIndex);
  });

  getClassTag(cls: string): string {
    if (cls.includes('LTI')) return 'class-lti';
    if (cls.includes('MTC')) return 'class-mtc';
    return 'class-fac';
  }

  resetFilters() {
    this.searchQuery = '';
    this.classFilter = 'ALL';
    this.rtwFilter = 'ALL';
    this.currentPage = 1;
  }

  exportRegister() {
    this.notify.showSuccess('Injury Register Export', `Exported ${this.filteredInjuries().length} medical and first-aid records to statutory return pack.`);
  }

  viewDetail(inj: InjuryRecord) {
    this.notify.showInfo(`Injury Dossier: ${inj.referenceNo}`, `${inj.injuredPersonName} (${inj.rank}) &bull; Status: ${inj.returnToWorkStatus}`);
  }

  submitNewInjury() {
    if (!this.newName.trim()) {
      this.notify.showWarning('Name Required', 'Please enter the name of the injured seafarer.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newVesselId);
    const newRecord = this.state.addInjury({
      vesselId: this.newVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      injuredPersonName: this.newName,
      rank: this.newRank,
      severityClassification: this.newClassification,
      location: this.newLocation
    });

    this.showCreateModal = false;
    this.newName = '';
    this.notify.showSuccess('Medical Case Logged', `Case ${newRecord.referenceNo} registered for medical clearance.`);
  }
}
