import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CertificateRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-certificate-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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
        title="Statutory & Class Certificate Register"
        subtitle="Manage flag state, classification society, ISM, and crew mandatory certifications with 90/60/30-day renewal warnings"
        icon="verified"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Certificates'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="simulateReport()" class="btn-export">
            <mat-icon>file_download</mat-icon> Expiry Schedule
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="openAddCertModal()">
            <mat-icon>add</mat-icon> Add Certificate
          </button>
        </div>
      </app-page-header>

      <!-- Status Summary Metric Cards -->
      <div class="cert-stats-grid mb-4">
        <div class="cstat-card">
          <span class="cstat-lbl">Fleet Validity Compliance</span>
          <span class="cstat-val text-green">{{ state.dashboardKpis().certificatesValidPercentage }}%</span>
          <span class="cstat-sub">Across all active vessels</span>
        </div>
        <div class="cstat-card">
          <span class="cstat-lbl">Expiring Within 45 Days</span>
          <span class="cstat-val text-amber">{{ state.dashboardKpis().certificatesExpiring30Days }} Certs</span>
          <span class="cstat-sub">Renewal surveys booked</span>
        </div>
        <div class="cstat-card">
          <span class="cstat-lbl">Expired / Overdue Survey</span>
          <span class="cstat-val text-red">{{ state.dashboardKpis().certificatesExpired }} Cert</span>
          <span class="cstat-sub">Immediate class intervention</span>
        </div>
        <div class="cstat-card">
          <span class="cstat-lbl">Total Monitored Certs</span>
          <span class="cstat-val text-blue">{{ state.certificates().length }}</span>
          <span class="cstat-sub">Flag, Class & Crew</span>
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
              placeholder="Search by certificate name, number, society (e.g. DNV, BV), or vessel..." 
              class="custom-input" />
          </div>

          <div class="filter-controls">
            <select [(ngModel)]="countdownFilter" class="custom-select">
              <option value="ALL">All Expiry Windows</option>
              <option value="EXPIRED">Expired / Overdue</option>
              <option value="DUE">Expiring &le; 45 Days</option>
              <option value="VALID">Valid (&gt; 45 Days)</option>
            </select>

            <select [(ngModel)]="categoryFilter" class="custom-select">
              <option value="ALL">All Categories</option>
              <option value="Class Statutory">Class Statutory</option>
              <option value="Safety Management">Safety Management</option>
              <option value="Environmental">Environmental</option>
              <option value="Crew STCW">Crew STCW</option>
            </select>

            <button *ngIf="searchQuery || countdownFilter !== 'ALL' || categoryFilter !== 'ALL'" 
                    mat-stroked-button (click)="resetFilters()" class="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Certificate Table -->
      <div class="hseq-card">
        <div class="table-responsive" *ngIf="paginatedCerts().length > 0">
          <table class="hseq-table">
            <thead>
              <tr>
                <th (click)="toggleSort('certificateName')" class="sortable-th">
                  Certificate Name
                  <mat-icon class="sort-icon">{{ getSortIcon('certificateName') }}</mat-icon>
                </th>
                <th>Vessel / Dept</th>
                <th>Authority / Society</th>
                <th>Certificate Number</th>
                <th>Issue Date</th>
                <th (click)="toggleSort('expiryDate')" class="sortable-th">
                  Expiry Date
                  <mat-icon class="sort-icon">{{ getSortIcon('expiryDate') }}</mat-icon>
                </th>
                <th (click)="toggleSort('daysToExpiry')" class="sortable-th">
                  Countdown
                  <mat-icon class="sort-icon">{{ getSortIcon('daysToExpiry') }}</mat-icon>
                </th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cert of paginatedCerts()">
                <td>
                  <strong class="text-sm block">{{ cert.certificateName }}</strong>
                  <span class="cert-cat-pill">{{ cert.category }}</span>
                </td>
                <td>
                  <span class="vessel-title">{{ cert.vesselName }}</span>
                  <span class="text-xs text-muted block">{{ cert.responsibleDepartment }}</span>
                </td>
                <td>
                  <span class="authority-badge">{{ cert.issuingAuthority }}</span>
                </td>
                <td class="font-mono text-xs font-semibold">{{ cert.certificateNumber }}</td>
                <td>{{ cert.issueDate }}</td>
                <td class="font-semibold">{{ cert.expiryDate }}</td>
                <td>
                  <span class="countdown-badge" [ngClass]="getCountdownClass(cert.daysToExpiry)">
                    {{ cert.daysToExpiry > 0 ? cert.daysToExpiry + ' days remaining' : 'EXPIRED' }}
                  </span>
                </td>
                <td><app-status-badge [status]="cert.status"></app-status-badge></td>
                <td class="text-right">
                  <button mat-icon-button color="primary" (click)="viewDoc(cert)" matTooltip="Download Stamped PDF">
                    <mat-icon>download</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ getEndIndex() }} of {{ filteredCerts().length }} certificates</span>
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
          *ngIf="paginatedCerts().length === 0"
          icon="verified"
          title="No Certificates Found"
          message="No certificates match the selected filters or search query. Adjust the filters above or upload a new certificate."
          actionText="Add Certificate"
          (action)="openAddCertModal()">
        </app-empty-state>
      </div>
    </div>

    <!-- Add Certificate Modal -->
    <app-modal
      [isOpen]="isAddModalOpen"
      title="Register Statutory / Class Certificate"
      subtitle="Track vessel or crew certification with automated survey renewal reminders"
      icon="verified"
      maxWidth="680px"
      (close)="isAddModalOpen = false">
      <div class="modal-form">
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Certificate Name *</label>
            <input type="text" [(ngModel)]="newCert.certificateName" placeholder="e.g. Safety Management Certificate (SMC)" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Category *</label>
            <select [(ngModel)]="newCert.category" class="custom-select">
              <option value="Class Statutory">Class Statutory</option>
              <option value="Safety Management">Safety Management (ISM/ISPS)</option>
              <option value="Environmental">Environmental (MARPOL)</option>
              <option value="Crew STCW">Crew STCW</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Vessel Asset *</label>
            <select [(ngModel)]="newCert.vesselId" class="custom-select">
              <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }}</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Department</label>
            <select [(ngModel)]="newCert.department" class="custom-select">
              <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Issuing Authority / Society *</label>
            <input type="text" [(ngModel)]="newCert.issuingAuthority" placeholder="e.g. DNV, Lloyd's Register, Flag Administration" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Certificate Number *</label>
            <input type="text" [(ngModel)]="newCert.certificateNumber" placeholder="e.g. CERT-2025-9981" class="custom-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Issue Date</label>
            <input type="date" [(ngModel)]="newCert.issueDate" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Expiry Date *</label>
            <input type="date" [(ngModel)]="newCert.expiryDate" class="custom-input" />
          </div>
        </div>
      </div>

      <div modal-actions>
        <button mat-stroked-button (click)="isAddModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveCert()">
          <mat-icon>check</mat-icon> Save Certificate
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .cstat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow-sm); }
    .cstat-lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .cstat-val { font-size: 24px; font-weight: 800; color: var(--foreground); }
    .cstat-sub { font-size: 11.5px; color: var(--muted-foreground); }
    .text-green { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .text-red { color: var(--destructive); }
    .text-blue { color: var(--primary); }
    .vessel-title { font-weight: 700; color: var(--foreground); }
    .cert-cat-pill { font-size: 10.5px; font-weight: 600; background: var(--accent); color: var(--primary); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; border: 1px solid var(--border); }
    .authority-badge { font-size: 11.5px; font-weight: 700; background: var(--muted); border: 1px solid var(--border); padding: 3px 8px; border-radius: 6px; color: var(--foreground); }
    .countdown-badge { font-size: 11.5px; font-weight: 700; padding: 3px 8px; border-radius: 4px; display: inline-block; }
    .cd-valid { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .cd-due { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); border: 1px solid oklch(0.88 0.06 78); }
    .cd-expired { background: oklch(0.95 0.04 25); color: var(--destructive); border: 1px solid oklch(0.88 0.08 25); }
    .text-right { text-align: right; }
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
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class CertificateListComponent {
  searchQuery: string = '';
  countdownFilter: string = 'ALL';
  categoryFilter: string = 'ALL';

  sortColumn: keyof CertificateRecord = 'daysToExpiry';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage: number = 1;
  pageSize: number = 6;

  isAddModalOpen: boolean = false;

  newCert = {
    certificateName: '',
    category: 'Class Statutory',
    vesselId: 'VES-01',
    department: 'Deck Department',
    issuingAuthority: 'DNV',
    certificateNumber: '',
    issueDate: new Date().toISOString().substring(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  };

  constructor(
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  filteredCerts = computed(() => {
    const list = this.state.certificates();
    const vFilter = this.state.selectedVesselFilter();

    const filtered = list.filter(c => {
      const matchVessel = vFilter === 'ALL' || c.vesselId === vFilter;
      const matchCat = this.categoryFilter === 'ALL' || c.category === this.categoryFilter;
      
      let matchCd = true;
      if (this.countdownFilter === 'EXPIRED') matchCd = c.daysToExpiry <= 0;
      else if (this.countdownFilter === 'DUE') matchCd = c.daysToExpiry > 0 && c.daysToExpiry <= 45;
      else if (this.countdownFilter === 'VALID') matchCd = c.daysToExpiry > 45;

      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        c.certificateName.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q) ||
        c.issuingAuthority.toLowerCase().includes(q) ||
        c.vesselName.toLowerCase().includes(q);

      return matchVessel && matchCat && matchCd && matchSearch;
    });

    return filtered.sort((a, b) => {
      const valA = a[this.sortColumn] ?? '';
      const valB = b[this.sortColumn] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return this.sortDirection === 'asc' 
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });
  });

  paginatedCerts = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCerts().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredCerts().length / this.pageSize) || 1);

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCerts().length);
  }

  toggleSort(col: keyof CertificateRecord) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof CertificateRecord): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery = '';
    this.countdownFilter = 'ALL';
    this.categoryFilter = 'ALL';
    this.currentPage = 1;
  }

  getCountdownClass(days: number): string {
    if (days <= 0) return 'cd-expired';
    if (days <= 45) return 'cd-due';
    return 'cd-valid';
  }

  viewDoc(cert: CertificateRecord) {
    this.notify.showSuccess('Document Downloaded', `Verified stamped copy: ${cert.attachmentFileName || cert.certificateName + '.pdf'}`);
  }

  simulateReport() {
    this.notify.showInfo('Report Generated', '90-day statutory renewal forecast schedule exported to PDF.');
  }

  openAddCertModal() {
    this.isAddModalOpen = true;
  }

  saveCert() {
    if (!this.newCert.certificateName || !this.newCert.certificateNumber) {
      this.notify.showError('Required Fields', 'Please fill in Certificate Name and Number.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.newCert.vesselId);
    const expDate = new Date(this.newCert.expiryDate);
    const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const newRecord: CertificateRecord = {
      id: `cert-${Date.now()}`,
      vesselId: this.newCert.vesselId,
      vesselName: vessel ? vessel.name : 'MV Pacific Voyager',
      responsibleDepartment: this.newCert.department,
      category: this.newCert.category as any,
      certificateName: this.newCert.certificateName,
      issuingAuthority: this.newCert.issuingAuthority as any,
      certificateNumber: this.newCert.certificateNumber,
      issueDate: this.newCert.issueDate,
      expiryDate: this.newCert.expiryDate,
      renewalDueDate: this.newCert.expiryDate,
      renewalHistory: [],
      daysToExpiry: diffDays,
      status: diffDays > 0 ? (diffDays <= 45 ? 'Due Soon' : 'Valid') : 'Expired',
      attachmentFileName: `${this.newCert.certificateNumber.replace(/\s+/g, '_')}_Stamped.pdf`
    };

    this.state.certificates.update(curr => [newRecord, ...curr]);
    this.isAddModalOpen = false;
    this.notify.showSuccess('Certificate Registered', `${newRecord.certificateName} added to statutory register.`);
    this.newCert.certificateName = '';
    this.newCert.certificateNumber = '';
  }
}
