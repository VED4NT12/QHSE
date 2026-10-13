import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import {
  Vessel, Department, VesselTypeItem, PortItem, CategoryItem, InspectorItem,
  PtwChecklistTemplate, PtwChecklistItem, PermitTypeItem, PermitTypeSectionsConfig,
  RiskApprovalRule, VesselCrewMember, ProjectItem, SystemUser, MasterListType,
  MasterListItem, RiskLikelihoodConfig, RiskSeverityConfig, RiskBandConfig,
  RiskMatrixConfig, WorkflowStageItem, WorkflowEscalationRule, NotificationThresholdTemplate,
  BulkImportRowError, BulkImportResult, RiskLevel
} from '../../core/models/hseq.models';

export type {
  VesselTypeItem, PortItem, CategoryItem, InspectorItem, PtwChecklistTemplate,
  PtwChecklistItem, PermitTypeItem, PermitTypeSectionsConfig, RiskApprovalRule,
  VesselCrewMember, ProjectItem, SystemUser, MasterListType, MasterListItem,
  WorkflowEscalationRule, NotificationThresholdTemplate
};

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    ModalComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Master Data & System Configuration"
        subtitle="Single Source of Truth for configurable dropdowns, classifications, workflow rules, notifications and risk matrices"
        icon="storage"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Master Data'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="openBulkImportModal()" class="btn-export">
            <mat-icon>upload_file</mat-icon> Bulk Excel Import
          </button>
        </div>
      </app-page-header>

      <div class="hseq-card">
        <mat-tab-group [(selectedIndex)]="activeTabIndex">
          
          <!-- ==========================================================
               TAB 0: FLEET VESSELS MASTER
               ========================================================== -->
          <mat-tab [label]="'Vessels (' + state.vessels().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.vessels().length }} Vessels Registered</span>
                  <span class="toolbar-sub">Active fleet assets subject to statutory audits & inspections</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddVesselModal()">
                  <mat-icon>add</mat-icon> Add Fleet Vessel
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th>Vessel Name</th>
                      <th>IMO Number</th>
                      <th>Flag State</th>
                      <th>Vessel Type</th>
                      <th>Crew Complement</th>
                      <th>Status</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (v of state.vessels(); track v.id) {
                      <tr>
                        <td>
                          <div class="vessel-cell">
                            <mat-icon class="vessel-icon">directions_boat</mat-icon>
                            <strong>{{ v.name }}</strong>
                          </div>
                        </td>
                        <td class="font-mono text-xs">{{ v.imoNumber }}</td>
                        <td>{{ v.flag }}</td>
                        <td><span class="type-tag">{{ v.vesselType }}</span></td>
                        <td>{{ v.crewCount }} Active Crew</td>
                        <td><app-status-badge [status]="v.status"></app-status-badge></td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewVessel(v)" title="View Details">
                              <mat-icon>visibility</mat-icon> View
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editVessel(v)" title="Edit Vessel">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="toggleVesselDeactivate(v)" [title]="v.status === 'Active' ? 'Deactivate Vessel' : 'Activate Vessel'">
                              <mat-icon>{{ v.status === 'Active' ? 'block' : 'check_circle' }}</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteVessel(v)" title="Delete Vessel">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 1: PROJECTS MASTER
               ========================================================== -->
          <mat-tab [label]="'Projects (' + state.projects().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.projects().length }} Operational Projects</span>
                  <span class="toolbar-sub">Client contracts, charters, and offshore field operations</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddProjectModal()">
                  <mat-icon>add</mat-icon> Add Project
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 130px;">Project Code</th>
                      <th>Project / Charter Name</th>
                      <th>Client / Charterer</th>
                      <th>Assigned Vessel Asset</th>
                      <th>Start & End Dates</th>
                      <th>Status</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of state.projects(); track p.id) {
                      <tr>
                        <td class="font-mono font-bold text-primary">{{ p.code }}</td>
                        <td>
                          <strong>{{ p.name }}</strong>
                          @if (p.description) {
                            <div class="text-xs text-muted mt-1">{{ p.description }}</div>
                          }
                        </td>
                        <td><span class="cat-chip">{{ p.client }}</span></td>
                        <td>
                          <div class="d-flex align-items-center gap-1 font-semibold text-xs">
                            <mat-icon class="text-muted" style="font-size: 15px; width: 15px; height: 15px;">directions_boat</mat-icon>
                            <span>{{ p.vesselName || 'Fleet Wide' }}</span>
                          </div>
                        </td>
                        <td class="font-mono text-xs">
                          {{ p.startDate | date:'dd-MMM-yyyy' }} @if (p.endDate) { &rarr; {{ p.endDate | date:'dd-MMM-yyyy' }} }
                        </td>
                        <td>
                          <button 
                            type="button" 
                            class="btn-status-toggle" 
                            [class.btn-status-active]="p.status === 'Active'" 
                            [class.btn-status-inactive]="p.status !== 'Active'"
                            (click)="toggleProjectStatus(p)"
                            [title]="p.status === 'Active' ? 'Click to Deactivate' : 'Click to Activate'">
                            {{ p.status }}
                          </button>
                        </td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewProject(p)" title="View Project">
                              <mat-icon>visibility</mat-icon>
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editProject(p)" title="Edit Project">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteProject(p)" title="Delete Project">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 2: DEPARTMENTS MASTER
               ========================================================== -->
          <mat-tab [label]="'Departments (' + state.departments().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.departments().length }} Marine Departments</span>
                  <span class="toolbar-sub">Organizational units for Maker-Checker sign-offs, CAPA ownership & audits</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddDeptModal()">
                  <mat-icon>add</mat-icon> Add Department
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 120px;">Dept Code</th>
                      <th>Department Name</th>
                      <th>Designated Department Head (HoD)</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (d of state.departments(); track d.id) {
                      <tr>
                        <td class="font-mono font-bold">{{ d.code }}</td>
                        <td><strong>{{ d.name }}</strong></td>
                        <td>
                          <div class="hod-cell">
                            <div class="hod-avatar-mini">{{ getDepartmentHeadInitials(d.head) }}</div>
                            <div class="hod-info">
                              <span class="hod-name font-bold">{{ getDepartmentHeadName(d.head) }}</span>
                              @if (getDepartmentHeadRole(d.head)) {
                                <span class="hod-role-tag">{{ getDepartmentHeadRole(d.head) }}</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewDept(d)" title="View Details">
                              <mat-icon>visibility</mat-icon> View
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editDept(d)" title="Edit Department Head">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteDept(d)" title="Delete Department">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 3: USER & CREW MASTER (MULTI-ROLE, MULTI-VESSEL, MULTI-DEPT)
               ========================================================== -->
          <mat-tab [label]="'Users (' + state.users().length + ')'">
            <div class="tab-body user-tab-body">
              <!-- Summary / Meta Info Header -->
              <div class="user-meta-bar">
                <div class="user-meta-info">
                  <span class="count-badge">{{ filteredUsers().length }} System Users Registered</span>
                  <span class="user-meta-desc">Enterprise access management with multi-role permissions, departmental mappings, and vessel allocations</span>
                </div>
              </div>

              <!-- Dedicated Balanced Toolbar: [ Search Users ] [ Role Filter ]                                [ Add User ] -->
              <div class="user-actions-bar">
                <div class="user-filters-group">
                  <div class="user-search-wrapper">
                    <mat-icon class="search-icon">search</mat-icon>
                    <input 
                      type="text" 
                      [(ngModel)]="userSearchQuery" 
                      placeholder="Search users by name, employee ID, role, vessel..." 
                      class="custom-input user-search-input" />
                    @if (userSearchQuery) {
                      <button type="button" class="btn-clear-search" (click)="userSearchQuery = ''" title="Clear Search">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </div>
                  <div class="user-filter-wrapper">
                    <select [(ngModel)]="selectedUserRoleFilter" class="custom-select user-role-select">
                      <option value="ALL">All Roles</option>
                      @for (r of allAvailableRoles; track r) {
                        <option [value]="r">{{ r }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="user-cta-group">
                  <button mat-flat-button color="primary" class="btn-add-user-primary" (click)="openAddUserModal()">
                    <mat-icon>person_add</mat-icon>
                    <span>Add User</span>
                  </button>
                </div>
              </div>

              <div class="table-responsive user-table-responsive">
                <table class="hseq-table user-table">
                  <thead>
                    <tr>
                      <th class="th-user">User / Seafarer</th>
                      <th class="th-roles">Assigned Role(s)</th>
                      <th class="th-dept">Department(s)</th>
                      <th class="th-vessels">Assigned Vessel(s)</th>
                      <th class="th-contact">Contact</th>
                      <th class="th-status">Status</th>
                      <th class="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (u of filteredUsers(); track u.id) {
                      <tr>
                        <td class="td-user">
                          <div class="crew-info-cell">
                            <div class="crew-avatar-mini">{{ getCrewInitials(u.fullName) }}</div>
                            <div class="crew-name-box">
                              <strong class="crew-full-name">{{ u.fullName }}</strong>
                              <span class="crew-id-tag font-mono">{{ u.employeeId }} @if (u.designation) { · {{ u.designation }} }</span>
                            </div>
                          </div>
                        </td>
                        <td class="td-roles">
                          <div class="chip-cloud roles-cloud">
                            @for (r of u.roles; track r) {
                              <span class="role-chip">{{ r }}</span>
                            }
                          </div>
                        </td>
                        <td class="td-dept">
                          <div class="chip-cloud dept-cloud">
                            @for (d of u.departments; track d) {
                              <span class="dept-chip">{{ d }}</span>
                            }
                          </div>
                        </td>
                        <td class="td-vessels">
                          <div class="chip-cloud vessel-cloud">
                            @for (v of u.assignedVessels; track v) {
                              <span class="vessel-chip">
                                <mat-icon class="xs-chip-icon">directions_boat</mat-icon>
                                <span>{{ v }}</span>
                              </span>
                            }
                          </div>
                        </td>
                        <td class="td-contact">
                          <div class="user-contact-cell">
                            <a [href]="'mailto:' + u.email" class="contact-row email-row" [title]="u.email">
                              <mat-icon class="contact-ico">email</mat-icon>
                              <span class="contact-txt font-mono">{{ u.email }}</span>
                            </a>
                            @if (u.phone) {
                              <span class="contact-row phone-row" [title]="u.phone">
                                <mat-icon class="contact-ico">phone</mat-icon>
                                <span class="contact-txt">{{ u.phone }}</span>
                              </span>
                            }
                          </div>
                        </td>
                        <td class="td-status">
                          <button 
                            type="button" 
                            class="btn-status-toggle" 
                            [class.btn-status-active]="u.status === 'Active'" 
                            [class.btn-status-inactive]="u.status !== 'Active'"
                            (click)="toggleUserStatus(u)"
                            [title]="u.status === 'Active' ? 'Click to Deactivate' : 'Click to Activate'">
                            {{ u.status }}
                          </button>
                        </td>
                        <td class="td-actions col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewUser(u)" title="View User Profile">
                              <mat-icon>visibility</mat-icon>
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editUser(u)" title="Edit User">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteUser(u)" title="Delete User">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 4: REUSABLE LIST MANAGEMENT FRAMEWORK (12 DOMAINS)
               ========================================================== -->
          <mat-tab [label]="'Master Lists (' + state.masterLists().length + ')'">
            <div class="tab-body">
              <div class="framework-hero-card mb-3">
                <div>
                  <h3 class="framework-title">Configurable List Management Framework</h3>
                  <p class="framework-sub">Universal administration pattern for all 12 dropdown classifications used throughout the HSEQ platform</p>
                </div>

                <!-- Domain Selector Bar -->
                <div class="domain-selector-pills mt-3">
                  @for (domain of masterListDomains; track domain) {
                    <button 
                      type="button" 
                      class="domain-pill" 
                      [class.active]="selectedListDomain === domain"
                      (click)="selectListDomain(domain)">
                      <span>{{ domain }}</span>
                      <span class="domain-badge">{{ getDomainCount(domain) }}</span>
                    </button>
                  }
                </div>
              </div>

              <br>
              <!-- List Toolbar -->
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ filteredMasterListItems().length }} Configured Records</span>
                  <span class="toolbar-sub">Displaying items configured under <strong>{{ selectedListDomain }}</strong></span>
                </div>
                <div class="toolbar-filters d-flex gap-2 align-items-center flex-wrap">
                  <div class="crew-search-box">
                    <mat-icon class="search-icon">search</mat-icon>
                    <input 
                      type="text" 
                      [(ngModel)]="masterListSearchQuery" 
                      placeholder="Search code, name, description..." 
                      class="custom-input custom-input-sm" />
                    @if (masterListSearchQuery) {
                      <button type="button" class="btn-clear-search" (click)="masterListSearchQuery = ''">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </div>
                  <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddMasterListItemModal()">
                    <mat-icon>add</mat-icon> Add Classification Item
                  </button>
                </div>
              </div>

              <!-- Unified Master List Table -->
              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 130px;">Item Code</th>
                      <th style="min-width: 220px;">Name / Label</th>
                      <th style="min-width: 280px;">Description & Scope Criteria</th>
                      <th style="width: 140px;">Severity Weight</th>
                      <th style="width: 100px;">Status</th>
                      <th class="col-actions" style="width: 150px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of filteredMasterListItems(); track item.id) {
                      <tr>
                        <td class="font-mono font-bold text-primary">{{ item.code }}</td>
                        <td><strong>{{ item.name }}</strong></td>
                        <td class="text-muted text-xs">{{ item.description || '—' }}</td>
                        <td>
                          @if (item.severityWeight) {
                            <span class="weight-badge" [ngClass]="'weight-' + item.severityWeight.toLowerCase()">
                              {{ item.severityWeight }}
                            </span>
                          } @else {
                            <span class="text-muted text-xs">—</span>
                          }
                        </td>
                        <td>
                          <button 
                            type="button" 
                            class="btn-status-toggle" 
                            [class.btn-status-active]="item.status === 'Active'" 
                            [class.btn-status-inactive]="item.status !== 'Active'"
                            (click)="toggleMasterListItemStatus(item)"
                            [title]="item.status === 'Active' ? 'Click to Deactivate' : 'Click to Activate'">
                            {{ item.status }}
                          </button>
                        </td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewMasterListItem(item)" title="View Details">
                              <mat-icon>visibility</mat-icon>
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editMasterListItem(item)" title="Edit Item">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteMasterListItem(item)" title="Delete Item">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                    @if (filteredMasterListItems().length === 0) {
                      <tr>
                        <td colspan="6" class="text-center p-4">
                          <div class="empty-state-card text-center p-3">
                            <mat-icon class="text-muted">playlist_add</mat-icon>
                            <div class="font-bold text-foreground mt-1">No items found in {{ selectedListDomain }}</div>
                            <button mat-flat-button color="primary" class="btn-add-entity mt-2" (click)="openAddMasterListItemModal()">
                              <mat-icon>add</mat-icon> Add First Item
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 5: RISK MATRIX CONFIGURATION (5x5 SINGLE SOURCE OF TRUTH)
               ========================================================== -->
          <mat-tab label="Risk Matrix">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">5x5 Marine Standard</span>
                  <span class="toolbar-sub">Defines Likelihood x Severity values, color bands, and ratings driving all modules</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="saveRiskMatrixConfig()">
                  <mat-icon>save</mat-icon> Save Matrix Configuration
                </button>
              </div>

              <!-- Interactive 5x5 Matrix Visualizer -->
              <div class="matrix-config-grid mb-4">
                <div class="matrix-visualizer-card">
                  <div class="axis-y-title">PROBABILITY / LIKELIHOOD</div>
                  <div class="matrix-table-wrap">
                    @for (l of [5, 4, 3, 2, 1]; track l) {
                      <div class="matrix-row">
                        <div class="y-label">{{ getLikelihoodLabel(l) }}</div>
                        @for (s of [1, 2, 3, 4, 5]; track s) {
                          <div 
                            class="m-cell"
                            [ngClass]="getMatrixCellClass(l * s)"
                            [class.selected-cell]="isCellSelected(l, s)"
                            (click)="inspectMatrixCell(l, s)">
                            <span class="m-score">{{ l * s }}</span>
                            <span class="m-text">{{ getRiskBandLevel(l * s) }}</span>
                          </div>
                        }
                      </div>
                    }
                    <div class="matrix-row header-row">
                      <div class="y-label"></div>
                      @for (s of [1, 2, 3, 4, 5]; track s) {
                        <div class="x-label">{{ getSeverityLabel(s) }}</div>
                      }
                    </div>
                    <div class="axis-x-title">SEVERITY / CONSEQUENCE</div>
                  </div>
                </div>

                <!-- Inspector Card -->
                <div class="matrix-inspector-panel">
                  @if (selectedMatrixCell) {
                    <div class="inspector-card">
                      <div class="inspector-badge" [ngClass]="'badge-' + selectedMatrixCell.level.toLowerCase()">
                        {{ selectedMatrixCell.level }} Risk &bull; Score {{ selectedMatrixCell.score }}
                      </div>
                      <div class="mt-2 text-xs">
                        <strong>Likelihood:</strong> {{ getLikelihoodLabel(selectedMatrixCell.l) }} &bull;
                        <strong>Severity:</strong> {{ getSeverityLabel(selectedMatrixCell.s) }}
                      </div>
                      <div class="inspector-mandate mt-2">
                        <strong>Mandatory Action Mandate:</strong>
                        <p class="mb-0 mt-1">{{ selectedMatrixCell.mandate }}</p>
                      </div>
                    </div>
                  }

                  <!-- Live Dynamic Calculator Test Box -->
                  <div class="calculator-test-card mt-3">
                    <div class="test-header">
                      <mat-icon class="test-icon">speed</mat-icon>
                      <strong>Live Dynamic Calculation Engine Test</strong>
                    </div>
                    <p class="text-xs text-muted mb-2">Simulate how Risk Assessment and Near Miss evaluate input values:</p>
                    <div class="d-flex gap-2">
                      <div class="flex-1">
                        <label class="text-xs font-bold text-muted">Likelihood:</label>
                        <select [(ngModel)]="testLikelihood" (ngModelChange)="evaluateLiveTest()" class="custom-select custom-select-sm w-100">
                          <option [value]="1">1 - Rare</option>
                          <option [value]="2">2 - Unlikely</option>
                          <option [value]="3">3 - Possible</option>
                          <option [value]="4">4 - Likely</option>
                          <option [value]="5">5 - Almost Certain</option>
                        </select>
                      </div>
                      <div class="flex-1">
                        <label class="text-xs font-bold text-muted">Severity:</label>
                        <select [(ngModel)]="testSeverity" (ngModelChange)="evaluateLiveTest()" class="custom-select custom-select-sm w-100">
                          <option [value]="1">1 - Insignificant</option>
                          <option [value]="2">2 - Minor</option>
                          <option [value]="3">3 - Moderate</option>
                          <option [value]="4">4 - Major</option>
                          <option [value]="5">5 - Catastrophic</option>
                        </select>
                      </div>
                    </div>
                    @if (liveTestResult) {
                      <div class="live-test-badge mt-2" [style.background-color]="liveTestResult.bgColor" [style.color]="liveTestResult.color">
                        <strong>Score: {{ liveTestResult.score }} &rarr; {{ liveTestResult.level }} Risk</strong>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Color Threshold Bands Configuration -->
              <h4 class="section-subheading">Configurable Risk Rating Thresholds & Color Bands</h4>
              <div class="threshold-bands-grid">
                @for (band of riskMatrixConfig.bands; track band.level) {
                  <div class="band-card" [style.border-top-color]="band.color">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="band-title" [style.color]="band.color">{{ band.level }} Risk</span>
                      <span class="band-score-tag">Score: {{ band.minScore }} &ndash; {{ band.maxScore }}</span>
                    </div>
                    <div class="form-group mb-1">
                      <label class="text-xs font-bold text-muted">Mandate & Review Protocol:</label>
                      <textarea [(ngModel)]="band.mandate" rows="2" class="custom-textarea text-xs"></textarea>
                    </div>
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 6: WORKFLOW & ESCALATION RULES (FIXED SEQUENCE + RULES)
               ========================================================== -->
          <mat-tab [label]="'Workflow & SLA (' + state.workflowEscalationRules().length + ')'">
            <div class="tab-body">
              <!-- Fixed 6-Stage Workflow Pipeline Header (Client Mandatory Architecture) -->
              <div class="workflow-fixed-banner mb-3">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <mat-icon class="text-primary">linear_scale</mat-icon>
                  <div>
                    <strong>Standard Company Fixed 6-Stage Workflow Sequence</strong>
                    <span class="text-muted text-xs block">Shared state machine enforced strictly across all 8 reporting modules</span>
                  </div>
                </div>
                <div class="workflow-sequence-flow">
                  @for (st of workflowStages; track st.id; let i = $index) {
                    <div class="flow-stage-card">
                      <div class="stage-num">{{ i + 1 }}</div>
                      <div class="stage-body">
                        <span class="stage-title">{{ st.name }}</span>
                        <span class="stage-actor">{{ st.defaultActor }}</span>
                        <span class="stage-sla">SLA: {{ st.sla }}</span>
                      </div>
                      @if (i < workflowStages.length - 1) {
                        <mat-icon class="stage-arrow">arrow_forward</mat-icon>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.workflowEscalationRules().length }} Escalation Mappings</span>
                  <span class="toolbar-sub">Configure escalation roles, overdue thresholds, and notification triggers per severity</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddWorkflowRuleModal()">
                  <mat-icon>add</mat-icon> Add Escalation Rule
                </button>
              </div>

              <!-- Escalation Rules Table -->
              <div class="table-responsive">
                <table class="hseq-table matrix-table">
                  <thead>
                    <tr>
                      <th style="width: 170px;">Report Module</th>
                      <th style="width: 120px;">Severity Level</th>
                      <th style="min-width: 160px;">Trigger Stage</th>
                      <th style="min-width: 200px;">Escalation Role</th>
                      <th style="width: 130px;">Overdue Threshold</th>
                      <th style="width: 150px;">Notification Trigger</th>
                      <th style="width: 130px;">Dual Sign-Off</th>
                      <th style="width: 90px;">Status</th>
                      <th class="col-actions" style="width: 130px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (rule of state.workflowEscalationRules(); track rule.id) {
                      <tr>
                        <td><strong>{{ rule.reportType }}</strong></td>
                        <td>
                          <span class="weight-badge" [ngClass]="'weight-' + rule.severity.toLowerCase()">
                            {{ rule.severity }}
                          </span>
                        </td>
                        <td><span class="cat-chip">{{ rule.stageName }}</span></td>
                        <td>
                          <div class="approver-authority-cell">
                            <mat-icon class="authority-icon">verified_user</mat-icon>
                            <strong>{{ rule.escalationRole }}</strong>
                          </div>
                        </td>
                        <td>
                          <div class="review-cycle-pill">
                            <mat-icon class="cycle-icon">timer</mat-icon>
                            <span>{{ rule.overdueThresholdDays }} Day(s)</span>
                          </div>
                        </td>
                        <td><span class="type-tag">{{ rule.notificationTrigger }}</span></td>
                        <td>
                          @if (rule.requiresDualSignOff) {
                            <span class="status-badge badge-warning">Dual Required</span>
                          } @else {
                            <span class="text-muted text-xs">Single Role</span>
                          }
                        </td>
                        <td>
                          <button 
                            type="button" 
                            class="btn-status-toggle" 
                            [class.btn-status-active]="rule.status === 'Active'" 
                            [class.btn-status-inactive]="rule.status !== 'Active'"
                            (click)="toggleWorkflowRuleStatus(rule)"
                            [title]="rule.status === 'Active' ? 'Click to Deactivate' : 'Click to Activate'">
                            {{ rule.status }}
                          </button>
                        </td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-edit-action" (click)="editWorkflowRule(rule)" title="Edit Rule">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteWorkflowRule(rule)" title="Delete Rule">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 7: NOTIFICATION & THRESHOLD MASTER
               ========================================================== -->
          <mat-tab [label]="'Notifications (' + state.notificationTemplates().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.notificationTemplates().length }} Configured Templates</span>
                  <span class="toolbar-sub">Automated alerts, reminder intervals, and escalation thresholds</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddNotificationModal()">
                  <mat-icon>add</mat-icon> Add Notification Template
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="min-width: 220px;">Template Name</th>
                      <th style="width: 180px;">Trigger Event</th>
                      <th style="min-width: 160px;">Reminder Days Before</th>
                      <th style="width: 140px;">Overdue Escalation</th>
                      <th style="min-width: 180px;">Role Recipients</th>
                      <th style="width: 90px;">Status</th>
                      <th class="col-actions" style="width: 130px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tmpl of state.notificationTemplates(); track tmpl.id) {
                      <tr>
                        <td>
                          <strong>{{ tmpl.templateName }}</strong>
                          <div class="text-xs text-muted font-mono mt-1" [title]="tmpl.emailSubjectTemplate">
                            {{ tmpl.emailSubjectTemplate }}
                          </div>
                        </td>
                        <td><span class="cat-chip">{{ tmpl.triggerEvent }}</span></td>
                        <td>
                          <div class="d-flex gap-1 flex-wrap">
                            @for (d of tmpl.reminderDays; track d) {
                              <span class="count-pill">{{ d }}d</span>
                            }
                          </div>
                        </td>
                        <td>
                          <span class="status-badge badge-danger">
                            <mat-icon class="badge-mini-icon">warning</mat-icon>
                            +{{ tmpl.escalationDays }}d Overdue
                          </span>
                        </td>
                        <td>
                          <div class="chip-cloud">
                            @for (role of tmpl.roleRecipients; track role) {
                              <span class="role-chip">{{ role }}</span>
                            }
                          </div>
                        </td>
                        <td>
                          <button 
                            type="button" 
                            class="btn-status-toggle" 
                            [class.btn-status-active]="tmpl.status === 'Active'" 
                            [class.btn-status-inactive]="tmpl.status !== 'Active'"
                            (click)="toggleNotificationStatus(tmpl)"
                            [title]="tmpl.status === 'Active' ? 'Click to Deactivate' : 'Click to Activate'">
                            {{ tmpl.status }}
                          </button>
                        </td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-edit-action" (click)="editNotification(tmpl)" title="Edit Template">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteNotification(tmpl)" title="Delete Template">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- ==========================================================
               TAB 8: PTW CHECKLIST TEMPLATES & DYNAMIC SECTIONS
               ========================================================== -->
          <mat-tab [label]="'PTW Governance (' + state.ptwTemplates().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-filters">
                  <label class="filter-label">Select Permit Type:</label>
                  <select [(ngModel)]="selectedTemplateType" class="custom-select-sm" (ngModelChange)="onSelectPtwTemplateType($event)">
                    @for (tmpl of state.ptwTemplates(); track tmpl.id) {
                      <option [value]="tmpl.permitType">{{ tmpl.permitType }} ({{ tmpl.items.length }} Checks)</option>
                    }
                  </select>
                  <span class="toolbar-sub ml-3" *ngIf="activePtwTemplate">
                    Form Source: <strong class="text-primary font-mono">{{ activePtwTemplate.formReference }}</strong>
                  </span>
                </div>
                <div class="d-flex gap-2">
                  <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddChecklistItemModal()">
                    <mat-icon>playlist_add</mat-icon> Add Question
                  </button>
                </div>
              </div>

              @if (activePtwTemplate) {
                <div class="ptw-template-hero-card mb-4">
                  <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="ptw-tmpl-tag">{{ activePtwTemplate.permitType }}</span>
                        <span class="font-mono text-xs font-bold text-muted">{{ activePtwTemplate.formReference }}</span>
                      </div>
                      <h3 class="template-heading mb-1">{{ activePtwTemplate.title }}</h3>
                      <p class="template-desc mb-2">{{ activePtwTemplate.description }}</p>
                    </div>
                    <div class="template-stats-pill">
                      <span class="num">{{ activePtwTemplate.items.length }} </span>
                      <span class="lbl">Safety Verification Checks</span>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="hseq-table">
                    <thead>
                      <tr>
                        <th style="width: 100px;">Item ID</th>
                        <th style="width: 180px;">Category</th>
                        <th>Safety Question / Verification Requirement</th>
                        <th style="width: 140px;">Required Answer</th>
                        <th class="col-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of activePtwTemplate.items; track item.id) {
                        <tr>
                          <td class="font-mono font-bold text-primary">{{ item.id }}</td>
                          <td><span class="cat-chip">{{ item.category || 'General Safety' }}</span></td>
                          <td><strong>{{ item.question }}</strong></td>
                          <td>
                            <span class="answer-badge" [class.badge-yes]="item.requiredAnswer === 'YES'" [class.badge-no]="item.requiredAnswer === 'NO'">
                              {{ item.requiredAnswer || 'YES' }}
                            </span>
                          </td>
                          <td class="col-actions">
                            <div class="actions-group">
                              <button type="button" class="btn-edit-action" (click)="editChecklistItem(item)" title="Edit Question">
                                <mat-icon>edit</mat-icon>
                              </button>
                              <button type="button" class="btn-delete-action" (click)="deleteChecklistItem(item.id)" title="Delete Question">
                                <mat-icon>delete_outline</mat-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    </div>

    <!-- ==========================================================
         MODALS: BULK IMPORT MODAL
         ========================================================== -->
    <app-modal
      [isOpen]="isBulkImportModalOpen"
      title="Bulk Excel / CSV Master Data Import"
      subtitle="Initial data load with validation, error report, and one-click database commit"
      icon="upload_file"
      maxWidth="780px"
      (close)="isBulkImportModalOpen = false">
      <div modal-body>
        <div class="modal-form">
          <!-- Import Type Selector -->
          <div class="d-flex align-items-center justify-content-between p-2 bg-muted rounded mb-3">
            <div class="d-flex align-items-center gap-3">
              <label class="radio-label">
                <input type="radio" name="importType" value="Users" [(ngModel)]="bulkImportTarget" (change)="resetImportState()" />
                <strong>Users Master (Multi-Role)</strong>
              </label>
              <label class="radio-label">
                <input type="radio" name="importType" value="Vessels" [(ngModel)]="bulkImportTarget" (change)="resetImportState()" />
                <strong>Vessels Master</strong>
              </label>
            </div>
            <button type="button" mat-stroked-button (click)="downloadSampleTemplate()" class="btn-sm">
              <mat-icon>download</mat-icon> Download Sample Template (.csv)
            </button>
          </div>

          <!-- File Upload Dropzone -->
          <div class="import-dropzone" (click)="fileInput.click()">
            <input #fileInput type="file" accept=".csv,.xlsx,.xls" (change)="onImportFileSelected($event)" style="display: none;" />
            <mat-icon class="dropzone-icon">cloud_upload</mat-icon>
            <div class="dropzone-text">
              @if (importedFileName) {
                <span class="file-name font-mono font-bold">{{ importedFileName }}</span>
                <span class="text-xs text-muted">Click to change or select another file</span>
              } @else {
                <strong>Click to upload or drag & drop CSV file</strong>
                <span class="text-xs text-muted">Supports standardized UTF-8 CSV exports with header row</span>
              }
            </div>
          </div>

          <!-- Validation Summary -->
          @if (importValidationResult) {
            <div class="import-summary-bar mt-3" [class.has-errors]="importValidationResult.errorCount > 0">
              <div class="d-flex align-items-center gap-2">
                <mat-icon [color]="importValidationResult.errorCount > 0 ? 'warn' : 'primary'">
                  {{ importValidationResult.errorCount > 0 ? 'warning' : 'check_circle' }}
                </mat-icon>
                <span>
                  <strong>{{ importValidationResult.validRows }} valid records ready to commit.</strong>
                  @if (importValidationResult.errorCount > 0) {
                    <span>({{ importValidationResult.errorCount }} validation error(s) detected).</span>
                  }
                </span>
              </div>
            </div>

            <!-- Error Report Table -->
            @if (importValidationResult.errors.length > 0) {
              <div class="error-report-wrap mt-3">
                <div class="error-report-title">Validation Error Report:</div>
                <div class="table-responsive" style="max-height: 180px;">
                  <table class="error-table">
                    <thead>
                      <tr>
                        <th>Row #</th>
                        <th>Field</th>
                        <th>Value</th>
                        <th>Error Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (err of importValidationResult.errors; track err.rowNumber + err.field) {
                        <tr>
                          <td class="font-mono text-center font-bold">{{ err.rowNumber }}</td>
                          <td><strong>{{ err.field }}</strong></td>
                          <td class="font-mono text-xs">{{ err.value || 'EMPTY' }}</td>
                          <td class="text-danger">{{ err.message }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          }
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isBulkImportModalOpen = false">Cancel</button>
        <button 
          mat-flat-button 
          color="primary" 
          [disabled]="!importValidationResult || importValidationResult.validRows === 0"
          (click)="commitBulkImport()">
          <mat-icon>check</mat-icon> Commit {{ importValidationResult?.validRows || 0 }} Valid Records
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: VESSEL ADD / EDIT
         ========================================================== -->
    <app-modal
      [isOpen]="isVesselModalOpen"
      [title]="isEditingVessel ? 'Edit Fleet Vessel' : 'Register New Fleet Asset'"
      subtitle="Configure vessel IMO identification, class type, and operational status"
      icon="directions_boat"
      maxWidth="620px"
      (close)="isVesselModalOpen = false">
      <div modal-body *ngIf="selectedVessel">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Vessel Name <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedVessel.name" placeholder="e.g. MV Pacific Voyager" class="custom-input" />
            </div>
            <div class="form-col">
              <label class="form-label">IMO Number <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedVessel.imoNumber" placeholder="e.g. 9482103" class="custom-input font-mono" />
            </div>
          </div>
          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Vessel Classification Type <span class="required">*</span></label>
              <select [(ngModel)]="selectedVessel.vesselType" class="custom-select">
                <option value="Container Vessel">Container Vessel</option>
                <option value="Crude Oil Tanker">Crude Oil Tanker</option>
                <option value="Bulk Carrier">Bulk Carrier</option>
                <option value="AHTS Vessel">AHTS Vessel</option>
                <option value="Platform Supply Vessel">Platform Supply Vessel</option>
                <option value="LNG Carrier">LNG Carrier</option>
                <option value="Multi-Purpose Vessel">Multi-Purpose Vessel</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Flag State</label>
              <input type="text" [(ngModel)]="selectedVessel.flag" placeholder="e.g. Marshall Islands, Panama" class="custom-input" />
            </div>
          </div>
          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Crew Complement</label>
              <input type="number" [(ngModel)]="selectedVessel.crewCount" class="custom-input" />
            </div>
            <div class="form-col">
              <label class="form-label">Operational Status</label>
              <select [(ngModel)]="selectedVessel.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="In Drydock">In Drydock</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isVesselModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveVessel()">
          <mat-icon>save</mat-icon> {{ isEditingVessel ? 'Update Vessel' : 'Save Vessel' }}
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: PROJECT ADD / EDIT
         ========================================================== -->
    <app-modal
      [isOpen]="isProjectModalOpen"
      [title]="isEditingProject ? 'Edit Project' : 'Register Operational Project'"
      subtitle="Configure charter contract, client scope, and assigned vessel asset"
      icon="assignment"
      maxWidth="620px"
      (close)="isProjectModalOpen = false">
      <div modal-body *ngIf="selectedProject">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Project Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedProject.code" placeholder="e.g. PRJ-SA-SAF" class="custom-input font-mono font-bold" />
            </div>
            <div class="form-col">
              <label class="form-label">Client / Charterer <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedProject.client" placeholder="e.g. Saudi Aramco, ADNOC" class="custom-input" />
            </div>
          </div>
          <div class="form-col mt-2">
            <label class="form-label">Project / Charter Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="selectedProject.name" placeholder="e.g. Aramco Safaniya Field Support" class="custom-input" />
          </div>
          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Assigned Vessel Asset</label>
              <select [(ngModel)]="selectedProject.vesselName" class="custom-select">
                <option value="">-- All Fleet Vessels --</option>
                @for (v of state.vessels(); track v.id) {
                  <option [value]="v.name">{{ v.name }}</option>
                }
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Status</label>
              <select [(ngModel)]="selectedProject.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Start Date</label>
              <input type="date" [(ngModel)]="selectedProject.startDate" class="custom-input" />
            </div>
            <div class="form-col">
              <label class="form-label">End Date</label>
              <input type="date" [(ngModel)]="selectedProject.endDate" class="custom-input" />
            </div>
          </div>
          <div class="form-col mt-2">
            <label class="form-label">Operational Description</label>
            <textarea [(ngModel)]="selectedProject.description" rows="2" class="custom-textarea" placeholder="Operational scope..."></textarea>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isProjectModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveProject()">
          <mat-icon>save</mat-icon> {{ isEditingProject ? 'Update Project' : 'Save Project' }}
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: DEPARTMENT ADD / EDIT
         ========================================================== -->
    <app-modal
      [isOpen]="isDeptModalOpen"
      [title]="isEditingDept ? 'Edit Marine Department' : 'Add Marine Department'"
      subtitle="Configure organizational department, code, and designated Head of Department"
      icon="apartment"
      maxWidth="600px"
      (close)="isDeptModalOpen = false">
      <div modal-body *ngIf="selectedDept">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Department Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedDept.code" placeholder="e.g. DEC, ENG, OPS" class="custom-input font-mono font-bold" />
            </div>
            <div class="form-col">
              <label class="form-label">Department Name <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedDept.name" placeholder="e.g. Deck Department" class="custom-input font-bold" />
            </div>
          </div>
          <div class="form-col mt-3">
            <label class="form-label">Designated Department Head (HoD) <span class="required">*</span></label>
            <select [(ngModel)]="selectedDept.head" class="custom-select font-bold">
              <option value="">-- Select Department Head (From User Master) --</option>
              @for (u of state.users(); track u.id) {
                <option [value]="u.fullName">{{ u.fullName }} ({{ u.designation || u.roles.join(', ') }})</option>
              }
              @for (c of state.crewMembers(); track c.id) {
                <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
              }
            </select>
            <span class="field-hint" style="font-size: 11px; color: var(--muted-foreground); margin-top: 4px; display: block;">Department Head is assigned Maker-Checker sign-off rights and CAPA ownership</span>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isDeptModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveDept()">
          <mat-icon>save</mat-icon> {{ isEditingDept ? 'Update Department' : 'Save Department' }}
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: USER ADD / EDIT (MULTI-ROLE, MULTI-VESSEL, MULTI-DEPT)
         ========================================================== -->
    <app-modal
      [isOpen]="isUserModalOpen"
      [title]="isEditingUser ? 'Edit User Record' : 'Register New System User'"
      subtitle="Configure multi-role permissions, departmental mappings, and vessel allocations"
      icon="person"
      maxWidth="720px"
      (close)="isUserModalOpen = false">
      <div modal-body *ngIf="selectedUser">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Employee ID <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedUser.employeeId" placeholder="e.g. EMP-1001" class="custom-input font-mono" />
            </div>
            <div class="form-col">
              <label class="form-label">Full Name <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedUser.fullName" placeholder="e.g. K. Hansen" class="custom-input font-bold" />
            </div>
          </div>

          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Email Address <span class="required">*</span></label>
              <input type="email" [(ngModel)]="selectedUser.email" placeholder="e.g. k.hansen@pacific-voyager.com" class="custom-input font-mono" />
            </div>
            <div class="form-col">
              <label class="form-label">Phone / Mobile</label>
              <input type="tel" [(ngModel)]="selectedUser.phone" placeholder="e.g. +45 20 12 34 56" class="custom-input" />
            </div>
          </div>

          <!-- Multi-Role Selection -->
          <div class="form-col mt-3">
            <label class="form-label">Assigned Roles (One User &rarr; Multiple Roles) <span class="required">*</span></label>
            <div class="tag-checkbox-group">
              @for (role of allAvailableRoles; track role) {
                <label class="tag-checkbox-pill" [class.selected]="isUserRoleSelected(role)">
                  <input type="checkbox" [checked]="isUserRoleSelected(role)" (change)="toggleUserRole(role)" />
                  <span>{{ role }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Multi-Department Selection -->
          <div class="form-col mt-3">
            <label class="form-label">Assigned Departments (One User &rarr; Multiple Departments) <span class="required">*</span></label>
            <div class="tag-checkbox-group">
              @for (dept of state.departmentNames(); track dept) {
                <label class="tag-checkbox-pill" [class.selected]="isUserDeptSelected(dept)">
                  <input type="checkbox" [checked]="isUserDeptSelected(dept)" (change)="toggleUserDept(dept)" />
                  <span>{{ dept }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Multi-Vessel Selection -->
          <div class="form-col mt-3">
            <label class="form-label">Assigned Vessels (One User &rarr; Multiple Vessels) <span class="required">*</span></label>
            <div class="tag-checkbox-group">
              <label class="tag-checkbox-pill" [class.selected]="isUserVesselSelected('All Fleet Vessels')">
                <input type="checkbox" [checked]="isUserVesselSelected('All Fleet Vessels')" (change)="toggleUserVessel('All Fleet Vessels')" />
                <span>All Fleet Vessels</span>
              </label>
              @for (v of state.vessels(); track v.id) {
                <label class="tag-checkbox-pill" [class.selected]="isUserVesselSelected(v.name)">
                  <input type="checkbox" [checked]="isUserVesselSelected(v.name)" (change)="toggleUserVessel(v.name)" />
                  <span>{{ v.name }}</span>
                </label>
              }
            </div>
          </div>

          <div class="form-row mt-3">
            <div class="form-col">
              <label class="form-label">Official Designation / Rank</label>
              <input type="text" [(ngModel)]="selectedUser.designation" placeholder="e.g. Chief Officer, Marine Director" class="custom-input" />
            </div>
            <div class="form-col">
              <label class="form-label">User Status</label>
              <select [(ngModel)]="selectedUser.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isUserModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveUser()">
          <mat-icon>save</mat-icon> {{ isEditingUser ? 'Update User' : 'Save User' }}
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: REUSABLE MASTER LIST ITEM ADD / EDIT
         ========================================================== -->
    <app-modal
      [isOpen]="isMasterListItemModalOpen"
      [title]="isEditingMasterListItem ? 'Edit ' + selectedListDomain + ' Item' : 'Add New ' + selectedListDomain + ' Item'"
      subtitle="Standardized classification entry synchronized across all application forms"
      icon="category"
      maxWidth="580px"
      (close)="isMasterListItemModalOpen = false">
      <div modal-body *ngIf="selectedMasterListItem">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Item Code <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedMasterListItem.code" placeholder="e.g. FND-01, PTW-HOT" class="custom-input font-mono font-bold" />
            </div>
            <div class="form-col">
              <label class="form-label">Severity Weight</label>
              <select [(ngModel)]="selectedMasterListItem.severityWeight" class="custom-select">
                <option value="">None / Not Applicable</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <div class="form-col mt-2">
            <label class="form-label">Classification / Display Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="selectedMasterListItem.name" placeholder="Name or label..." class="custom-input font-bold" />
          </div>
          <div class="form-col mt-2">
            <label class="form-label">Description / Scope Criteria</label>
            <textarea [(ngModel)]="selectedMasterListItem.description" rows="3" placeholder="Contextual criteria and audit requirements..." class="custom-textarea"></textarea>
          </div>
          <div class="form-col mt-2">
            <label class="form-label">Status</label>
            <select [(ngModel)]="selectedMasterListItem.status" class="custom-select">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isMasterListItemModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveMasterListItem()">
          <mat-icon>save</mat-icon> Save List Item
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: WORKFLOW ESCALATION RULE ADD / EDIT
         ========================================================== -->
    <app-modal
      [isOpen]="isWorkflowRuleModalOpen"
      [title]="isEditingWorkflowRule ? 'Edit Escalation Rule' : 'Create Escalation Rule'"
      subtitle="Configure designated escalation authority, overdue threshold, and sign-off gates"
      icon="alt_route"
      maxWidth="620px"
      (close)="isWorkflowRuleModalOpen = false">
      <div modal-body *ngIf="selectedWorkflowRule">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Report Module <span class="required">*</span></label>
              <select [(ngModel)]="selectedWorkflowRule.reportType" class="custom-select">
                <option value="Risk Assessment">Risk Assessment</option>
                <option value="Permit to Work">Permit to Work</option>
                <option value="Near Miss">Near Miss</option>
                <option value="Incident">Incident</option>
                <option value="Injury">Injury</option>
                <option value="Inspection Finding">Inspection Finding</option>
                <option value="Safe Observation">Safe Observation</option>
                <option value="CAPA Action">CAPA Action</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Severity Level <span class="required">*</span></label>
              <select [(ngModel)]="selectedWorkflowRule.severity" class="custom-select">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Trigger Stage <span class="required">*</span></label>
              <select [(ngModel)]="selectedWorkflowRule.stageName" class="custom-select">
                <option value="Report">1. Report</option>
                <option value="Review">2. Review</option>
                <option value="Investigation/Assessment">3. Investigation / Assessment</option>
                <option value="Corrective Action">4. Corrective Action</option>
                <option value="Verification">5. Verification</option>
                <option value="Formal Closure">6. Formal Closure</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Overdue Threshold (Days) <span class="required">*</span></label>
              <input type="number" [(ngModel)]="selectedWorkflowRule.overdueThresholdDays" min="1" class="custom-input" />
            </div>
          </div>
          <div class="form-col mt-2">
            <label class="form-label">Designated Escalation Role <span class="required">*</span></label>
            <input type="text" [(ngModel)]="selectedWorkflowRule.escalationRole" placeholder="e.g. Master + HSEQ Manager, DPA" class="custom-input font-bold" />
          </div>
          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Notification Trigger</label>
              <select [(ngModel)]="selectedWorkflowRule.notificationTrigger" class="custom-select">
                <option value="Immediate Alert">Immediate Alert</option>
                <option value="Daily Digest">Daily Digest</option>
                <option value="Overdue Breach">Overdue Breach</option>
                <option value="Sign-off Escalation">Sign-off Escalation</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Dual Sign-Off Gate</label>
              <div class="pt-2">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="selectedWorkflowRule.requiresDualSignOff" />
                  <span>Mandatory Dual Role Sign-off</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isWorkflowRuleModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveWorkflowRule()">
          <mat-icon>save</mat-icon> Save Escalation Rule
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         MODALS: NOTIFICATION TEMPLATE ADD / EDIT
         ========================================================== -->
    <app-modal
      [isOpen]="isNotificationModalOpen"
      [title]="isEditingNotification ? 'Edit Notification Template' : 'Add Notification Template'"
      subtitle="Configure reminder intervals, escalation thresholds, and recipient roles"
      icon="notifications"
      maxWidth="650px"
      (close)="isNotificationModalOpen = false">
      <div modal-body *ngIf="selectedNotification">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Template Name <span class="required">*</span></label>
              <input type="text" [(ngModel)]="selectedNotification.templateName" placeholder="Template title..." class="custom-input font-bold" />
            </div>
            <div class="form-col">
              <label class="form-label">Trigger Event <span class="required">*</span></label>
              <select [(ngModel)]="selectedNotification.triggerEvent" class="custom-select">
                <option value="Certificate Expiry">Certificate Expiry</option>
                <option value="PTW Expiry">PTW Expiry</option>
                <option value="Risk Assessment Review Due">Risk Assessment Review Due</option>
                <option value="Hours Of Rest Violation">Hours Of Rest Violation</option>
                <option value="Inspection Overdue">Inspection Overdue</option>
                <option value="Near Miss Escalation">Near Miss Escalation</option>
                <option value="CAPA Action Overdue">CAPA Action Overdue</option>
              </select>
            </div>
          </div>

          <div class="form-row mt-2">
            <div class="form-col">
              <label class="form-label">Reminder Days Before Due (Comma separated)</label>
              <input type="text" [ngModel]="notificationReminderDaysString" (ngModelChange)="notificationReminderDaysString = $event" placeholder="e.g. 90, 60, 30, 15, 7" class="custom-input font-mono" />
            </div>
            <div class="form-col">
              <label class="form-label">Escalation Days Overdue</label>
              <input type="number" [(ngModel)]="selectedNotification.escalationDays" min="1" class="custom-input" />
            </div>
          </div>

          <div class="form-col mt-2">
            <label class="form-label">Role Recipients (Comma separated)</label>
            <input type="text" [ngModel]="notificationRolesString" (ngModelChange)="notificationRolesString = $event" placeholder="e.g. Master, Chief Engineer, HSEQ Manager, DPA" class="custom-input" />
          </div>

          <div class="form-col mt-2">
            <label class="form-label">Email Subject Template</label>
            <input type="text" [(ngModel)]="selectedNotification.emailSubjectTemplate" placeholder="Subject with tokens {record_id}, {vessel}..." class="custom-input font-mono text-xs" />
          </div>

          <div class="form-col mt-2">
            <label class="form-label">Notification Body Template</label>
            <textarea [(ngModel)]="selectedNotification.bodyTemplate" rows="3" placeholder="Body with {record_id}, {vessel}, {days_remaining} tokens..." class="custom-textarea text-xs"></textarea>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isNotificationModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="saveNotification()">
          <mat-icon>save</mat-icon> Save Notification Template
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 14px; max-width: 1650px; margin: 0 auto; padding: 14px 20px; }
    .d-flex { display: flex; } .gap-2 { gap: 8px; } .flex-1 { flex: 1; } .w-100 { width: 100%; }
    .btn-export { height: 34px !important; border-radius: var(--radius-sm) !important; font-family: inherit !important; font-size: 12px !important; }
    .btn-add-entity { height: 32px !important; font-size: 12px !important; font-family: inherit !important; background: var(--primary) !important; color: var(--primary-foreground) !important; border-radius: var(--radius-sm) !important; white-space: nowrap !important; flex-shrink: 0 !important; }

    .hseq-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-2xs); overflow: hidden; }
    .tab-body { padding: 16px 20px; }

    .tab-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px; }
    .toolbar-info { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1 1 auto; }
    .count-badge { font-size: 11px; font-weight: 700; background: var(--muted); padding: 3px 8px; border-radius: 9999px; border: 1px solid var(--border); color: var(--foreground); white-space: nowrap; flex-shrink: 0; }
    .toolbar-sub { font-size: 12px; color: var(--muted-foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .toolbar-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .filter-label { font-size: 12px; font-weight: 700; color: var(--muted-foreground); }

    ::ng-deep .mat-mdc-tab-header {
      border-bottom: 1px solid var(--border);
    }
    ::ng-deep .mat-mdc-tab-link, ::ng-deep .mat-mdc-tab {
      min-width: unset !important;
      padding: 0 13px !important;
      height: 42px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      letter-spacing: 0.1px !important;
    }

    .crew-search-box {
      display: inline-flex;
      align-items: center;
      position: relative;
      width: 200px;
      flex-shrink: 1;
    }
    .crew-search-box .search-icon {
      position: absolute;
      left: 10px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--muted-foreground);
      pointer-events: none;
      z-index: 2;
    }
    .crew-search-box .custom-input {
      padding-left: 34px !important;
      padding-right: 28px !important;
      height: 32px !important;
      font-size: 12px !important;
      width: 100%;
    }
    .crew-search-box .btn-clear-search {
      position: absolute;
      right: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      color: var(--muted-foreground);
      z-index: 2;
    }
    .crew-search-box .btn-clear-search mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .custom-select-sm, .custom-input-sm { padding: 4px 8px; font-size: 12px; height: 30px; }
    .custom-input, .custom-select {
      height: 36px; padding: 0 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 13px; font-family: inherit; color: var(--foreground); background: var(--background);
      outline: none; transition: border-color 0.15s; width: 100%; box-sizing: border-box;
    }
    .custom-input:focus, .custom-select:focus { border-color: var(--primary); }
    .custom-textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 10px; font-family: inherit; font-size: 13px; color: var(--foreground); background: var(--background); outline: none; box-sizing: border-box; }

    /* Tables */
    .table-responsive { overflow-x: auto; width: 100%; }
    .hseq-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
    .hseq-table th { background: var(--muted); color: var(--muted-foreground); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .hseq-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); color: var(--foreground); vertical-align: middle; }
    .hseq-table tr:hover td { background: var(--accent); }

    .vessel-cell { display: flex; align-items: center; gap: 8px; }
    .vessel-icon { color: var(--primary); font-size: 20px; width: 20px; height: 20px; }
    .type-tag { font-size: 11px; font-weight: 600; background: var(--muted); padding: 2px 8px; border-radius: 4px; color: var(--muted-foreground); }
    .cat-chip { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary); }
    .count-pill { font-size: 11px; font-weight: 700; background: var(--muted); padding: 2px 7px; border-radius: 9999px; }

    /* Actions */
    .col-actions { text-align: right; }
    .actions-group { display: inline-flex; align-items: center; gap: 4px; justify-content: flex-end; }
    .btn-view-action, .btn-edit-action, .btn-delete-action {
      background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
      padding: 4px 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;
      font-size: 12px; font-family: inherit; color: var(--muted-foreground); transition: all 0.15s ease;
    }
    .btn-view-action:hover { background: var(--accent); color: var(--primary); border-color: var(--border); }
    .btn-edit-action:hover { background: var(--accent); color: var(--primary); border-color: var(--border); }
    .btn-delete-action:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
    .btn-view-action mat-icon, .btn-edit-action mat-icon, .btn-delete-action mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .btn-status-toggle {
      border: 1px solid transparent; border-radius: 9999px; padding: 2px 8px; font-size: 11px; font-weight: 700;
      cursor: pointer; transition: all 0.15s ease; font-family: inherit;
    }
    .btn-status-active { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .btn-status-inactive { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }

    /* HoD Department styling */
    .hod-cell { display: flex; align-items: center; gap: 10px; }
    .hod-avatar-mini {
      width: 32px; height: 32px; border-radius: 50%;
      background: color-mix(in srgb, var(--primary) 14%, var(--card));
      color: var(--primary);
      border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .hod-info { display: flex; flex-direction: column; gap: 2px; }
    .hod-name { font-size: 13px; color: var(--foreground); }
    .hod-role-tag {
      font-size: 10.5px; font-weight: 600; color: var(--muted-foreground);
      background: var(--muted); padding: 1px 6px; border-radius: 3px;
      display: inline-block; width: fit-content;
    }

    /* ==========================================================
       USER MASTER TAB REFACTOR (ENTERPRISE POLISH)
       ========================================================== */
    .user-tab-body {
      padding: 16px 20px;
    }
    .user-meta-bar {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
    }
    .user-meta-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .user-meta-desc {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    /* Required Toolbar Layout: [ Search Users ] [ Role Filter ]                                [ Add User ] */
    .user-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      gap: 16px;
      width: 100%;
    }
    .user-filters-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    .user-search-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 320px;
      max-width: 100%;
    }
    .user-search-wrapper .search-icon {
      position: absolute;
      left: 10px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--muted-foreground);
      pointer-events: none;
      z-index: 2;
    }
    .user-search-input {
      width: 100%;
      height: 36px !important;
      padding-left: 36px !important;
      padding-right: 30px !important;
      font-size: 12.5px !important;
    }
    .user-filter-wrapper {
      width: 160px;
      flex-shrink: 0;
    }
    .user-role-select {
      height: 36px !important;
      width: 100%;
      font-size: 12.5px !important;
      padding: 0 10px !important;
    }
    .user-cta-group {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    .btn-add-user-primary {
      height: 36px !important;
      padding: 0 18px !important;
      font-size: 12.5px !important;
      font-weight: 600 !important;
      font-family: inherit !important;
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      border-radius: var(--radius-sm) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      white-space: nowrap !important;
      flex-shrink: 0 !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.15s ease;
    }
    .btn-add-user-primary:hover {
      filter: brightness(1.08);
    }
    .btn-add-user-primary mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    /* Table Proportions & Normalized Row Heights */
    .user-table-responsive {
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow-x: auto;
      background: var(--card);
    }
    .user-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .user-table th {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted-foreground);
      background: var(--muted);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .user-table td {
      padding: 10px 14px;
      vertical-align: middle;
      border-bottom: 1px solid var(--border);
      font-size: 12.5px;
      line-height: 1.4;
    }
    .user-table tbody tr:hover {
      background-color: color-mix(in srgb, var(--primary) 3%, transparent);
    }

    /* Balanced Column Proportions */
    .th-user, .td-user { width: 22%; min-width: 210px; }
    .th-roles, .td-roles { width: 17%; min-width: 170px; }
    .th-dept, .td-dept { width: 15%; min-width: 150px; }
    .th-vessels, .td-vessels { width: 23%; min-width: 230px; }
    .th-contact, .td-contact { width: 15%; min-width: 165px; }
    .th-status, .td-status { width: 80px; text-align: center; }
    .th-actions, .td-actions { width: 95px; text-align: center; }

    /* User Profile Info Cell */
    .crew-info-cell { display: flex; align-items: center; gap: 10px; }
    .crew-avatar-mini {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--primary); color: var(--primary-foreground);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .crew-name-box { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .crew-full-name { font-size: 13px; color: var(--foreground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .crew-id-tag { font-size: 11px; color: var(--muted-foreground); white-space: nowrap; }

    /* Chip Cloud & Normalized Rhythm */
    .chip-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 6px;
      align-items: center;
    }
    .role-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 1.5px 7px;
      border-radius: 4px;
      background: color-mix(in srgb, var(--primary) 8%, var(--card));
      color: var(--primary);
      border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
      white-space: nowrap;
      line-height: 1.35;
    }
    .dept-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 1.5px 7px;
      border-radius: 4px;
      background: var(--muted);
      color: var(--foreground);
      border: 1px solid var(--border);
      white-space: nowrap;
      line-height: 1.35;
    }
    .vessel-chip {
      font-size: 10.5px;
      font-weight: 600;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      line-height: 1.35;
    }
    .vessel-chip .xs-chip-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    /* Contact Column Presentation */
    .user-contact-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .contact-row {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      line-height: 1.35;
      white-space: nowrap;
      text-decoration: none;
    }
    .contact-row.email-row {
      color: var(--primary);
    }
    .contact-row.email-row:hover {
      text-decoration: underline;
    }
    .contact-row.phone-row {
      color: var(--muted-foreground);
      font-size: 11px;
    }
    .contact-ico {
      font-size: 13px !important;
      width: 13px !important;
      height: 13px !important;
      color: var(--muted-foreground);
      opacity: 0.75;
      flex-shrink: 0;
    }
    .contact-txt {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }

    /* Framework Reusable Lists */
    .framework-hero-card {
      background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 6%, var(--card)), var(--card));
      border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px;
    }
    .framework-title { font-size: 15px; font-weight: 700; margin: 0; color: var(--foreground); }
    .framework-sub { font-size: 12px; color: var(--muted-foreground); margin: 2px 0 0; }
    .framework-stats-pill { text-align: right; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 14px; }
    .framework-stats-pill .num { font-size: 18px; font-weight: 800; color: var(--primary); display: block; line-height: 1; }
    .framework-stats-pill .lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--muted-foreground); }

    .domain-selector-pills { display: flex; flex-wrap: wrap; gap: 6px; }
    .domain-pill {
      background: var(--card); border: 1px solid var(--border); border-radius: 9999px; padding: 5px 12px;
      font-size: 12px; font-weight: 600; color: var(--foreground); cursor: pointer; display: inline-flex;
      align-items: center; gap: 6px; transition: all 0.15s ease; font-family: inherit;
    }
    .domain-pill:hover { background: var(--accent); border-color: var(--primary); color: var(--primary); }
    .domain-pill.active { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
    .domain-badge { font-size: 10px; font-weight: 700; background: rgba(0,0,0,0.1); padding: 1px 6px; border-radius: 9999px; }
    .domain-pill.active .domain-badge { background: rgba(255,255,255,0.25); color: #fff; }

    /* Risk Matrix 5x5 Grid */
    .matrix-config-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
    @media (max-width: 1024px) { .matrix-config-grid { grid-template-columns: 1fr; } }
    .matrix-visualizer-card { display: flex; gap: 10px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; }
    .axis-y-title { writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: 11px; font-weight: 800; color: var(--muted-foreground); letter-spacing: 1px; }
    .axis-x-title { text-align: center; font-size: 11px; font-weight: 800; color: var(--muted-foreground); letter-spacing: 1px; margin-top: 8px; padding-left: 120px; }
    .matrix-table-wrap { flex: 1; }
    .matrix-row { display: grid; grid-template-columns: 120px repeat(5, 1fr); gap: 6px; margin-bottom: 6px; align-items: center; }
    .y-label { font-size: 11px; font-weight: 600; text-align: right; padding-right: 10px; color: var(--muted-foreground); }
    .x-label { font-size: 11px; font-weight: 600; text-align: center; color: var(--muted-foreground); }
    .m-cell {
      height: 44px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    .m-cell:hover { transform: scale(1.04); box-shadow: 0 4px 8px rgba(0,0,0,0.12); }
    .m-cell.selected-cell { outline: 3px solid var(--primary); }
    .m-score { font-size: 13px; font-weight: 800; }
    .m-text { font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .cell-low { background-color: #d1fae5; color: #065f46; }
    .cell-medium { background-color: #fef3c7; color: #92400e; }
    .cell-high { background-color: #ffedd5; color: #9a3412; }
    .cell-critical { background-color: #fee2e2; color: #991b1b; }

    .matrix-inspector-panel { display: flex; flex-direction: column; gap: 12px; }
    .inspector-card, .calculator-test-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; }
    .inspector-badge { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; display: inline-block; }
    .badge-low { background: #d1fae5; color: #065f46; }
    .badge-medium { background: #fef3c7; color: #92400e; }
    .badge-high { background: #ffedd5; color: #9a3412; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .inspector-mandate { font-size: 12px; background: var(--muted); padding: 8px 10px; border-radius: 4px; color: var(--foreground); }

    .test-header { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--foreground); margin-bottom: 4px; }
    .test-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .live-test-badge { padding: 8px 12px; border-radius: 6px; text-align: center; font-size: 12.5px; border: 1px solid currentColor; }

    .threshold-bands-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 10px; }
    .band-card { background: var(--card); border: 1px solid var(--border); border-top: 4px solid var(--primary); border-radius: var(--radius-sm); padding: 12px; }
    .band-title { font-size: 13px; font-weight: 800; }
    .band-score-tag { font-size: 11px; font-weight: 700; background: var(--muted); padding: 2px 6px; border-radius: 4px; }
    .section-subheading { font-size: 13px; font-weight: 700; color: var(--foreground); margin: 16px 0 8px; }

    /* Workflow Pipeline */
    .workflow-fixed-banner { background: var(--muted); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 18px; }
    .workflow-sequence-flow { display: flex; align-items: center; gap: 8px; overflow-x: auto; padding: 6px 0; }
    .flow-stage-card {
      min-width: 150px; padding: 10px 12px; background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 3px;
    }
    .stage-num { font-size: 10px; font-weight: 800; background: var(--primary); color: var(--primary-foreground); width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stage-title { font-size: 12px; font-weight: 700; color: var(--foreground); }
    .stage-actor { font-size: 11px; color: var(--primary); }
    .stage-sla { font-size: 10px; color: var(--muted-foreground); font-weight: 600; }
    .stage-arrow { color: var(--muted-foreground); font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    /* Weights & Mandate Tags */
    .weight-badge { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; display: inline-block; }
    .weight-critical { background: #fee2e2; color: #991b1b; }
    .weight-high { background: #ffedd5; color: #9a3412; }
    .weight-medium { background: #fef3c7; color: #92400e; }
    .weight-low { background: #d1fae5; color: #065f46; }

    .approver-authority-cell { display: flex; align-items: center; gap: 6px; }
    .authority-icon { font-size: 16px; width: 16px; height: 16px; color: var(--primary); }
    .review-cycle-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--foreground); }
    .cycle-icon { font-size: 14px; width: 14px; height: 14px; color: var(--muted-foreground); }

    /* Dropzone & Import */
    .import-dropzone {
      border: 2px dashed var(--border); border-radius: var(--radius-sm); padding: 28px 20px;
      text-align: center; cursor: pointer; transition: all 0.15s ease; background: var(--background);
    }
    .import-dropzone:hover { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 4%, transparent); }
    .dropzone-icon { font-size: 36px; width: 36px; height: 36px; color: var(--primary); margin-bottom: 6px; }
    .import-summary-bar { padding: 10px 14px; border-radius: var(--radius-sm); background: #f0fdf4; border: 1px solid #bbf7d0; font-size: 12.5px; }
    .import-summary-bar.has-errors { background: #fffbeb; border-color: #fde68a; }
    .error-report-wrap { border: 1px solid #fecaca; border-radius: var(--radius-sm); padding: 10px; background: #fef2f2; }
    .error-report-title { font-size: 12px; font-weight: 700; color: #991b1b; margin-bottom: 6px; }
    .error-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .error-table th { background: #fee2e2; color: #991b1b; padding: 6px 8px; text-align: left; }
    .error-table td { padding: 6px 8px; border-bottom: 1px solid #fecaca; }
    .text-danger { color: #dc2626; font-weight: 600; }

    /* Tag Checkbox Group (Multi-select) */
    .tag-checkbox-group { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag-checkbox-pill {
      border: 1px solid var(--border); border-radius: 9999px; padding: 4px 10px; font-size: 12px;
      cursor: pointer; display: inline-flex; align-items: center; gap: 6px; background: var(--background);
      transition: all 0.15s ease;
    }
    .tag-checkbox-pill:hover { border-color: var(--primary); }
    .tag-checkbox-pill.selected { background: color-mix(in srgb, var(--primary) 12%, transparent); border-color: var(--primary); color: var(--primary); font-weight: 700; }
    .tag-checkbox-pill input { margin: 0; cursor: pointer; }

    /* Modals & Forms */
    .modal-form { display: flex; flex-direction: column; gap: 10px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-col { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.4px; }
    .required { color: #dc2626; }
    .radio-label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; }
    .checkbox-label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12.5px; }
  `]
})
export class MasterDataComponent implements OnInit {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  activeTabIndex = 0;

  // -------------------------------------------------------------
  // ALL AVAILABLE ROLES FOR USER MULTI-ROLE MAPPING
  // -------------------------------------------------------------
  readonly allAvailableRoles: string[] = [
    'Lead Assessor',
    'Approver',
    'Master',
    'Chief Officer',
    'Chief Engineer',
    'Second Officer',
    'Second Engineer',
    'Department Head',
    'Area Authority',
    'Responsible Supervisor',
    'Safety Watch',
    'Inspector',
    'Auditor',
    'HSEQ Officer',
    'HSEQ Admin',
    'Management Executive',
    'Vessel Crew'
  ];

  // -------------------------------------------------------------
  // REUSABLE MASTER LIST FRAMEWORK DOMAINS
  // -------------------------------------------------------------
  readonly masterListDomains: MasterListType[] = [
    'Finding Categories',
    'Near Miss Categories',
    'Incident Classifications',
    'Injury Types',
    'Body Part Lists',
    'Observation Categories',
    'Observation Types',
    'Permit Types',
    'Certificate Categories',
    'Issuing Authorities',
    'CAPA Categories',
    'Hazard Categories'
  ];

  selectedListDomain: MasterListType = 'Finding Categories';
  masterListSearchQuery = '';

  // -------------------------------------------------------------
  // FIXED WORKFLOW SEQUENCE
  // -------------------------------------------------------------
  readonly workflowStages: WorkflowStageItem[] = [
    { id: 1, sequence: 1, name: '1. Report', defaultActor: 'Vessel Crew / Finder', sla: 'Immediate', description: 'Initial event logging and immediate hazard mitigation' },
    { id: 2, sequence: 2, name: '2. Review', defaultActor: 'HSEQ Officer / Dept Head', sla: '24 Hours', description: 'Technical review, categorization, and preliminary validation' },
    { id: 3, sequence: 3, name: '3. Investigation / Assessment', defaultActor: 'Safety Team / Assessor', sla: '72 Hours', description: '5-Why root cause analysis and risk matrix rating' },
    { id: 4, sequence: 4, name: '4. Corrective Action Log', defaultActor: 'Designated Actionee', sla: 'Within 7 Days', description: 'CAPA execution and preventive safeguard installation' },
    { id: 5, sequence: 5, name: '5. Verification', defaultActor: 'Independent Superintendent', sla: 'Prior to Closure', description: 'Physical worksite inspection and effectiveness proof' },
    { id: 6, sequence: 6, name: '6. Formal Closure', defaultActor: 'Approver / Master', sla: 'Final Sign-off', description: 'Executive approval and lessons-learned fleet broadcast' }
  ];

  // -------------------------------------------------------------
  // SEARCH & FILTERS
  // -------------------------------------------------------------
  userSearchQuery = '';
  selectedUserRoleFilter = 'ALL';

  // -------------------------------------------------------------
  // RISK MATRIX LOCAL EDITING & LIVE CALCULATOR TEST
  // -------------------------------------------------------------
  riskMatrixConfig: RiskMatrixConfig = { ...this.state.riskMatrixConfig() };
  selectedMatrixCell: { l: number; s: number; score: number; level: RiskLevel; mandate: string } | null = {
    l: 4,
    s: 4,
    score: 16,
    level: 'High',
    mandate: 'Permit to Work (PTW) required with written Superintendent sign-off prior to task authorization.'
  };

  testLikelihood = 3;
  testSeverity = 4;
  liveTestResult: { score: number; level: RiskLevel; color: string; bgColor: string } | null = null;

  // -------------------------------------------------------------
  // MODALS STATE
  // -------------------------------------------------------------
  isVesselModalOpen = false;
  isEditingVessel = false;
  selectedVessel?: Vessel;

  isProjectModalOpen = false;
  isEditingProject = false;
  selectedProject?: ProjectItem;

  isDeptModalOpen = false;
  isEditingDept = false;
  selectedDept?: Department;

  isUserModalOpen = false;
  isEditingUser = false;
  selectedUser?: SystemUser;

  isMasterListItemModalOpen = false;
  isEditingMasterListItem = false;
  selectedMasterListItem?: MasterListItem;

  isWorkflowRuleModalOpen = false;
  isEditingWorkflowRule = false;
  selectedWorkflowRule?: WorkflowEscalationRule;

  isNotificationModalOpen = false;
  isEditingNotification = false;
  selectedNotification?: NotificationThresholdTemplate;
  notificationReminderDaysString = '';
  notificationRolesString = '';

  // Bulk Import
  isBulkImportModalOpen = false;
  bulkImportTarget: 'Users' | 'Vessels' = 'Users';
  importedFileName = '';
  importValidationResult: BulkImportResult | null = null;
  stagedParsedUsers: SystemUser[] = [];
  stagedParsedVessels: Vessel[] = [];

  // PTW Templates Governance
  selectedTemplateType = 'Hot Work';
  isPtwItemModalOpen = false;
  isEditingPtwItem = false;
  selectedPtwItem?: PtwChecklistItem;

  get activePtwTemplate(): PtwChecklistTemplate | undefined {
    return this.state.ptwTemplates().find(t => t.permitType === this.selectedTemplateType) || this.state.ptwTemplates()[0];
  }

  ngOnInit(): void {
    this.riskMatrixConfig = JSON.parse(JSON.stringify(this.state.riskMatrixConfig()));
    this.evaluateLiveTest();
  }

  // -------------------------------------------------------------
  // USER FILTER COMPUTED
  // -------------------------------------------------------------
  filteredUsers(): SystemUser[] {
    const q = (this.userSearchQuery || '').toLowerCase().trim();
    const roleFilter = this.selectedUserRoleFilter;

    return this.state.users().filter(u => {
      const matchRole = roleFilter === 'ALL' || u.roles.some(r => r === roleFilter);
      const matchQ = !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roles.some(r => r.toLowerCase().includes(q)) ||
        u.assignedVessels.some(v => v.toLowerCase().includes(q)) ||
        u.departments.some(d => d.toLowerCase().includes(q));

      return matchRole && matchQ;
    });
  }

  getCrewInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // -------------------------------------------------------------
  // REUSABLE MASTER LIST METHODS
  // -------------------------------------------------------------
  selectListDomain(domain: MasterListType) {
    this.selectedListDomain = domain;
    this.masterListSearchQuery = '';
  }

  getActiveDomainItems(): MasterListItem[] {
    return this.state.masterLists().filter(item => item.listType === this.selectedListDomain);
  }

  getDomainCount(domain: MasterListType): number {
    return this.state.masterLists().filter(item => item.listType === domain).length;
  }

  filteredMasterListItems(): MasterListItem[] {
    const items = this.getActiveDomainItems();
    const q = (this.masterListSearchQuery || '').toLowerCase().trim();
    if (!q) return items;
    return items.filter(i =>
      i.code.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q)) ||
      (i.severityWeight && i.severityWeight.toLowerCase().includes(q))
    );
  }

  openAddMasterListItemModal() {
    this.selectedMasterListItem = {
      id: `ML-${Date.now().toString().slice(-4)}`,
      listType: this.selectedListDomain,
      code: `${this.selectedListDomain.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
      name: '',
      description: '',
      severityWeight: '',
      status: 'Active',
      sortOrder: this.getActiveDomainItems().length + 1
    };
    this.isEditingMasterListItem = false;
    this.isMasterListItemModalOpen = true;
  }

  editMasterListItem(item: MasterListItem) {
    this.selectedMasterListItem = { ...item };
    this.isEditingMasterListItem = true;
    this.isMasterListItemModalOpen = true;
  }

  viewMasterListItem(item: MasterListItem) {
    this.editMasterListItem(item);
  }

  saveMasterListItem() {
    if (!this.selectedMasterListItem?.name.trim()) {
      this.notify.showError('Required Field', 'Please provide a name or label for the classification item.');
      return;
    }
    if (this.isEditingMasterListItem) {
      this.state.updateMasterListItem(this.selectedMasterListItem);
      this.notify.showSuccess('Item Updated', `${this.selectedMasterListItem.name} successfully updated.`);
    } else {
      this.state.addMasterListItem(this.selectedMasterListItem);
      this.notify.showSuccess('Item Added', `${this.selectedMasterListItem.name} added to ${this.selectedListDomain}.`);
    }
    if (this.selectedMasterListItem.listType === 'Permit Types') {
      const match = this.state.ptwTemplates().find(t => t.permitType.toLowerCase() === this.selectedMasterListItem?.name.toLowerCase());
      if (match) {
        this.selectedTemplateType = match.permitType;
      }
    }
    this.isMasterListItemModalOpen = false;
  }

  toggleMasterListItemStatus(item: MasterListItem) {
    this.state.toggleMasterListItemStatus(item.id);
    this.notify.showInfo('Status Toggled', `${item.name} is now ${item.status === 'Active' ? 'Inactive' : 'Active'}.`);
  }

  deleteMasterListItem(item: MasterListItem) {
    if (confirm(`Remove ${item.name} (${item.code}) from ${item.listType}?`)) {
      this.state.deleteMasterListItem(item.id);
      this.notify.showSuccess('Item Deleted', `${item.name} removed from master data.`);
    }
  }

  // -------------------------------------------------------------
  // VESSEL HANDLERS
  // -------------------------------------------------------------
  openAddVesselModal() {
    this.selectedVessel = {
      id: `VES-${String(this.state.vessels().length + 1).padStart(2, '0')}`,
      name: '',
      imoNumber: '9' + Math.floor(100000 + Math.random() * 900000),
      flag: 'Marshall Islands',
      vesselType: 'Container Vessel',
      departmentCount: 4,
      crewCount: 22,
      status: 'Active'
    };
    this.isEditingVessel = false;
    this.isVesselModalOpen = true;
  }

  viewVessel(v: Vessel) {
    this.editVessel(v);
  }

  editVessel(v: Vessel) {
    this.selectedVessel = { ...v };
    this.isEditingVessel = true;
    this.isVesselModalOpen = true;
  }

  saveVessel() {
    if (!this.selectedVessel?.name.trim()) {
      this.notify.showError('Required Field', 'Please provide a valid vessel name.');
      return;
    }
    if (this.isEditingVessel) {
      this.state.updateVessel(this.selectedVessel);
      this.notify.showSuccess('Vessel Updated', `Parameters for ${this.selectedVessel.name} saved.`);
    } else {
      this.state.addVessel(this.selectedVessel);
      this.notify.showSuccess('Vessel Registered', `${this.selectedVessel.name} added to company fleet.`);
    }
    this.isVesselModalOpen = false;
  }

  toggleVesselDeactivate(v: Vessel) {
    const newStatus = v.status === 'Active' ? 'Under Maintenance' : 'Active';
    const updated = { ...v, status: newStatus as any };
    this.state.updateVessel(updated);
    this.notify.showInfo('Vessel Status Updated', `${v.name} status is now ${newStatus}.`);
  }

  deleteVessel(v: Vessel) {
    if (confirm(`Are you sure you want to delete ${v.name}?`)) {
      this.state.deleteVessel(v.id);
      this.notify.showSuccess('Vessel Removed', `${v.name} removed from fleet.`);
    }
  }

  // -------------------------------------------------------------
  // PROJECT HANDLERS
  // -------------------------------------------------------------
  openAddProjectModal() {
    this.selectedProject = {
      id: `PRJ-${String(this.state.projects().length + 1).padStart(2, '0')}`,
      code: `PRJ-${Math.floor(100 + Math.random() * 899)}`,
      name: '',
      client: '',
      vesselName: '',
      startDate: new Date().toISOString().substring(0, 10),
      status: 'Active',
      description: ''
    };
    this.isEditingProject = false;
    this.isProjectModalOpen = true;
  }

  viewProject(p: ProjectItem) {
    this.editProject(p);
  }

  editProject(p: ProjectItem) {
    this.selectedProject = { ...p };
    this.isEditingProject = true;
    this.isProjectModalOpen = true;
  }

  saveProject() {
    if (!this.selectedProject?.name.trim() || !this.selectedProject?.code.trim()) {
      this.notify.showError('Required Fields', 'Please specify project code and name.');
      return;
    }
    if (this.isEditingProject) {
      this.state.updateProject(this.selectedProject);
      this.notify.showSuccess('Project Updated', `${this.selectedProject.name} updated.`);
    } else {
      this.state.addProject(this.selectedProject);
      this.notify.showSuccess('Project Registered', `${this.selectedProject.name} added to master.`);
    }
    this.isProjectModalOpen = false;
  }

  toggleProjectStatus(p: ProjectItem) {
    this.state.toggleProjectStatus(p.id);
    this.notify.showInfo('Status Toggled', `Project ${p.code} is now ${p.status === 'Active' ? 'Inactive' : 'Active'}.`);
  }

  deleteProject(p: ProjectItem) {
    if (confirm(`Remove project ${p.name} (${p.code})?`)) {
      this.state.deleteProject(p.id);
      this.notify.showSuccess('Project Removed', `${p.name} deleted.`);
    }
  }

  // -------------------------------------------------------------
  // DEPARTMENT HANDLERS & HELPERS
  // -------------------------------------------------------------
  getDepartmentHeadInitials(head: string): string {
    if (!head) return 'HD';
    const clean = head.replace(/^(Chief Officer|Chief Engineer|Chief Cook|Capt\.|Captain|Superintendent|Bosun)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return clean.substring(0, 2).toUpperCase();
  }

  getDepartmentHeadName(head: string): string {
    if (!head) return 'Unassigned';
    const userMatch = this.state.users().find(u => head.includes(u.fullName) || u.fullName.includes(head));
    if (userMatch) return userMatch.fullName;
    const stripped = head.replace(/^(Chief Officer|Chief Engineer|Chief Cook|Capt\.|Captain|Superintendent|Bosun)\s+/i, '').trim();
    return stripped || head;
  }

  getDepartmentHeadRole(head: string): string {
    if (!head) return '';
    const userMatch = this.state.users().find(u => head.includes(u.fullName) || u.fullName.includes(head));
    if (userMatch) return userMatch.designation || userMatch.roles[0] || '';
    const match = head.match(/^(Chief Officer|Chief Engineer|Chief Cook|Capt\.|Captain|Superintendent|Bosun)/i);
    return match ? match[1] : '';
  }

  openAddDeptModal() {
    this.selectedDept = {
      id: `DEP-${String(this.state.departments().length + 1).padStart(2, '0')}`,
      name: '',
      head: '',
      code: `D${Math.floor(10 + Math.random() * 89)}`
    };
    this.isEditingDept = false;
    this.isDeptModalOpen = true;
  }

  viewDept(d: Department) {
    this.editDept(d);
  }

  editDept(d: Department) {
    this.selectedDept = { ...d };
    this.isEditingDept = true;
    this.isDeptModalOpen = true;
  }

  saveDept() {
    if (!this.selectedDept?.name.trim()) {
      this.notify.showError('Required Field', 'Please provide department name.');
      return;
    }
    if (this.isEditingDept) {
      this.state.updateDepartment(this.selectedDept);
      this.notify.showSuccess('Department Updated', `${this.selectedDept.name} updated.`);
    } else {
      this.state.addDepartment(this.selectedDept);
      this.notify.showSuccess('Department Added', `${this.selectedDept.name} registered.`);
    }
    this.isDeptModalOpen = false;
  }

  deleteDept(d: Department) {
    if (confirm(`Delete department ${d.name}?`)) {
      this.state.deleteDepartment(d.id);
      this.notify.showSuccess('Department Deleted', `${d.name} removed.`);
    }
  }

  // -------------------------------------------------------------
  // USER MASTER HANDLERS (MULTI-ROLE, MULTI-VESSEL, MULTI-DEPT)
  // -------------------------------------------------------------
  openAddUserModal() {
    this.selectedUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 8999)}`,
      fullName: '',
      email: '',
      phone: '',
      roles: ['Lead Assessor'],
      departments: ['Deck Department'],
      assignedVessels: ['MV Pacific Voyager'],
      status: 'Active',
      designation: ''
    };
    this.isEditingUser = false;
    this.isUserModalOpen = true;
  }

  viewUser(u: SystemUser) {
    this.editUser(u);
  }

  editUser(u: SystemUser) {
    this.selectedUser = JSON.parse(JSON.stringify(u));
    this.isEditingUser = true;
    this.isUserModalOpen = true;
  }

  saveUser() {
    if (!this.selectedUser?.fullName.trim() || !this.selectedUser?.email.trim()) {
      this.notify.showError('Validation Error', 'Full Name and Email are mandatory.');
      return;
    }
    if (!this.selectedUser.roles || this.selectedUser.roles.length === 0) {
      this.notify.showError('Validation Error', 'User must be assigned to at least one role.');
      return;
    }
    if (this.isEditingUser) {
      this.state.updateUser(this.selectedUser);
      this.notify.showSuccess('User Updated', `Profile for ${this.selectedUser.fullName} updated.`);
    } else {
      this.state.addUser(this.selectedUser);
      this.notify.showSuccess('User Registered', `${this.selectedUser.fullName} added to Master Data.`);
    }
    this.isUserModalOpen = false;
  }

  toggleUserStatus(u: SystemUser) {
    this.state.toggleUserStatus(u.id);
    this.notify.showInfo('Status Toggled', `User ${u.fullName} is now ${u.status === 'Active' ? 'Inactive' : 'Active'}.`);
  }

  deleteUser(u: SystemUser) {
    if (confirm(`Delete user ${u.fullName} (${u.employeeId})?`)) {
      this.state.deleteUser(u.id);
      this.notify.showSuccess('User Deleted', `${u.fullName} removed.`);
    }
  }

  isUserRoleSelected(role: string): boolean {
    return this.selectedUser?.roles?.includes(role) || false;
  }

  toggleUserRole(role: string): void {
    if (!this.selectedUser) return;
    const current = this.selectedUser.roles || [];
    if (current.includes(role)) {
      this.selectedUser.roles = current.filter(r => r !== role);
    } else {
      this.selectedUser.roles = [...current, role];
    }
  }

  isUserDeptSelected(dept: string): boolean {
    return this.selectedUser?.departments?.includes(dept) || false;
  }

  toggleUserDept(dept: string): void {
    if (!this.selectedUser) return;
    const current = this.selectedUser.departments || [];
    if (current.includes(dept)) {
      this.selectedUser.departments = current.filter(d => d !== dept);
    } else {
      this.selectedUser.departments = [...current, dept];
    }
  }

  isUserVesselSelected(vessel: string): boolean {
    return this.selectedUser?.assignedVessels?.includes(vessel) || false;
  }

  toggleUserVessel(vessel: string): void {
    if (!this.selectedUser) return;
    const current = this.selectedUser.assignedVessels || [];
    if (current.includes(vessel)) {
      this.selectedUser.assignedVessels = current.filter(v => v !== vessel);
    } else {
      this.selectedUser.assignedVessels = [...current, vessel];
    }
  }

  // -------------------------------------------------------------
  // RISK MATRIX MASTER HANDLERS
  // -------------------------------------------------------------
  getLikelihoodLabel(l: number): string {
    const found = this.riskMatrixConfig.likelihoods.find(item => item.score === l);
    return found ? `${found.label}` : `L${l}`;
  }

  getSeverityLabel(s: number): string {
    const found = this.riskMatrixConfig.severities.find(item => item.score === s);
    return found ? `${found.label}` : `S${s}`;
  }

  getRiskBandLevel(score: number): RiskLevel {
    const found = this.riskMatrixConfig.bands.find(b => score >= b.minScore && score <= b.maxScore);
    return found ? found.level : 'Medium';
  }

  getMatrixCellClass(score: number): string {
    const level = this.getRiskBandLevel(score).toLowerCase();
    return `cell-${level}`;
  }

  isCellSelected(l: number, s: number): boolean {
    return !!this.selectedMatrixCell && this.selectedMatrixCell.l === l && this.selectedMatrixCell.s === s;
  }

  inspectMatrixCell(l: number, s: number) {
    const score = l * s;
    const level = this.getRiskBandLevel(score);
    const band = this.riskMatrixConfig.bands.find(b => b.level === level);
    this.selectedMatrixCell = {
      l,
      s,
      score,
      level,
      mandate: band?.mandate || 'Mandatory review required'
    };
  }

  evaluateLiveTest() {
    this.liveTestResult = this.state.calculateRiskLevel(Number(this.testLikelihood), Number(this.testSeverity));
  }

  saveRiskMatrixConfig() {
    this.state.updateRiskMatrixConfig(this.riskMatrixConfig);
    this.notify.showSuccess('Risk Matrix Saved', 'Company-approved 5x5 Matrix parameters and color thresholds committed to system master.');
  }

  // -------------------------------------------------------------
  // WORKFLOW & ESCALATION RULES HANDLERS
  // -------------------------------------------------------------
  openAddWorkflowRuleModal() {
    this.selectedWorkflowRule = {
      id: `WFR-${Date.now().toString().slice(-4)}`,
      reportType: 'Risk Assessment',
      severity: 'High',
      stageName: 'Review',
      escalationRole: 'Master + Department Head',
      overdueThresholdDays: 2,
      notificationTrigger: 'Immediate Alert',
      requiresDualSignOff: false,
      status: 'Active'
    };
    this.isEditingWorkflowRule = false;
    this.isWorkflowRuleModalOpen = true;
  }

  editWorkflowRule(rule: WorkflowEscalationRule) {
    this.selectedWorkflowRule = { ...rule };
    this.isEditingWorkflowRule = true;
    this.isWorkflowRuleModalOpen = true;
  }

  saveWorkflowRule() {
    if (!this.selectedWorkflowRule?.escalationRole.trim()) {
      this.notify.showError('Required Field', 'Please specify designated escalation role.');
      return;
    }
    if (this.isEditingWorkflowRule) {
      this.state.updateWorkflowEscalationRule(this.selectedWorkflowRule);
      this.notify.showSuccess('Rule Updated', 'Escalation mapping updated.');
    } else {
      this.state.addWorkflowEscalationRule(this.selectedWorkflowRule);
      this.notify.showSuccess('Rule Added', 'New escalation rule configured.');
    }
    this.isWorkflowRuleModalOpen = false;
  }

  toggleWorkflowRuleStatus(rule: WorkflowEscalationRule) {
    this.state.toggleWorkflowRuleStatus(rule.id);
    this.notify.showInfo('Status Toggled', `Rule is now ${rule.status === 'Active' ? 'Inactive' : 'Active'}.`);
  }

  deleteWorkflowRule(rule: WorkflowEscalationRule) {
    if (confirm(`Delete escalation rule for ${rule.reportType} (${rule.severity})?`)) {
      this.state.deleteWorkflowEscalationRule(rule.id);
      this.notify.showSuccess('Rule Deleted', 'Escalation rule removed.');
    }
  }

  // -------------------------------------------------------------
  // NOTIFICATION & THRESHOLD TEMPLATES HANDLERS
  // -------------------------------------------------------------
  openAddNotificationModal() {
    this.selectedNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      templateName: '',
      triggerEvent: 'Certificate Expiry',
      reminderDays: [30, 15, 7],
      escalationDays: 2,
      roleRecipients: ['Master', 'HSEQ Manager'],
      emailSubjectTemplate: 'Alert: {record_id} due on {vessel}',
      bodyTemplate: 'Record {record_id} requires immediate action.',
      status: 'Active'
    };
    this.notificationReminderDaysString = '30, 15, 7';
    this.notificationRolesString = 'Master, HSEQ Manager';
    this.isEditingNotification = false;
    this.isNotificationModalOpen = true;
  }

  editNotification(tmpl: NotificationThresholdTemplate) {
    this.selectedNotification = { ...tmpl };
    this.notificationReminderDaysString = tmpl.reminderDays.join(', ');
    this.notificationRolesString = tmpl.roleRecipients.join(', ');
    this.isEditingNotification = true;
    this.isNotificationModalOpen = true;
  }

  saveNotification() {
    if (!this.selectedNotification?.templateName.trim()) {
      this.notify.showError('Required Field', 'Please provide a template name.');
      return;
    }
    // Parse reminder days and roles
    this.selectedNotification.reminderDays = this.notificationReminderDaysString
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
    this.selectedNotification.roleRecipients = this.notificationRolesString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (this.isEditingNotification) {
      this.state.updateNotificationTemplate(this.selectedNotification);
      this.notify.showSuccess('Template Updated', `${this.selectedNotification.templateName} saved.`);
    } else {
      this.state.addNotificationTemplate(this.selectedNotification);
      this.notify.showSuccess('Template Created', `${this.selectedNotification.templateName} registered.`);
    }
    this.isNotificationModalOpen = false;
  }

  toggleNotificationStatus(tmpl: NotificationThresholdTemplate) {
    this.state.toggleNotificationTemplateStatus(tmpl.id);
    this.notify.showInfo('Status Toggled', `${tmpl.templateName} is now ${tmpl.status === 'Active' ? 'Inactive' : 'Active'}.`);
  }

  deleteNotification(tmpl: NotificationThresholdTemplate) {
    if (confirm(`Delete notification template ${tmpl.templateName}?`)) {
      this.state.deleteNotificationTemplate(tmpl.id);
      this.notify.showSuccess('Template Deleted', `${tmpl.templateName} removed.`);
    }
  }

  // -------------------------------------------------------------
  // BULK EXCEL / CSV IMPORT HANDLER
  // -------------------------------------------------------------
  openBulkImportModal() {
    this.resetImportState();
    this.isBulkImportModalOpen = true;
  }

  resetImportState() {
    this.importedFileName = '';
    this.importValidationResult = null;
    this.stagedParsedUsers = [];
    this.stagedParsedVessels = [];
  }

  downloadSampleTemplate() {
    if (this.bulkImportTarget === 'Users') {
      const csv = 'EmployeeID,FullName,Email,Phone,Roles,Departments,AssignedVessels,Status\n' +
        'EMP-2001,Capt. Johnathan Vance,j.vance@hseq-fleet.com,+44 7700 900199,"Master; Approver","Deck Department","MV Pacific Voyager",Active\n' +
        'EMP-2002,Sarah Jenkins,s.jenkins@hseq-fleet.com,+44 7700 900288,"Lead Assessor; HSEQ Officer","HSEQ & Compliance","MV Pacific Voyager; MT Nordic Titan",Active\n' +
        'EMP-2003,Pavel Dubov,p.dubov@hseq-fleet.com,+380 44 9123456,"Chief Engineer; Department Head","Engine Department","All Fleet Vessels",Active\n';
      this.downloadCsvFile(csv, 'HSEQ_Users_Import_Template.csv');
    } else {
      const csv = 'VesselName,IMONumber,FlagState,VesselType,CrewComplement,Status\n' +
        'MV Coral Sea,9823415,Panama,Container Vessel,22,Active\n' +
        'MT Petro King,9712049,Marshall Islands,Crude Oil Tanker,26,Active\n' +
        'AHTS Gulf Carrier,9543810,Liberia,AHTS Vessel,18,Active\n';
      this.downloadCsvFile(csv, 'HSEQ_Vessels_Import_Template.csv');
    }
    this.notify.showInfo('Template Downloaded', `Standard ${this.bulkImportTarget} Excel CSV template saved.`);
  }

  private downloadCsvFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onImportFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.importedFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target?.result as string;
      this.validateAndStageCsv(text);
    };
    reader.readAsText(file);
  }

  private validateAndStageCsv(csvText: string) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
      this.notify.showError('Invalid File', 'The uploaded CSV contains no data rows.');
      return;
    }

    const errors: BulkImportRowError[] = [];
    let validCount = 0;

    if (this.bulkImportTarget === 'Users') {
      const parsedUsers: SystemUser[] = [];
      const existingIds = new Set(this.state.users().map(u => u.employeeId.toLowerCase()));

      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCsvRow(lines[i]);
        const rowNum = i + 1;
        const [empId, fullName, email, phone, rolesStr, deptsStr, vesselsStr, status] = row;

        if (!empId) {
          errors.push({ rowNumber: rowNum, field: 'EmployeeID', value: '', message: 'Employee ID is required' });
        } else if (existingIds.has(empId.toLowerCase())) {
          errors.push({ rowNumber: rowNum, field: 'EmployeeID', value: empId, message: 'Duplicate Employee ID already exists in master' });
        }

        if (!fullName) {
          errors.push({ rowNumber: rowNum, field: 'FullName', value: '', message: 'Full Name is required' });
        }

        if (!email || !email.includes('@')) {
          errors.push({ rowNumber: rowNum, field: 'Email', value: email || '', message: 'Valid email address is required' });
        }

        const roles = rolesStr ? rolesStr.split(';').map(s => s.trim()).filter(s => s.length > 0) : ['Vessel Crew'];
        const departments = deptsStr ? deptsStr.split(';').map(s => s.trim()).filter(s => s.length > 0) : ['Deck Department'];
        const assignedVessels = vesselsStr ? vesselsStr.split(';').map(s => s.trim()).filter(s => s.length > 0) : ['All Fleet Vessels'];

        if (errors.filter(e => e.rowNumber === rowNum).length === 0) {
          validCount++;
          parsedUsers.push({
            id: `USR-IMP-${Date.now().toString().slice(-4)}-${i}`,
            employeeId: empId,
            fullName,
            email,
            phone: phone || '',
            roles,
            departments,
            assignedVessels,
            status: (status && status.toLowerCase() === 'inactive') ? 'Inactive' : 'Active'
          });
        }
      }

      this.stagedParsedUsers = parsedUsers;
      this.importValidationResult = {
        totalRows: lines.length - 1,
        validRows: validCount,
        errorCount: errors.length,
        errors
      };

    } else {
      // Vessels
      const parsedVessels: Vessel[] = [];
      const existingNames = new Set(this.state.vessels().map(v => v.name.toLowerCase()));

      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCsvRow(lines[i]);
        const rowNum = i + 1;
        const [vesselName, imoNumber, flag, vesselType, crewCountStr, status] = row;

        if (!vesselName) {
          errors.push({ rowNumber: rowNum, field: 'VesselName', value: '', message: 'Vessel Name is required' });
        } else if (existingNames.has(vesselName.toLowerCase())) {
          errors.push({ rowNumber: rowNum, field: 'VesselName', value: vesselName, message: 'Vessel name already registered' });
        }

        if (!imoNumber || imoNumber.length < 5) {
          errors.push({ rowNumber: rowNum, field: 'IMONumber', value: imoNumber || '', message: 'Valid IMO Number required' });
        }

        if (errors.filter(e => e.rowNumber === rowNum).length === 0) {
          validCount++;
          parsedVessels.push({
            id: `VES-IMP-${Date.now().toString().slice(-4)}-${i}`,
            name: vesselName,
            imoNumber: imoNumber || '9999999',
            flag: flag || 'Marshall Islands',
            vesselType: vesselType || 'Container Vessel',
            departmentCount: 4,
            crewCount: parseInt(crewCountStr || '20', 10) || 20,
            status: (status && status.toLowerCase().includes('drydock')) ? 'In Drydock' : 'Active'
          });
        }
      }

      this.stagedParsedVessels = parsedVessels;
      this.importValidationResult = {
        totalRows: lines.length - 1,
        validRows: validCount,
        errorCount: errors.length,
        errors
      };
    }
  }

  private parseCsvRow(rowStr: string): string[] {
    const result: string[] = [];
    let insideQuotes = false;
    let current = '';

    for (let i = 0; i < rowStr.length; i++) {
      const ch = rowStr[i];
      if (ch === '"') {
        insideQuotes = !insideQuotes;
      } else if (ch === ',' && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  commitBulkImport() {
    if (!this.importValidationResult || this.importValidationResult.validRows === 0) return;

    if (this.bulkImportTarget === 'Users') {
      this.state.bulkImportUsers(this.stagedParsedUsers);
      this.notify.showSuccess('Import Completed', `Successfully committed ${this.stagedParsedUsers.length} users to Master Data.`);
    } else {
      this.state.bulkImportVessels(this.stagedParsedVessels);
      this.notify.showSuccess('Import Completed', `Successfully committed ${this.stagedParsedVessels.length} vessels to Master Data.`);
    }
    this.isBulkImportModalOpen = false;
    this.resetImportState();
  }

  // -------------------------------------------------------------
  // PTW CHECKLIST ITEMS
  // -------------------------------------------------------------
  onSelectPtwTemplateType(type: string) {
    this.selectedTemplateType = type;
  }

  openAddChecklistItemModal() {
    if (!this.activePtwTemplate) return;
    const nextNum = this.activePtwTemplate.items.length + 1;
    this.selectedPtwItem = {
      id: `${this.activePtwTemplate.formReference}-${nextNum}`,
      question: '',
      requiredAnswer: 'YES',
      category: 'General Safety Verification',
      clientFormRef: this.activePtwTemplate.formReference
    };
    this.isEditingPtwItem = false;
    this.isPtwItemModalOpen = true;
  }

  editChecklistItem(item: PtwChecklistItem) {
    this.selectedPtwItem = { ...item };
    this.isEditingPtwItem = true;
    this.isPtwItemModalOpen = true;
  }

  deleteChecklistItem(itemId: string) {
    if (!this.activePtwTemplate) return;
    if (confirm(`Remove verification check ${itemId}?`)) {
      this.state.deletePtwChecklistItem(this.activePtwTemplate.id, itemId);
      this.notify.showSuccess('Item Deleted', 'Verification question removed.');
    }
  }
}
