import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SafeCardRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-safe-card-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Safe Cards & Safety Observations"
        subtitle="Capture proactive hazard hunts, safe behaviors, stop work authority (SWA), and positive recognition"
        icon="assignment_turned_in"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Safe Cards'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="exportObservations()" class="btn-export">
            <mat-icon>file_download</mat-icon> Export Log
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/safe-cards/create">
            <mat-icon>add</mat-icon> Submit Safety Observation
          </button>
        </div>
      </app-page-header>

      <!-- Observation Category Interactive Cards -->
      <div class="obs-summary-grid mb-4">
        <div class="obs-card card-safe" [class.active-card]="selectedType === 'Safe Act'" (click)="setTypeFilter('Safe Act')">
          <div class="obs-header">
            <span class="obs-label">Safe Acts & Positive</span>
            <mat-icon class="obs-icon text-green">thumb_up</mat-icon>
          </div>
          <span class="obs-val">{{ getCount('Safe Act') }}</span>
        </div>

        <div class="obs-card card-unsafe" [class.active-card]="selectedType === 'Unsafe Condition'" (click)="setTypeFilter('Unsafe Condition')">
          <div class="obs-header">
            <span class="obs-label">Unsafe Conditions</span>
            <mat-icon class="obs-icon text-amber">warning_amber</mat-icon>
          </div>
          <span class="obs-val">{{ getCount('Unsafe Condition') }}</span>
        </div>

        <div class="obs-card card-swa" [class.active-card]="selectedType === 'Stop Work Authority (SWA)'" (click)="setTypeFilter('Stop Work Authority (SWA)')">
          <div class="obs-header">
            <span class="obs-label">Stop Work Authority (SWA)</span>
            <mat-icon class="obs-icon text-red">pan_tool</mat-icon>
          </div>
          <span class="obs-val">{{ getCount('Stop Work Authority (SWA)') }}</span>
        </div>

        <div class="obs-card card-all" [class.active-card]="selectedType === 'ALL'" (click)="setTypeFilter('ALL')">
          <div class="obs-header">
            <span class="obs-label">Total Observations</span>
            <mat-icon class="obs-icon text-blue">view_list</mat-icon>
          </div>
          <span class="obs-val">{{ state.safeCards().length }}</span>
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
              placeholder="Search by observation ref, reporter, description, location..." 
              class="custom-input" />
          </div>

          <div class="filter-controls">
            <select [(ngModel)]="categoryFilter" class="custom-select">
              <option value="ALL">All Categories</option>
              <option value="PPE Use">PPE Use & Compliance</option>
              <option value="Housekeeping">Housekeeping & Clear Walkways</option>
              <option value="Electrical Safety">Electrical Safety</option>
              <option value="Working Aloft">Working Aloft</option>
              <option value="Tools & Machinery">Tools & Machinery</option>
            </select>

            <button *ngIf="searchQuery || selectedType !== 'ALL' || categoryFilter !== 'ALL'" 
                    mat-stroked-button (click)="resetFilters()" class="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Main Register Table -->
      <div class="hseq-card">
        <div class="table-responsive" *ngIf="paginatedCards().length > 0">
          <table class="hseq-table">
            <thead>
              <tr>
                <th (click)="toggleSort('referenceNo')" class="sortable-th">
                  Observation Ref
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th>Type</th>
                <th>Vessel / Location</th>
                <th>Category</th>
                <th>Description & Immediate Action</th>
                <th>Reporter</th>
                <th>Recognition</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sc of paginatedCards()">
                <td class="mono-ref"><strong>{{ sc.referenceNo }}</strong></td>
                <td>
                  <span class="type-tag" [ngClass]="getTypeTagClass(sc.type)">
                    {{ sc.type }}
                  </span>
                </td>
                <td>
                  <span class="vessel-title">{{ sc.vesselName }}</span>
                  <span class="text-xs text-muted block">{{ sc.location }}</span>
                </td>
                <td><span class="cat-pill">{{ sc.category }}</span></td>
                <td class="obs-desc-cell">
                  <div class="obs-text">{{ sc.description }}</div>
                  <div class="action-note">
                    <strong>Action:</strong> {{ sc.immediateActionTaken }}
                  </div>
                </td>
                <td>
                  <span *ngIf="!sc.isAnonymous" class="font-bold text-xs">{{ sc.reporterName }}</span>
                  <span *ngIf="sc.isAnonymous" class="anon-tag">Anonymous</span>
                  <span class="text-xs text-muted block">{{ sc.dateTime }}</span>
                </td>
                <td>
                  <div *ngIf="sc.positiveRecognitionFlag" class="recognition-badge" [title]="sc.recognitionNote || ''">
                    <mat-icon class="star-icon">star</mat-icon> Recognized
                  </div>
                  <span *ngIf="!sc.positiveRecognitionFlag" class="text-muted text-xs">-</span>
                </td>
                <td><app-status-badge [status]="sc.status"></app-status-badge></td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ getEndIndex() }} of {{ filteredCards().length }} observations</span>
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
          *ngIf="paginatedCards().length === 0"
          icon="assignment_turned_in"
          title="No Safety Observations Found"
          message="No safe card observations match the current filter. Help build a proactive safety culture by submitting an observation."
          actionText="Submit Observation"
          [actionLink]="'/safe-cards/create'">
        </app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .btn-export { height: 40px !important; border-color: #cbd5e1 !important; color: #334155 !important; font-weight: 600 !important; }
    .obs-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .obs-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .obs-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .obs-card.active-card { border-color: var(--primary); background: var(--accent); }
    .obs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .obs-label { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .obs-val { font-size: 24px; font-weight: 800; color: var(--foreground); }
    .obs-icon { font-size: 24px; width: 24px; height: 24px; }
    .text-green { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .text-red { color: var(--destructive); }
    .text-blue { color: var(--primary); }
    .vessel-title { font-weight: 700; color: var(--foreground); }
    .type-tag { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: var(--radius-sm); white-space: nowrap; }
    .tag-safe { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .tag-unsafe { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); border: 1px solid oklch(0.88 0.06 78); }
    .tag-swa { background: oklch(0.95 0.04 25); color: var(--destructive); border: 1px solid oklch(0.88 0.08 25); }
    .tag-default { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .cat-pill { font-size: 11px; font-weight: 600; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155; }
    .obs-desc-cell { max-width: 320px; }
    .obs-text { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    .action-note { font-size: 11.5px; color: #475569; background: #f8fafc; padding: 4px 8px; border-radius: 4px; }
    .anon-tag { font-size: 11px; font-weight: 700; background: #f1f5f9; color: #64748b; padding: 2px 6px; border-radius: 4px; }
    .recognition-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .star-icon { font-size: 14px; width: 14px; height: 14px; color: #f59e0b; }
    .filter-card { padding: 14px 20px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
    .search-input-wrap { position: relative; flex: 1; min-width: 280px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: #94a3b8; }
    .search-input-wrap .custom-input { padding-left: 38px; }
    .filter-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .btn-reset { height: 38px !important; color: #64748b !important; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sort-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-left: 4px; color: #94a3b8; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class SafeCardListComponent {
  searchQuery: string = '';
  selectedType: string = 'ALL';
  categoryFilter: string = 'ALL';

  sortColumn: keyof SafeCardRecord = 'referenceNo';
  sortDirection: 'asc' | 'desc' = 'desc';

  currentPage: number = 1;
  pageSize: number = 6;

  constructor(
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  filteredCards = computed(() => {
    const list = this.state.safeCards();
    const vFilter = this.state.selectedVesselFilter();

    const filtered = list.filter(sc => {
      const matchVessel = vFilter === 'ALL' || sc.vesselId === vFilter;
      const matchType = this.selectedType === 'ALL' || sc.type === this.selectedType;
      const matchCat = this.categoryFilter === 'ALL' || sc.category === this.categoryFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        sc.referenceNo.toLowerCase().includes(q) ||
        sc.description.toLowerCase().includes(q) ||
        sc.reporterName.toLowerCase().includes(q) ||
        sc.vesselName.toLowerCase().includes(q);

      return matchVessel && matchType && matchCat && matchSearch;
    });

    return filtered.sort((a, b) => {
      const valA = (a[this.sortColumn] || '').toString();
      const valB = (b[this.sortColumn] || '').toString();
      return this.sortDirection === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  });

  paginatedCards = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCards().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredCards().length / this.pageSize) || 1);

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCards().length);
  }

  getCount(type: string): number {
    return this.state.safeCards().filter(sc => sc.type === type).length;
  }

  getTypeTagClass(type: string): string {
    if (type.includes('Safe') || type.includes('Positive')) return 'tag-safe';
    if (type.includes('Unsafe')) return 'tag-unsafe';
    if (type.includes('Stop Work') || type.includes('SWA')) return 'tag-swa';
    return 'tag-default';
  }

  setTypeFilter(type: string) {
    this.selectedType = type;
    this.currentPage = 1;
  }

  toggleSort(col: keyof SafeCardRecord) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof SafeCardRecord): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedType = 'ALL';
    this.categoryFilter = 'ALL';
    this.currentPage = 1;
  }

  exportObservations() {
    this.notify.showInfo('Export Complete', 'Safe Card & Proactive Observations log exported to Excel.');
  }
}
