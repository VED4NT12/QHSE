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
import { InspectionStore, InspectionTrackerRecord } from '../../core/stores/inspection.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

export type InspectionRecord = InspectionTrackerRecord;

@Component({
  selector: 'app-inspection-tracker-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, MatTooltipModule, PageHeaderComponent, EmptyStateComponent, SearchFilterComponent],
  template: `
    <div class="module-container">
      <app-page-header
        title="Fleet Inspection Tracker"
        subtitle="Operational & Technical Fleet Inspections — Internal Audits, External Surveys & Vessel Matrix"
        icon="checklist"
        [breadcrumbs]="[{label: 'Overview', link: '/inspection-tracker'}, {label: 'Inspection Register'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportCsv()">
            <mat-icon>file_download</mat-icon> Export CSV
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/inspection-tracker/create">
            <mat-icon>add</mat-icon> New Inspection
          </button>
        </div>
      </app-page-header>

      <!-- KPI Overview Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.04 230 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.12 230)">fact_check</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Inspections</div>
            <div class="kpi-value">{{ kpis().total }}</div>
            <div class="kpi-sub">Across active fleet</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.93 0.05 145 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.15 145)">verified</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Completed / Closed</div>
            <div class="kpi-value">{{ kpis().closed }}</div>
            <div class="kpi-sub">Audits fulfilled</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.94 0.06 75 / 0.5)">
            <mat-icon style="color: oklch(0.50 0.15 75)">pending_actions</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Open / In Progress</div>
            <div class="kpi-value">{{ kpis().open }}</div>
            <div class="kpi-sub">Follow-up required</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.06 25 / 0.5)">
            <mat-icon style="color: oklch(0.52 0.18 25)">report_problem</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Findings</div>
            <div class="kpi-value">{{ kpis().totalFindings }}</div>
            <div class="kpi-sub">Fleet observations</div>
          </div>
        </div>
      </div>

      <!-- View Tabs: All Inspections Data Grid vs Vessel Specific Schedule Matrix -->
      <div class="view-tabs-bar">
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab() === 'grid'" 
          (click)="activeTab.set('grid')">
          <mat-icon>grid_on</mat-icon>
          <span>All Inspections Register (Data Grid)</span>
          <span class="tab-badge">{{ filteredRecords().length }}</span>
        </button>
        <button 
          type="button" 
          class="tab-btn" 
          [class.active]="activeTab() === 'vessel-matrix'" 
          (click)="activeTab.set('vessel-matrix')">
          <mat-icon>directions_boat</mat-icon>
          <span>Vessel Schedule & Matrix (Dropdown Selector)</span>
        </button>
      </div>

      <!-- VIEW 1: DATA GRID -->
      @if (activeTab() === 'grid') {
        <!-- Unified Reusable Search & Filter Bar -->
        <app-search-filter
          searchLabel="Search Inspections"
          placeholder="Search vessel, inspection type, inspector, period..."
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
            <label class="filter-label">Category</label>
            <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event); currentPage.set(1)" class="custom-select">
              <option value="ALL">All Categories</option>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Status</label>
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)" class="custom-select">
              <option value="ALL">All Statuses</option>
              <option value="Closed">Closed</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </app-search-filter>

        <!-- Main Master Table (With Nested Child Grid) -->
        <div class="hseq-card table-card">
          <div class="table-card-header">
            <div class="header-info">
              <div class="d-flex align-items-center gap-2">
                <h2 class="table-card-title">Inspection Running Sheet (Master Grid)</h2>
                <span class="grid-badge">Grid inside Grid</span>
              </div>
              <span class="table-card-count">
                Showing {{ paginatedRecords().length }} of {{ filteredRecords().length }} inspections
                @if (searchQuery()) {
                  <span class="search-indicator">matching "{{ searchQuery() }}"</span>
                }
              </span>
            </div>
            <div class="header-actions">
              <button 
                type="button" 
                class="btn-toggle-all"
                (click)="toggleAll(!allExpanded())"
                title="Expand or collapse all child grids">
                <mat-icon>{{ allExpanded() ? 'unfold_less' : 'unfold_more' }}</mat-icon>
                <span>{{ allExpanded() ? 'Collapse All' : 'Expand All Sub-Grids' }}</span>
              </button>
              <span class="excel-tag">
                <mat-icon class="excel-icon">grid_on</mat-icon> Excel Synchronized
              </span>
            </div>
          </div>

              <div class="table-responsive">
            <table class="hseq-table xl-table">
              <thead>
                <tr>
                  <th class="col-expand" style="width: 34px; text-align: center;"></th>
                  <th class="col-vessel sortable-th" (click)="toggleSort('vesselName')">
                    Vessel & Takeover
                    <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                  </th>
                  <th class="col-insp-type sortable-th" (click)="toggleSort('typeOfInspection')">
                    Type
                    <mat-icon class="sort-icon">{{ getSortIcon('typeOfInspection') }}</mat-icon>
                  </th>
                  <th class="col-cat sortable-th" (click)="toggleSort('categoryOfInspection')">
                    Category
                    <mat-icon class="sort-icon">{{ getSortIcon('categoryOfInspection') }}</mat-icon>
                  </th>
                  <th class="col-period sortable-th" (click)="toggleSort('period')">
                    Period & Date
                    <mat-icon class="sort-icon">{{ getSortIcon('period') }}</mat-icon>
                  </th>
                  <th class="col-findings sortable-th" (click)="toggleSort('findingsTotal')">
                    Findings (H/M/L)
                    <mat-icon class="sort-icon">{{ getSortIcon('findingsTotal') }}</mat-icon>
                  </th>
                  <th class="col-closed sortable-th" (click)="toggleSort('closedTotal')">
                    Closed (H/M/L)
                    <mat-icon class="sort-icon">{{ getSortIcon('closedTotal') }}</mat-icon>
                  </th>
                  <th class="col-inspector sortable-th" (click)="toggleSort('nameOfInspectors')">
                    Inspectors
                    <mat-icon class="sort-icon">{{ getSortIcon('nameOfInspectors') }}</mat-icon>
                  </th>
                  <th class="col-next sortable-th" (click)="toggleSort('dueDate')">
                    Next Due & Window
                    <mat-icon class="sort-icon">{{ getSortIcon('dueDate') }}</mat-icon>
                  </th>
                  <th class="col-status sortable-th" (click)="toggleSort('status')">
                    Status
                    <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                  </th>
                  <th class="col-actions">Actions</th>
                </tr>
              </thead>
              @if (paginatedRecords().length > 0) {
                <tbody>
                  @for (rec of paginatedRecords(); track rec.id) {
                    <!-- MASTER PARENT ROW -->
                    <tr 
                      class="data-row master-row" 
                      [class.is-expanded]="isExpanded(rec.id)"
                      (click)="toggleRow(rec.id)">
                      
                      <!-- Expand/Collapse Chevron Button -->
                      <td class="col-expand" style="text-align: center;" (click)="$event.stopPropagation()">
                        <button 
                          type="button" 
                          class="row-expand-btn" 
                          [class.expanded]="isExpanded(rec.id)"
                          (click)="toggleRow(rec.id)"
                          [title]="isExpanded(rec.id) ? 'Click to collapse findings sub-grid' : 'Click to expand findings sub-grid'">
                          <mat-icon class="expand-icon">{{ isExpanded(rec.id) ? 'keyboard_arrow_down' : 'keyboard_arrow_right' }}</mat-icon>
                        </button>
                      </td>

                      <!-- Vessel Name & Takeover Date -->
                      <td class="col-vessel">
                        <div class="vessel-badge">
                          <mat-icon class="vessel-icon">directions_boat</mat-icon>
                          <div class="vessel-info-stack">
                            <span class="vessel-text">{{ rec.vesselName }}</span>
                            <span class="vessel-subtext">{{ rec.vesselType }} &bull; Takeover: <strong>{{ rec.takeoverDate || 'N/A' }}</strong></span>
                          </div>
                        </div>
                      </td>

                      <!-- Type of Inspection (Internal / External) -->
                      <td class="col-insp-type">
                        <span class="insp-type-pill" [class.type-ext]="rec.typeOfInspection === 'External'">
                          {{ rec.typeOfInspection }}
                        </span>
                      </td>

                      <!-- Category of Inspection -->
                      <td class="col-cat">
                        <span class="cat-pill" [class.cat-ext]="rec.categoryOfInspection === 'External' || rec.categoryOfInspection === 'SIRE 2.0 Vetting Inspection' || rec.categoryOfInspection === 'Annual Class Survey'">
                          {{ rec.categoryOfInspection }}
                        </span>
                      </td>

                      <!-- Period & Date of Inspection -->
                      <td class="col-period">
                        <div class="period-stack">
                          <span class="period-text">{{ rec.period }}</span>
                          <span class="date-subtext">{{ rec.dateOfInspection }}</span>
                        </div>
                      </td>
                      
                      <!-- Findings Count: Total, High, Medium, Low -->
                      <td class="col-findings" (click)="$event.stopPropagation(); toggleRow(rec.id)">
                        <div class="findings-chip interactive" [title]="'Click to expand child findings: Total ' + rec.findingsTotal + ' (' + rec.findingsHigh + ' High, ' + rec.findingsMedium + ' Med, ' + rec.findingsLow + ' Low)'">
                          <span class="f-total">{{ rec.findingsTotal }}</span>
                          <span class="f-breakdown">
                            <span class="badge-h" title="High Findings">{{ rec.findingsHigh }}H</span>
                            <span class="badge-m" title="Medium Findings">{{ rec.findingsMedium }}M</span>
                            <span class="badge-l" title="Low Findings">{{ rec.findingsLow }}L</span>
                          </span>
                          <mat-icon class="chip-arrow">{{ isExpanded(rec.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                        </div>
                      </td>

                      <!-- Closed Count: Total, High Closed, Med Closed, Low Closed -->
                      <td class="col-closed">
                        <div class="closed-chip" [title]="'Total Closed: ' + rec.closedTotal + ' (' + rec.closedHigh + ' High, ' + rec.closedMedium + ' Med, ' + rec.closedLow + ' Low Closed)'">
                          <span class="c-total">{{ rec.closedTotal }}</span>
                          <span class="c-breakdown">
                            <span class="badge-ch" title="High Closed">{{ rec.closedHigh }}H</span>
                            <span class="badge-cm" title="Medium Closed">{{ rec.closedMedium }}M</span>
                            <span class="badge-cl" title="Low Closed">{{ rec.closedLow }}L</span>
                          </span>
                        </div>
                      </td>
                      
                      <!-- Name & Type of Inspectors -->
                      <td class="col-inspector">
                        <div class="inspector-box" [title]="(rec.nameOfInspectors || rec.inspectorName || 'TBD') + ' (' + (rec.typeOfInspectors || rec.inspectorType || 'Auditor') + ')'">
                          <div class="ins-name">{{ rec.nameOfInspectors || rec.inspectorName || 'TBD' }}</div>
                          <span class="ins-type-badge">{{ rec.typeOfInspectors || rec.inspectorType || 'Auditor' }}</span>
                        </div>
                      </td>

                      <!-- Next Inspection Schedule: Due Date, Due Window, Interval (Days), Window Opening, Status -->
                      <td class="col-next">
                        <div class="next-box">
                          <div class="next-due-line">
                            <span class="next-due-date">{{ rec.dueDate || rec.nextDue || '-' }}</span>
                            <span class="next-interval" *ngIf="rec.intervalDays">({{ rec.intervalDays }}d)</span>
                          </div>
                          <div class="next-meta-line" [title]="'Due Window: ' + (rec.dueWindow || '-') + ' | Opening: ' + (rec.windowOpening || '-')">
                            Window: {{ rec.dueWindow || '-' }}
                          </div>
                          <span class="next-status-tag" [ngClass]="getNextStatusClass(rec.statusNextInspection)">
                            {{ rec.statusNextInspection || 'Planned' }}
                          </span>
                        </div>
                      </td>

                      <!-- Inspection Status -->
                      <td class="col-status">
                        <span class="status-pill" [ngClass]="getStatusPillClass(rec.status)">
                          <span class="status-dot"></span>
                          {{ rec.status }}
                        </span>
                      </td>

                      <!-- Actions Group -->
                      <td class="col-actions" (click)="$event.stopPropagation()">
                        <div class="actions-group">
                          <a 
                            class="btn-edit-action" 
                            [routerLink]="['/inspection-tracker/edit', rec.id]"
                            title="Edit Inspection">
                            <mat-icon class="btn-icon">edit</mat-icon>
                          </a>
                          <button 
                            type="button" 
                            class="btn-delete-action" 
                            (click)="deleteInspection(rec.id, rec.vesselName, $event)" 
                            title="Delete Inspection">
                            <mat-icon class="btn-icon">delete_outline</mat-icon>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <!-- NESTED CHILD FINDINGS GRID (GRID INSIDE GRID) -->
                    @if (isExpanded(rec.id)) {
                      <tr class="nested-subgrid-row">
                        <td colspan="11" class="nested-subgrid-cell">
                          <div class="subgrid-card">
                            
                            <!-- Sub-Grid Header Strip with Excel Structure Alignment -->
                            <div class="subgrid-header">
                              <div class="subgrid-title-info">
                                <div class="subgrid-title-badge">
                                  <mat-icon class="subgrid-icon">account_tree</mat-icon>
                                  <span class="subgrid-title">Child Findings Grid: {{ rec.vesselName }} &mdash; {{ rec.categoryOfInspection }} ({{ rec.typeOfInspection }})</span>
                                </div>
                                <span class="findings-count-pill">
                                  {{ getFindingsForInspection(rec).length }} Recorded Findings
                                </span>
                                <button type="button" class="btn-add-finding" (click)="openAddFindingModal(rec, $event)">
                                  <mat-icon>add_circle</mat-icon>
                                  <span>Add Finding</span>
                                </button>
                              </div>
                              <div class="subgrid-parent-meta">
                                <span>Takeover: <strong>{{ rec.takeoverDate || 'N/A' }}</strong></span>
                                <span class="sep">&bull;</span>
                                <span>Window Opening: <strong>{{ rec.windowOpening || 'N/A' }}</strong></span>
                                <span class="sep">&bull;</span>
                                <span>Due Window: <strong>{{ rec.dueWindow || 'N/A' }}</strong></span>
                                <span class="sep">&bull;</span>
                                <span>Next Due: <strong>{{ rec.dueDate || 'N/A' }}</strong> ({{ rec.intervalDays || 90 }} Days)</span>
                                <span class="sep">&bull;</span>
                                <span>Next Status: <strong>{{ rec.statusNextInspection || 'Planned' }}</strong></span>
                              </div>
                            </div>

                            <!-- Dual Findings Summary Section (Reflecting Excel Structure) -->
                            <div class="findings-summary-banner">
                              <div class="summary-card findings-col">
                                <div class="summary-card-header">
                                  <mat-icon class="sm-icon text-amber">report_problem</mat-icon>
                                  <span class="sm-title">Findings Summary</span>
                                  <span class="sm-total-badge">{{ rec.findingsTotal }} Total</span>
                                </div>
                                <div class="summary-chips-row">
                                  <span class="summary-chip sc-high">High: <strong>{{ rec.findingsHigh }}</strong></span>
                                  <span class="summary-chip sc-med">Medium: <strong>{{ rec.findingsMedium }}</strong></span>
                                  <span class="summary-chip sc-low">Low: <strong>{{ rec.findingsLow }}</strong></span>
                                  <span class="summary-chip sc-total">Total: <strong>{{ rec.findingsTotal }}</strong></span>
                                </div>
                              </div>

                              <div class="summary-card closed-col">
                                <div class="summary-card-header">
                                  <mat-icon class="sm-icon text-green">task_alt</mat-icon>
                                  <span class="sm-title">Closure Summary</span>
                                  <span class="sm-total-badge success">{{ rec.closedTotal }} Closed</span>
                                </div>
                                <div class="summary-chips-row">
                                  <span class="summary-chip sc-chigh">High Closed: <strong>{{ rec.closedHigh }}</strong></span>
                                  <span class="summary-chip sc-cmed">Med Closed: <strong>{{ rec.closedMedium }}</strong></span>
                                  <span class="summary-chip sc-clow">Low Closed: <strong>{{ rec.closedLow }}</strong></span>
                                  <span class="summary-chip sc-ctotal">Total: <strong>{{ rec.closedTotal }}</strong></span>
                                </div>
                              </div>
                            </div>

                            <!-- Sub-Grid Child Findings Table (All Excel Child Columns) -->
                            @if (getFindingsForInspection(rec).length > 0) {
                              <div class="subgrid-table-wrapper">
                                <table class="subgrid-table">
                                  <thead>
                                    <tr>
                                      <th class="sg-col-num" style="width: 36px;">#</th>
                                      <th class="sg-col-id" style="width: 90px;">Finding ID</th>
                                      <th class="sg-col-date" style="width: 90px;">Date</th>
                                      <th class="sg-col-desc">Finding / Deficiency Description</th>
                                      <th class="sg-col-aoc" style="width: 105px;">AOC</th>
                                      <th class="sg-col-subaoc" style="width: 120px;">Sub AOC</th>
                                      <th class="sg-col-rating" style="width: 80px;">Rating</th>
                                      <th class="sg-col-action" style="min-width: 180px;">Corrective Action</th>
                                      <th class="sg-col-pic" style="width: 140px;">PIC Details</th>
                                      <th class="sg-col-due" style="width: 90px;">Due Date</th>
                                      <th class="sg-col-close" style="width: 90px;">Closure Date</th>
                                      <th class="sg-col-status" style="width: 80px;">Status</th>
                                      <th class="sg-col-actions" style="width: 80px; text-align: center;">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    @for (f of getFindingsForInspection(rec); track f.id; let idx = $index) {
                                      <tr class="subgrid-row">
                                        <td class="sg-col-num">
                                          <span class="sg-num-badge">{{ idx + 1 }}</span>
                                        </td>
                                        <td class="sg-col-id">
                                          <span class="fnd-id">{{ f.id }}</span>
                                        </td>
                                        <td class="sg-col-date">
                                          <span class="fnd-date">{{ f.dateOfInspection }}</span>
                                        </td>
                                        <td class="sg-col-desc">
                                          <div class="fnd-desc-wrap">{{ f.findingDescription }}</div>
                                        </td>
                                        <td class="sg-col-aoc">
                                          <span class="aoc-badge">{{ f.aoc }}</span>
                                        </td>
                                        <td class="sg-col-subaoc">
                                          <span class="subaoc-text">{{ f.subAoc }}</span>
                                        </td>
                                        <td class="sg-col-rating">
                                          <span class="rating-badge" [ngClass]="'rating-' + f.rating.toLowerCase()">
                                            {{ f.rating }}
                                          </span>
                                        </td>
                                        <td class="sg-col-action">
                                          <div class="action-desc-wrap">{{ f.correctiveAction }}</div>
                                        </td>
                                        <td class="sg-col-pic">
                                          <div class="pic-wrap" [title]="f.picDetails">
                                            <mat-icon class="pic-icon">badge</mat-icon>
                                            <span class="pic-text">{{ f.picDetails }}</span>
                                          </div>
                                        </td>
                                        <td class="sg-col-due">
                                          <span class="date-chip">{{ f.dueDate || '-' }}</span>
                                        </td>
                                        <td class="sg-col-close">
                                          <span class="date-chip" [class.text-closed]="f.closureDate">{{ f.closureDate || '-' }}</span>
                                        </td>
                                        <td class="sg-col-status">
                                          <span class="status-pill" [ngClass]="getStatusPillClass(f.status)">
                                            <span class="status-dot"></span>
                                            {{ f.status }}
                                          </span>
                                        </td>
                                        <td class="sg-col-actions" style="text-align: center;" (click)="$event.stopPropagation()">
                                          <div class="sg-actions-row">
                                            <button type="button" class="btn-sg-edit" (click)="openEditFindingModal(rec, f, $event)" title="Edit Finding">
                                              <mat-icon>edit</mat-icon>
                                            </button>
                                            <button type="button" class="btn-sg-delete" (click)="deleteFindingItem(rec, f, $event)" title="Delete Finding">
                                              <mat-icon>delete_outline</mat-icon>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    }
                                  </tbody>
                                </table>
                              </div>
                            } @else {
                              <div class="subgrid-empty">
                                <mat-icon>check_circle</mat-icon>
                                <div class="empty-info">
                                  <strong>No findings recorded</strong>
                                  <p>This inspection audit completed with zero deficiency observations.</p>
                                </div>
                                <button type="button" class="btn-add-finding empty-add-btn" (click)="openAddFindingModal(rec, $event)">
                                  <mat-icon>add_circle</mat-icon> Add First Finding
                                </button>
                              </div>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              } @else {
                <tbody>
                  <tr>
                    <td colspan="11">
                      <app-empty-state 
                        icon="checklist" 
                        title="No Inspections Found" 
                        message="No inspection records match your current search or filter criteria.">
                      </app-empty-state>
                    </td>
                  </tr>
                </tbody>
              }
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination-footer">
              <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
              <div class="page-buttons">
                <button 
                  type="button" 
                  class="page-nav-btn" 
                  [disabled]="currentPage() === 1" 
                  (click)="currentPage.set(currentPage() - 1)">
                  <mat-icon>chevron_left</mat-icon> Previous
                </button>
                <button 
                  type="button" 
                  class="page-nav-btn" 
                  [disabled]="currentPage() === totalPages()" 
                  (click)="currentPage.set(currentPage() + 1)">
                  Next <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- VIEW 2: VESSEL SCHEDULE MATRIX WITH DROPDOWN SELECTOR & FULL DYNAMIC DATA -->
      @if (activeTab() === 'vessel-matrix') {
        <div class="hseq-card matrix-card">
          <div class="matrix-header">
            <div class="vessel-selector-wrap">
              <label class="matrix-select-label">Select Vessel Sheet:</label>
              <select 
                class="matrix-vessel-select" 
                [ngModel]="selectedMatrixVessel()" 
                (ngModelChange)="selectedMatrixVessel.set($event)">
                @for (v of matrixVesselList(); track v) {
                  <option [value]="v">{{ v }}</option>
                }
              </select>
            </div>
            @if (currentVesselSchedule(); as sched) {
              <div class="vessel-meta-bar">
                <div class="meta-item">
                  <span class="m-lbl">Takeover Date:</span>
                  <span class="m-val">{{ sched.takeoverDate }}</span>
                </div>
                <div class="meta-item">
                  <span class="m-lbl">Assigned Inspector:</span>
                  <span class="m-val">{{ sched.inspector }}</span>
                </div>
                <div class="meta-item">
                  <span class="m-lbl">Scheduled Programs:</span>
                  <span class="m-val">{{ filteredMatrixItems().length }} of {{ sched.items.length }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Matrix Search & Filtering Controls -->
          <div class="matrix-filter-bar">
            <div class="matrix-search-wrap">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                class="matrix-search-input" 
                placeholder="Search program, period, frequency..." 
                [ngModel]="matrixSearchQuery()" 
                (ngModelChange)="matrixSearchQuery.set($event)">
            </div>
            <div class="matrix-filter-item">
              <label>Category:</label>
              <select [ngModel]="matrixCategoryFilter()" (ngModelChange)="matrixCategoryFilter.set($event)" class="matrix-filter-select">
                <option value="ALL">All Categories</option>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
            <div class="matrix-filter-item">
              <label>Status:</label>
              <select [ngModel]="matrixStatusFilter()" (ngModelChange)="matrixStatusFilter.set($event)" class="matrix-filter-select">
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>
            @if (isMatrixFiltered()) {
              <button type="button" class="btn-reset-matrix" (click)="resetMatrixFilters()">
                <mat-icon>clear</mat-icon> Reset Filters
              </button>
            }
          </div>

          @if (currentVesselSchedule(); as sched) {
            <div class="matrix-table-wrap">
              <table class="hseq-table matrix-table">
                <thead>
                  <tr>
                    <th class="sortable-th" (click)="toggleMatrixSort('name')">
                      Inspection Program
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('name') }}</mat-icon>
                    </th>
                    <th class="sortable-th" (click)="toggleMatrixSort('category')">
                      Category
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('category') }}</mat-icon>
                    </th>
                    <th class="sortable-th" (click)="toggleMatrixSort('frequency')">
                      Frequency
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('frequency') }}</mat-icon>
                    </th>
                    <th class="sortable-th" (click)="toggleMatrixSort('period')">
                      Period
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('period') }}</mat-icon>
                    </th>
                    <th class="sortable-th" (click)="toggleMatrixSort('date')">
                      Inspection Date
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('date') }}</mat-icon>
                    </th>
                    <th class="sortable-th" (click)="toggleMatrixSort('nextDate')">
                      Next Expected Due
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('nextDate') }}</mat-icon>
                    </th>
                    <th class="sortable-th" (click)="toggleMatrixSort('status')">
                      Status
                      <mat-icon class="sort-icon">{{ getMatrixSortIcon('status') }}</mat-icon>
                    </th>
                  </tr>
                </thead>
                @if (filteredMatrixItems().length > 0) {
                  <tbody>
                    @for (item of filteredMatrixItems(); track item.id || item.name) {
                      <tr>
                        <td class="fw-bold">{{ item.name }}</td>
                        <td>
                          <span class="cat-pill" [class.cat-ext]="item.category === 'External'">
                            {{ item.category }}
                          </span>
                        </td>
                        <td>{{ item.frequency }}</td>
                        <td>{{ item.period }}</td>
                        <td>{{ item.date }}</td>
                        <td>{{ item.nextDate }}</td>
                        <td>
                          <span class="status-pill" [ngClass]="getStatusPillClass(item.status)">
                            <span class="status-dot"></span>
                            {{ item.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                } @else {
                  <tbody>
                    <tr>
                      <td colspan="7">
                        <app-empty-state 
                          icon="search_off" 
                          title="No Programs Found" 
                          message="No inspection programs match your current filter criteria for {{ sched.vesselName }}.">
                        </app-empty-state>
                      </td>
                    </tr>
                  </tbody>
                }
              </table>
            </div>
          }
        </div>
      }
    </div>

    <!-- ADD / EDIT FINDING MODAL -->
    @if (isFindingModalOpen()) {
      <div class="finding-modal-backdrop" (click)="closeFindingModal()">
        <div class="finding-modal-card" (click)="$event.stopPropagation()">
          <div class="finding-modal-header">
            <div class="fmodal-titles">
              <mat-icon class="fmodal-icon">{{ editingFindingId() ? 'edit_note' : 'add_circle' }}</mat-icon>
              <div>
                <h3 class="fmodal-title">{{ editingFindingId() ? 'Edit Inspection Finding' : 'Add Child Finding' }}</h3>
                <p class="fmodal-sub">{{ activeInspection()?.vesselName }} &bull; {{ activeInspection()?.categoryOfInspection }} ({{ activeInspection()?.typeOfInspection }})</p>
              </div>
            </div>
            <button type="button" class="fmodal-close-btn" (click)="closeFindingModal()" title="Close">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="finding-modal-body">
            @if (findingModalError()) {
              <div class="fmodal-alert-error">
                <mat-icon>error_outline</mat-icon>
                <span>{{ findingModalError() }}</span>
              </div>
            }

            <div class="fmodal-field-group">
              <label class="fmodal-label">Finding / Deficiency Description <span class="req">*</span></label>
              <textarea 
                rows="3" 
                class="fmodal-textarea" 
                [(ngModel)]="findingForm.findingDescription" 
                placeholder="Enter detailed audit finding or deficiency observed during survey..."></textarea>
            </div>

            <div class="fmodal-grid-2">
              <div class="fmodal-field-group">
                <label class="fmodal-label">Area of Concern (AOC) <span class="req">*</span></label>
                <select class="fmodal-select" [(ngModel)]="findingForm.aoc">
                  <option value="Technical">Technical</option>
                  <option value="Operations">Operations</option>
                  <option value="Safety">Safety</option>
                  <option value="Navigation">Navigation</option>
                  <option value="Crewing">Crewing & Manpower</option>
                  <option value="Environmental">Environmental Protection</option>
                  <option value="Documentation">Documentation & Certificates</option>
                </select>
              </div>

              <div class="fmodal-field-group">
                <label class="fmodal-label">Sub AOC</label>
                <input type="text" class="fmodal-input" [(ngModel)]="findingForm.subAoc" placeholder="e.g. Machinery Maintenance, Record Keeping" list="insSubAocList">
                <datalist id="insSubAocList">
                  <option value="Machinery Maintenance">Machinery Maintenance</option>
                  <option value="Record Keeping">Record Keeping</option>
                  <option value="Safety Drills">Safety Drills</option>
                  <option value="Navigational Equipment">Navigational Equipment</option>
                  <option value="Life Saving Appliances">Life Saving Appliances (LSA)</option>
                  <option value="Fire Fighting Equipment">Fire Fighting Equipment (FFA)</option>
                  <option value="PMS Overdue">PMS Overdue</option>
                </datalist>
              </div>
            </div>

            <div class="fmodal-grid-2">
              <div class="fmodal-field-group">
                <label class="fmodal-label">Observation Rating <span class="req">*</span></label>
                <select class="fmodal-select" [(ngModel)]="findingForm.rating">
                  <option value="High">High Severity</option>
                  <option value="Medium">Medium Severity</option>
                  <option value="Low">Low Severity</option>
                </select>
                <span class="fmodal-hint">Auto-updates High/Medium/Low summary counters</span>
              </div>

              <div class="fmodal-field-group">
                <label class="fmodal-label">Status of Finding <span class="req">*</span></label>
                <select class="fmodal-select" [(ngModel)]="findingForm.status" (ngModelChange)="onFindingStatusChange($event)">
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                <span class="fmodal-hint">If Closed, auto-updates Closed counters</span>
              </div>
            </div>

            <div class="fmodal-field-group">
              <label class="fmodal-label">Corrective Action Plan</label>
              <textarea 
                rows="2" 
                class="fmodal-textarea" 
                [(ngModel)]="findingForm.correctiveAction" 
                placeholder="Detail corrective / preventive action plan to rectify deficiency..."></textarea>
            </div>

            <div class="fmodal-grid-3">
              <div class="fmodal-field-group">
                <label class="fmodal-label">PIC Details / Dept</label>
                <input type="text" class="fmodal-input" [(ngModel)]="findingForm.picDetails" placeholder="e.g. Chief Engineer, Master">
              </div>

              <div class="fmodal-field-group">
                <label class="fmodal-label">Due Date</label>
                <input type="date" class="fmodal-input" [(ngModel)]="findingForm.dueDate">
              </div>

              <div class="fmodal-field-group">
                <label class="fmodal-label">Closure Date</label>
                <input type="date" class="fmodal-input" [(ngModel)]="findingForm.closureDate" [disabled]="findingForm.status !== 'Closed'">
              </div>
            </div>
          </div>

          <div class="finding-modal-footer">
            <button type="button" class="btn-fmodal-cancel" (click)="closeFindingModal()">Cancel</button>
            <button type="button" class="btn-fmodal-save" (click)="saveFindingModal()">
              <mat-icon>check</mat-icon>
              <span>{{ editingFindingId() ? 'Update Finding' : 'Save Finding' }}</span>
            </button>
          </div>
        </div>
      </div>
    }
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

    /* Tabs Bar */
    .view-tabs-bar { display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
    .tab-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: var(--radius-sm);
      border: 1px solid transparent; background: transparent;
      color: var(--muted-foreground); font-size: 12.5px; font-weight: 600;
      cursor: pointer; transition: all 0.15s ease; font-family: inherit;
    }
    .tab-btn:hover { background: var(--accent); color: var(--foreground); }
    .tab-btn.active {
      background: var(--card); border-color: var(--border);
      color: var(--primary); font-weight: 700;
      box-shadow: var(--shadow-2xs);
    }
    .tab-badge { font-size: 11px; background: var(--muted); padding: 2px 6px; border-radius: 9999px; }

    .btn-export { height: 34px !important; border-radius: var(--radius-sm) !important; font-family: inherit !important; font-size: 12px !important; }
    .btn-primary-action { height: 34px !important; border-radius: var(--radius-sm) !important; background: var(--primary) !important; color: var(--primary-foreground) !important; font-family: inherit !important; font-size: 12px !important; }

    /* Table Card */
    .hseq-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-2xs); }
    .table-card { overflow: hidden; }
    .table-card-header { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background-color: var(--card); }
    .table-card-title { font-size: 14.5px; font-weight: 700; color: var(--foreground); margin: 0; }
    .table-card-count { font-size: 12px; color: var(--muted-foreground); margin-left: 8px; }
    .search-indicator { color: var(--primary); font-weight: 600; margin-left: 4px; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .excel-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: oklch(0.40 0.12 145); background: oklch(0.94 0.05 145); padding: 3px 8px; border-radius: 9999px; border: 1px solid oklch(0.85 0.08 145); }
    .excel-icon { font-size: 15px; width: 15px; height: 15px; }

    .grid-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: oklch(0.92 0.05 240);
      color: oklch(0.40 0.14 240);
      border: 1px solid oklch(0.85 0.08 240);
      padding: 2px 7px;
      border-radius: 9999px;
    }

    .btn-toggle-all {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .btn-toggle-all:hover {
      background: var(--accent);
      color: var(--primary);
      border-color: var(--primary);
    }
    .btn-toggle-all mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Table Grid */
    .table-responsive { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
    .xl-table { width: 100%; min-width: 1050px; border-collapse: collapse; }
    .xl-table th { background: var(--muted); color: var(--muted-foreground); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; padding: 6px 8px; border-bottom: 1px solid var(--border); white-space: nowrap; text-align: left; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { color: var(--primary); background-color: var(--accent); }
    .sort-icon { font-size: 13px; width: 13px; height: 13px; vertical-align: middle; margin-left: 2px; }
    
    .data-row { border-bottom: 1px solid var(--border); transition: background-color 0.15s ease; }
    .data-row:hover { background-color: var(--accent); }
    .master-row { cursor: pointer; }
    .master-row.is-expanded { background-color: oklch(0.97 0.02 240 / 0.5); }
    
    .xl-table td { padding: 5px 8px; font-size: 12px; color: var(--foreground); vertical-align: middle; }

    /* Expand / Collapse Button */
    .col-expand { width: 34px; min-width: 34px; padding: 5px 2px !important; text-align: center; }
    .row-expand-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--muted-foreground);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .row-expand-btn:hover {
      background: var(--accent);
      border-color: var(--primary);
      color: var(--primary);
      transform: scale(1.05);
    }
    .row-expand-btn.expanded {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
      box-shadow: 0 2px 6px -1px oklch(0.55 0.18 250 / 0.35);
    }
    .expand-icon { font-size: 17px; width: 17px; height: 17px; }

    /* Badges & Pills */
    .col-vessel { width: 175px; min-width: 155px; }
    .vessel-badge { display: inline-flex; align-items: flex-start; gap: 6px; background: var(--muted); padding: 3px 7px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .vessel-icon { font-size: 15px; width: 15px; height: 15px; color: var(--primary); margin-top: 2px; }
    .vessel-info-stack { display: flex; flex-direction: column; gap: 1px; }
    .vessel-text { font-weight: 700; font-size: 12px; color: var(--foreground); }
    .vessel-subtext { font-size: 10px; color: var(--muted-foreground); }
    
    .col-insp-type { width: 75px; min-width: 75px; text-align: center; }
    .insp-type-pill { display: inline-block; font-size: 10.5px; font-weight: 700; background: var(--muted); padding: 1px 6px; border-radius: 4px; }
    .insp-type-pill.type-ext { background: oklch(0.93 0.05 300); color: oklch(0.40 0.12 300); }
    
    .col-cat { width: 130px; min-width: 115px; }
    .cat-pill { display: inline-block; font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; background: oklch(0.92 0.05 240); color: oklch(0.40 0.12 240); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 125px; }
    .cat-ext { background: oklch(0.93 0.05 300); color: oklch(0.40 0.12 300); }

    .col-period { width: 120px; min-width: 110px; }
    .period-stack { display: flex; flex-direction: column; gap: 1px; }
    .period-text { font-weight: 600; font-size: 11.5px; color: var(--foreground); }
    .date-subtext { font-size: 10.5px; color: var(--muted-foreground); }
    
    .col-findings { width: 115px; min-width: 115px; }
    .col-closed { width: 115px; min-width: 115px; }
    .findings-chip { display: flex; align-items: center; gap: 4px; }
    .findings-chip.interactive {
      background: var(--muted);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      border: 1px dashed var(--border);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .findings-chip.interactive:hover {
      border-color: var(--primary);
      background: var(--accent);
    }
    .chip-arrow {
      font-size: 12px;
      width: 12px;
      height: 12px;
      color: var(--muted-foreground);
      margin-left: 1px;
    }
    .f-total { font-weight: 700; font-size: 12px; }
    .f-breakdown, .c-breakdown { display: inline-flex; gap: 2px; font-size: 10px; font-weight: 700; margin-left: 2px; }
    .badge-h { color: oklch(0.50 0.20 25); background: oklch(0.94 0.06 25); padding: 1px 3px; border-radius: 3px; }
    .badge-m { color: oklch(0.52 0.16 70); background: oklch(0.94 0.06 70); padding: 1px 3px; border-radius: 3px; }
    .badge-l { color: oklch(0.42 0.12 240); background: oklch(0.93 0.05 240); padding: 1px 3px; border-radius: 3px; }

    .closed-chip { display: flex; align-items: center; gap: 4px; background: var(--muted); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .c-total { font-weight: 700; font-size: 12px; color: oklch(0.38 0.15 145); }
    .badge-ch, .badge-cm, .badge-cl { color: oklch(0.38 0.15 145); background: oklch(0.93 0.06 145); padding: 1px 3px; border-radius: 3px; }

    .col-inspector { width: 140px; min-width: 125px; }
    .inspector-box { display: flex; flex-direction: column; gap: 1px; max-width: 140px; }
    .ins-name { font-size: 11.5px; font-weight: 600; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ins-type-badge { font-size: 10px; color: var(--muted-foreground); background: var(--muted); border-radius: 3px; padding: 1px 4px; width: fit-content; border: 1px solid var(--border); }

    .col-next { width: 135px; min-width: 120px; }
    .next-box { display: flex; flex-direction: column; gap: 1px; }
    .next-due-line { display: flex; align-items: center; gap: 3px; }
    .next-due-date { font-weight: 700; font-size: 11.5px; color: var(--foreground); }
    .next-interval { font-size: 10px; color: var(--muted-foreground); font-weight: 600; }
    .next-meta-line { font-size: 10px; color: var(--muted-foreground); white-space: nowrap; }
    .next-status-tag { display: inline-block; font-size: 9.5px; font-weight: 700; padding: 1px 5px; border-radius: 4px; text-transform: uppercase; width: fit-content; }
    .next-status-tag.next-scheduled { background: oklch(0.93 0.04 230); color: oklch(0.42 0.12 230); }
    .next-status-tag.next-completed { background: oklch(0.93 0.06 145); color: oklch(0.38 0.15 145); }
    .next-status-tag.next-window { background: oklch(0.95 0.07 70); color: oklch(0.48 0.16 65); }
    .next-status-tag.next-overdue { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }

    /* Status Pills */
    .xl-table th.col-status,
    .xl-table td.col-status {
      width: 90px;
      min-width: 90px;
      text-align: center;
    }
    .status-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
    .status-dot { width: 5px; height: 5px; border-radius: 50%; }

    /* Actions Group & Column Alignment */
    .xl-table th.col-actions,
    .xl-table td.col-actions {
      width: 90px;
      min-width: 90px;
      text-align: center !important;
      padding: 6px 8px !important;
    }
    .actions-group {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .btn-edit-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      border: 1px solid var(--border);
      background-color: var(--card);
      border-radius: var(--radius-sm);
      color: var(--muted-foreground);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-edit-action:hover {
      border-color: var(--primary);
      background-color: var(--accent);
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .btn-edit-action .btn-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      line-height: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-delete-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      border: 1px solid var(--border);
      background-color: var(--card);
      border-radius: var(--radius-sm);
      color: var(--muted-foreground);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-delete-action:hover {
      border-color: #fca5a5;
      background-color: #fef2f2;
      color: #dc2626;
      box-shadow: 0 1px 3px rgba(220, 38, 38, 0.08);
    }
    .btn-delete-action .btn-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      line-height: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ==========================================================
       NESTED SUB-GRID (GRID INSIDE GRID) STYLES
       ========================================================= */
    .nested-subgrid-row {
      background: oklch(0.97 0.01 240 / 0.6);
      border-bottom: 2px solid var(--border);
    }
    .nested-subgrid-cell {
      padding: 0 12px 10px 34px !important;
    }
    .subgrid-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 3px solid var(--primary);
      border-radius: var(--radius-sm);
      box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      margin-top: 4px;
    }
    .subgrid-header {
      padding: 8px 12px;
      background: var(--muted);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .subgrid-title-info {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .subgrid-title-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .subgrid-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary);
    }
    .subgrid-title {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .findings-count-pill {
      font-size: 10.5px;
      font-weight: 700;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 1px 7px;
      border-radius: 9999px;
      color: var(--foreground);
    }
    .subgrid-parent-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--muted-foreground);
      flex-wrap: wrap;
    }
    .subgrid-parent-meta strong {
      color: var(--foreground);
    }
    .subgrid-parent-meta .sep {
      color: var(--border);
    }

    /* Dual Findings Summary Section */
    .findings-summary-banner {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 8px;
      padding: 8px 12px;
      background: color-mix(in srgb, var(--muted) 40%, var(--card));
      border-bottom: 1px solid var(--border);
    }
    .summary-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .summary-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sm-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .text-amber { color: oklch(0.55 0.18 70); }
    .text-green { color: oklch(0.45 0.18 145); }
    .sm-title {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--foreground);
      flex: 1;
    }
    .sm-total-badge {
      font-size: 10.5px;
      font-weight: 700;
      background: oklch(0.95 0.08 70);
      color: oklch(0.48 0.18 65);
      padding: 1px 6px;
      border-radius: 9999px;
      margin-left: auto;
    }
    .sm-total-badge.success {
      background: oklch(0.93 0.06 145);
      color: oklch(0.38 0.15 145);
    }
    .summary-chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .summary-chip {
      font-size: 10.5px;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--muted);
      color: var(--muted-foreground);
    }
    .summary-chip strong {
      color: var(--foreground);
      margin-left: 2px;
    }
    .sc-high { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }
    .sc-med { background: oklch(0.94 0.07 70); color: oklch(0.48 0.16 65); }
    .sc-low { background: oklch(0.93 0.05 240); color: oklch(0.40 0.12 240); }
    .sc-total { background: var(--card); border: 1px solid var(--border); color: var(--foreground); }
    .sc-chigh, .sc-cmed, .sc-clow, .sc-ctotal { background: oklch(0.93 0.06 145); color: oklch(0.38 0.15 145); }
    .sc-ctotal { font-weight: 700; }

    /* Subgrid Findings Table */
    .subgrid-table-wrapper {
      overflow-x: auto;
      max-height: 400px;
    }
    .subgrid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .subgrid-table th {
      background: var(--muted);
      padding: 5px 8px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: var(--muted-foreground);
      border-bottom: 1px solid var(--border);
      text-align: left;
      white-space: nowrap;
    }
    .subgrid-row {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.15s ease;
    }
    .subgrid-row:hover {
      background-color: var(--accent);
    }
    .subgrid-table td {
      padding: 5px 8px;
      color: var(--foreground);
      vertical-align: middle;
      font-size: 11.5px;
    }
    .sg-num-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--muted);
      font-size: 10px;
      font-weight: 700;
      color: var(--muted-foreground);
    }
    .fnd-id {
      font-weight: 700;
      color: var(--primary);
      font-size: 11px;
    }
    .fnd-date {
      color: var(--muted-foreground);
      font-size: 11px;
      white-space: nowrap;
    }
    .fnd-desc-wrap {
      max-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.3;
      color: var(--foreground);
    }
    .action-desc-wrap {
      max-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.3;
      color: var(--muted-foreground);
      font-size: 11px;
    }
    .aoc-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      background: var(--muted);
      padding: 1px 5px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .subaoc-text {
      color: var(--muted-foreground);
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
      display: block;
    }
    .pic-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .pic-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: var(--muted-foreground);
    }
    .pic-text {
      font-weight: 600;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 125px;
      font-size: 11px;
    }
    .date-chip {
      font-size: 10.5px;
      color: var(--muted-foreground);
    }
    .date-chip.text-closed {
      color: oklch(0.40 0.15 145);
      font-weight: 600;
    }
    .rating-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 9999px;
    }
    .rating-badge.rating-high { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }
    .rating-badge.rating-medium { background: oklch(0.94 0.07 70); color: oklch(0.48 0.16 65); }
    .rating-badge.rating-low { background: oklch(0.93 0.05 240); color: oklch(0.40 0.12 240); }
    .subgrid-empty {
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: oklch(0.40 0.15 145);
      background: oklch(0.97 0.03 145 / 0.3);
    }
    .subgrid-empty mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .subgrid-empty p {
      margin: 2px 0 0;
      font-size: 11.5px;
      color: var(--muted-foreground);
    }
    .empty-info { flex: 1; }
    .btn-add-finding {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: filter 0.15s ease;
      margin-left: 8px;
    }
    .btn-add-finding:hover { filter: brightness(1.1); }
    .btn-add-finding mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .empty-add-btn { margin-left: 0; }

    .sg-actions-row {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
    }
    .btn-sg-edit, .btn-sg-delete {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--card);
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--muted-foreground);
      transition: all 0.15s ease;
    }
    .btn-sg-edit:hover {
      color: var(--primary);
      border-color: var(--primary);
      background: oklch(0.96 0.02 230 / 0.5);
    }
    .btn-sg-delete:hover {
      color: #dc2626;
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .btn-sg-edit mat-icon, .btn-sg-delete mat-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
    }

    /* FINDING MODAL STYLES */
    .finding-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 20px;
    }
    .finding-modal-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.25);
      width: 100%;
      max-width: 620px;
      overflow: hidden;
      animation: modalPop 0.18s ease-out;
    }
    @keyframes modalPop {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .finding-modal-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--muted) / 0.3;
    }
    .fmodal-titles { display: flex; align-items: center; gap: 10px; }
    .fmodal-icon { font-size: 22px; width: 22px; height: 22px; color: var(--primary); }
    .fmodal-title { font-size: 14.5px; font-weight: 700; color: var(--foreground); margin: 0; }
    .fmodal-sub { font-size: 11.5px; color: var(--muted-foreground); margin: 2px 0 0; }
    .fmodal-close-btn {
      background: none; border: none; cursor: pointer; color: var(--muted-foreground);
      display: grid; place-items: center; padding: 4px; border-radius: var(--radius-sm);
    }
    .fmodal-close-btn:hover { color: var(--foreground); background: var(--muted); }
    .fmodal-close-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .finding-modal-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .fmodal-alert-error {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      color: #991b1b;
      font-size: 12px;
      font-weight: 600;
    }
    .fmodal-alert-error mat-icon { font-size: 16px; width: 16px; height: 16px; color: #dc2626; }
    .fmodal-field-group { display: flex; flex-direction: column; gap: 4px; }
    .fmodal-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .fmodal-grid-3 { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; }
    .fmodal-label { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; }
    .fmodal-label .req { color: #dc2626; }
    .fmodal-textarea, .fmodal-input, .fmodal-select {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 7px 9px;
      background: var(--background);
      color: var(--foreground);
      font-size: 12.5px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease;
      box-sizing: border-box;
    }
    .fmodal-textarea:focus, .fmodal-input:focus, .fmodal-select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px oklch(0.92 0.04 230 / 0.5);
    }
    .fmodal-hint { font-size: 10.5px; color: var(--muted-foreground); font-style: italic; }

    .finding-modal-footer {
      padding: 12px 18px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--muted) / 0.2;
    }
    .btn-fmodal-cancel {
      height: 34px; padding: 0 14px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--card); color: var(--foreground);
      font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
    }
    .btn-fmodal-cancel:hover { background: var(--muted); }
    .btn-fmodal-save {
      height: 34px; padding: 0 16px; border-radius: var(--radius-sm);
      border: none; background: var(--primary); color: var(--primary-foreground);
      font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-fmodal-save:hover { filter: brightness(1.08); }
    .btn-fmodal-save mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Pagination */
    .pagination-footer { padding: 8px 14px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); }
    .page-info { font-size: 11.5px; color: var(--muted-foreground); }
    .page-buttons { display: flex; gap: 6px; }
    .page-nav-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: 1px solid var(--border); background: var(--card); border-radius: var(--radius-sm); font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; color: var(--foreground); }
    .page-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Matrix View */
    .matrix-card { padding: 14px 18px; }
    .matrix-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px; }
    .vessel-selector-wrap { display: flex; align-items: center; gap: 8px; }
    .matrix-select-label { font-size: 12px; font-weight: 700; color: var(--foreground); }
    .matrix-vessel-select { background: var(--card); border: 1.5px solid var(--primary); border-radius: var(--radius-sm); padding: 5px 10px; font-size: 12.5px; font-weight: 700; color: var(--foreground); outline: none; }
    .vessel-meta-bar { display: flex; gap: 14px; background: var(--muted); padding: 5px 12px; border-radius: var(--radius-sm); flex-wrap: wrap; }
    .meta-item { display: flex; gap: 5px; font-size: 11.5px; }
    .m-lbl { color: var(--muted-foreground); font-weight: 600; }
    .m-val { color: var(--foreground); font-weight: 700; }

    .matrix-filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--muted);
      border-radius: var(--radius-sm);
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .matrix-search-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 3px 8px;
      flex: 1;
      min-width: 180px;
      max-width: 320px;
    }
    .search-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
      color: var(--muted-foreground);
    }
    .matrix-search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 12px;
      width: 100%;
      color: var(--foreground);
      font-family: inherit;
    }
    .matrix-filter-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--muted-foreground);
    }
    .matrix-filter-select {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 4px 8px;
      font-size: 11.5px;
      color: var(--foreground);
      outline: none;
      font-family: inherit;
    }
    .btn-reset-matrix {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--muted-foreground);
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s ease;
    }
    .btn-reset-matrix:hover {
      color: #dc2626;
      border-color: #ef4444;
      background: #fef2f2;
    }
    .btn-reset-matrix mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .matrix-table-wrap { overflow-x: auto; }
    .matrix-table { width: 100%; border-collapse: collapse; }
    .matrix-table th { background: var(--muted); padding: 6px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted-foreground); border-bottom: 1px solid var(--border); text-align: left; }
    .matrix-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); font-size: 12px; }
    .fw-bold { font-weight: 700; }
  `]
})
export class InspectionTrackerListComponent {
  private store = inject(InspectionStore);
  private notify = inject(NotificationService);

  readonly activeTab = signal<'grid' | 'vessel-matrix'>('grid');
  readonly selectedMatrixVessel = signal<string>('MV Pacific Voyager');

  readonly searchQuery = signal('');
  readonly vesselFilter = signal('ALL');
  readonly categoryFilter = signal('ALL');
  readonly statusFilter = signal('ALL');

  readonly sortCol = signal<keyof InspectionRecord>('dateOfInspection');
  readonly sortAsc = signal<boolean>(false);

  // Matrix Filter & Sort signals
  readonly matrixSearchQuery = signal<string>('');
  readonly matrixCategoryFilter = signal<string>('ALL');
  readonly matrixStatusFilter = signal<string>('ALL');
  readonly matrixSortCol = signal<string>('name');
  readonly matrixSortAsc = signal<boolean>(true);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);

  readonly expandedRows = signal<Record<string, boolean>>({});

  public hseqState = inject(HseqStateService);

  readonly availableVessels = computed(() => {
    const fromMaster = this.hseqState.vesselNames();
    const fromRecords = this.rawRecords().map(r => r.vesselName);
    return Array.from(new Set([...fromMaster, ...fromRecords])).filter(Boolean).sort();
  });

  readonly rawRecords = this.store.records;

  readonly matrixVesselList = computed(() => {
    return this.availableVessels();
  });

  private readonly standardPrograms = [
    { name: 'Internal Safety Audit (ISM Code)', defaultCategory: 'Internal', frequency: 'Annual', defaultInterval: 365 },
    { name: 'ISPS Security Verification Audit', defaultCategory: 'Internal', frequency: 'Annual', defaultInterval: 365 },
    { name: 'MLC 2006 Maritime Labour Inspection', defaultCategory: 'Internal', frequency: 'Bi-Annual', defaultInterval: 730 },
    { name: 'Annual Class Survey (Hull & Machinery)', defaultCategory: 'External', frequency: 'Annual', defaultInterval: 365 },
    { name: 'Port State Control (PSC MOU) Audit', defaultCategory: 'External', frequency: 'Periodic', defaultInterval: 180 },
    { name: 'Navigational & Bridge Operations Audit', defaultCategory: 'Internal', frequency: 'Semi-Annual', defaultInterval: 180 },
    { name: 'Environmental & MARPOL Compliance', defaultCategory: 'Internal', frequency: 'Annual', defaultInterval: 365 },
    { name: 'Radio & GMDSS Statutory Survey', defaultCategory: 'External', frequency: 'Annual', defaultInterval: 365 }
  ];

  readonly currentVesselSchedule = computed(() => {
    const v = this.selectedMatrixVessel();
    const vesselRecords = this.rawRecords().filter(r => r.vesselName === v);

    const takeoverDate = vesselRecords[0]?.takeoverDate || '10-Jan-2025';
    const inspector = vesselRecords[0]?.nameOfInspectors || vesselRecords[0]?.inspectorName || 'Capt. R. Sterling / HSEQ Lead Auditor';

    const items: Array<{
      id: string;
      name: string;
      category: string;
      frequency: string;
      period: string;
      date: string;
      nextDate: string;
      status: string;
    }> = [];

    const added = new Set<string>();

    for (const r of vesselRecords) {
      const progName = r.categoryOfInspection || r.typeOfInspection || 'Audit';
      const freq = r.intervalDays ? (r.intervalDays >= 360 ? 'Annual' : r.intervalDays >= 180 ? 'Semi-Annual' : `${r.intervalDays} Days`) : 'Periodic';
      items.push({
        id: r.id,
        name: progName,
        category: r.typeOfInspection || 'Internal',
        frequency: freq,
        period: r.period || 'Q3 2026',
        date: r.dateOfInspection || '-',
        nextDate: r.dueDate || r.nextDue || '-',
        status: r.status || 'Planned'
      });
      added.add(progName.toLowerCase());
    }

    for (const sp of this.standardPrograms) {
      if (!added.has(sp.name.toLowerCase())) {
        items.push({
          id: `STD-${sp.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: sp.name,
          category: sp.defaultCategory,
          frequency: sp.frequency,
          period: 'Q3 2026',
          date: '2026-08-15',
          nextDate: '2027-08-15',
          status: sp.defaultCategory === 'External' ? 'Completed' : 'Closed'
        });
      }
    }

    return {
      vesselName: v,
      takeoverDate,
      inspector,
      items
    };
  });

  readonly filteredMatrixItems = computed(() => {
    const sched = this.currentVesselSchedule();
    if (!sched) return [];
    const q = this.matrixSearchQuery().toLowerCase().trim();
    const cat = this.matrixCategoryFilter();
    const st = this.matrixStatusFilter();

    let list = sched.items.filter(item => {
      const matchCat = cat === 'ALL' || item.category === cat;
      const matchStatus = st === 'ALL' || item.status === st;
      const matchQ = !q || (item.name.toLowerCase().includes(q) || item.period.toLowerCase().includes(q) || item.frequency.toLowerCase().includes(q));
      return matchCat && matchStatus && matchQ;
    });

    const col = this.matrixSortCol();
    const asc = this.matrixSortAsc() ? 1 : -1;

    list.sort((a, b) => {
      if (col === 'date' || col === 'nextDate') {
        const tA = this.parseMaritimeDate((a as any)[col]);
        const tB = this.parseMaritimeDate((b as any)[col]);
        if (tA === tB) return 0;
        if (tA <= 0) return 1;
        if (tB <= 0) return -1;
        return (tA - tB) * asc;
      }
      const valA = ((a as any)[col] ?? '').toString().toLowerCase();
      const valB = ((b as any)[col] ?? '').toString().toLowerCase();
      return valA.localeCompare(valB) * asc;
    });

    return list;
  });

  isMatrixFiltered(): boolean {
    return !!this.matrixSearchQuery().trim() || this.matrixCategoryFilter() !== 'ALL' || this.matrixStatusFilter() !== 'ALL';
  }

  resetMatrixFilters(): void {
    this.matrixSearchQuery.set('');
    this.matrixCategoryFilter.set('ALL');
    this.matrixStatusFilter.set('ALL');
  }

  toggleMatrixSort(col: string): void {
    if (this.matrixSortCol() === col) {
      this.matrixSortAsc.set(!this.matrixSortAsc());
    } else {
      this.matrixSortCol.set(col);
      this.matrixSortAsc.set(true);
    }
  }

  getMatrixSortIcon(col: string): string {
    if (this.matrixSortCol() !== col) return 'unfold_more';
    return this.matrixSortAsc() ? 'arrow_upward' : 'arrow_downward';
  }

  isExpanded(id: string): boolean {
    return !!this.expandedRows()[id];
  }

  toggleRow(id: string): void {
    const current = { ...this.expandedRows() };
    current[id] = !current[id];
    this.expandedRows.set(current);
  }

  toggleAll(expand: boolean): void {
    const next: Record<string, boolean> = {};
    if (expand) {
      for (const item of this.filteredRecords()) {
        next[item.id] = true;
      }
    }
    this.expandedRows.set(next);
  }

  readonly allExpanded = computed(() => {
    const list = this.filteredRecords();
    if (list.length === 0) return false;
    const current = this.expandedRows();
    return list.every(i => !!current[i.id]);
  });

  getNextStatusClass(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('overdue')) return 'next-overdue';
    if (s.includes('window open') || s.includes('due')) return 'next-window';
    if (s.includes('completed') || s.includes('closed')) return 'next-completed';
    return 'next-scheduled';
  }

  getStatusPillClass(status?: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('closed') || s.includes('completed') || s.includes('valid')) return 'status-closed';
    if (s.includes('in progress') || s.includes('scheduled') || s.includes('investigating')) return 'status-in-progress';
    if (s.includes('overdue') || s.includes('critical') || s.includes('expired')) return 'status-critical';
    if (s.includes('draft') || s.includes('inactive')) return 'status-draft';
    return 'status-open';
  }

  // Child Finding Management
  readonly isFindingModalOpen = signal(false);
  readonly activeInspection = signal<any>(null);
  readonly editingFindingId = signal<string | null>(null);
  readonly findingModalError = signal('');

  findingForm = {
    findingDescription: '',
    aoc: 'Technical',
    subAoc: 'Machinery Maintenance',
    rating: 'Medium' as 'High' | 'Medium' | 'Low',
    picDetails: 'Chief Engineer',
    correctiveAction: '',
    dueDate: '',
    closureDate: '',
    status: 'Open' as 'Open' | 'Closed'
  };

  openAddFindingModal(rec: any, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.activeInspection.set(rec);
    this.editingFindingId.set(null);
    this.findingModalError.set('');
    this.findingForm = {
      findingDescription: '',
      aoc: 'Technical',
      subAoc: 'Machinery Maintenance',
      rating: 'Medium',
      picDetails: rec.picName || rec.nameOfInspectors || 'Chief Engineer',
      correctiveAction: '',
      dueDate: new Date().toISOString().substring(0, 10),
      closureDate: '',
      status: 'Open'
    };
    this.isFindingModalOpen.set(true);
    if (!this.isExpanded(rec.id)) {
      this.toggleRow(rec.id);
    }
  }

  openEditFindingModal(rec: any, finding: any, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.activeInspection.set(rec);
    this.editingFindingId.set(finding.id);
    this.findingModalError.set('');
    this.findingForm = {
      findingDescription: finding.findingDescription || finding.description || '',
      aoc: finding.aoc || 'Technical',
      subAoc: finding.subAoc || 'Machinery Maintenance',
      rating: (finding.rating || finding.observationRating || 'Medium') as 'High' | 'Medium' | 'Low',
      picDetails: finding.picDetails || rec.picName || 'Chief Engineer',
      correctiveAction: finding.correctiveAction || '',
      dueDate: finding.dueDate || '',
      closureDate: finding.closureDate || '',
      status: (finding.status || 'Open') as 'Open' | 'Closed'
    };
    this.isFindingModalOpen.set(true);
  }

  closeFindingModal(): void {
    this.isFindingModalOpen.set(false);
    this.activeInspection.set(null);
    this.editingFindingId.set(null);
    this.findingModalError.set('');
  }

  onFindingStatusChange(newStatus: 'Open' | 'Closed'): void {
    if (newStatus === 'Closed' && !this.findingForm.closureDate) {
      this.findingForm.closureDate = new Date().toISOString().substring(0, 10);
    } else if (newStatus === 'Open') {
      this.findingForm.closureDate = '';
    }
  }

  saveFindingModal(): void {
    const desc = this.findingForm.findingDescription.trim();
    if (!desc) {
      this.findingModalError.set('Please provide a deficiency / finding description.');
      return;
    }
    const rec = this.activeInspection();
    if (!rec) return;

    if (this.editingFindingId()) {
      this.store.updateFinding(rec.id, this.editingFindingId()!, {
        findingDescription: desc,
        description: desc,
        aoc: this.findingForm.aoc,
        subAoc: this.findingForm.subAoc,
        rating: this.findingForm.rating,
        picDetails: this.findingForm.picDetails,
        correctiveAction: this.findingForm.correctiveAction,
        dueDate: this.findingForm.dueDate,
        closureDate: this.findingForm.status === 'Closed' ? (this.findingForm.closureDate || new Date().toISOString().substring(0, 10)) : '',
        status: this.findingForm.status
      });
      this.notify.showSuccess('Finding Updated', 'Child finding updated and inspection counts recalculated.');
    } else {
      this.store.addFinding(rec.id, {
        findingDescription: desc,
        description: desc,
        aoc: this.findingForm.aoc,
        subAoc: this.findingForm.subAoc,
        rating: this.findingForm.rating,
        picDetails: this.findingForm.picDetails,
        correctiveAction: this.findingForm.correctiveAction,
        dueDate: this.findingForm.dueDate,
        closureDate: this.findingForm.status === 'Closed' ? (this.findingForm.closureDate || new Date().toISOString().substring(0, 10)) : '',
        status: this.findingForm.status
      });
      this.notify.showSuccess('Finding Added', 'New child finding added. Inspection counts automatically updated.');
    }

    this.closeFindingModal();
  }

  deleteFindingItem(rec: any, finding: any, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete finding "${finding.id}"? Inspection summary counts will automatically recalculate.`)) {
      this.store.deleteFinding(rec.id, finding.id);
      this.notify.showSuccess('Finding Deleted', 'Child finding deleted and summary counts updated.');
    }
  }

  getFindingsForInspection(rec: any): any[] {
    if (rec.findings && rec.findings.length > 0) {
      return rec.findings;
    }
    return [];
  }

  readonly kpis = computed(() => {
    const all = this.rawRecords();
    return {
      total: all.length,
      closed: all.filter(r => r.status === 'Closed' || r.status === 'Completed').length,
      open: all.filter(r => r.status === 'Open' || r.status === 'In Progress').length,
      totalFindings: all.reduce((sum, r) => sum + (r.findingsTotal || 0), 0)
    };
  });

  isFiltered(): boolean {
    return !!this.searchQuery().trim() || this.vesselFilter() !== 'ALL' || this.categoryFilter() !== 'ALL' || this.statusFilter() !== 'ALL';
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.vesselFilter.set('ALL');
    this.categoryFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.currentPage.set(1);
  }

  toggleSort(col: keyof InspectionRecord): void {
    if (this.sortCol() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  getSortIcon(col: keyof InspectionRecord): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortAsc() ? 'arrow_upward' : 'arrow_downward';
  }

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

  readonly filteredRecords = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const vFilter = this.vesselFilter();
    const cFilter = this.categoryFilter();
    const sFilter = this.statusFilter();

    let res = this.rawRecords().filter(r => {
      const matchVessel = vFilter === 'ALL' || r.vesselName === vFilter;
      const matchCat = cFilter === 'ALL' || r.categoryOfInspection === cFilter;
      const matchStatus = sFilter === 'ALL' || r.status === sFilter;

      let matchQuery = true;
      if (q) {
        const text = [
          r.vesselName, r.vesselType, r.typeOfInspection,
          r.categoryOfInspection, r.period, r.inspectorName, r.nameOfInspectors,
          r.typeOfInspectors, r.statusNextInspection, r.status
        ].join(' ').toLowerCase();
        matchQuery = text.includes(q);
      }

      return matchVessel && matchCat && matchStatus && matchQuery;
    });

    const key = this.sortCol();
    const dir = this.sortAsc() ? 1 : -1;

    res.sort((a, b) => {
      if (key === 'dateOfInspection' || key === 'nextDue' || key === 'dueDate' || key === 'takeoverDate') {
        const tA = this.parseMaritimeDate((a as any)[key]);
        const tB = this.parseMaritimeDate((b as any)[key]);
        if (tA === tB) return 0;
        if (tA <= 0) return 1;
        if (tB <= 0) return -1;
        return (tA - tB) * dir;
      }

      if (typeof (a as any)[key] === 'number' && typeof (b as any)[key] === 'number') {
        return (((a as any)[key] as number) - ((b as any)[key] as number)) * dir;
      }

      const valA = ((a as any)[key] ?? '').toString().toLowerCase().trim();
      const valB = ((b as any)[key] ?? '').toString().toLowerCase().trim();
      if (valA === valB) return 0;
      return valA.localeCompare(valB) * dir;
    });

    return res;
  });

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredRecords().length / this.pageSize()));
  });

  readonly paginatedRecords = computed(() => {
    const list = this.filteredRecords();
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  exportCsv(): void {
    const rows = this.filteredRecords().map(r =>
      `"${r.vesselName}","${r.takeoverDate || ''}","${r.vesselType}","${r.typeOfInspection}","${r.categoryOfInspection}","${r.period}","${r.dateOfInspection}",${r.findingsTotal},${r.findingsHigh},${r.findingsMedium},${r.findingsLow},${r.closedTotal},${r.closedHigh},${r.closedMedium},${r.closedLow},"${r.nameOfInspectors || r.inspectorName || ''}","${r.typeOfInspectors || ''}","${r.dueDate || ''}","${r.dueWindow || ''}",${r.intervalDays || 90},"${r.windowOpening || ''}","${r.statusNextInspection || ''}","${r.status}"`
    );
    const csv = ['Vessel Name,Takeover Date,Vessel Type,Type Of Inspection,Category Of Inspection,Period,Date Of Inspection,Total Findings,High Findings,Med Findings,Low Findings,Total Closed,High Closed,Med Closed,Low Closed,Name Of Inspectors,Type Of Inspectors,Due Date,Due Window,Interval (Days),Window Opening,Status Of Next Inspection,Status Of Inspection', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'inspection-tracker-running-sheet.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  deleteInspection(id: string, vesselName: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete inspection ${id} for ${vesselName}?`)) {
      this.store.delete(id);
      this.notify.showSuccess('Inspection Deleted', `Inspection ${id} has been removed.`);
    }
  }
}
