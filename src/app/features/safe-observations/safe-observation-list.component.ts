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
import { ObservationStore, SafeObservationCard } from '../../core/stores/observation.store';
import { NotificationService } from '../../core/services/notification.service';
import { HseqStateService } from '../../core/services/hseq-state.service';

export type { SafeObservationCard };

@Component({
  selector: 'app-safe-observation-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, SearchFilterComponent],
  template: `
    <div class="module-container">
      <app-page-header
        title="Safe Observation Cards Tracker"
        subtitle="Fleet Safety Observation Cards — Unsafe Acts, Unsafe Conditions, Safe Acts & Safe Conditions"
        icon="assignment_turned_in"
        [breadcrumbs]="[{label: 'Overview', link: '/safe-observations'}, {label: 'Observation Cards'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportCsv()">
            <mat-icon>file_download</mat-icon> Export CSV
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/safe-observations/create">
            <mat-icon>add</mat-icon> New Observation
          </button>
        </div>
      </app-page-header>

      <!-- KPI Overview Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.04 230 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.12 230)">assignment_turned_in</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Cards</div>
            <div class="kpi-value">{{ kpis().total }}</div>
            <div class="kpi-sub">Reported cards</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.06 25 / 0.5)">
            <mat-icon style="color: oklch(0.52 0.18 25)">warning</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Unsafe Acts</div>
            <div class="kpi-value">{{ kpis().unsafeActs }}</div>
            <div class="kpi-sub">Behavior-based</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.94 0.06 75 / 0.5)">
            <mat-icon style="color: oklch(0.50 0.15 75)">report_problem</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Unsafe Conditions</div>
            <div class="kpi-value">{{ kpis().unsafeConditions }}</div>
            <div class="kpi-sub">Environmental hazards</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.05 145 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.15 145)">thumb_up</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Safe Acts</div>
            <div class="kpi-value">{{ kpis().safeActs }}</div>
            <div class="kpi-sub">Positive observations</div>
          </div>
        </div>
      </div>

      <!-- Unified Reusable Search & Filter Bar -->
      <app-search-filter
        searchLabel="Search Observations"
        placeholder="Search vessel, observation, description, category..."
        [searchQuery]="searchQuery()"
        (searchQueryChange)="searchQuery.set($event); currentPage.set(1)"
        [isFiltered]="isFiltered()"
        (reset)="resetFilters()">

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
          <label class="filter-label">Card Type</label>
          <select [ngModel]="cardTypeFilter()" (ngModelChange)="cardTypeFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Card Types</option>
            <option value="Unsafe Act">Unsafe Act</option>
            <option value="Unsafe Condition">Unsafe Condition</option>
            <option value="Safe Act">Safe Act</option>
            <option value="Safe Condition">Safe Condition</option>
          </select>
        </div>
      </app-search-filter>

      <!-- Main Register Table Matching Near Miss -->
      <div class="hseq-card table-card">
        <div class="table-card-header">
          <div class="header-info">
            <h2 class="table-card-title">Observation Cards Register</h2>
            <span class="table-card-count">
              Showing {{ paginatedCards().length }} of {{ filteredCards().length }} cards
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
                <th class="col-vessel sortable-th" (click)="toggleSort('vesselName')">
                  Vessel Name
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th class="col-date sortable-th" (click)="toggleSort('date')">
                  Date
                  <mat-icon class="sort-icon">{{ getSortIcon('date') }}</mat-icon>
                </th>
                <th class="col-time sortable-th" (click)="toggleSort('time')">
                  Time
                  <mat-icon class="sort-icon">{{ getSortIcon('time') }}</mat-icon>
                </th>
                <th class="col-card-type sortable-th" (click)="toggleSort('cardType')">
                  Card Type
                  <mat-icon class="sort-icon">{{ getSortIcon('cardType') }}</mat-icon>
                </th>
                <th class="col-hazard sortable-th" (click)="toggleSort('whatWasObserved')">
                  What Was Observed
                  <mat-icon class="sort-icon">{{ getSortIcon('whatWasObserved') }}</mat-icon>
                </th>
                <th class="col-desc">Detailed Description</th>
                <th class="col-stopped sortable-th text-center" (click)="toggleSort('stoppedWork')">
                  Work Stopped
                  <mat-icon class="sort-icon">{{ getSortIcon('stoppedWork') }}</mat-icon>
                </th>
                <th class="col-attitude sortable-th" (click)="toggleSort('attitudeOfPersons')">
                  Attitude
                  <mat-icon class="sort-icon">{{ getSortIcon('attitudeOfPersons') }}</mat-icon>
                </th>
                <th class="col-action-taken sortable-th" (click)="toggleSort('correctiveActionTaken')">
                  Action Taken
                  <mat-icon class="sort-icon">{{ getSortIcon('correctiveActionTaken') }}</mat-icon>
                </th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            @if (paginatedCards().length > 0) {
              <tbody>
                @for (card of paginatedCards(); track card.id) {
                  <tr class="data-row">
                    <!-- Vessel Name -->
                    <td class="col-vessel">
                      <div class="vessel-badge">
                        <mat-icon class="vessel-icon">directions_boat</mat-icon>
                        <span class="vessel-text">{{ card.vesselName }}</span>
                      </div>
                    </td>

                    <!-- Date -->
                    <td class="col-date">{{ card.date }}</td>

                    <!-- Time -->
                    <td class="col-time">{{ card.time }}</td>

                    <!-- Card Type -->
                    <td class="col-card-type">
                      <span class="card-type-badge" [class]="'ctype-' + card.cardType.toLowerCase().replace(' ', '-')">
                        {{ card.cardType }}
                      </span>
                    </td>

                    <!-- Observation Category -->
                    <td class="col-hazard">
                      <span class="hazard-text">{{ card.whatWasObserved || '—' }}</span>
                    </td>

                    <!-- Description -->
                    <td class="col-desc">
                      <div class="desc-cell-text" [title]="card.detailedDescription">
                        {{ card.detailedDescription }}
                      </div>
                    </td>

                    <!-- Work Stopped -->
                    <td class="col-stopped text-center">
                      <span class="yn-badge" [class]="'yn-' + (card.stoppedWork === 'Yes' ? 'yes' : card.stoppedWork === 'No' ? 'no' : 'na')">
                        {{ card.stoppedWork }}
                      </span>
                    </td>

                    <!-- Attitude -->
                    <td class="col-attitude">
                      <span class="attitude-badge" [class]="'att-' + (card.attitudeOfPersons === 'Receptive' ? 'receptive' : card.attitudeOfPersons === 'Dismissive' ? 'dismissive' : card.attitudeOfPersons === 'Aggressive' ? 'aggressive' : 'na')">
                        {{ card.attitudeOfPersons }}
                      </span>
                    </td>

                    <!-- Corrective Action Taken -->
                    <td class="col-action-taken">
                      <span class="yn-badge" [class]="'yn-' + (card.correctiveActionTaken === 'Yes' ? 'yes' : 'no')">
                        {{ card.correctiveActionTaken }}
                      </span>
                    </td>

                    <!-- Actions Group Matching Near Miss -->
                    <td class="col-actions">
                      <div class="actions-group">
                        <a 
                          class="btn-view-details" 
                          [routerLink]="['/safe-observations', card.id]"
                          title="View Full Details">
                          <mat-icon class="btn-icon">visibility</mat-icon>
                          <span>View Details</span>
                        </a>
                        <a 
                          class="btn-edit-action" 
                          [routerLink]="['/safe-observations/edit', card.id]"
                          title="Edit Observation">
                          <mat-icon class="btn-icon">edit</mat-icon>
                        </a>
                        <button 
                          type="button" 
                          class="btn-delete-action" 
                          (click)="deleteCard(card.id, card.whatWasObserved, $event)" 
                          title="Delete Observation">
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
                      icon="assignment_turned_in" 
                      title="No Observation Cards Found" 
                      message="No observation cards match your current search and filter criteria.">
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
    .xl-table { width: 100%; min-width: 1400px; border-collapse: collapse; }
    .xl-table th { background: var(--muted); color: var(--muted-foreground); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; text-align: left; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { color: var(--primary); background-color: var(--accent); }
    .sort-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-left: 2px; }
    .data-row { border-bottom: 1px solid var(--border); transition: background-color 0.15s ease; }
    .data-row:hover { background-color: var(--accent); }
    .xl-table td { padding: 7px 12px; font-size: 12.5px; color: var(--foreground); vertical-align: middle; }
    .text-center { text-align: center !important; }

    /* Cells & Badges */
    .vessel-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--muted); padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .vessel-icon { font-size: 15px; width: 15px; height: 15px; color: var(--primary); }
    .vessel-text { font-weight: 700; font-size: 12px; }
    .hazard-text { font-weight: 600; font-size: 12px; }
    .desc-cell-text { font-size: 12px; max-width: 320px; line-height: 1.3; }

    .card-type-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; white-space: nowrap; }
    .ctype-unsafe-act { background: oklch(0.93 0.06 25 / 0.5); color: oklch(0.42 0.18 25); }
    .ctype-unsafe-condition { background: oklch(0.94 0.06 75 / 0.5); color: oklch(0.42 0.15 75); }
    .ctype-safe-act { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }
    .ctype-safe-condition { background: oklch(0.9 0.04 200 / 0.5); color: oklch(0.35 0.10 200); }

    .yn-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; }
    .yn-yes { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }
    .yn-no { background: oklch(0.92 0.06 25 / 0.5); color: oklch(0.42 0.18 25); }
    .yn-na { background: var(--muted); color: var(--muted-foreground); }

    .attitude-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; }
    .att-receptive { background: oklch(0.9 0.05 145 / 0.4); color: oklch(0.35 0.12 145); }
    .att-dismissive { background: oklch(0.94 0.06 75 / 0.4); color: oklch(0.42 0.15 75); }
    .att-aggressive { background: oklch(0.92 0.07 25 / 0.4); color: oklch(0.42 0.18 25); }
    .att-na { background: var(--muted); color: var(--muted-foreground); }

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
    .btn-delete-action:hover { border-color: oklch(0.6 0.22 25); background-color: oklch(0.95 0.05 25 / 0.3); color: oklch(0.5 0.22 25); }
    .btn-delete-action .btn-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Pagination */
    .pagination-footer { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); }
    .page-info { font-size: 12px; color: var(--muted-foreground); }
    .page-buttons { display: flex; gap: 6px; }
    .page-nav-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border: 1px solid var(--border); background: var(--card); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; color: var(--foreground); }
    .page-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class SafeObservationListComponent {
  private readonly store = inject(ObservationStore);
  private readonly notifications = inject(NotificationService);

  readonly searchQuery = signal('');
  readonly vesselFilter = signal('ALL');
  readonly cardTypeFilter = signal('ALL');

  readonly sortCol = signal<keyof SafeObservationCard>('date');
  readonly sortAsc = signal<boolean>(false);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);

  public hseqState = inject(HseqStateService);

  readonly rawCards = this.store.records;

  readonly availableVessels = computed(() => {
    return Array.from(new Set([...this.hseqState.vesselNames(), ...this.rawCards().map(c => c.vesselName)])).filter(Boolean).sort();
  });

  readonly kpis = computed(() => {
    const all = this.rawCards();
    return {
      total: all.length,
      unsafeActs: all.filter(c => c.cardType === 'Unsafe Act').length,
      unsafeConditions: all.filter(c => c.cardType === 'Unsafe Condition').length,
      safeActs: all.filter(c => c.cardType === 'Safe Act').length,
    };
  });

  isFiltered(): boolean {
    return !!this.searchQuery().trim() || this.vesselFilter() !== 'ALL' || this.cardTypeFilter() !== 'ALL';
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.vesselFilter.set('ALL');
    this.cardTypeFilter.set('ALL');
    this.currentPage.set(1);
  }

  toggleSort(col: keyof SafeObservationCard): void {
    if (this.sortCol() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(col: keyof SafeObservationCard): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortAsc() ? 'arrow_upward' : 'arrow_downward';
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

  readonly filteredCards = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const vFilter = this.vesselFilter();
    const ctFilter = this.cardTypeFilter();

    let res = this.rawCards().filter(c => {
      const matchV = vFilter === 'ALL' || c.vesselName === vFilter;
      const matchCT = ctFilter === 'ALL' || c.cardType === ctFilter;

      let matchQuery = true;
      if (q) {
        const text = [
          c.vesselName, c.whatWasObserved, c.detailedDescription,
          c.department || '', c.hazardHuntCategory || '', c.actionsTaken
        ].join(' ').toLowerCase();
        matchQuery = text.includes(q);
      }

      return matchV && matchCT && matchQuery;
    });

    const key = this.sortCol();
    const dir = this.sortAsc() ? 1 : -1;

    res.sort((a, b) => {
      if (key === 'date') {
        const tA = this.parseDate(a[key]);
        const tB = this.parseDate(b[key]);
        if (tA === tB) return 0;
        if (tA <= 0) return 1;
        if (tB <= 0) return -1;
        return (tA - tB) * dir;
      }
      const valA = (a[key] ?? '').toString().toLowerCase().trim();
      const valB = (b[key] ?? '').toString().toLowerCase().trim();
      if (valA === valB) return 0;
      return valA.localeCompare(valB) * dir;
    });

    return res;
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredCards().length / this.pageSize()));
  });

  readonly paginatedCards = computed(() => {
    const list = this.filteredCards();
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  exportCsv(): void {
    const rows = this.filteredCards().map(c =>
      `"${c.vesselName}","${c.date}","${c.time}","${c.cardType}","${c.whatWasObserved}","${(c.detailedDescription || '').replace(/"/g, '""')}","${c.stoppedWork}","${c.attitudeOfPersons}","${c.correctiveActionTaken}"`
    );
    const csv = ['Vessel,Date,Time,Card Type,Observation,Description,Work Stopped,Attitude,Action Taken', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'safe-observations.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  deleteCard(id: string, label: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete observation "${label || id}"? This action cannot be undone.`)) {
      this.store.delete(id);
      this.notifications.showSuccess('Observation Deleted', 'Observation card was deleted successfully.');
    }
  }
}
