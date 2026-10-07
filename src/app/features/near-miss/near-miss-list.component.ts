import { Component, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchFilterComponent } from '../../shared/components/search-filter/search-filter.component';
import { NearMissRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-near-miss-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    SearchFilterComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Near Miss Tracker"
        subtitle="Maritime Fleet Hazard Prevention Log & Near Miss Register (Aramco MOMs Compliant)"
        icon="warning"
        [breadcrumbs]="[{label: 'Overview', link: '/near-miss'}, {label: 'Near Miss Tracker'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportToCsv()">
            <mat-icon>file_download</mat-icon> Export CSV
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/near-miss/create">
            <mat-icon>add</mat-icon> Report Near Miss
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-total">
            <mat-icon>assessment</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Near Misses</div>
            <div class="kpi-value">{{ totalCount() }}</div>
            <div class="kpi-sub">Fleet reports registered</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-open">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Open Near Misses</div>
            <div class="kpi-value text-amber">{{ openCount() }}</div>
            <div class="kpi-sub">Corrective actions pending</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-closed">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Closed Out</div>
            <div class="kpi-value text-green">{{ closedCount() }}</div>
            <div class="kpi-sub">Actions verified & signed off</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-icon-moms">
            <mat-icon>verified</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Aramco MOMs Submitted</div>
            <div class="kpi-value text-primary">{{ momsSubmittedCount() }}</div>
            <div class="kpi-sub">Compliant with Saudi Aramco</div>
          </div>
        </div>
      </div>

      <!-- Unified Reusable Search & Filter Bar -->
      <app-search-filter
        searchLabel="Search Register"
        placeholder="Search Vessel, Location, Status, Description, Reported By, Aramco MOMs..."
        [searchQuery]="searchQuery()"
        (searchQueryChange)="searchQuery.set($event); currentPage.set(1)"
        [isFiltered]="isFiltered()"
        (reset)="resetFilters()">

        <div class="filter-item">
          <label class="filter-label">Vessel</label>
          <select [ngModel]="vesselFilter()" (ngModelChange)="onVesselChange($event)" class="custom-select">
            <option value="ALL">All Vessels</option>
            @for (v of uniqueVessels(); track v) {
              <option [value]="v">{{ v }}</option>
            }
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Status</label>
          <select [ngModel]="statusFilter()" (ngModelChange)="onStatusChange($event)" class="custom-select">
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Aramco MOMs</label>
          <select [ngModel]="momsFilter()" (ngModelChange)="onMomsChange($event)" class="custom-select">
            <option value="ALL">All MOMs Status</option>
            <option value="SUBMITTED">Submitted Only</option>
            <option value="PENDING">Pending / None</option>
          </select>
        </div>
      </app-search-filter>

      <!-- Main Register Table Matching Excel Directly -->
      <div class="hseq-card table-card">
        <div class="table-card-header">
          <div class="header-info">
            <h2 class="table-card-title">Fleet Near Miss Register</h2>
            <span class="table-card-count">
              Showing {{ paginatedNearMisses().length }} of {{ filteredNearMisses().length }} records
              @if (searchQuery()) {
                <span class="search-indicator">matching "{{ searchQuery() }}"</span>
              }
            </span>
          </div>
          <div class="header-actions">
            <span class="excel-tag">
              <mat-icon class="excel-icon">grid_on</mat-icon> Excel Structure Synchronized
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
                <th class="col-location sortable-th" (click)="toggleSort('location')">
                  Location
                  <mat-icon class="sort-icon">{{ getSortIcon('location') }}</mat-icon>
                </th>
                <th class="col-desc">Near Miss Description</th>
                <th class="col-corrective">Corrective Action</th>
                <th class="col-reported sortable-th" (click)="toggleSort('reportedBy')">
                  Reported By
                  <mat-icon class="sort-icon">{{ getSortIcon('reportedBy') }}</mat-icon>
                </th>
                <th class="col-status sortable-th" (click)="toggleSort('status')">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                </th>
                <th class="col-closeout sortable-th" (click)="toggleSort('closeOutDate')">
                  Close Out Date
                  <mat-icon class="sort-icon">{{ getSortIcon('closeOutDate') }}</mat-icon>
                </th>
                <th class="col-moms">Aramco MOMs Submission</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            @if (paginatedNearMisses().length > 0) {
              <tbody>
                @for (nm of paginatedNearMisses(); track nm.id) {
                  <tr class="data-row">
                    <!-- Vessel Name -->
                    <td class="col-vessel">
                      <div class="vessel-badge">
                        <mat-icon class="vessel-icon">directions_boat</mat-icon>
                        <span class="vessel-text">{{ nm.vesselName }}</span>
                      </div>
                    </td>

                    <!-- Date -->
                    <td class="col-date">
                      <span class="date-badge">{{ nm.date }}</span>
                    </td>

                    <!-- Location -->
                    <td class="col-location">
                      <span class="location-text" [title]="nm.location">{{ nm.location || '-' }}</span>
                    </td>

                    <!-- Near Miss Description -->
                    <td class="col-desc">
                      <div class="desc-cell-wrapper">
                        <p class="desc-main-text" [class.expanded]="expandedRows()[nm.id]">
                          {{ nm.nearMissDescription }}
                        </p>
                        @if (nm.nearMissDescription && nm.nearMissDescription.length > 90) {
                          <button 
                            type="button" 
                            class="toggle-expand-btn" 
                            (click)="toggleRowExpand(nm.id, $event)">
                            {{ expandedRows()[nm.id] ? 'Show less' : 'Read more' }}
                          </button>
                        }
                      </div>
                    </td>

                    <!-- Corrective Action -->
                    <td class="col-corrective">
                      @if (nm.correctiveAction) {
                        <div class="corrective-cell">
                          <p class="action-text" [class.expanded]="expandedActionRows()[nm.id]">
                            {{ nm.correctiveAction }}
                          </p>
                          @if (nm.correctiveAction.length > 80) {
                            <button 
                              type="button" 
                              class="toggle-expand-btn" 
                              (click)="toggleActionExpand(nm.id, $event)">
                              {{ expandedActionRows()[nm.id] ? 'Show less' : 'Read more' }}
                            </button>
                          }
                        </div>
                      } @else {
                        <span class="text-muted fst-italic">Pending corrective action</span>
                      }
                    </td>

                    <!-- Reported By -->
                    <td class="col-reported">
                      @if (nm.reportedBy) {
                        <div class="reporter-box">
                          <mat-icon class="reporter-icon">person</mat-icon>
                          <span class="reporter-name">{{ nm.reportedBy }}</span>
                        </div>
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>

                    <!-- Status -->
                    <td class="col-status">
                      <span class="status-pill" [ngClass]="nm.status === 'Closed' ? 'status-closed' : 'status-open'">
                        <span class="status-dot"></span>
                        {{ nm.status }}
                      </span>
                    </td>

                    <!-- Close Out Date -->
                    <td class="col-closeout">
                      @if (nm.closeOutDate) {
                        <span class="closeout-text">{{ nm.closeOutDate }}</span>
                      } @else {
                        <span class="pending-pill">Pending Close</span>
                      }
                    </td>

                    <!-- Aramco MOMs Submission -->
                    <td class="col-moms">
                      @if (nm.aramcoMomsSubmission) {
                        <div class="moms-badge" (click)="copyMomsId(nm.aramcoMomsSubmission, $event)" matTooltip="Click to copy MOMs ID">
                          <mat-icon class="moms-check-icon">verified</mat-icon>
                          <span class="moms-id">{{ nm.aramcoMomsSubmission }}</span>
                          <mat-icon class="copy-hint-icon">content_copy</mat-icon>
                        </div>
                      } @else {
                        <span class="moms-empty">—</span>
                      }
                    </td>

                    <!-- Actions (Replaced Eye with Prominent View Details and Edit Buttons) -->
                    <td class="col-actions">
                      <div class="actions-group">
                        <a 
                          class="btn-view-details" 
                          [routerLink]="['/near-miss', nm.id]"
                          title="View Full Details">
                          <mat-icon class="btn-icon">visibility</mat-icon>
                          <span>View Details</span>
                        </a>
                        <a 
                          class="btn-edit-action" 
                          [routerLink]="['/near-miss/edit', nm.id]" 
                          title="Edit Record">
                          <mat-icon class="btn-icon">edit</mat-icon>
                        </a>
                        <button 
                          type="button"
                          class="btn-delete-action" 
                          (click)="deleteRecord(nm.id, nm.vesselName, $event)"
                          title="Delete Record">
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

        <!-- Empty state fallback -->
        @if (filteredNearMisses().length === 0) {
          <div class="p-5">
            <app-empty-state
              icon="search_off"
              title="No Matching Near Miss Records"
              description="No reports match your current filter settings or search query."
              actionLabel="Clear Filters"
              (actionClick)="resetFilters()">
            </app-empty-state>
          </div>
        }

        <!-- Pagination Bar -->
        @if (filteredNearMisses().length > 0) {
          <div class="table-pagination-bar">
            <div class="pagination-meta">
              Showing <strong>{{ startIndex() + 1 }}</strong> to <strong>{{ endIndex() }}</strong> of <strong>{{ filteredNearMisses().length }}</strong> Near Misses
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

    /* KPI Grid - Compact High Density */
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
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .kpi-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
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

    .kpi-icon-moms {
      background: oklch(0.93 0.05 40);
      color: var(--primary);
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .kpi-value {
      font-size: 21px;
      font-weight: 700;
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
    .text-primary { color: var(--primary) !important; }

    /* Filter Card */
    .filter-card {
      padding: 16px 20px;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 2.2fr 1fr 1fr 1fr auto;
      gap: 16px;
      align-items: end;
    }

    @media (max-width: 1024px) {
      .filter-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-label {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: var(--muted-foreground);
      font-size: 18px;
      width: 18px;
      height: 18px;
      pointer-events: none;
    }

    .search-field {
      padding-left: 38px !important;
      padding-right: 32px !important;
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      padding: 2px;
    }

    .clear-search-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .btn-reset {
      height: 42px !important;
      border-color: var(--border) !important;
      color: var(--foreground) !important;
    }

    /* Table Card */
    .table-card {
      padding: 0;
      overflow: hidden;
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
      font-size: 14.5px;
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
      min-width: 1380px;
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
      padding: 7px 12px;
      font-size: 12.5px;
      color: var(--foreground);
      vertical-align: middle;
    }

    /* Column Widths & Layouts */
    .col-vessel { width: 130px; }
    .col-date { width: 110px; white-space: nowrap; }
    .col-location { width: 160px; }
    .col-desc { width: 320px; }
    .col-corrective { width: 280px; }
    .col-reported { width: 160px; }
    .col-status { width: 100px; text-align: center; }
    .col-closeout { width: 120px; }
    .col-moms { width: 150px; }
    .col-actions { 
      width: 170px; 
      min-width: 170px; 
      text-align: right; 
      padding-right: 16px !important;
    }

    .vessel-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--muted);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }

    .vessel-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: var(--primary);
    }

    .vessel-text {
      font-weight: 700;
      color: var(--foreground);
      font-size: 12px;
    }

    .date-badge {
      font-weight: 600;
      color: var(--foreground);
      background: var(--muted);
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11.5px;
      display: inline-block;
    }

    .location-text {
      font-weight: 500;
      color: var(--foreground);
      display: inline-block;
      line-height: 1.35;
      font-size: 12px;
    }

    .desc-cell-wrapper, .corrective-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .desc-main-text, .action-text {
      margin: 0;
      line-height: 1.35;
      color: var(--foreground);
      font-size: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 300px;
    }

    .desc-main-text.expanded, .action-text.expanded {
      display: block;
      -webkit-line-clamp: unset;
      overflow: visible;
    }

    .toggle-expand-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
      text-align: left;
      align-self: flex-start;
    }

    .toggle-expand-btn:hover {
      text-decoration: underline;
    }

    .reporter-box {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--foreground);
    }

    .reporter-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: var(--muted-foreground);
    }

    /* Status Pills */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-closed {
      background: oklch(0.93 0.06 145);
      color: oklch(0.38 0.15 145);
      border: 1px solid oklch(0.85 0.09 145);
    }

    .status-closed .status-dot {
      background: oklch(0.45 0.18 145);
    }

    .status-open {
      background: oklch(0.95 0.08 70);
      color: oklch(0.48 0.18 65);
      border: 1px solid oklch(0.88 0.10 70);
    }

    .status-open .status-dot {
      background: oklch(0.60 0.20 65);
    }

    .closeout-text {
      font-weight: 600;
      color: oklch(0.35 0.12 145);
      font-size: 11.5px;
    }

    .pending-pill {
      font-size: 10.5px;
      font-weight: 600;
      color: var(--muted-foreground);
      background: var(--muted);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px dashed var(--border);
    }

    .moms-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: oklch(0.95 0.04 40);
      color: var(--primary);
      border: 1px solid var(--border);
      padding: 2px 7px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .moms-badge:hover {
      background: var(--accent);
    }

    .moms-check-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: var(--primary);
    }

    .moms-id {
      font-family: monospace;
      font-size: 11.5px;
      font-weight: 700;
    }

    .copy-hint-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
      opacity: 0.6;
    }

    .moms-empty {
      color: var(--muted-foreground);
      font-weight: 500;
      font-size: 12px;
    }

    /* Professional Action Buttons */
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
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: var(--primary);
    }

    .btn-edit-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--muted-foreground);
      border-radius: var(--radius-sm);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-edit-action:hover {
      border-color: var(--foreground);
      color: var(--foreground);
      background: var(--muted);
    }

    .btn-edit-action .btn-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .btn-delete-action {
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
      transition: all 0.15s ease;
    }

    .btn-delete-action:hover {
      border-color: #ef4444;
      background-color: #fef2f2;
      color: #dc2626;
    }

    .btn-delete-action .btn-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    /* Pagination */
    .table-pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      background: var(--card);
    }

    .pagination-meta {
      font-size: 12.5px;
      color: var(--muted-foreground);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .page-btn {
      width: 36px;
      height: 36px;
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--foreground);
      transition: all 0.15s ease;
      padding: 0;
    }

    .page-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    .page-btn:hover:not(:disabled) {
      background: var(--accent);
      border-color: var(--primary);
      color: var(--primary);
    }

    .page-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .page-indicator {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      padding: 0 8px;
    }

    .p-5 { padding: 40px; }
  `]
})
export class NearMissListComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  // Angular 22 Signals for Search & Filters
  readonly searchQuery = signal<string>('');
  readonly vesselFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');
  readonly momsFilter = signal<string>('ALL');

  // Signals for Sorting & Pagination
  readonly sortCol = signal<keyof NearMissRecord>('date');
  readonly sortAsc = signal<boolean>(false);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);

  // Expansion tracking using signals
  readonly expandedRows = signal<Record<string, boolean>>({});
  readonly expandedActionRows = signal<Record<string, boolean>>({});

  // Computed KPI values directly derived from nearMisses signal
  readonly totalCount = computed(() => this.state.nearMisses().length);
  readonly openCount = computed(() => this.state.nearMisses().filter(nm => nm.status === 'Open').length);
  readonly closedCount = computed(() => this.state.nearMisses().filter(nm => nm.status === 'Closed').length);
  readonly momsSubmittedCount = computed(() => this.state.nearMisses().filter(nm => !!nm.aramcoMomsSubmission?.trim()).length);

  readonly uniqueVessels = computed(() => {
    const list = [...this.state.vesselNames(), ...this.state.nearMisses().map(n => n.vesselName)];
    return Array.from(new Set(list)).filter(Boolean).sort();
  });

  // Filter actions updating signals
  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value || '';
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val || '');
    this.currentPage.set(1);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  onVesselChange(val: string) {
    this.vesselFilter.set(val);
    this.currentPage.set(1);
  }

  onStatusChange(val: string) {
    this.statusFilter.set(val);
    this.currentPage.set(1);
  }

  onMomsChange(val: string) {
    this.momsFilter.set(val);
    this.currentPage.set(1);
  }

  toggleSort(col: keyof NearMissRecord) {
    if (this.sortCol() === col) {
      this.sortAsc.update(asc => !asc);
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(col: keyof NearMissRecord): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortAsc() ? 'arrow_upward' : 'arrow_downward';
  }

  toggleRowExpand(id: string, event: MouseEvent) {
    event.stopPropagation();
    this.expandedRows.update(prev => ({ ...prev, [id]: !prev[id] }));
  }

  toggleActionExpand(id: string, event: MouseEvent) {
    event.stopPropagation();
    this.expandedActionRows.update(prev => ({ ...prev, [id]: !prev[id] }));
  }

  copyMomsId(id: string, event: MouseEvent) {
    event.stopPropagation();
    navigator.clipboard?.writeText(id);
    this.notify.showSuccess('Aramco MOMs ID Copied', `Reference #${id} copied to clipboard.`);
  }

  isFiltered(): boolean {
    return !!this.searchQuery().trim() || this.vesselFilter() !== 'ALL' || this.statusFilter() !== 'ALL' || this.momsFilter() !== 'ALL';
  }

  resetFilters() {
    this.searchQuery.set('');
    this.vesselFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.momsFilter.set('ALL');
    this.currentPage.set(1);
  }

  // Parse maritime dates formatted e.g. "26-Dec-25", "2-Aug-26" into epoch timestamps for accurate sorting
  private parseMaritimeDate(dateStr?: string): number {
    if (!dateStr || !dateStr.trim()) return 0;
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const mon = parts[1];
      let yr = parseInt(parts[2], 10);
      if (yr < 100) yr += 2000;
      const parsed = Date.parse(`${mon} ${day}, ${yr}`);
      if (!isNaN(parsed)) return parsed;
    }
    const standard = Date.parse(dateStr);
    return isNaN(standard) ? 0 : standard;
  }

  // Reactive Computed Signal: filters across all 6 specified fields
  readonly filteredNearMisses = computed(() => {
    const list = this.state.nearMisses();
    const q = this.searchQuery().toLowerCase().trim();
    const vFilter = this.vesselFilter();
    const sFilter = this.statusFilter();
    const mFilter = this.momsFilter();

    let res = list.filter(nm => {
      const matchVessel = vFilter === 'ALL' || nm.vesselName === vFilter;
      const matchStatus = sFilter === 'ALL' || nm.status === sFilter;
      
      let matchMoms = true;
      if (mFilter === 'SUBMITTED') {
        matchMoms = !!nm.aramcoMomsSubmission && nm.aramcoMomsSubmission.trim().length > 0;
      } else if (mFilter === 'PENDING') {
        matchMoms = !nm.aramcoMomsSubmission || nm.aramcoMomsSubmission.trim().length === 0;
      }

      // Search across required 6 fields: Vessel Name, Location, Status, Description, Reported By, Aramco MOMs Submission
      let matchQuery = true;
      if (q) {
        const terms = q.split(/\s+/).filter(t => t.length > 0);
        const searchableText = [
          nm.vesselName || '',
          nm.location || '',
          nm.status || '',
          nm.nearMissDescription || '',
          nm.reportedBy || '',
          nm.aramcoMomsSubmission || '',
          nm.correctiveAction || ''
        ].join(' ').toLowerCase();

        matchQuery = terms.every(t => searchableText.includes(t));
      }

      return matchVessel && matchStatus && matchMoms && matchQuery;
    });

    // Reactive sorting across sortable columns
    const key = this.sortCol();
    const dir = this.sortAsc() ? 1 : -1;

    res.sort((a, b) => {
      if (key === 'date' || key === 'closeOutDate') {
        const timeA = this.parseMaritimeDate(a[key]);
        const timeB = this.parseMaritimeDate(b[key]);
        if (timeA === timeB) return 0;
        if (timeA <= 0) return 1; // Empty dates always sort to bottom
        if (timeB <= 0) return -1;
        return (timeA - timeB) * dir;
      }

      const valA = (a[key] ?? '').toString().toLowerCase().trim();
      const valB = (b[key] ?? '').toString().toLowerCase().trim();
      if (valA === valB) return 0;
      return valA.localeCompare(valB) * dir;
    });

    return res;
  });

  // Pagination computed signals
  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredNearMisses().length / this.pageSize()));
  });

  readonly startIndex = computed(() => {
    return (this.currentPage() - 1) * this.pageSize();
  });

  readonly endIndex = computed(() => {
    return Math.min(this.startIndex() + this.pageSize(), this.filteredNearMisses().length);
  });

  readonly paginatedNearMisses = computed(() => {
    return this.filteredNearMisses().slice(this.startIndex(), this.endIndex());
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

  exportToCsv() {
    const records = this.filteredNearMisses();
    const headers = [
      'Vessel Name',
      'Date',
      'Near Miss Description',
      'Corrective Action',
      'Location',
      'Colse Out Date',
      'Status',
      'Reported By',
      'Recommendation',
      'Action Taken By Vessel',
      'Aramco MOMs Submission'
    ];

    const escapeCsv = (val: string | undefined | null) => {
      if (!val) return '""';
      const clean = val.replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = records.map(r => [
      escapeCsv(r.vesselName),
      escapeCsv(r.date),
      escapeCsv(r.nearMissDescription),
      escapeCsv(r.correctiveAction),
      escapeCsv(r.location),
      escapeCsv(r.closeOutDate),
      escapeCsv(r.status),
      escapeCsv(r.reportedBy),
      escapeCsv(r.recommendation),
      escapeCsv(r.actionTakenByVessel),
      escapeCsv(r.aramcoMomsSubmission)
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Near_Miss_Register_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.notify.showSuccess('Export Complete', `Exported ${records.length} records matching active filters to CSV.`);
  }

  deleteRecord(id: string, vesselName: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete Near Miss record ${id} for ${vesselName}?`)) {
      this.state.deleteNearMiss(id);
      this.notify.showSuccess('Record Deleted', `Near Miss report ${id} has been removed.`);
    }
  }
}
