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
import { OnHireStore } from '../../core/stores/on-hire.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

export interface OnHireRecord {
  id: string;
  vesselName: string;
  takeoverDate: string;
  vesselType: string;
  categoryOfInspection: string;
  dateOfInspection: string;
  findingsHigh: number;
  findingsMedium: number;
  findingsLow: number;
  findingsTotal: number;
  closedHigh: number;
  closedMedium: number;
  closedLow: number;
  closedTotal: number;
  status: string;
  inspectors: string;
  findings?: any[];
}

export type OnHireInspection = OnHireRecord;

export interface OnHireFinding {
  id: string;
  vesselName: string;
  takeoverDate: string;
  vesselType: string;
  typeOfInspection: string;
  dateOfInspection: string;
  description: string;
  dept: string;
  rating: string;
  dueDate: string;
  closureDate: string;
  status: string;
}

@Component({
  selector: 'app-on-hire-inspection-list',
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
        title="On Hire Inspection Tracker"
        subtitle="Vessel On-Hire Acceptance Inspections with Interactive Master-Detail Findings Sub-Grid"
        icon="fact_check"
        [breadcrumbs]="[{label: 'Overview', link: '/on-hire-inspection'}, {label: 'On Hire Inspections'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportCsv()">
            <mat-icon>file_download</mat-icon> Export CSV
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/on-hire-inspection/create">
            <mat-icon>add</mat-icon> New On-Hire
          </button>
        </div>
      </app-page-header>

      <!-- KPI Overview Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.04 230 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.12 230)">anchor</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">On-Hire Vessels</div>
            <div class="kpi-value">{{ kpis().total }}</div>
            <div class="kpi-sub">Accepted vessels</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.93 0.05 145 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.15 145)">verified</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Closed Inspections</div>
            <div class="kpi-value text-green">{{ kpis().closed }}</div>
            <div class="kpi-sub">All punchlist items rectified</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.94 0.06 75 / 0.5)">
            <mat-icon style="color: oklch(0.50 0.15 75)">pending</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Open / Action Needed</div>
            <div class="kpi-value text-amber">{{ kpis().open }}</div>
            <div class="kpi-sub">Active punchlist pending</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.06 25 / 0.5)">
            <mat-icon style="color: oklch(0.52 0.18 25)">report_problem</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Findings</div>
            <div class="kpi-value text-primary">{{ kpis().findings }}</div>
            <div class="kpi-sub">In nested child grids</div>
          </div>
        </div>
      </div>

      <!-- Unified Reusable Search & Filter Bar -->
      <app-search-filter
        searchLabel="Search On-Hire Register"
        placeholder="Search vessel, type, inspectors, status, or deficiency description..."
        [searchQuery]="searchQuery()"
        (searchQueryChange)="onSearchQueryChange($event)"
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
          <label class="filter-label">Status</label>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Statuses</option>
            <option value="Closed">Closed</option>
            <option value="Open">Open</option>
          </select>
        </div>
      </app-search-filter>

      <!-- Main Master Table (With Nested Child Grid) -->
      <div class="hseq-card table-card">
        <div class="table-card-header">
          <div class="header-info">
            <div class="d-flex align-items-center gap-2">
              <h2 class="table-card-title">On-Hire Inspections (Master Grid)</h2>
              <span class="grid-badge">Grid inside Grid</span>
            </div>
            <span class="table-card-count">
              Showing {{ paginatedRunning().length }} of {{ filteredRunning().length }} inspections
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
                <th class="col-expand" style="width: 44px; text-align: center;"></th>
                <th class="col-vessel sortable-th" (click)="toggleSortRunning('vesselName')">
                  Vessel Name
                  <mat-icon class="sort-icon">{{ getSortIconRunning('vesselName') }}</mat-icon>
                </th>
                <th class="col-type sortable-th" (click)="toggleSortRunning('vesselType')">
                  Vessel Type
                  <mat-icon class="sort-icon">{{ getSortIconRunning('vesselType') }}</mat-icon>
                </th>
                <th class="col-date sortable-th" (click)="toggleSortRunning('takeoverDate')">
                  Takeover Date
                  <mat-icon class="sort-icon">{{ getSortIconRunning('takeoverDate') }}</mat-icon>
                </th>
                <th class="col-date sortable-th" (click)="toggleSortRunning('dateOfInspection')">
                  Date of Inspection
                  <mat-icon class="sort-icon">{{ getSortIconRunning('dateOfInspection') }}</mat-icon>
                </th>
                <th class="col-findings sortable-th" (click)="toggleSortRunning('findingsTotal')">
                  Findings (H / M / L)
                  <mat-icon class="sort-icon">{{ getSortIconRunning('findingsTotal') }}</mat-icon>
                </th>
                <th class="col-findings sortable-th" (click)="toggleSortRunning('closedTotal')">
                  Closed (H / M / L)
                  <mat-icon class="sort-icon">{{ getSortIconRunning('closedTotal') }}</mat-icon>
                </th>
                <th class="col-inspector sortable-th" (click)="toggleSortRunning('inspectors')">
                  Inspectors
                  <mat-icon class="sort-icon">{{ getSortIconRunning('inspectors') }}</mat-icon>
                </th>
                <th class="col-status sortable-th" (click)="toggleSortRunning('status')">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIconRunning('status') }}</mat-icon>
                </th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            @if (paginatedRunning().length > 0) {
              <tbody>
                @for (insp of paginatedRunning(); track insp.id) {
                  <!-- MASTER PARENT ROW -->
                  <tr 
                    class="data-row master-row" 
                    [class.is-expanded]="isExpanded(insp.id)"
                    (click)="toggleRow(insp.id)">
                    
                    <!-- Expand/Collapse Chevron Button -->
                    <td class="col-expand" style="text-align: center;" (click)="$event.stopPropagation()">
                      <button 
                        type="button" 
                        class="row-expand-btn" 
                        [class.expanded]="isExpanded(insp.id)"
                        (click)="toggleRow(insp.id)"
                        [title]="isExpanded(insp.id) ? 'Click to collapse findings' : 'Click to expand findings'">
                        <mat-icon class="expand-icon">{{ isExpanded(insp.id) ? 'keyboard_arrow_down' : 'keyboard_arrow_right' }}</mat-icon>
                      </button>
                    </td>

                    <!-- Vessel Name -->
                    <td class="col-vessel">
                      <div class="vessel-badge">
                        <mat-icon class="vessel-icon">directions_boat</mat-icon>
                        <span class="vessel-text">{{ insp.vesselName }}</span>
                      </div>
                    </td>

                    <!-- Vessel Type -->
                    <td class="col-type">
                      <span class="type-text">{{ insp.vesselType }}</span>
                    </td>

                    <!-- Takeover Date -->
                    <td class="col-date">{{ insp.takeoverDate }}</td>

                    <!-- Date of Inspection -->
                    <td class="col-date">{{ insp.dateOfInspection }}</td>

                    <!-- Findings Breakdown (Clickable to view sub-grid) -->
                    <td class="col-findings" (click)="$event.stopPropagation(); toggleRow(insp.id)">
                      <div class="findings-chip interactive" [title]="'Click to view ' + insp.findingsTotal + ' findings in sub-grid'">
                        <span class="f-total">{{ insp.findingsTotal }}</span>
                        <span class="f-split">({{ insp.findingsHigh }}H / {{ insp.findingsMedium }}M / {{ insp.findingsLow }}L)</span>
                        <mat-icon class="chip-arrow">{{ isExpanded(insp.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                      </div>
                    </td>

                    <!-- Closed Breakdown -->
                    <td class="col-findings">
                      <div class="findings-chip">
                        <span class="f-total text-green">{{ insp.closedTotal }}</span>
                        <span class="f-split">({{ insp.closedHigh }}H / {{ insp.closedMedium }}M / {{ insp.closedLow }}L)</span>
                      </div>
                    </td>

                    <!-- Inspectors -->
                    <td class="col-inspector">
                      <div class="inspector-box" [title]="insp.inspectors">
                        <mat-icon class="ins-icon">person</mat-icon>
                        <span class="ins-name">{{ insp.inspectors || '-' }}</span>
                      </div>
                    </td>

                    <!-- Status -->
                    <td class="col-status">
                      <span class="status-pill" [ngClass]="insp.status === 'Closed' ? 'status-closed' : 'status-open'">
                        <span class="status-dot"></span>
                        {{ insp.status }}
                      </span>
                    </td>

                    <!-- Action: Edit and Delete -->
                    <td class="col-actions" (click)="$event.stopPropagation()">
                      <div class="actions-group">
                        <a 
                          class="btn-edit-action" 
                          [routerLink]="['/on-hire-inspection/edit', insp.id]"
                          title="Edit Inspection">
                          <mat-icon class="btn-icon">edit</mat-icon>
                        </a>
                        <button 
                          type="button"
                          class="btn-delete-action"
                          (click)="deleteInspection(insp.id, insp.vesselName, $event)"
                          title="Delete Inspection">
                          <mat-icon class="btn-icon">delete_outline</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>

                  <!-- NESTED CHILD GRID (GRID INSIDE GRID) -->
                  @if (isExpanded(insp.id)) {
                    <tr class="nested-subgrid-row">
                      <td colspan="10" class="nested-subgrid-cell">
                        <div class="subgrid-card">
                          
                          <!-- Sub-Grid Header Strip -->
                          <div class="subgrid-header">
                            <div class="subgrid-title-info">
                              <div class="subgrid-title-badge">
                                <mat-icon class="subgrid-icon">account_tree</mat-icon>
                                <span class="subgrid-title">Child Findings Grid: {{ insp.vesselName }}</span>
                              </div>
                              <span class="findings-count-pill">
                                {{ getFindingsForInspection(insp).length }} Deficiency Records
                              </span>
                              <div class="subgrid-stats-chips">
                                <span class="stat-tag high">High: {{ insp.findingsHigh }}</span>
                                <span class="stat-tag med">Medium: {{ insp.findingsMedium }}</span>
                                <span class="stat-tag low">Low: {{ insp.findingsLow }}</span>
                                <span class="stat-tag closed">Closed: {{ insp.closedTotal }}</span>
                              </div>
                              <button type="button" class="btn-add-finding" (click)="openAddFindingModal(insp, $event)">
                                <mat-icon>add_circle</mat-icon>
                                <span>Add Finding</span>
                              </button>
                            </div>
                            <div class="subgrid-meta">
                              Inspection: {{ insp.dateOfInspection }} | Takeover: {{ insp.takeoverDate }}
                            </div>
                          </div>

                          <!-- Sub-Grid Table -->
                          @if (getFindingsForInspection(insp).length > 0) {
                            <div class="subgrid-table-wrapper">
                              <table class="subgrid-table">
                                <thead>
                                  <tr>
                                    <th class="sg-col-num" style="width: 45px;">#</th>
                                    <th class="sg-col-id" style="width: 95px;">Finding ID</th>
                                    <th class="sg-col-date" style="width: 105px;">Date</th>
                                    <th class="sg-col-desc">Deficiency / Finding Description</th>
                                    <th class="sg-col-dept" style="width: 100px;">Dept</th>
                                    <th class="sg-col-rating" style="width: 95px;">Rating</th>
                                    <th class="sg-col-date" style="width: 105px;">Closure Date</th>
                                    <th class="sg-col-status" style="width: 95px;">Status</th>
                                    <th class="sg-col-actions" style="width: 85px; text-align: center;">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (f of getFindingsForInspection(insp); track f.id; let idx = $index) {
                                    <tr class="subgrid-row">
                                      <td class="sg-col-num">
                                        <span class="sg-num-badge">{{ idx + 1 }}</span>
                                      </td>
                                      <td class="sg-col-id">
                                        <span class="fnd-id">{{ f.id }}</span>
                                      </td>
                                      <td class="sg-col-date">
                                        <span class="fnd-date">{{ f.dateOfInspection || insp.dateOfInspection }}</span>
                                      </td>
                                      <td class="sg-col-desc">
                                        <div class="fnd-desc-wrap">{{ f.description || f.findings }}</div>
                                      </td>
                                      <td class="sg-col-dept">
                                        <span class="dept-badge">{{ f.dept || f.category || 'Deck' }}</span>
                                      </td>
                                      <td class="sg-col-rating">
                                        <span class="rating-badge" [ngClass]="'rating-' + (f.rating || f.riskRating || 'low').toLowerCase()">
                                          {{ f.rating || f.riskRating }}
                                        </span>
                                      </td>
                                      <td class="sg-col-date">
                                        <span class="fnd-closure">{{ f.closureDate || f.completionDate || '-' }}</span>
                                      </td>
                                      <td class="sg-col-status">
                                        <span class="status-pill" [ngClass]="f.status === 'Closed' ? 'status-closed' : 'status-open'">
                                          <span class="status-dot"></span>
                                          {{ f.status }}
                                        </span>
                                      </td>
                                      <td class="sg-col-actions" style="text-align: center;" (click)="$event.stopPropagation()">
                                        <div class="sg-actions-row">
                                          <button type="button" class="btn-sg-edit" (click)="openEditFindingModal(insp, f, $event)" title="Edit Finding">
                                            <mat-icon>edit</mat-icon>
                                          </button>
                                          <button type="button" class="btn-sg-delete" (click)="deleteFindingItem(insp, f, $event)" title="Delete Finding">
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
                                <p>This vessel inspection passed all punchlist criteria with zero deficiencies.</p>
                              </div>
                              <button type="button" class="btn-add-finding empty-add-btn" (click)="openAddFindingModal(insp, $event)">
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
                  <td colspan="10">
                    <app-empty-state 
                      icon="fact_check" 
                      title="No On-Hire Inspections Found" 
                      message="No records match your current filters.">
                    </app-empty-state>
                  </td>
                </tr>
              </tbody>
            }
          </table>
        </div>

        @if (totalRunningPages() > 1) {
          <div class="pagination-footer">
            <span class="page-info">Page {{ currentPage() }} of {{ totalRunningPages() }}</span>
            <div class="page-buttons">
              <button type="button" class="page-nav-btn" [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">
                <mat-icon>chevron_left</mat-icon> Previous
              </button>
              <button type="button" class="page-nav-btn" [disabled]="currentPage() === totalRunningPages()" (click)="currentPage.set(currentPage() + 1)">
                Next <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- ADD / EDIT FINDING MODAL -->
    @if (isFindingModalOpen()) {
      <div class="finding-modal-backdrop" (click)="closeFindingModal()">
        <div class="finding-modal-card" (click)="$event.stopPropagation()">
          <div class="finding-modal-header">
            <div class="fmodal-titles">
              <mat-icon class="fmodal-icon">{{ editingFindingId() ? 'edit_note' : 'add_circle' }}</mat-icon>
              <div>
                <h3 class="fmodal-title">{{ editingFindingId() ? 'Edit Finding Record' : 'Add Child Finding' }}</h3>
                <p class="fmodal-sub">{{ activeInspection()?.vesselName }} &bull; {{ activeInspection()?.categoryOfInspection }}</p>
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
              <label class="fmodal-label">Deficiency / Finding Description <span class="req">*</span></label>
              <textarea 
                rows="3" 
                class="fmodal-textarea" 
                [(ngModel)]="findingForm.description" 
                placeholder="Enter detailed description of deficiency observed on board..."></textarea>
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

            <div class="fmodal-grid-2">
              <div class="fmodal-field-group">
                <label class="fmodal-label">Dept / By Who</label>
                <input type="text" class="fmodal-input" [(ngModel)]="findingForm.dept" placeholder="e.g. deck, eng, deck/eng, CE, PE, Master" list="onHireDepts">
                <datalist id="onHireDepts">
                  <option value="deck">Deck Department</option>
                  <option value="eng">Engine Department</option>
                  <option value="deck/eng">Deck & Engine Joint</option>
                  <option value="CE">Chief Engineer</option>
                  <option value="PE">Port Engineer</option>
                  <option value="Master">Master</option>
                  <option value="Safety">Safety Officer</option>
                </datalist>
              </div>

              <div class="fmodal-field-group">
                <label class="fmodal-label">Category / Area</label>
                <input type="text" class="fmodal-input" [(ngModel)]="findingForm.category" placeholder="e.g. Life Saving Appliances, Fire Safety, Hull">
              </div>
            </div>

            <div class="fmodal-grid-2">
              <div class="fmodal-field-group">
                <label class="fmodal-label">Due Date</label>
                <input type="date" class="fmodal-input" [(ngModel)]="findingForm.dueDate">
              </div>

              <div class="fmodal-field-group">
                <label class="fmodal-label">Closure Date</label>
                <input type="date" class="fmodal-input" [(ngModel)]="findingForm.closureDate" [disabled]="findingForm.status !== 'Closed'">
                <span class="fmodal-hint" *ngIf="findingForm.status !== 'Closed'">Available when Status is Closed</span>
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
    .align-items-center { align-items: center; }

    /* KPIs Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; margin-bottom: 12px; }
    .kpi-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; gap: 10px; align-items: center; box-shadow: var(--shadow-2xs); }
    .kpi-icon-wrap { width: 36px; height: 36px; border-radius: var(--radius-sm); display: grid; place-items: center; flex-shrink: 0; }
    .kpi-icon-wrap mat-icon { font-size: 19px; width: 19px; height: 19px; }
    .kpi-label { font-size: 11.5px; color: var(--muted-foreground); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .kpi-value { font-size: 21px; font-weight: 700; color: var(--foreground); line-height: 1.1; margin: 1px 0 0; }
    .kpi-sub { font-size: 11px; color: var(--muted-foreground); margin-top: 1px; }

    .text-green { color: oklch(0.42 0.15 145) !important; }
    .text-amber { color: oklch(0.55 0.18 65) !important; }
    .text-primary { color: var(--primary) !important; }

    .btn-export { height: 34px !important; border-radius: var(--radius-sm) !important; font-family: inherit !important; font-size: 12px !important; }
    .btn-primary-action { height: 34px !important; border-radius: var(--radius-sm) !important; background: var(--primary) !important; color: var(--primary-foreground) !important; font-family: inherit !important; font-size: 12px !important; }

    /* Table Card */
    .hseq-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-2xs); }
    .table-card { overflow: hidden; }
    .table-card-header { padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background-color: var(--card); flex-wrap: wrap; gap: 10px; }
    .table-card-title { font-size: 14.5px; font-weight: 700; color: var(--foreground); margin: 0; }
    .grid-badge { font-size: 11px; font-weight: 700; background: oklch(0.92 0.05 240); color: oklch(0.40 0.15 240); padding: 2px 7px; border-radius: 9999px; }
    .table-card-count { font-size: 12px; color: var(--muted-foreground); margin-top: 2px; display: block; }
    .search-indicator { color: var(--primary); font-weight: 600; margin-left: 4px; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    
    .btn-toggle-all {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--card); border: 1px solid var(--border);
      padding: 4px 10px; border-radius: var(--radius-sm);
      font-size: 11.5px; font-weight: 600; color: var(--foreground);
      cursor: pointer; transition: all 0.15s ease; font-family: inherit;
    }
    .btn-toggle-all:hover { background: var(--accent); border-color: var(--primary); color: var(--primary); }
    .btn-toggle-all mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .excel-tag { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: oklch(0.40 0.12 145); background: oklch(0.94 0.05 145); padding: 3px 8px; border-radius: 9999px; border: 1px solid oklch(0.85 0.08 145); }
    .excel-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Table Grid */
    .table-responsive { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
    .xl-table { width: 100%; min-width: 1250px; border-collapse: collapse; }
    .xl-table th { background: var(--muted); color: var(--muted-foreground); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; text-align: left; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { color: var(--primary); background-color: var(--accent); }
    .sort-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-left: 2px; }
    
    .data-row { border-bottom: 1px solid var(--border); transition: background-color 0.15s ease; cursor: pointer; }
    .data-row:hover { background-color: var(--accent); }
    .data-row.is-expanded { background-color: oklch(0.97 0.01 240); }
    .xl-table td { padding: 7px 12px; font-size: 12.5px; color: var(--foreground); vertical-align: middle; }

    /* Expand button */
    .row-expand-btn {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
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
    .expand-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Badges & Pills */
    .vessel-badge { display: inline-flex; align-items: center; gap: 5px; background: var(--muted); padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .vessel-icon { font-size: 15px; width: 15px; height: 15px; color: var(--primary); }
    .vessel-text { font-weight: 700; font-size: 12px; }
    .type-text { font-size: 12px; color: var(--muted-foreground); }
    
    .findings-chip { display: flex; align-items: center; gap: 5px; }
    .findings-chip.interactive {
      background: var(--muted); padding: 3px 7px; border-radius: var(--radius-sm);
      border: 1px dashed var(--border); cursor: pointer; transition: all 0.15s ease;
    }
    .findings-chip.interactive:hover { border-color: var(--primary); background: var(--accent); }
    .chip-arrow { font-size: 13px; width: 13px; height: 13px; color: var(--muted-foreground); margin-left: 1px; }
    .f-total { font-weight: 700; font-size: 12.5px; }
    .f-split { font-size: 11px; color: var(--muted-foreground); }
    
    .inspector-box { display: flex; align-items: center; gap: 4px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ins-icon { font-size: 15px; width: 15px; height: 15px; color: var(--muted-foreground); }
    .ins-name { font-size: 12px; }

    /* Status Pills */
    .status-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .status-closed { background: oklch(0.93 0.06 145); color: oklch(0.38 0.15 145); border: 1px solid oklch(0.85 0.09 145); }
    .status-closed .status-dot { background: oklch(0.45 0.18 145); }
    .status-open { background: oklch(0.95 0.08 70); color: oklch(0.48 0.18 65); border: 1px solid oklch(0.88 0.10 70); }
    .status-open .status-dot { background: oklch(0.60 0.20 65); }

    /* Actions Group */
    .xl-table th.col-actions,
    .xl-table td.col-actions {
      text-align: center !important;
      padding: 6px 8px !important;
      min-width: 90px;
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
       ========================================================== */
    .nested-subgrid-row {
      background: oklch(0.97 0.01 240 / 0.6);
      border-bottom: 2px solid var(--border);
    }
    .nested-subgrid-cell {
      padding: 0 16px 16px 44px !important;
    }
    .subgrid-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
      border-radius: var(--radius-sm);
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      margin-top: 6px;
    }
    .subgrid-header {
      padding: 12px 16px;
      background: var(--muted);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .subgrid-title-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .subgrid-title-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .subgrid-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary);
    }
    .subgrid-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .findings-count-pill {
      font-size: 11px;
      font-weight: 700;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 3px 8px;
      border-radius: 9999px;
      color: var(--foreground);
    }
    .subgrid-stats-chips {
      display: inline-flex;
      gap: 6px;
    }
    .stat-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: var(--radius-sm);
    }
    .stat-tag.high { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }
    .stat-tag.med { background: oklch(0.94 0.07 70); color: oklch(0.48 0.16 65); }
    .stat-tag.low { background: oklch(0.93 0.05 240); color: oklch(0.40 0.12 240); }
    .stat-tag.closed { background: oklch(0.93 0.06 145); color: oklch(0.38 0.15 145); }

    .subgrid-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .subgrid-meta {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }
    .btn-collapse-subgrid {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      color: var(--muted-foreground);
      cursor: pointer;
      font-family: inherit;
    }
    .btn-collapse-subgrid:hover {
      color: var(--foreground);
      border-color: var(--muted-foreground);
    }
    .btn-collapse-subgrid mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Sub-Grid Table */
    .subgrid-table-wrapper {
      max-height: 420px;
      overflow-y: auto;
      overflow-x: auto;
    }
    .subgrid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .subgrid-table th {
      background: var(--card);
      color: var(--muted-foreground);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 1.5px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 1;
      text-align: left;
    }
    .subgrid-row {
      border-bottom: 1px solid var(--border);
      transition: background-color 0.1s ease;
    }
    .subgrid-row:hover {
      background-color: var(--accent);
    }
    .subgrid-table td {
      padding: 9px 12px;
      vertical-align: middle;
      color: var(--foreground);
    }
    .sg-num-badge {
      display: inline-block;
      width: 22px;
      height: 22px;
      line-height: 22px;
      text-align: center;
      border-radius: 50%;
      background: var(--muted);
      font-size: 10.5px;
      font-weight: 700;
      color: var(--muted-foreground);
    }
    .fnd-id {
      font-family: monospace;
      font-weight: 700;
      font-size: 11.5px;
      color: var(--primary);
    }
    .fnd-date {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }
    .fnd-desc-wrap {
      line-height: 1.4;
      max-width: 520px;
      font-size: 12.5px;
    }
    .dept-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: var(--radius-sm);
      background: var(--muted);
      color: var(--foreground);
      border: 1px solid var(--border);
      text-transform: uppercase;
    }
    .rating-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .rating-badge.rating-high { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }
    .rating-badge.rating-medium { background: oklch(0.94 0.07 70); color: oklch(0.48 0.16 65); }
    .rating-badge.rating-low { background: oklch(0.93 0.05 240); color: oklch(0.40 0.12 240); }
    .fnd-closure {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }
    .subgrid-empty {
      padding: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: oklch(0.40 0.15 145);
      background: oklch(0.97 0.03 145 / 0.3);
    }
    .subgrid-empty mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    .subgrid-empty p {
      margin: 2px 0 0;
      font-size: 12px;
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
      padding: 5px 12px;
      border-radius: var(--radius-sm);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: filter 0.15s ease;
      margin-left: 8px;
    }
    .btn-add-finding:hover { filter: brightness(1.1); }
    .btn-add-finding mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-add-btn { margin-left: 0; }

    .sg-actions-row {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      justify-content: center;
    }
    .btn-sg-edit, .btn-sg-delete {
      width: 26px;
      height: 26px;
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
      font-size: 14px;
      width: 14px;
      height: 14px;
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
      max-width: 580px;
      overflow: hidden;
      animation: modalPop 0.18s ease-out;
    }
    @keyframes modalPop {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .finding-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--muted) / 0.3;
    }
    .fmodal-titles { display: flex; align-items: center; gap: 12px; }
    .fmodal-icon { font-size: 24px; width: 24px; height: 24px; color: var(--primary); }
    .fmodal-title { font-size: 15px; font-weight: 700; color: var(--foreground); margin: 0; }
    .fmodal-sub { font-size: 12px; color: var(--muted-foreground); margin: 2px 0 0; }
    .fmodal-close-btn {
      background: none; border: none; cursor: pointer; color: var(--muted-foreground);
      display: grid; place-items: center; padding: 4px; border-radius: var(--radius-sm);
    }
    .fmodal-close-btn:hover { color: var(--foreground); background: var(--muted); }
    .fmodal-close-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .finding-modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
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
    .fmodal-field-group { display: flex; flex-direction: column; gap: 5px; }
    .fmodal-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fmodal-label { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; }
    .fmodal-label .req { color: #dc2626; }
    .fmodal-textarea, .fmodal-input, .fmodal-select {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      background: var(--background);
      color: var(--foreground);
      font-size: 13px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease;
      box-sizing: border-box;
    }
    .fmodal-textarea:focus, .fmodal-input:focus, .fmodal-select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px oklch(0.92 0.04 230 / 0.5);
    }
    .fmodal-hint { font-size: 11px; color: var(--muted-foreground); font-style: italic; }

    .finding-modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--muted) / 0.2;
    }
    .btn-fmodal-cancel {
      height: 36px; padding: 0 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--card); color: var(--foreground);
      font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .btn-fmodal-cancel:hover { background: var(--muted); }
    .btn-fmodal-save {
      height: 36px; padding: 0 18px; border-radius: var(--radius-sm);
      border: none; background: var(--primary); color: var(--primary-foreground);
      font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-fmodal-save:hover { filter: brightness(1.08); }
    .btn-fmodal-save mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Pagination */
    .pagination-footer { padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); }
    .page-info { font-size: 12px; color: var(--muted-foreground); }
    .page-buttons { display: flex; gap: 8px; }
    .page-nav-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--border); background: var(--card); border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; color: var(--foreground); }
    .page-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class OnHireInspectionListComponent {
  private store = inject(OnHireStore);
  private notify = inject(NotificationService);

  readonly searchQuery = signal('');
  readonly vesselFilter = signal('ALL');
  readonly statusFilter = signal('ALL');

  readonly sortColRunning = signal<keyof OnHireRecord>('dateOfInspection');
  readonly sortAscRunning = signal<boolean>(false);

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(15);

  readonly expandedRows = signal<Record<string, boolean>>({});
  public hseqState = inject(HseqStateService);

  readonly rawRunning = this.store.records;

  readonly availableVessels = computed(() => {
    return Array.from(new Set([...this.hseqState.vesselNames(), ...this.rawRunning().map(r => r.vesselName)])).filter(Boolean).sort();
  });

  readonly kpis = computed(() => {
    const list = this.rawRunning();
    return {
      total: list.length,
      closed: list.filter(r => r.status === 'Closed').length,
      open: list.filter(r => r.status === 'Open').length,
      findings: list.reduce((s, r) => s + (r.findingsTotal || 0), 0)
    };
  });

  isFiltered(): boolean {
    return !!this.searchQuery().trim() || this.vesselFilter() !== 'ALL' || this.statusFilter() !== 'ALL';
  }

  onSearchQueryChange(val: string): void {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.vesselFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.currentPage.set(1);
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
      for (const item of this.filteredRunning()) {
        next[item.id] = true;
      }
    }
    this.expandedRows.set(next);
  }

  readonly allExpanded = computed(() => {
    const list = this.filteredRunning();
    if (list.length === 0) return false;
    const current = this.expandedRows();
    return list.every(i => !!current[i.id]);
  });

  // Finding Management State Signals
  readonly isFindingModalOpen = signal(false);
  readonly activeInspection = signal<OnHireRecord | null>(null);
  readonly editingFindingId = signal<string | null>(null);
  readonly findingModalError = signal('');

  findingForm = {
    description: '',
    rating: 'Medium' as 'High' | 'Medium' | 'Low',
    status: 'Open' as 'Open' | 'Closed',
    dept: 'deck',
    category: 'Hull & Deck',
    dueDate: '',
    closureDate: ''
  };

  openAddFindingModal(insp: OnHireRecord, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.activeInspection.set(insp);
    this.editingFindingId.set(null);
    this.findingModalError.set('');
    this.findingForm = {
      description: '',
      rating: 'Medium',
      status: 'Open',
      dept: 'deck',
      category: 'Hull & Deck',
      dueDate: new Date().toISOString().substring(0, 10),
      closureDate: ''
    };
    this.isFindingModalOpen.set(true);
    if (!this.isExpanded(insp.id)) {
      this.toggleRow(insp.id);
    }
  }

  openEditFindingModal(insp: OnHireRecord, finding: any, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.activeInspection.set(insp);
    this.editingFindingId.set(finding.id);
    this.findingModalError.set('');
    this.findingForm = {
      description: finding.description || finding.findings || '',
      rating: (finding.rating || finding.riskRating || 'Medium') as 'High' | 'Medium' | 'Low',
      status: (finding.status || 'Open') as 'Open' | 'Closed',
      dept: finding.dept || finding.category || 'deck',
      category: finding.category || 'Hull & Deck',
      dueDate: finding.dueDate || finding.targetDate || '',
      closureDate: finding.closureDate || finding.completionDate || ''
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
    const desc = this.findingForm.description.trim();
    if (!desc) {
      this.findingModalError.set('Please provide a deficiency / finding description.');
      return;
    }
    const insp = this.activeInspection();
    if (!insp) return;

    if (this.editingFindingId()) {
      this.store.updateFinding(insp.id, this.editingFindingId()!, {
        description: desc,
        findings: desc,
        riskRating: this.findingForm.rating,
        rating: this.findingForm.rating,
        status: this.findingForm.status,
        dept: this.findingForm.dept,
        category: this.findingForm.category,
        dueDate: this.findingForm.dueDate,
        targetDate: this.findingForm.dueDate,
        closureDate: this.findingForm.status === 'Closed' ? (this.findingForm.closureDate || new Date().toISOString().substring(0, 10)) : '',
        completionDate: this.findingForm.status === 'Closed' ? (this.findingForm.closureDate || new Date().toISOString().substring(0, 10)) : ''
      });
      this.notify.showSuccess('Finding Updated', 'Child finding updated and summary counts automatically recalculated.');
    } else {
      this.store.addFinding(insp.id, {
        description: desc,
        findings: desc,
        riskRating: this.findingForm.rating,
        rating: this.findingForm.rating,
        status: this.findingForm.status,
        dept: this.findingForm.dept,
        category: this.findingForm.category,
        dueDate: this.findingForm.dueDate,
        targetDate: this.findingForm.dueDate,
        closureDate: this.findingForm.status === 'Closed' ? (this.findingForm.closureDate || new Date().toISOString().substring(0, 10)) : '',
        completionDate: this.findingForm.status === 'Closed' ? (this.findingForm.closureDate || new Date().toISOString().substring(0, 10)) : ''
      });
      this.notify.showSuccess('Finding Added', 'New child finding added. Summary counts automatically updated.');
    }

    this.closeFindingModal();
  }

  deleteFindingItem(insp: OnHireRecord, finding: any, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete finding "${finding.id}"? Summary counts will automatically recalculate.`)) {
      this.store.deleteFinding(insp.id, finding.id);
      this.notify.showSuccess('Finding Deleted', 'Child finding deleted and summary counts updated.');
    }
  }

  getFindingsForInspection(insp: OnHireRecord): any[] {
    if (insp.findings && insp.findings.length > 0) {
      return insp.findings;
    }
    return [];
  }

  toggleSortRunning(col: keyof OnHireRecord): void {
    if (this.sortColRunning() === col) {
      this.sortAscRunning.set(!this.sortAscRunning());
    } else {
      this.sortColRunning.set(col);
      this.sortAscRunning.set(true);
    }
  }

  getSortIconRunning(col: keyof OnHireRecord): string {
    if (this.sortColRunning() !== col) return 'unfold_more';
    return this.sortAscRunning() ? 'arrow_upward' : 'arrow_downward';
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

  readonly filteredRunning = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const vFilter = this.vesselFilter();
    const sFilter = this.statusFilter();

    let res = this.rawRunning().filter(r => {
      const matchV = vFilter === 'ALL' || r.vesselName === vFilter;
      const matchS = sFilter === 'ALL' || r.status === sFilter;
      let matchQ = true;
      if (q) {
        const text = [r.vesselName, r.vesselType, r.inspectors, r.status].join(' ').toLowerCase();
        // Also search within findings descriptions of this inspection
        const findings = this.getFindingsForInspection(r);
        const fText = findings.map(f => `${f.description} ${f.dept} ${f.rating}`).join(' ').toLowerCase();
        matchQ = text.includes(q) || fText.includes(q);
      }
      return matchV && matchS && matchQ;
    });

    const key = this.sortColRunning();
    const dir = this.sortAscRunning() ? 1 : -1;

    res.sort((a, b) => {
      if (key === 'dateOfInspection' || key === 'takeoverDate') {
        const tA = this.parseDate(a[key]);
        const tB = this.parseDate(b[key]);
        if (tA === tB) return 0;
        if (tA <= 0) return 1;
        if (tB <= 0) return -1;
        return (tA - tB) * dir;
      }
      if (typeof a[key] === 'number' && typeof b[key] === 'number') {
        return ((a[key] as number) - (b[key] as number)) * dir;
      }
      const valA = (a[key] ?? '').toString().toLowerCase().trim();
      const valB = (b[key] ?? '').toString().toLowerCase().trim();
      if (valA === valB) return 0;
      return valA.localeCompare(valB) * dir;
    });

    return res;
  });

  readonly totalRunningPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredRunning().length / this.pageSize()));
  });

  readonly paginatedRunning = computed(() => {
    const list = this.filteredRunning();
    const page = Math.min(this.currentPage(), this.totalRunningPages());
    const size = this.pageSize();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  exportCsv(): void {
    const rows = this.filteredRunning().map(r =>
      `"${r.vesselName}","${r.vesselType}","${r.takeoverDate}","${r.dateOfInspection}",${r.findingsTotal},${r.closedTotal},"${r.status}","${r.inspectors}"`
    );
    const csv = ['Vessel,Type,Takeover Date,Inspection Date,Total Findings,Closed Findings,Status,Inspectors', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'on-hire-inspections.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  deleteInspection(id: string, vesselName: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete the On-Hire Inspection for ${vesselName}?`)) {
      this.store.delete(id);
      this.notify.showSuccess('Inspection Deleted', `On-Hire inspection ${id} has been removed.`);
    }
  }
}
