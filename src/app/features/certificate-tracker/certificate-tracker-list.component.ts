import { Component, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchFilterComponent } from '../../shared/components/search-filter/search-filter.component';
import { NotificationService } from '../../core/services/notification.service';
import { CertificateStore } from '../../core/stores/certificate.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

export interface CertificateItem {
  id: string;
  code: string;
  description: string;
  category: 'Statutory' | 'Operational';
  frequency: string;
  vesselName: string;
  issueDate: string;
  window: string;
  expiryDate: string;
  remainingDays: number;
  status: 'Valid' | 'In Window' | 'Expiring Soon' | 'Expired';
  dateLastReceived: string;
  remarks?: string;
  issuingAuthority?: string;
  certificateType?: string;
  lastEndorsementDate?: string;
}

export type CertificateRecord = CertificateItem;

@Component({
  selector: 'app-certificate-tracker-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, SearchFilterComponent],
  template: `
    <div class="module-container">
      <app-page-header
        title="Consolidated Certificate Tracker"
        subtitle="Fleet Statutory & Operational Certificates — Renewal Windows, Expiry Tracking & Verification"
        icon="verified"
        [breadcrumbs]="[{label: 'Overview', link: '/certificate-tracker'}, {label: 'Certificate Tracker'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportCsv()">
            <mat-icon>file_download</mat-icon> Export CSV
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/certificate-tracker/create">
            <mat-icon>add</mat-icon> Add Certificate
          </button>
        </div>
      </app-page-header>

      <!-- KPI Overview Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.04 230 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.12 230)">verified_user</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Certificates</div>
            <div class="kpi-value">{{ kpis().total }}</div>
            <div class="kpi-sub">Managed portfolio</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.93 0.05 145 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.15 145)">check_circle</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Valid</div>
            <div class="kpi-value">{{ kpis().valid }}</div>
            <div class="kpi-sub">In good standing</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.94 0.06 75 / 0.5)">
            <mat-icon style="color: oklch(0.50 0.15 75)">schedule</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">In Window / Due Soon</div>
            <div class="kpi-value">{{ kpis().inWindow }}</div>
            <div class="kpi-sub">Within renewal window</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.06 25 / 0.5)">
            <mat-icon style="color: oklch(0.52 0.18 25)">warning</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Expired / Action</div>
            <div class="kpi-value">{{ kpis().expired }}</div>
            <div class="kpi-sub">Requires endorsement</div>
          </div>
        </div>
      </div>

      <!-- Unified Reusable Search & Filter Bar -->
      <app-search-filter
        searchLabel="Search Certificates"
        placeholder="Search code, certificate description, vessel, remarks..."
        [searchQuery]="searchQuery()"
        (searchQueryChange)="searchQuery.set($event); currentPage.set(1)"
        [isFiltered]="isFiltered()"
        (reset)="resetFilters()">

        <div class="filter-item">
          <label class="filter-label">Category</label>
          <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Categories</option>
            <option value="Operational">Operational</option>
            <option value="Statutory">Statutory</option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Vessel</label>
          <select [ngModel]="vesselFilter()" (ngModelChange)="vesselFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Vessels</option>
            @for (v of availableVessels(); track v) {
              <option [value]="v">{{ v }}</option>
            }
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Status</label>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Statuses</option>
            <option value="Valid">Valid</option>
            <option value="In Window">In Window</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </app-search-filter>

      <!-- Main Register Table Matching Near Miss -->
      <div class="hseq-card table-card">
        <div class="table-card-header">
          <div class="header-info">
            <h2 class="table-card-title">Fleet Certificates Register</h2>
            <span class="table-card-count">
              Showing {{ paginatedCerts().length }} of {{ filteredCerts().length }} certificates
              @if (searchQuery()) {
                <span class="search-indicator">matching "{{ searchQuery() }}"</span>
              }
            </span>
          </div>
          <div class="header-actions">
            <span class="excel-tag">
              <mat-icon class="excel-icon">grid_on</mat-icon> Excel Synchronized
            </span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="hseq-table xl-table">
            <thead>
              <tr>
                <th class="col-code sortable-th" (click)="toggleSort('code')">
                  Code
                  <mat-icon class="sort-icon">{{ getSortIcon('code') }}</mat-icon>
                </th>
                <th class="col-desc sortable-th" (click)="toggleSort('description')">
                  Certificate Description
                  <mat-icon class="sort-icon">{{ getSortIcon('description') }}</mat-icon>
                </th>
                <th class="col-cat sortable-th" (click)="toggleSort('category')">
                  Category
                  <mat-icon class="sort-icon">{{ getSortIcon('category') }}</mat-icon>
                </th>
                <th class="col-vessel sortable-th" (click)="toggleSort('vesselName')">
                  Vessel Name
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th class="col-date sortable-th" (click)="toggleSort('issueDate')">
                  Issue Date
                  <mat-icon class="sort-icon">{{ getSortIcon('issueDate') }}</mat-icon>
                </th>
                <th class="col-window">Renewal Window</th>
                <th class="col-date sortable-th" (click)="toggleSort('expiryDate')">
                  Expiry Date
                  <mat-icon class="sort-icon">{{ getSortIcon('expiryDate') }}</mat-icon>
                </th>
                <th class="col-days sortable-th" (click)="toggleSort('remainingDays')">
                  Days Left
                  <mat-icon class="sort-icon">{{ getSortIcon('remainingDays') }}</mat-icon>
                </th>
                <th class="col-status sortable-th" (click)="toggleSort('status')">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                </th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            @if (paginatedCerts().length > 0) {
              <tbody>
                @for (cert of paginatedCerts(); track cert.id) {
                  <tr class="data-row">
                    <!-- Code -->
                    <td class="col-code">
                      <span class="cert-code-chip">{{ cert.code }}</span>
                    </td>

                    <!-- Description -->
                    <td class="col-desc">
                      <div class="cert-desc-text" [title]="cert.description">
                        {{ cert.description }}
                      </div>
                    </td>

                    <!-- Category -->
                    <td class="col-cat">
                      <span class="cat-pill" [class.cat-statutory]="cert.category === 'Statutory'">
                        {{ cert.category }}
                      </span>
                    </td>

                    <!-- Vessel -->
                    <td class="col-vessel">
                      <div class="vessel-badge">
                        <mat-icon class="vessel-icon">directions_boat</mat-icon>
                        <span class="vessel-text">{{ cert.vesselName }}</span>
                      </div>
                    </td>

                    <!-- Issue Date -->
                    <td class="col-date">{{ cert.issueDate || '—' }}</td>

                    <!-- Window -->
                    <td class="col-window">
                      <span class="window-text" [title]="cert.window">{{ cert.window || '—' }}</span>
                    </td>

                    <!-- Expiry Date -->
                    <td class="col-date">
                      <span [class.text-danger]="cert.status === 'Expired'">{{ cert.expiryDate || 'Permanent' }}</span>
                    </td>

                    <!-- Days Remaining -->
                    <td class="col-days">
                      <span class="days-chip" [ngClass]="getDaysClass(cert.remainingDays, cert.status)">
                        {{ cert.expiryDate ? cert.remainingDays + ' d' : '∞' }}
                      </span>
                    </td>

                    <!-- Status -->
                    <td class="col-status">
                      <span class="status-pill" [ngClass]="getStatusClass(cert.status)">
                        <span class="status-dot"></span>
                        {{ cert.status }}
                      </span>
                    </td>

                    <!-- Actions Group Matching Near Miss -->
                    <td class="col-actions">
                      <div class="actions-group">
                        <a 
                          class="btn-view-details" 
                          [routerLink]="['/certificate-tracker', cert.id]"
                          title="View Full Details">
                          <mat-icon class="btn-icon">visibility</mat-icon>
                          <span>View Details</span>
                        </a>
                        <a 
                          class="btn-edit-action" 
                          [routerLink]="['/certificate-tracker/edit', cert.id]"
                          title="Edit Certificate">
                          <mat-icon class="btn-icon">edit</mat-icon>
                        </a>
                        <button 
                          type="button" 
                          class="btn-delete-action" 
                          (click)="deleteCertificate(cert.id, cert.code, $event)" 
                          title="Delete Certificate">
                          <mat-icon class="btn-icon">delete_outline</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            } @else {
              <tbody>
                <tr>
                  <td colspan="10">
                    <app-empty-state 
                      icon="verified" 
                      title="No Certificates Found" 
                      message="No certificates match your search and filter criteria.">
                    </app-empty-state>
                  </td>
                </tr>
              </tbody>
            }
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="pagination-footer">
            <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <div class="page-buttons">
              <button type="button" class="page-nav-btn" [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">
                <mat-icon>chevron_left</mat-icon> Previous
              </button>
              <button type="button" class="page-nav-btn" [disabled]="currentPage() === totalPages()" (click)="currentPage.set(currentPage() + 1)">
                Next <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .module-container { padding: 14px 20px; max-width: 1750px; margin: 0 auto; }
    .d-flex { display: flex; } .gap-2 { gap: 8px; }

    /* KPIs Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .kpi-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; gap: 10px; align-items: center; box-shadow: var(--shadow-2xs); }
    .kpi-icon-wrap { width: 36px; height: 36px; border-radius: var(--radius-sm); display: grid; place-items: center; flex-shrink: 0; }
    .kpi-icon-wrap mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .kpi-label { font-size: 11.5px; color: var(--muted-foreground); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-value { font-size: 21px; font-weight: 700; color: var(--foreground); line-height: 1.1; margin: 1px 0 0; }
    .kpi-sub { font-size: 11px; color: var(--muted-foreground); margin-top: 1px; }

    .btn-export { height: 34px !important; border-radius: var(--radius-sm) !important; font-family: inherit !important; font-size: 12px !important; }
    .btn-primary-action { height: 34px !important; border-radius: var(--radius-sm) !important; background: var(--primary) !important; color: var(--primary-foreground) !important; font-family: inherit !important; font-size: 12px !important; }

    /* Table Card */
    .hseq-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-2xs); }
    .table-card { overflow: hidden; }
    .table-card-header { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background-color: var(--card); }
    .table-card-title { font-size: 14.5px; font-weight: 700; color: var(--foreground); margin: 0; }
    .table-card-count { font-size: 12px; color: var(--muted-foreground); margin-left: 8px; }
    .search-indicator { color: var(--primary); font-weight: 600; margin-left: 4px; }
    .excel-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: oklch(0.40 0.12 145); background: oklch(0.94 0.05 145); padding: 3px 8px; border-radius: 9999px; border: 1px solid oklch(0.85 0.08 145); }
    .excel-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Table Grid */
    .table-responsive { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
    .xl-table { width: 100%; min-width: 1350px; border-collapse: collapse; }
    .xl-table th { background: var(--muted); color: var(--muted-foreground); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; text-align: left; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { color: var(--primary); background-color: var(--accent); }
    .sort-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-left: 2px; }
    .data-row { border-bottom: 1px solid var(--border); transition: background-color 0.15s ease; }
    .data-row:hover { background-color: var(--accent); }
    .xl-table td { padding: 7px 12px; font-size: 12.5px; color: var(--foreground); vertical-align: middle; }

    /* Cell Styles */
    .cert-code-chip { display: inline-block; font-family: monospace; font-size: 11.5px; font-weight: 700; background: var(--muted); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border); }
    .cert-desc-text { font-weight: 600; max-width: 320px; line-height: 1.3; font-size: 12px; }
    .cat-pill { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: oklch(0.92 0.05 240); color: oklch(0.40 0.12 240); }
    .cat-statutory { background: oklch(0.92 0.06 180); color: oklch(0.35 0.12 180); }
    .vessel-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--muted); padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .vessel-icon { font-size: 15px; width: 15px; height: 15px; color: var(--primary); }
    .vessel-text { font-weight: 700; font-size: 12px; }
    .window-text { font-size: 11.5px; color: var(--muted-foreground); max-width: 180px; }
    .text-danger { color: oklch(0.45 0.18 25); font-weight: 700; }

    .days-chip { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .days-ok { background: oklch(0.93 0.05 145); color: oklch(0.38 0.15 145); }
    .days-warn { background: oklch(0.95 0.08 70); color: oklch(0.48 0.18 65); }
    .days-exp { background: oklch(0.92 0.06 25); color: oklch(0.48 0.18 25); }

    /* Status Pills */
    .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-valid { background: oklch(0.93 0.06 145); color: oklch(0.38 0.15 145); border: 1px solid oklch(0.85 0.09 145); }
    .status-valid .status-dot { background: oklch(0.45 0.18 145); }
    .status-window { background: oklch(0.95 0.08 70); color: oklch(0.48 0.18 65); border: 1px solid oklch(0.88 0.10 70); }
    .status-window .status-dot { background: oklch(0.60 0.20 65); }
    .status-expired { background: oklch(0.93 0.06 25); color: oklch(0.42 0.18 25); border: 1px solid oklch(0.85 0.08 25); }
    .status-expired .status-dot { background: oklch(0.50 0.18 25); }

    /* Actions Group (Identical to Near Miss) */
    .col-actions { text-align: right; padding-right: 16px !important; min-width: 170px; }
    .actions-group { display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px; }
    .btn-view-details {
      display: inline-flex; align-items: center; gap: 4px;
      background-color: var(--card); border: 1px solid var(--border);
      color: var(--foreground); padding: 4px 10px; border-radius: var(--radius-sm);
      font-size: 11.5px; font-weight: 700; text-decoration: none; cursor: pointer;
      white-space: nowrap; transition: all 0.15s ease; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .btn-view-details:hover { border-color: var(--primary); background-color: var(--accent); color: var(--primary); }
    .btn-view-details .btn-icon { font-size: 15px; width: 15px; height: 15px; color: var(--primary); }
    .btn-edit-action {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: 1px solid var(--border);
      background-color: var(--card); border-radius: var(--radius-sm);
      color: var(--muted-foreground); text-decoration: none; cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-edit-action:hover { border-color: var(--primary); background-color: var(--accent); color: var(--primary); }
    .btn-edit-action .btn-icon { font-size: 15px; width: 15px; height: 15px; }

    .btn-delete-action {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: 1px solid var(--border);
      background-color: var(--card); border-radius: var(--radius-sm);
      color: var(--muted-foreground); cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-delete-action:hover { border-color: #ef4444; background-color: #fef2f2; color: #dc2626; }
    .btn-delete-action .btn-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Pagination */
    .pagination-footer { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); }
    .page-info { font-size: 12px; color: var(--muted-foreground); }
    .page-buttons { display: flex; gap: 6px; }
    .page-nav-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border: 1px solid var(--border); background: var(--card); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; color: var(--foreground); }
    .page-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class CertificateTrackerListComponent {
  private store = inject(CertificateStore);
  private notify = inject(NotificationService);

  readonly searchQuery = signal('');
  readonly categoryFilter = signal('ALL');
  readonly vesselFilter = signal('ALL');
  readonly statusFilter = signal('ALL');

  readonly sortCol = signal<keyof CertificateItem>('expiryDate');
  readonly sortAsc = signal<boolean>(true);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);

  public hseqState = inject(HseqStateService);

  readonly rawCerts = this.store.records;

  readonly availableVessels = computed(() => {
    return Array.from(new Set([...this.hseqState.vesselNames(), ...this.rawCerts().map(c => c.vesselName)])).filter(Boolean).sort();
  });

  readonly kpis = computed(() => {
    const all = this.rawCerts();
    return {
      total: all.length,
      valid: all.filter(c => c.status === 'Valid').length,
      inWindow: all.filter(c => c.status === 'In Window' || c.status === 'Expiring Soon').length,
      expired: all.filter(c => c.status === 'Expired').length,
    };
  });

  isFiltered(): boolean {
    return !!this.searchQuery().trim() || this.categoryFilter() !== 'ALL' || this.vesselFilter() !== 'ALL' || this.statusFilter() !== 'ALL';
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('ALL');
    this.vesselFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.currentPage.set(1);
  }

  toggleSort(col: keyof CertificateItem): void {
    if (this.sortCol() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(col: keyof CertificateItem): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortAsc() ? 'arrow_upward' : 'arrow_downward';
  }

  getStatusClass(status: string): string {
    if (status === 'Valid') return 'status-valid';
    if (status === 'Expired') return 'status-expired';
    return 'status-window';
  }

  getDaysClass(days: number, status: string): string {
    if (status === 'Expired' || days <= 0) return 'days-exp';
    if (days <= 45) return 'days-warn';
    return 'days-ok';
  }

  private parseDate(d?: string): number {
    if (!d || !d.trim()) return 0;
    const parts = d.trim().split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const mon = parts[1];
      let yr = parseInt(parts[2], 10);
      if (yr < 100) yr += 2000;
      const parsed = Date.parse(`${mon} ${day}, ${yr}`);
      if (!isNaN(parsed)) return parsed;
    }
    const standard = Date.parse(d);
    return isNaN(standard) ? 0 : standard;
  }

  readonly filteredCerts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cFilter = this.categoryFilter();
    const vFilter = this.vesselFilter();
    const sFilter = this.statusFilter();

    let res = this.rawCerts().filter(c => {
      const matchCat = cFilter === 'ALL' || c.category === cFilter;
      const matchVessel = vFilter === 'ALL' || c.vesselName === vFilter;
      const matchStatus = sFilter === 'ALL' || c.status === sFilter;

      let matchQuery = true;
      if (q) {
        const text = [c.code, c.description, c.vesselName, c.category, c.status, c.remarks].join(' ').toLowerCase();
        matchQuery = text.includes(q);
      }
      return matchCat && matchVessel && matchStatus && matchQuery;
    });

    const key = this.sortCol();
    const dir = this.sortAsc() ? 1 : -1;

    res.sort((a, b) => {
      if (key === 'expiryDate' || key === 'issueDate') {
        const tA = this.parseDate(a[key]);
        const tB = this.parseDate(b[key]);
        if (tA === tB) return 0;
        if (tA <= 0) return 1;
        if (tB <= 0) return -1;
        return (tA - tB) * dir;
      }
      if (key === 'remainingDays') {
        return (a.remainingDays - b.remainingDays) * dir;
      }
      const valA = (a[key] ?? '').toString().toLowerCase().trim();
      const valB = (b[key] ?? '').toString().toLowerCase().trim();
      if (valA === valB) return 0;
      return valA.localeCompare(valB) * dir;
    });

    return res;
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredCerts().length / this.pageSize()));
  });

  readonly paginatedCerts = computed(() => {
    const list = this.filteredCerts();
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  exportCsv(): void {
    const rows = this.filteredCerts().map(c =>
      `"${c.code}","${c.description}","${c.category}","${c.vesselName}","${c.issueDate}","${c.expiryDate}",${c.remainingDays},"${c.status}"`
    );
    const csv = ['Code,Description,Category,Vessel,Issue Date,Expiry Date,Days Left,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'consolidated-certificates.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  deleteCertificate(id: string, code: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete certificate ${code}?`)) {
      this.store.delete(id);
      this.notify.showSuccess('Certificate Deleted', `Certificate ${code} has been removed.`);
    }
  }
}
