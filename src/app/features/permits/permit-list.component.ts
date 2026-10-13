import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchFilterComponent } from '../../shared/components/search-filter/search-filter.component';
import { PermitStore } from '../../core/stores/permit.store';
import { PermitToWorkRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-permit-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    SearchFilterComponent
  ],
  template: `
    <div class="module-container">
      <!-- Standard Page Header -->
      <app-page-header
        title="Permit to Work (PTW) Register"
        subtitle="Manage safety authorizations, Confined Space gas testing, LOTO isolation, and SIMOPS coordination"
        icon="vpn_key"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Permit to Work'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportRegister()">
            <mat-icon>file_download</mat-icon> Export Active PTWs
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/permits/create">
            <mat-icon>add</mat-icon> Request New Permit
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards (Compact High Density Pattern matching Near Miss & Inspection Trackers) -->
      <div class="kpi-grid">
        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'ALL'"
          (click)="setStatusFilter('ALL')">
          <div class="kpi-icon-wrap kpi-icon-total">
            <mat-icon>assignment</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Permits Log</div>
            <div class="kpi-value text-primary">{{ permitStore.totalCount() }}</div>
            <div class="kpi-sub">Fleet register archive</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'Active'"
          (click)="setStatusFilter('Active')">
          <div class="kpi-icon-wrap kpi-icon-open">
            <mat-icon>play_circle</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Live Active Permits</div>
            <div class="kpi-value text-amber">{{ permitStore.activeCount() }}</div>
            <div class="kpi-sub">Work currently active</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'Approved'"
          (click)="setStatusFilter('Approved')">
          <div class="kpi-icon-wrap kpi-icon-closed">
            <mat-icon>verified</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Approved (Ready)</div>
            <div class="kpi-value text-green">{{ permitStore.approvedCount() }}</div>
            <div class="kpi-sub">Pre-work authorized</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'Requested'"
          (click)="setStatusFilter('Requested')">
          <div class="kpi-icon-wrap kpi-icon-review">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Pending Review</div>
            <div class="kpi-value text-blue">{{ permitStore.requestedCount() }}</div>
            <div class="kpi-sub">Area & Master queue</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'Suspended'"
          (click)="setStatusFilter('Suspended')">
          <div class="kpi-icon-wrap kpi-icon-suspended">
            <mat-icon>pause_circle_filled</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Suspended Permits</div>
            <div class="kpi-value text-red">{{ permitStore.suspendedCount() }}</div>
            <div class="kpi-sub">Halted for safety</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'Closed'"
          (click)="setStatusFilter('Closed')">
          <div class="kpi-icon-wrap kpi-icon-closed">
            <mat-icon>task_alt</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Closed & Restored</div>
            <div class="kpi-value text-slate">{{ permitStore.closedCount() }}</div>
            <div class="kpi-sub">Housekeeping verified</div>
          </div>
        </div>
      </div>

      <!-- Unified Reusable Search & Filter Bar (Matching Inspection & Near Miss Trackers) -->
      <app-search-filter
        searchLabel="Search Register"
        placeholder="Search Permit ID, Worksite, Description, Authority, Risk Assessment..."
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
          <label class="filter-label">Permit Type</label>
          <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Permit Types</option>
            @for (cat of ptwCategories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Status</label>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active (Live)</option>
            <option value="Approved">Approved (Ready)</option>
            <option value="Requested">Pending Review</option>
            <option value="Suspended">Suspended</option>
            <option value="Extended">Extended</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed & Restored</option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Controls / Gates</label>
          <select [ngModel]="controlsFilter()" (ngModelChange)="controlsFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Controls</option>
            <option value="GAS">Gas Testing Required</option>
            <option value="LOTO">Energy Isolation (LOTO)</option>
            <option value="SIMOPS">SIMOPS Active</option>
            <option value="TBT">Toolbox Talk Confirmed</option>
          </select>
        </div>
      </app-search-filter>

      <!-- Main Register Table (Following the Exact Pattern of Other Modules) -->
      <div class="hseq-card table-card">
        <div class="table-card-header">
          <div class="header-info">
            <h2 class="table-card-title">Permit to Work Register</h2>
            <span class="table-card-count">
              Showing {{ paginatedPermits().length }} of {{ filteredPermits().length }} records
              @if (searchQuery()) {
                <span class="search-indicator">matching "{{ searchQuery() }}"</span>
              }
            </span>
          </div>
          <div class="header-actions">
            <span class="excel-tag">
              <mat-icon class="excel-icon">grid_on</mat-icon> Safety Authorizations Register
            </span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="hseq-table xl-table">
            <thead>
              <tr>
                <th class="col-ref sortable-th" (click)="toggleSort('referenceNo')">
                  Permit ID
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th class="col-type sortable-th" (click)="toggleSort('permitType')">
                  Permit Type
                  <mat-icon class="sort-icon">{{ getSortIcon('permitType') }}</mat-icon>
                </th>
                <th class="col-vessel sortable-th" (click)="toggleSort('vesselName')">
                  Vessel Name
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th class="col-location">Worksite Location</th>
                <th class="col-desc">Work Scope & Description</th>
                <th class="col-auth">Designated Authorities</th>
                <th class="col-window sortable-th" (click)="toggleSort('startDateTime')">
                  Validity Window
                  <mat-icon class="sort-icon">{{ getSortIcon('startDateTime') }}</mat-icon>
                </th>
                <th class="col-status sortable-th" (click)="toggleSort('status')">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                </th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            @if (paginatedPermits().length > 0) {
              <tbody>
                @for (p of paginatedPermits(); track p.id) {
                  <tr class="data-row">
                    <!-- Permit ID -->
                    <td class="col-ref">
                      <a class="permit-id-link" [routerLink]="['/permits', p.id]">
                        <mat-icon class="key-icon">vpn_key</mat-icon>
                        <span class="font-mono">{{ p.referenceNo }}</span>
                      </a>
                    </td>

                    <!-- Permit Type -->
                    <td class="col-type">
                      <span class="ptw-type-pill" [ngClass]="getPermitTypeClass(p.permitType)">
                        {{ p.permitType }}
                      </span>
                    </td>

                    <!-- Vessel Name (Using identical vessel-badge from other modules) -->
                    <td class="col-vessel">
                      <div class="vessel-badge">
                        <mat-icon class="vessel-icon">directions_boat</mat-icon>
                        <span class="vessel-text">{{ p.vesselName }}</span>
                      </div>
                    </td>

                    <!-- Worksite Location -->
                    <td class="col-location">
                      <span class="location-text" [title]="p.locationOfWork || p.worksiteLocation">{{ p.locationOfWork || p.worksiteLocation }}</span>
                      @if (p.areaFieldLocation) {
                        <span class="sub-location font-xs text-muted d-block" [title]="p.areaFieldLocation">{{ p.areaFieldLocation }}</span>
                      }
                    </td>

                    <!-- Work Description -->
                    <td class="col-desc">
                      <div class="desc-cell-wrapper">
                        <p class="desc-main-text" [title]="p.workDescription">
                          {{ p.workDescription }}
                        </p>
                      </div>
                    </td>

                    <!-- Designated Authorities -->
                    <td class="col-auth">
                      <div class="auth-stack">
                        <span class="auth-row"><span class="auth-label">Perf:</span> {{ p.performingAuthority }}</span>
                        @if (p.responsiblePersonInAttendance) {
                          <span class="auth-row"><span class="auth-label">Attn:</span> {{ p.responsiblePersonInAttendance }}</span>
                        } @else {
                          <span class="auth-row"><span class="auth-label">Area:</span> {{ p.areaAuthority }}</span>
                        }
                        <span class="auth-row"><span class="auth-label">Appr:</span> {{ p.approvingAuthority }}</span>
                      </div>
                    </td>

                    <!-- Validity Window -->
                    <td class="col-window">
                      <div class="window-stack">
                        <span class="window-start font-mono">{{ p.startDateTime }}</span>
                        <span class="window-end text-muted text-xs">to {{ p.expiryDateTime }} ({{ p.validityHours }}h)</span>
                      </div>
                    </td>

                    <!-- Status Badge -->
                    <td class="col-status">
                      <app-status-badge [status]="p.status"></app-status-badge>
                    </td>

                    <!-- Actions (Matching Near Miss and Inspection Trackers) -->
                    <td class="col-actions">
                      <div class="actions-group">
                        <a 
                          class="btn-view-details" 
                          [routerLink]="['/permits', p.id]"
                          title="View Full Details">
                          <mat-icon class="btn-icon">visibility</mat-icon>
                          <span>View</span>
                        </a>
                        <a 
                          class="btn-edit-action" 
                          [routerLink]="['/permits/edit', p.id]" 
                          title="Edit Permit">
                          <mat-icon class="btn-icon">edit</mat-icon>
                        </a>
                        <button 
                          type="button" 
                          class="btn-delete-action" 
                          (click)="deletePermit(p, $event)"
                          title="Delete Permit">
                          <mat-icon class="btn-icon">delete_outline</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            }
          </table>
        </div>

        @if (filteredPermits().length === 0) {
          <div class="p-5">
            <app-empty-state
              icon="search_off"
              title="No Matching Permits to Work"
              description="No permit records match your current filter settings or search query."
              actionLabel="Clear Filters"
              (actionClick)="resetFilters()">
            </app-empty-state>
          </div>
        }

        <!-- Pagination Bar (Identical to other modules) -->
        @if (filteredPermits().length > 0) {
          <div class="table-pagination-bar">
            <div class="pagination-meta">
              Showing <strong>{{ startIndex() + 1 }}</strong> to <strong>{{ endIndex() }}</strong> of <strong>{{ filteredPermits().length }}</strong> Permits
            </div>

            <div class="pagination-controls">
              <button 
                class="page-btn" 
                [disabled]="currentPage() === 1" 
                (click)="prevPage()"
                title="Previous Page">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="page-indicator">Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button 
                class="page-btn" 
                [disabled]="currentPage() >= totalPages()" 
                (click)="nextPage()"
                title="Next Page">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-sans); display: block; }
    .module-container {
      padding: 14px 20px;
      max-width: 1750px;
      margin: 0 auto;
    }

    .d-flex { display: flex; } .gap-2 { gap: 8px; }

    .btn-export {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-family: inherit !important;
      font-size: 12px !important;
    }

    .btn-primary-action {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      font-family: inherit !important;
      font-size: 12px !important;
    }

    /* KPI Grid - Compact High Density Matching Near Miss & Inspection Trackers */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: var(--shadow-2xs);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }

    .kpi-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
      border-color: var(--primary);
    }

    .kpi-card-selected {
      border: 2px solid var(--primary) !important;
      background: var(--accent) !important;
    }

    .kpi-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon-wrap mat-icon {
      font-size: 19px;
      width: 19px;
      height: 19px;
    }

    .kpi-icon-total {
      background: oklch(0.92 0.03 240);
      color: oklch(0.40 0.12 250);
    }

    .kpi-icon-open {
      background: oklch(0.95 0.08 70);
      color: oklch(0.55 0.18 65);
    }

    .kpi-icon-closed {
      background: oklch(0.92 0.07 145);
      color: oklch(0.45 0.15 145);
    }

    .kpi-icon-review {
      background: oklch(0.93 0.05 40);
      color: var(--primary);
    }

    .kpi-icon-suspended {
      background: #fee2e2;
      color: #dc2626;
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--foreground);
      line-height: 1.1;
      margin: 1px 0 0;
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .text-amber { color: oklch(0.55 0.18 65) !important; }
    .text-green { color: oklch(0.45 0.15 145) !important; }
    .text-blue { color: #2563eb !important; }
    .text-red { color: #dc2626 !important; }
    .text-slate { color: #64748b !important; }
    .text-primary { color: var(--primary) !important; }

    /* Filter Items projected into <app-search-filter> */
    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
      flex: 1 1 140px;
    }

    .filter-label {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1;
    }

    /* Table Card - Enterprise Standard Pattern */
    .table-card {
      padding: 0;
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-2xs);
    }

    .table-card-header {
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      background-color: var(--card);
    }

    .table-card-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .table-card-count {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .search-indicator {
      color: var(--primary);
      font-weight: 600;
      margin-left: 4px;
    }

    .excel-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: oklch(0.40 0.12 145);
      background: oklch(0.94 0.05 145);
      padding: 3px 8px;
      border-radius: 9999px;
      border: 1px solid oklch(0.85 0.08 145);
    }

    .excel-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .table-responsive {
      overflow-x: auto;
      width: 100%;
      -webkit-overflow-scrolling: touch;
    }

    .xl-table {
      width: 100%;
      min-width: 980px;
      border-collapse: collapse;
    }

    .xl-table th {
      background: var(--muted);
      color: var(--muted-foreground);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }

    .sortable-th {
      cursor: pointer;
      user-select: none;
    }

    .sortable-th:hover {
      color: var(--primary);
      background-color: var(--accent);
    }

    .sort-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      vertical-align: middle;
      margin-left: 2px;
    }

    .data-row {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.15s ease;
    }

    .data-row:hover {
      background-color: var(--accent);
    }

    .xl-table td {
      padding: 8px 12px;
      font-size: 12.5px;
      color: var(--foreground);
      vertical-align: middle;
    }

    /* Column Widths & Balanced Proportions (No Horizontal Scroll on Standard Screens) */
    .col-ref { width: 125px; min-width: 120px; white-space: nowrap; }
    .col-type { width: 130px; min-width: 120px; white-space: nowrap; }
    .col-vessel { width: 160px; min-width: 145px; }
    .col-location { width: 160px; min-width: 145px; }
    .col-desc { min-width: 220px; }
    .col-auth { width: 175px; min-width: 160px; }
    .col-window { width: 155px; min-width: 145px; white-space: nowrap; }
    .col-status { width: 105px; min-width: 100px; text-align: center; }
    .col-actions { 
      width: 155px; 
      min-width: 150px; 
      text-align: right; 
      padding-right: 14px !important;
    }

    .permit-id-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }
    .permit-id-link:hover { text-decoration: underline; }
    .key-icon { font-size: 14px; width: 14px; height: 14px; color: var(--primary); }

    .ptw-type-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      display: inline-block;
      white-space: nowrap;
    }
    .type-hot { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .type-confined { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .type-elec { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .type-aloft { background: #faf5ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    .type-overboard { background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; }
    .type-cold { background: var(--muted); color: var(--foreground); border: 1px solid var(--border); }

    /* Vessel Badge matching Near Miss & Inspection Trackers */
    .vessel-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--muted);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    .vessel-icon { font-size: 14px; width: 14px; height: 14px; color: var(--primary); }
    .vessel-text { font-weight: 700; color: var(--foreground); font-size: 12px; }

    .location-text { font-size: 12px; color: var(--foreground); line-height: 1.35; }

    .desc-cell-wrapper { display: flex; flex-direction: column; }
    .desc-main-text {
      margin: 0;
      line-height: 1.35;
      color: var(--foreground);
      font-size: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .auth-stack { display: flex; flex-direction: column; gap: 1px; line-height: 1.3; }
    .auth-row { font-size: 11.5px; color: var(--foreground); }
    .auth-label { color: var(--muted-foreground); font-weight: 700; font-size: 10.5px; margin-right: 2px; }

    .window-stack { display: flex; flex-direction: column; gap: 1px; line-height: 1.3; }
    .window-start { font-size: 11.5px; font-weight: 700; color: var(--foreground); }
    .window-end { font-size: 11px; color: var(--muted-foreground); }

    /* Actions Group matching other trackers */
    .actions-group {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .btn-view-details {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: var(--card);
      border: 1px solid var(--border);
      color: var(--foreground);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .btn-view-details:hover {
      border-color: var(--primary);
      background-color: var(--accent);
      color: var(--primary);
    }
    .btn-view-details .btn-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--primary);
    }

    .btn-edit-action, .btn-delete-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--muted-foreground);
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn-edit-action:hover { border-color: var(--primary); color: var(--primary); background: var(--accent); }
    .btn-delete-action:hover { border-color: #ef4444; background: #fef2f2; color: #dc2626; }
    .btn-edit-action mat-icon, .btn-delete-action mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Pagination */
    .table-pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-top: 1px solid var(--border);
      background: var(--card);
    }
    .pagination-meta { font-size: 12px; color: var(--muted-foreground); }
    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--foreground);
    }
    .page-btn:hover:not(:disabled) { background: var(--accent); border-color: var(--primary); color: var(--primary); }
    .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .page-indicator { font-size: 12px; font-weight: 600; color: var(--foreground); }

    .font-mono { font-family: monospace !important; }
    .p-5 { padding: 40px; }
  `]
})
export class PermitListComponent {
  public state = inject(HseqStateService);
  public permitStore = inject(PermitStore);
  private notify = inject(NotificationService);

  readonly searchQuery = signal<string>('');
  readonly categoryFilter = signal<string>('ALL');
  readonly vesselFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');
  readonly controlsFilter = signal<string>('ALL');

  readonly sortCol = signal<keyof PermitToWorkRecord>('startDateTime');
  readonly sortAsc = signal<boolean>(false);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  readonly ptwCategories = computed(() => {
    const cats = this.state.categories()
      .filter(c => c.scope === 'Permit to Work')
      .map(c => c.name);
    return cats.length > 0
      ? cats
      : ['Hot Work', 'Cold Work', 'Confined Space Entry', 'Electrical Work', 'Working Aloft', 'Working Overboard'];
  });

  // Dynamic vessels list from Master Data + any vessels referenced on permits
  readonly availableVessels = computed(() => {
    const list = this.state.vessels().map(v => v.name);
    const permitVessels = this.permitStore.records().map(p => p.vesselName);
    return Array.from(new Set([...list, ...permitVessels])).filter(Boolean).sort();
  });

  readonly isFiltered = computed(() => {
    return (
      !!this.searchQuery().trim() ||
      this.categoryFilter() !== 'ALL' ||
      this.vesselFilter() !== 'ALL' ||
      this.statusFilter() !== 'ALL' ||
      this.controlsFilter() !== 'ALL'
    );
  });

  setStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.currentPage.set(1);
  }

  getPermitTypeClass(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('hot')) return 'type-hot';
    if (t.includes('confined')) return 'type-confined';
    if (t.includes('elec')) return 'type-elec';
    if (t.includes('aloft')) return 'type-aloft';
    if (t.includes('overboard')) return 'type-overboard';
    return 'type-cold';
  }

  toggleSort(col: keyof PermitToWorkRecord) {
    if (this.sortCol() === col) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(col: keyof PermitToWorkRecord): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortAsc() ? 'arrow_upward' : 'arrow_downward';
  }

  readonly filteredPermits = computed(() => {
    const list = this.permitStore.records();
    const vFilter = this.vesselFilter();
    const catFilter = this.categoryFilter();
    const stFilter = this.statusFilter();
    const ctrlFilter = this.controlsFilter();
    const q = this.searchQuery().toLowerCase().trim();

    let res = list.filter(p => {
      const matchVessel = vFilter === 'ALL' || p.vesselName === vFilter || p.vesselId === vFilter;
      const matchCat = catFilter === 'ALL' || p.permitType.toLowerCase().includes(catFilter.toLowerCase());
      const matchStatus = stFilter === 'ALL' || p.status === stFilter;
      const matchControls =
        ctrlFilter === 'ALL' ||
        (ctrlFilter === 'GAS' && p.gasTestingRequired) ||
        (ctrlFilter === 'LOTO' && p.isolationLotoRequired) ||
        (ctrlFilter === 'SIMOPS' && p.simopsRequired) ||
        (ctrlFilter === 'TBT' && p.toolboxTalkCompleted);
      const matchQ =
        !q ||
        p.referenceNo.toLowerCase().includes(q) ||
        p.workDescription.toLowerCase().includes(q) ||
        p.worksiteLocation.toLowerCase().includes(q) ||
        (p.locationOfWork && p.locationOfWork.toLowerCase().includes(q)) ||
        (p.areaFieldLocation && p.areaFieldLocation.toLowerCase().includes(q)) ||
        (p.responsiblePersonInAttendance && p.responsiblePersonInAttendance.toLowerCase().includes(q)) ||
        p.vesselName.toLowerCase().includes(q) ||
        p.performingAuthority.toLowerCase().includes(q) ||
        p.areaAuthority.toLowerCase().includes(q) ||
        (p.linkedRaNumber && p.linkedRaNumber.toLowerCase().includes(q));

      return matchVessel && matchCat && matchStatus && matchControls && matchQ;
    });

    const col = this.sortCol();
    const dir = this.sortAsc() ? 1 : -1;
    res.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;
      return valA > valB ? dir : -dir;
    });

    return res;
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredPermits().length / this.pageSize()));
  });

  readonly startIndex = computed(() => {
    return (this.currentPage() - 1) * this.pageSize();
  });

  readonly endIndex = computed(() => {
    return Math.min(this.startIndex() + this.pageSize(), this.filteredPermits().length);
  });

  readonly paginatedPermits = computed(() => {
    return this.filteredPermits().slice(this.startIndex(), this.endIndex());
  });

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  resetFilters() {
    this.searchQuery.set('');
    this.categoryFilter.set('ALL');
    this.vesselFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.controlsFilter.set('ALL');
    this.currentPage.set(1);
  }

  deletePermit(p: PermitToWorkRecord, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete Permit ${p.referenceNo} (${p.permitType})?`)) {
      this.permitStore.deletePermit(p.id);
      this.notify.showSuccess('Permit Removed', `Permit ${p.referenceNo} deleted successfully.`);
    }
  }

  exportRegister() {
    const count = this.filteredPermits().length;
    this.notify.showSuccess(
      'Export Initiated',
      `Exported ${count} permit records to Fleet Safety Daily Log.`
    );
  }
}
