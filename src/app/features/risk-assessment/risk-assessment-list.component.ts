import { Component, computed, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { SearchFilterComponent } from '../../shared/components/search-filter/search-filter.component';
import { RiskAssessmentRecord, MarineRiskFactor, RiskLevel } from '../../core/models/hseq.models';

@Component({
  selector: 'app-risk-assessment-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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
      <!-- Standard Page Header matching PTW -->
      <app-page-header
        title="Risk Assessment & JSA (HIRA) Register"
        subtitle="Manage marine operational hazard identifications, Hierarchy of Controls, ALARP compliance, and PTW interlocks"
        icon="rule"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Risk Assessments'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportRegister()">
            <mat-icon>file_download</mat-icon> Export Register
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" routerLink="/risk-assessment/create">
            <mat-icon>add</mat-icon> Create Risk Assessment
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards (Matching PTW & Inspection Trackers) -->
      <div class="kpi-grid">
        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'ALL' && riskFilter() === 'ALL' && ptwInterlockFilter() === 'ALL'"
          (click)="setStatusFilter('ALL')">
          <div class="kpi-icon-wrap kpi-icon-total">
            <mat-icon>rule</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Active Risk Assessments</div>
            <div class="kpi-value text-primary">{{ activeCount() }}</div>
            <div class="kpi-sub">Approved & live operational</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="statusFilter() === 'Under Review'"
          (click)="setStatusFilter('Under Review')">
          <div class="kpi-icon-wrap kpi-icon-review">
            <mat-icon>pending_actions</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Under Review</div>
            <div class="kpi-value text-amber">{{ reviewCount() }}</div>
            <div class="kpi-sub">Master / HoD sign-off queue</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="riskFilter() === 'High'"
          (click)="setRiskFilter('High')">
          <div class="kpi-icon-wrap kpi-icon-closed">
            <mat-icon>verified_user</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">High/Critical Mitigated</div>
            <div class="kpi-value text-green">{{ highRiskMitigatedCount() }}</div>
            <div class="kpi-sub">ALARP residual verified</div>
          </div>
        </div>

        <div 
          class="kpi-card" 
          [class.kpi-card-selected]="ptwInterlockFilter() === 'LINKED'"
          (click)="toggleLinkedPtwFilter()">
          <div class="kpi-icon-wrap kpi-icon-open">
            <mat-icon>vpn_key</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Linked To Active PTW</div>
            <div class="kpi-value text-blue">{{ linkedPtwCount() }}</div>
            <div class="kpi-sub">Mandatory permit interlock</div>
          </div>
        </div>
      </div>

      <!-- Unified Reusable Search & Filter Bar (Matching PTW & Near Miss Trackers) -->
      <app-search-filter
        searchLabel="Search Register"
        placeholder="Search RA Ref, Activity Title, Vessel, Department, Assessment Type, Approver..."
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

        <!-- Assessment Type Filter: Driven by Master Data -->
        <div class="filter-item">
          <label class="filter-label">Assessment Type</label>
          <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Assessment Types</option>
            @for (t of state.assessmentTypes(); track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>

        <!-- Status Filter: Draft, Under Review, Approved, Rejected, Expired -->
        <div class="filter-item">
          <label class="filter-label">Status</label>
          <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Under Review">Under Review</option>
            <option value="Draft">Draft</option>
            <option value="Rejected">Rejected</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <!-- Risk Level Filter -->
        <div class="filter-item">
          <label class="filter-label">Risk Rating</label>
          <select [ngModel]="riskFilter()" (ngModelChange)="riskFilter.set($event); currentPage.set(1)" class="custom-select">
            <option value="ALL">All Risk Levels</option>
            <option value="High">High / Critical</option>
            <option value="Moderate">Moderate / Medium</option>
            <option value="Low">Low (Negligible)</option>
          </select>
        </div>
      </app-search-filter>

      <!-- Main Register Table (Following the Exact Pattern of Other Modules) -->
      <div class="hseq-card table-card">
        <div class="table-card-header">
          <div class="header-info">
            <h2 class="table-card-title">Risk Assessment & JSA Register</h2>
            <span class="table-card-count">
              Showing {{ paginatedAssessments().length }} of {{ filteredAssessments().length }} assessments
              @if (searchQuery()) {
                <span class="search-indicator">matching "{{ searchQuery() }}"</span>
              }
            </span>
          </div>
          <div class="header-actions">
            <span class="excel-tag">
              <mat-icon class="excel-icon">grid_on</mat-icon> Client Marine HIRA Matrix
            </span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="hseq-table xl-table">
            <thead>
              <tr>
                <th class="col-ref sortable-th" (click)="toggleSort('referenceNo')">
                  RA Reference
                  <mat-icon class="sort-icon">{{ getSortIcon('referenceNo') }}</mat-icon>
                </th>
                <th class="col-activity sortable-th" (click)="toggleSort('activityTitle')">
                  Activity / Operation Scope
                  <mat-icon class="sort-icon">{{ getSortIcon('activityTitle') }}</mat-icon>
                </th>
                <th class="col-vessel sortable-th" (click)="toggleSort('vesselName')">
                  Vessel & Dept
                  <mat-icon class="sort-icon">{{ getSortIcon('vesselName') }}</mat-icon>
                </th>
                <th class="col-risk sortable-th" (click)="toggleSort('initialRisk')">
                  Initial &rarr; Residual Risk
                  <mat-icon class="sort-icon">{{ getSortIcon('initialRisk') }}</mat-icon>
                </th>
                <th class="col-auth sortable-th" (click)="toggleSort('approver')">
                  Assessor / Approver
                  <mat-icon class="sort-icon">{{ getSortIcon('approver') }}</mat-icon>
                </th>
                <th class="col-status sortable-th" (click)="toggleSort('status')">
                  Status
                  <mat-icon class="sort-icon">{{ getSortIcon('status') }}</mat-icon>
                </th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            @if (paginatedAssessments().length > 0) {
              <tbody>
                @for (ra of paginatedAssessments(); track ra.id) {
                  <tr class="data-row">
                    <!-- RA Reference -->
                    <td class="col-ref">
                      <a class="permit-id-link" [routerLink]="['/risk-assessment', ra.id]">
                        <mat-icon class="key-icon">rule</mat-icon>
                        <span class="font-mono">{{ ra.referenceNo }}</span>
                      </a>
                    </td>

                    <!-- Activity / Operation Scope -->
                    <td class="col-activity">
                      <div class="activity-cell-wrapper">
                        <a [routerLink]="['/risk-assessment', ra.id]" class="activity-main-text" [title]="ra.activityTitle">
                          {{ ra.activityTitle }}
                        </a>
                        <div class="activity-sub-text">
                          @if (ra.location) {
                            <span class="location-crumb">{{ ra.location }}</span>
                          }
                          <span class="step-chip">{{ ra.steps.length || 1 }} Hazard Steps</span>
                          @if (ra.linkedPermits && ra.linkedPermits.length > 0) {
                            <span class="linked-ptw-chip" title="Linked to Permit to Work">
                              <mat-icon class="chip-icon">vpn_key</mat-icon> {{ ra.linkedPermits[0] }}
                            </span>
                          }
                        </div>
                      </div>
                    </td>

                    <!-- Vessel & Dept -->
                    <td class="col-vessel">
                      <div class="vessel-badge">
                        <mat-icon class="vessel-icon">directions_boat</mat-icon>
                        <span class="vessel-text">{{ ra.vesselName }}</span>
                      </div>
                      <span class="text-xs text-muted d-block mt-0-5">{{ ra.department }}</span>
                    </td>

                    <!-- Initial -> Residual Risk Reduction Flow -->
                    <td class="col-risk">
                      <div class="risk-reduction-flow">
                        <span class="risk-badge" [ngClass]="getRiskBadgeClass(ra.maxInitialRisk)">
                          {{ ra.maxInitialRisk }}
                        </span>
                        <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                        <span class="risk-badge" [ngClass]="getRiskBadgeClass(ra.maxResidualRisk)">
                          {{ ra.maxResidualRisk }}
                        </span>
                      </div>
                      <span class="text-xs text-muted d-block mt-0-5">ALARP Mitigated</span>
                    </td>

                    <!-- Assessor / Approver -->
                    <td class="col-auth">
                      <div class="auth-stack">
                        <span class="auth-row"><span class="auth-label">Lead:</span> {{ ra.leadAssessor }}</span>
                        @if (ra.status === 'Approved') {
                          <span class="auth-row"><span class="auth-label">Appr:</span> {{ ra.approver }}</span>
                        } @else if (ra.status === 'Rejected') {
                          <span class="auth-row text-red"><span class="auth-label text-red">Rej:</span> {{ ra.rejectedBy || ra.approver }}</span>
                        } @else {
                          <span class="auth-row"><span class="auth-label">Gate:</span> {{ ra.requiredApproverRole || 'Approver' }}</span>
                        }
                      </div>
                    </td>

                    <!-- Status Badge -->
                    <td class="col-status">
                      <app-status-badge [status]="ra.status"></app-status-badge>
                    </td>

                    <!-- Actions (Structured 4-Action Toolbar) -->
                    <td class="col-actions">
                      <div class="actions-group">
                        @if (ra.status === 'Approved') {
                          <a 
                            class="btn-ptw-action" 
                            [routerLink]="['/permits/create']" 
                            [queryParams]="{ fromRa: ra.referenceNo }"
                            title="Generate Permit to Work (PTW)">
                            <mat-icon class="btn-icon">vpn_key</mat-icon>
                            <span>PTW</span>
                          </a>
                        } @else {
                          <span 
                            class="btn-ptw-locked" 
                            title="PTW Generation Locked: Assessment must be Approved">
                            <mat-icon class="btn-icon">vpn_key</mat-icon>
                            <span>PTW</span>
                          </span>
                        }

                        <a 
                          class="btn-view-details" 
                          [routerLink]="['/risk-assessment', ra.id]"
                          title="View Full Risk Assessment & JSA">
                          <mat-icon class="btn-icon">visibility</mat-icon>
                          <span>View</span>
                        </a>

                        <a 
                          class="btn-edit-action" 
                          [routerLink]="['/risk-assessment/edit', ra.id]" 
                          title="Edit Risk Assessment">
                          <mat-icon class="btn-icon">edit</mat-icon>
                        </a>

                        <button 
                          type="button" 
                          class="btn-delete-action" 
                          (click)="deleteRa(ra, $event)"
                          title="Delete Risk Assessment">
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

        <!-- Empty State UI (Requirement 9) -->
        @if (filteredAssessments().length === 0) {
          <div class="p-5">
            <app-empty-state
              icon="rule"
              title="No Risk Assessments Found"
              description="No risk assessment records match your selected search query or active filter settings."
              actionLabel="Create Risk Assessment"
              actionIcon="add"
              (actionClick)="navigateToCreate()">
            </app-empty-state>
          </div>
        }

        <!-- Pagination Bar (Identical to PTW & other modules) -->
        @if (filteredAssessments().length > 0) {
          <div class="table-pagination-bar">
            <div class="pagination-meta">
              Showing <strong>{{ startIndex() + 1 }}</strong> to <strong>{{ endIndex() }}</strong> of <strong>{{ filteredAssessments().length }}</strong> Assessments
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
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 14px 20px 40px 20px;
      max-width: 1750px;
      margin: 0 auto;
      min-width: 0;
      box-sizing: border-box;
    }

    .btn-export {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-family: inherit !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-color: var(--border) !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary-action {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      font-family: inherit !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* KPI Grid - Compact High Density Pattern matching PTW */
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
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: var(--shadow-2xs);
      user-select: none;
    }

    .kpi-card:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-xs);
      transform: translateY(-1px);
    }

    .kpi-card-selected {
      border-color: var(--primary);
      background-color: var(--accent);
      box-shadow: 0 0 0 1.5px var(--primary);
    }

    .kpi-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon-wrap mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .kpi-icon-total { background: #eff6ff; color: #1d4ed8; }
    .kpi-icon-open { background: #eef2ff; color: #4338ca; }
    .kpi-icon-closed { background: #f0fdf4; color: #15803d; }
    .kpi-icon-review { background: #fffbeb; color: #b45309; }

    .kpi-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .kpi-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--muted-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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

    /* Table Card - Enterprise Standard Pattern matching PTW */
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
      max-width: 100%;
      width: 100%;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
    }

    .xl-table {
      width: 100%;
      table-layout: fixed;
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
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Column Widths (Fixed layout fits 100% of desktop viewport with zero horizontal scroll) */
    .col-ref { width: 125px; white-space: nowrap; }
    .col-activity { width: 28%; }
    .col-vessel { width: 155px; }
    .col-risk { width: 150px; }
    .col-auth { width: 165px; }
    .col-status { width: 105px; text-align: center; }
    .col-actions { 
      width: 195px; 
      text-align: right; 
      padding-right: 12px !important;
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

    .mt-0-5 { margin-top: 2px; }

    /* Activity Column */
    .activity-cell-wrapper {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .activity-main-text {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
      text-decoration: none;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .activity-main-text:hover {
      color: var(--primary);
    }

    .activity-sub-text {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .location-crumb {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .step-chip {
      font-size: 10.5px;
      font-weight: 600;
      color: var(--muted-foreground);
      background: var(--muted);
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .linked-ptw-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10.5px;
      font-weight: 700;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .chip-icon { font-size: 11px; width: 11px; height: 11px; }

    /* Vessel Badge matching PTW & Other modules */
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

    /* Assessment Type Pill */
    .type-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      display: inline-block;
      white-space: nowrap;
    }
    .type-routine { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .type-non-routine { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .type-task { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .type-emergency { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .type-default { background: var(--muted); color: var(--foreground); border: 1px solid var(--border); }

    /* Risk Reduction Flow & Badges */
    .risk-reduction-flow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .risk-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      min-width: 58px;
      text-align: center;
    }
    .badge-crit { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
    .badge-high { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-mod { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .badge-low { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }

    .arrow-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: var(--muted-foreground);
    }

    /* Auth & Validity Stacks */
    .auth-stack { display: flex; flex-direction: column; gap: 1px; line-height: 1.3; }
    .auth-row { font-size: 11.5px; color: var(--foreground); }
    .auth-label { color: var(--muted-foreground); font-weight: 700; font-size: 10.5px; margin-right: 2px; }

    /* Action Buttons (Balanced 4-Action Toolbar) */
    .actions-group {
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      gap: 5px;
      white-space: nowrap;
    }

    .btn-ptw-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: var(--primary);
      border: 1px solid var(--primary);
      color: #fff !important;
      height: 28px;
      padding: 0 8px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
    }
    .btn-ptw-action:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-ptw-action .btn-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: #fff;
    }

    .btn-ptw-locked {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: var(--muted);
      border: 1px dashed var(--border);
      color: var(--muted-foreground);
      height: 28px;
      padding: 0 8px;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-weight: 600;
      cursor: not-allowed;
      white-space: nowrap;
      user-select: none;
      opacity: 0.55;
      box-sizing: border-box;
    }
    .btn-ptw-locked .btn-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: var(--muted-foreground);
    }

    .btn-view-details {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: var(--card);
      border: 1px solid var(--border);
      color: var(--foreground);
      height: 28px;
      padding: 0 8px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
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
      box-sizing: border-box;
      padding: 0;
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
  `]
})
export class RiskAssessmentListComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  // Reactive State Signals for Real-Time Search & Filtering
  searchQuery = signal<string>('');
  vesselFilter = signal<string>('ALL');
  typeFilter = signal<string>('ALL');
  statusFilter = signal<string>('ALL');
  riskFilter = signal<string>('ALL');
  ptwInterlockFilter = signal<string>('ALL'); // 'ALL' | 'LINKED' | 'UNLINKED'

  // Sorting
  sortColumn = signal<string>('referenceNo');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Available vessels list derived from register
  availableVessels = computed(() => {
    const list = this.state.riskAssessments().map(r => r.vesselName);
    return Array.from(new Set(list)).filter(Boolean).sort();
  });

  // KPI Metrics Computed
  activeCount = computed(() => {
    return this.state.riskAssessments().filter(r => r.status === 'Approved' || r.status === 'Active').length;
  });

  reviewCount = computed(() => {
    return this.state.riskAssessments().filter(r => r.status === 'Under Review').length;
  });

  highRiskMitigatedCount = computed(() => {
    return this.state.riskAssessments().filter(r => {
      const initHigh = r.maxInitialRisk === 'High' || r.maxInitialRisk === 'Critical';
      const resLow = r.maxResidualRisk === 'Low' || r.maxResidualRisk === 'Moderate';
      return initHigh && resLow;
    }).length;
  });

  linkedPtwCount = computed(() => {
    return this.state.riskAssessments().filter(r => r.linkedPermits && r.linkedPermits.length > 0).length;
  });

  isFiltered = computed(() => {
    return (
      this.searchQuery().trim() !== '' ||
      this.vesselFilter() !== 'ALL' ||
      this.typeFilter() !== 'ALL' ||
      this.statusFilter() !== 'ALL' ||
      this.riskFilter() !== 'ALL' ||
      this.ptwInterlockFilter() !== 'ALL'
    );
  });

  // Reactive Filtered Assessments List
  filteredAssessments = computed(() => {
    const globalVessel = this.state.selectedVesselFilter();
    const vFilter = this.vesselFilter();
    const tFilter = this.typeFilter();
    const sFilter = this.statusFilter();
    const rFilter = this.riskFilter();
    const ptwFilter = this.ptwInterlockFilter();
    const q = this.searchQuery().toLowerCase().trim();

    return this.state.riskAssessments().filter(ra => {
      // 1. Global topbar vessel filter
      if (globalVessel !== 'ALL' && ra.vesselId !== globalVessel && ra.vesselName !== globalVessel) {
        return false;
      }

      // 2. Local Vessel Filter
      if (vFilter !== 'ALL' && ra.vesselName !== vFilter && ra.vesselId !== vFilter) {
        return false;
      }

      // 3. Assessment Type Filter (Master Data integrated)
      if (tFilter !== 'ALL' && ra.assessmentType !== tFilter) {
        return false;
      }

      // 4. Status Filter (Draft, Under Review, Approved, Rejected, Expired)
      if (sFilter !== 'ALL' && ra.status !== sFilter) {
        return false;
      }

      // 5. Risk Filter (High/Critical, Moderate, Low)
      if (rFilter !== 'ALL') {
        const matchesRisk = 
          ra.maxInitialRisk === rFilter ||
          ra.maxResidualRisk === rFilter ||
          (rFilter === 'High' && (ra.maxInitialRisk === 'High' || ra.maxInitialRisk === 'Critical'));
        if (!matchesRisk) return false;
      }

      // 6. PTW Interlock Filter
      if (ptwFilter === 'LINKED' && (!ra.linkedPermits || ra.linkedPermits.length === 0)) {
        return false;
      }
      if (ptwFilter === 'UNLINKED' && ra.linkedPermits && ra.linkedPermits.length > 0) {
        return false;
      }

      // 7. Search Filter: RA Reference, Activity Title, Vessel, Department, Type, Approver, Lead Assessor
      if (q) {
        const matchSearch =
          (ra.referenceNo && ra.referenceNo.toLowerCase().includes(q)) ||
          (ra.activityTitle && ra.activityTitle.toLowerCase().includes(q)) ||
          (ra.vesselName && ra.vesselName.toLowerCase().includes(q)) ||
          (ra.department && ra.department.toLowerCase().includes(q)) ||
          (ra.assessmentType && ra.assessmentType.toLowerCase().includes(q)) ||
          (ra.approver && ra.approver.toLowerCase().includes(q)) ||
          (ra.leadAssessor && ra.leadAssessor.toLowerCase().includes(q)) ||
          (ra.location && ra.location.toLowerCase().includes(q));
        if (!matchSearch) return false;
      }

      return true;
    }).sort((a, b) => this.compareAssessments(a, b));
  });

  // Sorting Comparator (Requirement 4)
  private compareAssessments(a: RiskAssessmentRecord, b: RiskAssessmentRecord): number {
    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    switch (col) {
      case 'referenceNo':
        return (a.referenceNo || '').localeCompare(b.referenceNo || '') * dir;
      case 'activityTitle':
        return (a.activityTitle || '').localeCompare(b.activityTitle || '') * dir;
      case 'vesselName':
        return (a.vesselName || '').localeCompare(b.vesselName || '') * dir;
      case 'assessmentType':
        return (a.assessmentType || '').localeCompare(b.assessmentType || '') * dir;
      case 'approver':
        return (a.approver || '').localeCompare(b.approver || '') * dir;
      case 'status':
        return (a.status || '').localeCompare(b.status || '') * dir;
      case 'validityExpiryDate':
        return ((a.validityExpiryDate || '').localeCompare(b.validityExpiryDate || '')) * dir;
      case 'initialRisk':
        return (this.getRiskWeight(a.maxInitialRisk) - this.getRiskWeight(b.maxInitialRisk)) * dir;
      case 'residualRisk':
        return (this.getRiskWeight(a.maxResidualRisk) - this.getRiskWeight(b.maxResidualRisk)) * dir;
      default:
        return ((a.referenceNo || '').localeCompare(b.referenceNo || '')) * dir;
    }
  }

  private getRiskWeight(risk?: RiskLevel | MarineRiskFactor): number {
    switch (risk) {
      case 'Critical': return 4;
      case 'High': return 3;
      case 'Moderate': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  }

  // Paginated Slices
  paginatedAssessments = computed(() => {
    const start = this.startIndex();
    return this.filteredAssessments().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredAssessments().length / this.pageSize()) || 1;
  });

  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.filteredAssessments().length));

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

  // UI Interactive Handlers
  setStatusFilter(status: string) {
    if (this.statusFilter() === status && status !== 'ALL') {
      this.statusFilter.set('ALL');
    } else {
      this.statusFilter.set(status);
    }
    this.riskFilter.set('ALL');
    this.ptwInterlockFilter.set('ALL');
    this.currentPage.set(1);
  }

  setRiskFilter(risk: string) {
    if (this.riskFilter() === risk) {
      this.riskFilter.set('ALL');
    } else {
      this.riskFilter.set(risk);
      this.statusFilter.set('ALL');
      this.ptwInterlockFilter.set('ALL');
    }
    this.currentPage.set(1);
  }

  toggleLinkedPtwFilter() {
    if (this.ptwInterlockFilter() === 'LINKED') {
      this.ptwInterlockFilter.set('ALL');
    } else {
      this.ptwInterlockFilter.set('LINKED');
      this.statusFilter.set('ALL');
      this.riskFilter.set('ALL');
    }
    this.currentPage.set(1);
  }

  toggleSort(col: string) {
    if (this.sortColumn() === col) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(col: string): string {
    if (this.sortColumn() !== col) return 'unfold_more';
    return this.sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery.set('');
    this.vesselFilter.set('ALL');
    this.typeFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.riskFilter.set('ALL');
    this.ptwInterlockFilter.set('ALL');
    this.currentPage.set(1);
  }

  navigateToCreate() {
    this.router.navigate(['/risk-assessment/create']);
  }

  deleteRa(ra: RiskAssessmentRecord, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete Risk Assessment "${ra.referenceNo}" (${ra.activityTitle})?`)) {
      this.state.deleteRiskAssessment(ra.id);
      this.notify.showSuccess('Assessment Removed', `${ra.referenceNo} deleted from register.`);
    }
  }

  exportRegister() {
    this.notify.showSuccess('Export Complete', 'Risk Assessment & JSA Register exported to Excel (HIRA format).');
  }

  // Styling helper for Risk Badges
  getRiskBadgeClass(level?: RiskLevel | MarineRiskFactor): string {
    switch (level) {
      case 'Critical': return 'badge-crit';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-mod';
      case 'Low': return 'badge-low';
      default: return 'badge-low';
    }
  }

  // Styling helper for Assessment Type Pills
  getTypePillClass(type?: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('routine') && !t.includes('non')) return 'type-routine';
    if (t.includes('non-routine') || t.includes('high risk')) return 'type-non-routine';
    if (t.includes('task') || t.includes('jsa')) return 'type-task';
    if (t.includes('emergency')) return 'type-emergency';
    return 'type-default';
  }
}
