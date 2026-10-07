import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { Vessel, Department, VesselTypeItem, PortItem, CategoryItem, InspectorItem } from '../../core/models/hseq.models';
export type { VesselTypeItem, PortItem, CategoryItem, InspectorItem };

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
        subtitle="Manage fleet vessels, vessel classes, operating ports, departments, and configurable HSEQ categories"
        icon="storage"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Master Data'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button (click)="openImportModal()" class="btn-export">
            <mat-icon>upload_file</mat-icon> Bulk Excel Import
          </button>
        </div>
      </app-page-header>

      <div class="hseq-card">
        <mat-tab-group [(selectedIndex)]="activeTabIndex">
          
          <!-- TAB 1: FLEET VESSELS & ASSET MASTER -->
          <mat-tab [label]="'Fleet Vessels & Assets (' + state.vessels().length + ')'">
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

          <!-- TAB 2: VESSEL TYPES & CLASSES -->
          <mat-tab [label]="'Vessel Types & Classes (' + vesselTypes().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ vesselTypes().length }} Ship Classifications</span>
                  <span class="toolbar-sub">Standard vessel taxonomy for audit scope & checklist allocation</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddVesselTypeModal()">
                  <mat-icon>add</mat-icon> Add Vessel Type
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 110px;">Type Code</th>
                      <th>Class & Type Name</th>
                      <th>Category</th>
                      <th>Typical DWT / Spec</th>
                      <th>Fleet Count</th>
                      <th>Status</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (vt of vesselTypes(); track vt.id) {
                      <tr>
                        <td class="font-mono font-bold">{{ vt.code }}</td>
                        <td><strong>{{ vt.name }}</strong></td>
                        <td><span class="cat-chip">{{ vt.classCategory }}</span></td>
                        <td class="text-muted">{{ vt.typicalDwt }}</td>
                        <td><span class="count-pill">{{ vt.activeCount }} in Fleet</span></td>
                        <td><app-status-badge [status]="vt.status"></app-status-badge></td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewVesselType(vt)" title="View Details">
                              <mat-icon>visibility</mat-icon> View
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editVesselType(vt)" title="Edit Type">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteVesselType(vt)" title="Delete Type">
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

          <!-- TAB 3: OPERATING PORTS & LOCATIONS -->
          <mat-tab [label]="'Operating Ports & Locations (' + ports().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ ports().length }} Operating Ports</span>
                  <span class="toolbar-sub">Port State Control (PSC MOU) jurisdictions & regular ports of call</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddPortModal()">
                  <mat-icon>add</mat-icon> Add Port / Location
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 110px;">Port Code</th>
                      <th>Port / Terminal Name</th>
                      <th>Country</th>
                      <th>Trading Region</th>
                      <th>PSC MOU Regime</th>
                      <th>Status</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of ports(); track p.id) {
                      <tr>
                        <td class="font-mono font-bold text-primary">{{ p.code }}</td>
                        <td><strong>{{ p.name }}</strong></td>
                        <td>{{ p.country }}</td>
                        <td><span class="cat-chip">{{ p.region }}</span></td>
                        <td><span class="type-tag">{{ p.mouRegime }}</span></td>
                        <td><app-status-badge [status]="p.status"></app-status-badge></td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewPort(p)" title="View Details">
                              <mat-icon>visibility</mat-icon> View
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editPort(p)" title="Edit Port">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deletePort(p)" title="Delete Port">
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

          <!-- TAB 4: DEPARTMENTS & HEAD OF DEPARTMENTS -->
          <mat-tab [label]="'Departments & HoD (' + state.departments().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.departments().length }} Departments</span>
                  <span class="toolbar-sub">Organization departments for Maker-Checker sign-offs & CAPA assignment</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddDeptModal()">
                  <mat-icon>add</mat-icon> Add Department
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 110px;">Dept Code</th>
                      <th>Department Name</th>
                      <th>Designated Department Head</th>
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
                            <mat-icon class="hod-icon">person</mat-icon>
                            <span>{{ d.head }}</span>
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

          <!-- TAB 5: CONFIGURABLE HSEQ CATEGORIES -->
          <mat-tab [label]="'Configurable HSEQ Categories (' + categories().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-filters">
                  <label class="filter-label">Filter Scope:</label>
                  <select [(ngModel)]="categoryScopeFilter" class="custom-select-sm">
                    <option value="ALL">All Scopes ({{ categories().length }})</option>
                    <option value="Inspection Finding">Inspection Finding</option>
                    <option value="Near Miss">Near Miss</option>
                    <option value="Permit to Work">Permit to Work</option>
                    <option value="Injury Classification">Injury Classification</option>
                  </select>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddCategoryModal()">
                  <mat-icon>add</mat-icon> Add Category
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th style="width: 180px;">Scope / Domain</th>
                      <th style="width: 100px;">Code</th>
                      <th>Category Name</th>
                      <th style="width: 140px;">Severity Weight</th>
                      <th style="width: 110px;">Status</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of filteredCategories(); track cat.id) {
                      <tr>
                        <td><span class="cat-scope-tag" [ngClass]="getScopeClass(cat.scope)">{{ cat.scope }}</span></td>
                        <td class="font-mono font-bold">{{ cat.code }}</td>
                        <td><strong>{{ cat.name }}</strong></td>
                        <td>
                          <span class="weight-badge" [ngClass]="'weight-' + cat.severityWeight.toLowerCase()">
                            {{ cat.severityWeight }}
                          </span>
                        </td>
                        <td><app-status-badge [status]="cat.status"></app-status-badge></td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewCategory(cat)" title="View Details">
                              <mat-icon>visibility</mat-icon> View
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editCategory(cat)" title="Edit Category">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteCategory(cat)" title="Delete Category">
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

          <!-- TAB 6: FLEET INSPECTORS & AUDITORS -->
          <mat-tab [label]="'Inspectors & Auditors (' + state.inspectors().length + ')'">
            <div class="tab-body">
              <div class="tab-toolbar">
                <div class="toolbar-info">
                  <span class="count-badge">{{ state.inspectors().length }} Auditors Registered</span>
                  <span class="toolbar-sub">Internal superintendents, class surveyors, PSC officers, and vetting auditors</span>
                </div>
                <button mat-flat-button color="primary" class="btn-add-entity" (click)="openAddInspectorModal()">
                  <mat-icon>add</mat-icon> Add Inspector
                </button>
              </div>

              <div class="table-responsive">
                <table class="hseq-table">
                  <thead>
                    <tr>
                      <th>Inspector Name</th>
                      <th>Organization / Body</th>
                      <th>Designation / Role</th>
                      <th>Status</th>
                      <th class="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ins of state.inspectors(); track ins.id) {
                      <tr>
                        <td>
                          <div class="hod-cell">
                            <mat-icon class="hod-icon">badge</mat-icon>
                            <strong>{{ ins.name }}</strong>
                          </div>
                        </td>
                        <td>{{ ins.organization }}</td>
                        <td><span class="type-tag">{{ ins.role }}</span></td>
                        <td><app-status-badge [status]="ins.status"></app-status-badge></td>
                        <td class="col-actions">
                          <div class="actions-group">
                            <button type="button" class="btn-view-action" (click)="viewInspector(ins)" title="View Details">
                              <mat-icon>visibility</mat-icon> View
                            </button>
                            <button type="button" class="btn-edit-action" (click)="editInspector(ins)" title="Edit Inspector">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button type="button" class="btn-delete-action" (click)="deleteInspector(ins)" title="Delete Inspector">
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

        </mat-tab-group>
      </div>
    </div>

    <!-- ==========================================================
         1. VESSEL VIEW MODAL
         ========================================================== -->
    <app-modal
      [isOpen]="isVesselViewModalOpen"
      title="Vessel Asset Details"
      subtitle="Complete asset profile, IMO registry, and crew complement"
      icon="directions_boat"
      maxWidth="600px"
      (close)="isVesselViewModalOpen = false">
      <div modal-body *ngIf="viewingVessel">
        <div class="view-card">
          <div class="view-header-strip">
            <mat-icon class="view-header-icon">directions_boat</mat-icon>
            <div>
              <h3 class="view-title">{{ viewingVessel.name }}</h3>
              <span class="view-sub">IMO Number: {{ viewingVessel.imoNumber }}</span>
            </div>
            <app-status-badge [status]="viewingVessel.status" class="ml-auto"></app-status-badge>
          </div>

          <div class="view-grid">
            <div class="view-item">
              <span class="view-label">Vessel Type</span>
              <span class="view-val">{{ viewingVessel.vesselType }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">Flag State</span>
              <span class="view-val">{{ viewingVessel.flag }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">Crew Complement</span>
              <span class="view-val">{{ viewingVessel.crewCount }} Active Personnel</span>
            </div>
            <div class="view-item">
              <span class="view-label">Departments Monitored</span>
              <span class="view-val">{{ viewingVessel.departmentCount }} Marine Departments</span>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isVesselViewModalOpen = false">Close</button>
        <button mat-flat-button color="primary" (click)="isVesselViewModalOpen = false; editVessel(viewingVessel!)">
          <mat-icon>edit</mat-icon> Edit Vessel
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         2. VESSEL ADD / EDIT MODAL
         ========================================================== -->
    <app-modal
      [isOpen]="isVesselModalOpen"
      [title]="isEditingVessel ? 'Edit Vessel Asset Details' : 'Register New Fleet Asset'"
      subtitle="Configure vessel IMO identification, class type, and operational assignment"
      icon="directions_boat"
      maxWidth="640px"
      (close)="isVesselModalOpen = false">
      <div modal-body *ngIf="selectedVessel">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Vessel Name *</label>
              <input type="text" [(ngModel)]="selectedVessel.name" class="custom-input" placeholder="e.g. MV Pacific Voyager" />
            </div>
            <div class="form-col">
              <label class="form-label">IMO Number *</label>
              <input type="text" [(ngModel)]="selectedVessel.imoNumber" class="custom-input" placeholder="e.g. 9482103" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Flag State</label>
              <input type="text" [(ngModel)]="selectedVessel.flag" class="custom-input" placeholder="e.g. Marshall Islands" />
            </div>
            <div class="form-col">
              <label class="form-label">Vessel Type</label>
              <select [(ngModel)]="selectedVessel.vesselType" class="custom-select">
                <option value="Container Vessel">Container Vessel</option>
                <option value="Crude Oil Tanker">Crude Oil Tanker</option>
                <option value="Bulk Carrier">Bulk Carrier</option>
                <option value="AHTS Vessel">AHTS Vessel</option>
                <option value="Platform Supply Vessel">Platform Supply Vessel</option>
                <option value="LNG Carrier">LNG Carrier</option>
                <option value="Chemical Carrier">Chemical Carrier</option>
                <option value="Offshore Support Vessel">Offshore Support Vessel</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Crew Complement</label>
              <input type="number" [(ngModel)]="selectedVessel.crewCount" class="custom-input" min="1" max="100" />
            </div>
            <div class="form-col">
              <label class="form-label">Operational Status</label>
              <select [(ngModel)]="selectedVessel.status" class="custom-select">
                <option value="Active">Active / In Service</option>
                <option value="In Progress">Drydock / Repair</option>
                <option value="Action Pending">Class Survey Due</option>
                <option value="Closed">Decommissioned / Off-hire</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isVesselModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveVessel()">
          <mat-icon>save</mat-icon> Save Vessel
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         3. VESSEL TYPE VIEW & EDIT MODALS
         ========================================================== -->
    <app-modal
      [isOpen]="isVesselTypeViewModalOpen"
      title="Vessel Type & Classification Profile"
      subtitle="Standardized ship category attributes and fleet usage"
      icon="category"
      maxWidth="560px"
      (close)="isVesselTypeViewModalOpen = false">
      <div modal-body *ngIf="viewingVesselType">
        <div class="view-card">
          <div class="view-header-strip">
            <mat-icon class="view-header-icon">category</mat-icon>
            <div>
              <h3 class="view-title">{{ viewingVesselType.name }}</h3>
              <span class="view-sub">Code: {{ viewingVesselType.code }}</span>
            </div>
            <app-status-badge [status]="viewingVesselType.status" class="ml-auto"></app-status-badge>
          </div>
          <div class="view-grid">
            <div class="view-item">
              <span class="view-label">Class Category</span>
              <span class="view-val">{{ viewingVesselType.classCategory }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">Typical DWT / Size</span>
              <span class="view-val">{{ viewingVesselType.typicalDwt }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">Active in Fleet</span>
              <span class="view-val">{{ viewingVesselType.activeCount }} vessels currently assigned</span>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isVesselTypeViewModalOpen = false">Close</button>
        <button mat-flat-button color="primary" (click)="isVesselTypeViewModalOpen = false; editVesselType(viewingVesselType!)">
          <mat-icon>edit</mat-icon> Edit Type
        </button>
      </div>
    </app-modal>

    <app-modal
      [isOpen]="isVesselTypeModalOpen"
      [title]="isEditingVesselType ? 'Edit Vessel Classification' : 'Add Vessel Classification'"
      subtitle="Configure classification parameters and standard fleet grouping"
      icon="category"
      maxWidth="580px"
      (close)="isVesselTypeModalOpen = false">
      <div modal-body *ngIf="selectedVesselType">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Type Code *</label>
              <input type="text" [(ngModel)]="selectedVesselType.code" class="custom-input" placeholder="e.g. VT-CONT" />
            </div>
            <div class="form-col">
              <label class="form-label">Type / Class Name *</label>
              <input type="text" [(ngModel)]="selectedVesselType.name" class="custom-input" placeholder="e.g. Container Vessel" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Class Category</label>
              <input type="text" [(ngModel)]="selectedVesselType.classCategory" class="custom-input" placeholder="e.g. Cargo Liner" />
            </div>
            <div class="form-col">
              <label class="form-label">Typical DWT / Capacity</label>
              <input type="text" [(ngModel)]="selectedVesselType.typicalDwt" class="custom-input" placeholder="e.g. 50,000 - 140,000 DWT" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Status</label>
              <select [(ngModel)]="selectedVesselType.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isVesselTypeModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveVesselType()">
          <mat-icon>save</mat-icon> Save Classification
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         4. PORT VIEW & EDIT MODALS
         ========================================================== -->
    <app-modal
      [isOpen]="isPortViewModalOpen"
      title="Operating Port / Location Details"
      subtitle="Maritime port registry, region, and Port State Control compliance regime"
      icon="anchor"
      maxWidth="580px"
      (close)="isPortViewModalOpen = false">
      <div modal-body *ngIf="viewingPort">
        <div class="view-card">
          <div class="view-header-strip">
            <mat-icon class="view-header-icon">anchor</mat-icon>
            <div>
              <h3 class="view-title">{{ viewingPort.name }}</h3>
              <span class="view-sub">UN/LOCODE: {{ viewingPort.code }} &bull; {{ viewingPort.country }}</span>
            </div>
            <app-status-badge [status]="viewingPort.status" class="ml-auto"></app-status-badge>
          </div>
          <div class="view-grid">
            <div class="view-item">
              <span class="view-label">Trading Region</span>
              <span class="view-val">{{ viewingPort.region }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">MOU Inspection Regime</span>
              <span class="view-val">{{ viewingPort.mouRegime }}</span>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isPortViewModalOpen = false">Close</button>
        <button mat-flat-button color="primary" (click)="isPortViewModalOpen = false; editPort(viewingPort!)">
          <mat-icon>edit</mat-icon> Edit Port
        </button>
      </div>
    </app-modal>

    <app-modal
      [isOpen]="isPortModalOpen"
      [title]="isEditingPort ? 'Edit Operating Port / Terminal' : 'Register New Port / Terminal'"
      subtitle="Configure port identifier, regional regime, and maritime location details"
      icon="anchor"
      maxWidth="580px"
      (close)="isPortModalOpen = false">
      <div modal-body *ngIf="selectedPort">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Port Code (UN/LOCODE) *</label>
              <input type="text" [(ngModel)]="selectedPort.code" class="custom-input" placeholder="e.g. SGSIN" />
            </div>
            <div class="form-col">
              <label class="form-label">Port / Terminal Name *</label>
              <input type="text" [(ngModel)]="selectedPort.name" class="custom-input" placeholder="e.g. Port of Singapore" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Country</label>
              <input type="text" [(ngModel)]="selectedPort.country" class="custom-input" placeholder="e.g. Singapore" />
            </div>
            <div class="form-col">
              <label class="form-label">Trading Region</label>
              <input type="text" [(ngModel)]="selectedPort.region" class="custom-input" placeholder="e.g. Southeast Asia" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">PSC MOU Regime</label>
              <select [(ngModel)]="selectedPort.mouRegime" class="custom-select">
                <option value="Tokyo MOU">Tokyo MOU (Asia-Pacific)</option>
                <option value="Paris MOU">Paris MOU (Europe & North Atlantic)</option>
                <option value="USCG">United States Coast Guard (USCG)</option>
                <option value="Riyadh MOU">Riyadh MOU (Gulf Region)</option>
                <option value="Indian Ocean MOU">Indian Ocean MOU</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Status</label>
              <select [(ngModel)]="selectedPort.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Restricted">Restricted</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isPortModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="savePort()">
          <mat-icon>save</mat-icon> Save Port
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         5. DEPARTMENT VIEW & EDIT MODALS
         ========================================================== -->
    <app-modal
      [isOpen]="isDeptViewModalOpen"
      title="Department Scope & Leadership"
      subtitle="Departmental organization and Designated HoD sign-off authorization"
      icon="business"
      maxWidth="540px"
      (close)="isDeptViewModalOpen = false">
      <div modal-body *ngIf="viewingDept">
        <div class="view-card">
          <div class="view-header-strip">
            <mat-icon class="view-header-icon">business</mat-icon>
            <div>
              <h3 class="view-title">{{ viewingDept.name }}</h3>
              <span class="view-sub">Code: {{ viewingDept.code }}</span>
            </div>
          </div>
          <div class="view-grid">
            <div class="view-item">
              <span class="view-label">Designated Head of Department</span>
              <span class="view-val"><strong>{{ viewingDept.head }}</strong></span>
            </div>
            <div class="view-item">
              <span class="view-label">Responsibility Scope</span>
              <span class="view-val">Operational compliance, daily log review & CAPA closeout verification</span>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isDeptViewModalOpen = false">Close</button>
        <button mat-flat-button color="primary" (click)="isDeptViewModalOpen = false; editDept(viewingDept!)">
          <mat-icon>edit</mat-icon> Edit Department
        </button>
      </div>
    </app-modal>

    <app-modal
      [isOpen]="isDeptModalOpen"
      [title]="isEditingDept ? 'Edit Department Head & Scope' : 'Add New Department'"
      subtitle="Assign departmental leadership for Maker-Checker sign-offs"
      icon="business"
      maxWidth="540px"
      (close)="isDeptModalOpen = false">
      <div modal-body *ngIf="selectedDept">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Department Code *</label>
              <input type="text" [(ngModel)]="selectedDept.code" class="custom-input" placeholder="e.g. DEC" />
            </div>
            <div class="form-col">
              <label class="form-label">Department Name *</label>
              <input type="text" [(ngModel)]="selectedDept.name" class="custom-input" placeholder="e.g. Deck Department" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Designated Department Head *</label>
              <input type="text" [(ngModel)]="selectedDept.head" class="custom-input" placeholder="e.g. Chief Officer K. Hansen" />
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isDeptModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveDept()">
          <mat-icon>save</mat-icon> Save Department
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         6. CATEGORY VIEW & EDIT MODALS
         ========================================================== -->
    <app-modal
      [isOpen]="isCategoryViewModalOpen"
      title="HSEQ Category Definition"
      subtitle="Standard taxonomy classification details and risk evaluation"
      icon="label"
      maxWidth="540px"
      (close)="isCategoryViewModalOpen = false">
      <div modal-body *ngIf="viewingCategory">
        <div class="view-card">
          <div class="view-header-strip">
            <mat-icon class="view-header-icon">label</mat-icon>
            <div>
              <h3 class="view-title">{{ viewingCategory.name }}</h3>
              <span class="view-sub">Code: {{ viewingCategory.code }} &bull; {{ viewingCategory.scope }}</span>
            </div>
            <app-status-badge [status]="viewingCategory.status" class="ml-auto"></app-status-badge>
          </div>
          <div class="view-grid">
            <div class="view-item">
              <span class="view-label">Severity / Risk Weight</span>
              <span class="view-val">
                <span class="weight-badge" [ngClass]="'weight-' + viewingCategory.severityWeight.toLowerCase()">
                  {{ viewingCategory.severityWeight }}
                </span>
              </span>
            </div>
            <div class="view-item">
              <span class="view-label">Functional Module Scope</span>
              <span class="view-val">{{ viewingCategory.scope }}</span>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isCategoryViewModalOpen = false">Close</button>
        <button mat-flat-button color="primary" (click)="isCategoryViewModalOpen = false; editCategory(viewingCategory!)">
          <mat-icon>edit</mat-icon> Edit Category
        </button>
      </div>
    </app-modal>

    <app-modal
      [isOpen]="isCategoryModalOpen"
      [title]="isEditingCategory ? 'Edit HSEQ Category' : 'Add New HSEQ Category'"
      subtitle="Configure classification parameters, functional domain scope, and risk evaluation weight"
      icon="label"
      maxWidth="560px"
      (close)="isCategoryModalOpen = false">
      <div modal-body *ngIf="selectedCategory">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Domain Scope *</label>
              <select [(ngModel)]="selectedCategory.scope" class="custom-select">
                <option value="Inspection Finding">Inspection Finding</option>
                <option value="Near Miss">Near Miss</option>
                <option value="Permit to Work">Permit to Work</option>
                <option value="Injury Classification">Injury Classification</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Category Code *</label>
              <input type="text" [(ngModel)]="selectedCategory.code" class="custom-input" placeholder="e.g. CAT-MTR" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Category Name *</label>
              <input type="text" [(ngModel)]="selectedCategory.name" class="custom-input" placeholder="e.g. Mooring & Towing Equipment" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Severity / Risk Weight</label>
              <select [(ngModel)]="selectedCategory.severityWeight" class="custom-select">
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Informational">Informational</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Status</label>
              <select [(ngModel)]="selectedCategory.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Deprecated">Deprecated</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isCategoryModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveCategory()">
          <mat-icon>save</mat-icon> Save Category
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         6. INSPECTOR VIEW & EDIT MODALS
         ========================================================== -->
    <app-modal
      [isOpen]="isInspectorViewModalOpen"
      title="Inspector & Auditor Profile"
      subtitle="Fleet technical auditor credentials and auditing body"
      icon="badge"
      maxWidth="580px"
      (close)="isInspectorViewModalOpen = false">
      <div modal-body *ngIf="viewingInspector">
        <div class="view-card">
          <div class="view-header-strip">
            <mat-icon class="view-header-icon">badge</mat-icon>
            <div>
              <h3 class="view-title">{{ viewingInspector.name }}</h3>
              <span class="view-sub">{{ viewingInspector.organization }} &bull; {{ viewingInspector.role }}</span>
            </div>
            <app-status-badge [status]="viewingInspector.status" class="ml-auto"></app-status-badge>
          </div>
          <div class="view-grid">
            <div class="view-item">
              <span class="view-label">Auditing Organization</span>
              <span class="view-val">{{ viewingInspector.organization }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">Primary Role</span>
              <span class="view-val">{{ viewingInspector.role }}</span>
            </div>
            <div class="view-item">
              <span class="view-label">Registry Status</span>
              <span class="view-val">{{ viewingInspector.status }}</span>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isInspectorViewModalOpen = false">Close</button>
        <button mat-flat-button color="primary" (click)="isInspectorViewModalOpen = false; editInspector(viewingInspector!)">
          <mat-icon>edit</mat-icon> Edit Inspector
        </button>
      </div>
    </app-modal>

    <app-modal
      [isOpen]="isInspectorModalOpen"
      [title]="isEditingInspector ? 'Edit Auditor / Inspector' : 'Register New Auditor / Inspector'"
      subtitle="Add qualified fleet auditor or external regulatory surveyor"
      icon="badge"
      maxWidth="580px"
      (close)="isInspectorModalOpen = false">
      <div modal-body *ngIf="selectedInspector">
        <div class="modal-form">
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Full Name & Rank *</label>
              <input type="text" [(ngModel)]="selectedInspector.name" class="custom-input" placeholder="e.g. Capt. J. Vance" />
            </div>
            <div class="form-col">
              <label class="form-label">Organization / Entity *</label>
              <input type="text" [(ngModel)]="selectedInspector.organization" class="custom-input" placeholder="e.g. DNV / Saudi Aramco / Navis Internal" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label class="form-label">Designation / Role</label>
              <select [(ngModel)]="selectedInspector.role" class="custom-select">
                <option value="Lead Auditor">Lead Auditor</option>
                <option value="Class Surveyor">Class Surveyor</option>
                <option value="Marine Superintendent">Marine Superintendent</option>
                <option value="Port State Control Officer">Port State Control Officer</option>
                <option value="Oil Major Vetting Auditor">Oil Major Vetting Auditor</option>
                <option value="Safety Officer">Safety Officer</option>
              </select>
            </div>
            <div class="form-col">
              <label class="form-label">Status</label>
              <select [(ngModel)]="selectedInspector.status" class="custom-select">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div modal-footer>
        <button mat-stroked-button (click)="isInspectorModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveInspector()">
          <mat-icon>save</mat-icon> Save Inspector
        </button>
      </div>
    </app-modal>

    <!-- ==========================================================
         7. BULK IMPORT MODAL
         ========================================================== -->
    <app-modal
      [isOpen]="isImportModalOpen"
      title="Bulk Master Data Import"
      subtitle="Upload fleet assets, crew rosters, and department mappings from Excel (.xlsx / .csv)"
      icon="upload_file"
      maxWidth="580px"
      (close)="isImportModalOpen = false">
      <div modal-body class="import-modal-body">
        <div class="drop-zone" (click)="fileInput.click()">
          <input 
            #fileInput 
            type="file" 
            class="hidden-file-input" 
            (change)="onFileSelected($event)" 
            accept=".xlsx,.csv" 
            style="display: none !important;" 
            hidden />
          
          @if (!selectedFileName) {
            <mat-icon class="drop-icon">cloud_upload</mat-icon>
            <div class="drop-text">
              <strong class="drop-title">Drag and drop master spreadsheet here</strong>
              <span class="drop-subtitle text-xs text-muted">Supports .xlsx, .csv formatted templates up to 25MB</span>
            </div>
            <button mat-stroked-button color="primary" class="btn-sm btn-browse" type="button" (click)="$event.stopPropagation(); fileInput.click()">
              <mat-icon>folder_open</mat-icon> Browse Local File
            </button>
          } @else {
            <div class="staged-file-card" (click)="$event.stopPropagation()">
              <div class="staged-icon-wrap">
                <mat-icon class="staged-icon">description</mat-icon>
              </div>
              <div class="staged-info">
                <strong class="staged-filename">{{ selectedFileName }}</strong>
                <span class="staged-meta text-xs text-muted">Spreadsheet staged &bull; Ready for master synchronization</span>
              </div>
              <button mat-button color="warn" class="btn-xs btn-change-staged" type="button" (click)="removeSelectedFile(fileInput)">
                <mat-icon>close</mat-icon> Remove
              </button>
            </div>
          }
        </div>

        <div class="template-box mt-3">
          <mat-icon class="text-blue">description</mat-icon>
          <div class="text-xs">
            <strong>Need the approved data layout?</strong>
            <span>Download the blank standard fleet import template before uploading.</span>
          </div>
          <button mat-button color="primary" class="btn-xs" (click)="downloadTemplate()">Download Template</button>
        </div>
      </div>

      <div modal-footer>
        <button mat-stroked-button (click)="isImportModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="processImport()">
          <mat-icon>check_circle</mat-icon> Process Import
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 14px; max-width: 1650px; margin: 0 auto; padding: 14px 20px; }
    .d-flex { display: flex; } .gap-2 { gap: 8px; }
    .btn-export { height: 34px !important; border-radius: var(--radius-sm) !important; font-family: inherit !important; font-size: 12px !important; }
    .btn-primary-action { height: 34px !important; border-radius: var(--radius-sm) !important; background: var(--primary) !important; color: var(--primary-foreground) !important; font-family: inherit !important; font-size: 12px !important; }
    .btn-add-entity { height: 32px !important; font-size: 12px !important; font-family: inherit !important; background: var(--primary) !important; color: var(--primary-foreground) !important; border-radius: var(--radius-sm) !important; }

    .hseq-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-2xs); overflow: hidden; }
    .tab-body { padding: 16px 20px; }

    .tab-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .toolbar-info { display: flex; align-items: center; gap: 10px; }
    .count-badge { font-size: 11px; font-weight: 700; background: var(--muted); padding: 3px 8px; border-radius: 9999px; border: 1px solid var(--border); color: var(--foreground); }
    .toolbar-sub { font-size: 12px; color: var(--muted-foreground); }
    .toolbar-filters { display: flex; align-items: center; gap: 8px; }
    .filter-label { font-size: 12px; font-weight: 700; color: var(--muted-foreground); }
    .custom-select-sm { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 5px 10px; font-size: 12px; color: var(--foreground); outline: none; }

    /* Tables */
    .table-responsive { overflow-x: auto; width: 100%; }
    .hseq-table { width: 100%; border-collapse: collapse; min-width: 900px; }
    .hseq-table th { background: var(--muted); color: var(--muted-foreground); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 12px; border-bottom: 1px solid var(--border); text-align: left; }
    .hseq-table td { padding: 8px 12px; font-size: 12.5px; color: var(--foreground); vertical-align: middle; border-bottom: 1px solid var(--border); }
    .hseq-table tr:hover { background-color: var(--accent); }

    .vessel-cell, .hod-cell { display: inline-flex; align-items: center; gap: 6px; }
    .vessel-icon, .hod-icon { font-size: 16px; width: 16px; height: 16px; color: var(--primary); }

    .type-tag { font-size: 11px; font-weight: 600; background: var(--accent); color: var(--primary); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border); }
    .cat-chip { font-size: 11px; background: var(--muted); padding: 2px 7px; border-radius: 4px; border: 1px solid var(--border); color: var(--foreground); }
    .count-pill { font-size: 11px; font-weight: 700; background: oklch(0.93 0.05 145); color: oklch(0.38 0.15 145); padding: 2px 7px; border-radius: 9999px; }

    .cat-scope-tag { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; text-transform: uppercase; }
    .cat-scope-tag.scope-insp { background: oklch(0.93 0.05 240); color: oklch(0.40 0.14 240); }
    .cat-scope-tag.scope-nm { background: oklch(0.94 0.07 70); color: oklch(0.48 0.16 65); }
    .cat-scope-tag.scope-ptw { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }
    .cat-scope-tag.scope-inj { background: oklch(0.93 0.05 300); color: oklch(0.40 0.12 300); }

    .weight-badge { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 9999px; }
    .weight-critical { background: oklch(0.93 0.08 25); color: oklch(0.48 0.18 25); }
    .weight-high { background: oklch(0.94 0.07 50); color: oklch(0.48 0.17 45); }
    .weight-medium { background: oklch(0.94 0.07 70); color: oklch(0.48 0.16 65); }
    .weight-low { background: oklch(0.93 0.05 240); color: oklch(0.40 0.12 240); }
    .weight-informational { background: var(--muted); color: var(--muted-foreground); }

    /* Actions */
    .col-actions { text-align: right; width: 155px; }
    .actions-group { display: inline-flex; align-items: center; justify-content: flex-end; gap: 4px; }
    .btn-view-action {
      display: inline-flex; align-items: center; gap: 3px;
      background: var(--card); border: 1px solid var(--border);
      color: var(--foreground); padding: 3px 8px; border-radius: var(--radius-sm);
      font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
      font-family: inherit;
    }
    .btn-view-action:hover { border-color: var(--primary); background: var(--accent); color: var(--primary); }
    .btn-view-action mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--primary); }

    .btn-edit-action, .btn-delete-action {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border: 1px solid var(--border);
      background: var(--card); border-radius: var(--radius-sm);
      color: var(--muted-foreground); cursor: pointer; transition: all 0.15s ease;
    }
    .btn-edit-action:hover { border-color: var(--primary); background: var(--accent); color: var(--primary); }
    .btn-edit-action mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .btn-delete-action:hover { border-color: #ef4444; background: #fef2f2; color: #dc2626; }
    .btn-delete-action mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Forms */
    .modal-form { display: flex; flex-direction: column; gap: 12px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }
    .form-col { display: flex; flex-direction: column; gap: 5px; }
    .form-label { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); }
    .custom-input, .custom-select {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 6px 10px; font-size: 12.5px;
      color: var(--foreground); font-family: inherit; outline: none;
    }
    .custom-input:focus, .custom-select:focus { border-color: var(--primary); }

    /* View Modal Cards */
    .view-card { display: flex; flex-direction: column; gap: 14px; }
    .view-header-strip { display: flex; align-items: center; gap: 10px; padding: 12px; background: var(--muted); border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .view-header-icon { font-size: 24px; width: 24px; height: 24px; color: var(--primary); }
    .view-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--foreground); }
    .view-sub { font-size: 11.5px; color: var(--muted-foreground); }
    .view-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .view-item { background: var(--muted); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 3px; }
    .view-label { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .view-val { font-size: 12.5px; color: var(--foreground); }

    /* Bulk Import */
    .hidden-file-input {
      display: none !important;
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      visibility: hidden !important;
    }
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-sm);
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      text-align: center;
      background: var(--muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .drop-zone:hover { border-color: var(--primary); background: var(--accent); }
    .drop-icon { font-size: 38px; width: 38px; height: 38px; color: var(--primary); }
    .drop-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .drop-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .drop-subtitle {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }
    .btn-browse {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px !important;
      font-weight: 600 !important;
    }
    .btn-browse mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .staged-file-card {
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .staged-icon-wrap {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      background: oklch(0.94 0.05 145);
      color: oklch(0.40 0.15 145);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .staged-icon { font-size: 18px; width: 18px; height: 18px; }
    .staged-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      flex: 1;
      text-align: left;
    }
    .staged-filename { font-size: 12.5px; font-weight: 700; color: var(--foreground); word-break: break-all; }
    .staged-meta { font-size: 11px; color: var(--muted-foreground); }
    .btn-change-staged { font-size: 11px !important; display: inline-flex; align-items: center; gap: 4px; }
    .btn-change-staged mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .template-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
    }
    .text-blue { color: var(--primary); }
    .text-xs { font-size: 11.5px; }
    .text-muted { color: var(--muted-foreground); }
    .btn-xs { font-size: 11px !important; }
    .btn-sm { font-size: 12px !important; }
    .mt-3 { margin-top: 10px; }
    .ml-auto { margin-left: auto; }
    .font-mono { font-family: monospace; }
  `]
})
export class MasterDataComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  activeTabIndex = 0;

  // 1. Vessel States
  isVesselModalOpen = false;
  isVesselViewModalOpen = false;
  isEditingVessel = false;
  selectedVessel?: Vessel;
  viewingVessel?: Vessel;

  // 2. Vessel Types (Master Data Bound)
  readonly vesselTypes = this.state.vesselTypes;
  isVesselTypeModalOpen = false;
  isVesselTypeViewModalOpen = false;
  isEditingVesselType = false;
  selectedVesselType?: VesselTypeItem;
  viewingVesselType?: VesselTypeItem;

  // 3. Operating Ports & Locations (Master Data Bound)
  readonly ports = this.state.ports;
  isPortModalOpen = false;
  isPortViewModalOpen = false;
  isEditingPort = false;
  selectedPort?: PortItem;
  viewingPort?: PortItem;

  // 4. Department States
  isDeptModalOpen = false;
  isDeptViewModalOpen = false;
  isEditingDept = false;
  selectedDept?: Department;
  viewingDept?: Department;

  // 5. Configurable Categories (Master Data Bound)
  categoryScopeFilter = 'ALL';
  readonly categories = this.state.categories;
  isCategoryModalOpen = false;
  isCategoryViewModalOpen = false;
  isEditingCategory = false;
  selectedCategory?: CategoryItem;
  viewingCategory?: CategoryItem;

  // 6. Fleet Inspectors & Auditors (Master Data Bound)
  readonly inspectors = this.state.inspectors;
  isInspectorModalOpen = false;
  isInspectorViewModalOpen = false;
  isEditingInspector = false;
  selectedInspector?: InspectorItem;
  viewingInspector?: InspectorItem;

  // Bulk Import
  isImportModalOpen = false;
  selectedFileName = '';

  filteredCategories() {
    if (this.categoryScopeFilter === 'ALL') return this.categories();
    return this.categories().filter(c => c.scope === this.categoryScopeFilter);
  }

  getScopeClass(scope: string): string {
    switch (scope) {
      case 'Inspection Finding': return 'scope-insp';
      case 'Near Miss': return 'scope-nm';
      case 'Permit to Work': return 'scope-ptw';
      case 'Injury Classification': return 'scope-inj';
      default: return '';
    }
  }


  // 1. Vessel Handlers
  viewVessel(v: Vessel) {
    this.viewingVessel = v;
    this.isVesselViewModalOpen = true;
  }

  editVessel(v: Vessel) {
    this.selectedVessel = { ...v };
    this.isEditingVessel = true;
    this.isVesselModalOpen = true;
  }

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

  saveVessel() {
    if (!this.selectedVessel || !this.selectedVessel.name.trim()) {
      this.notify.showError('Required Field', 'Please provide a valid vessel name.');
      return;
    }
    if (this.isEditingVessel) {
      this.state.updateVessel(this.selectedVessel);
      this.notify.showSuccess('Vessel Updated', `Parameters for ${this.selectedVessel.name} saved.`);
    } else {
      this.state.vessels.update(list => [...list, this.selectedVessel!]);
      this.notify.showSuccess('Vessel Registered', `${this.selectedVessel.name} added to company fleet.`);
    }
    this.isVesselModalOpen = false;
  }

  deleteVessel(v: Vessel) {
    if (confirm(`Are you sure you want to remove ${v.name} from active fleet master?`)) {
      this.state.vessels.update(list => list.filter(item => item.id !== v.id));
      this.notify.showSuccess('Vessel Removed', `${v.name} has been archived.`);
    }
  }

  // 2. Vessel Type Handlers
  viewVesselType(vt: VesselTypeItem) {
    this.viewingVesselType = vt;
    this.isVesselTypeViewModalOpen = true;
  }

  editVesselType(vt: VesselTypeItem) {
    this.selectedVesselType = { ...vt };
    this.isEditingVesselType = true;
    this.isVesselTypeModalOpen = true;
  }

  openAddVesselTypeModal() {
    this.selectedVesselType = {
      id: `VT-${String(this.vesselTypes().length + 1).padStart(2, '0')}`,
      code: 'VT-NEW',
      name: '',
      classCategory: 'Specialized Cargo',
      typicalDwt: '10,000 - 30,000 DWT',
      activeCount: 0,
      status: 'Active'
    };
    this.isEditingVesselType = false;
    this.isVesselTypeModalOpen = true;
  }

  saveVesselType() {
    if (!this.selectedVesselType || !this.selectedVesselType.name.trim()) {
      this.notify.showError('Required Field', 'Please provide a vessel type name.');
      return;
    }
    if (this.isEditingVesselType) {
      this.vesselTypes.update(list => list.map(item => item.id === this.selectedVesselType!.id ? this.selectedVesselType! : item));
      this.notify.showSuccess('Type Updated', `Vessel class ${this.selectedVesselType.name} updated.`);
    } else {
      this.vesselTypes.update(list => [...list, this.selectedVesselType!]);
      this.notify.showSuccess('Type Added', `Vessel class ${this.selectedVesselType.name} registered.`);
    }
    this.isVesselTypeModalOpen = false;
  }

  deleteVesselType(vt: VesselTypeItem) {
    if (confirm(`Are you sure you want to delete ${vt.name}?`)) {
      this.vesselTypes.update(list => list.filter(item => item.id !== vt.id));
      this.notify.showSuccess('Type Deleted', `${vt.name} removed.`);
    }
  }

  // 3. Port Handlers
  viewPort(p: PortItem) {
    this.viewingPort = p;
    this.isPortViewModalOpen = true;
  }

  editPort(p: PortItem) {
    this.selectedPort = { ...p };
    this.isEditingPort = true;
    this.isPortModalOpen = true;
  }

  openAddPortModal() {
    this.selectedPort = {
      id: `PRT-${String(this.ports().length + 1).padStart(2, '0')}`,
      code: '',
      name: '',
      country: '',
      region: 'Global Shipping Corridor',
      mouRegime: 'Tokyo MOU',
      status: 'Active'
    };
    this.isEditingPort = false;
    this.isPortModalOpen = true;
  }

  savePort() {
    if (!this.selectedPort || !this.selectedPort.name.trim() || !this.selectedPort.code.trim()) {
      this.notify.showError('Required Fields', 'Please provide both a port name and UN/LOCODE code.');
      return;
    }
    if (this.isEditingPort) {
      this.ports.update(list => list.map(item => item.id === this.selectedPort!.id ? this.selectedPort! : item));
      this.notify.showSuccess('Port Updated', `${this.selectedPort.name} updated.`);
    } else {
      this.ports.update(list => [...list, this.selectedPort!]);
      this.notify.showSuccess('Port Registered', `${this.selectedPort.name} added to port directory.`);
    }
    this.isPortModalOpen = false;
  }

  deletePort(p: PortItem) {
    if (confirm(`Are you sure you want to delete ${p.name}?`)) {
      this.ports.update(list => list.filter(item => item.id !== p.id));
      this.notify.showSuccess('Port Deleted', `${p.name} removed.`);
    }
  }

  // 4. Department Handlers
  viewDept(d: Department) {
    this.viewingDept = d;
    this.isDeptViewModalOpen = true;
  }

  editDept(d: Department) {
    this.selectedDept = { ...d };
    this.isEditingDept = true;
    this.isDeptModalOpen = true;
  }

  openAddDeptModal() {
    this.selectedDept = {
      id: `DEP-${String(this.state.departments().length + 1).padStart(2, '0')}`,
      code: 'NEW',
      name: '',
      head: ''
    };
    this.isEditingDept = false;
    this.isDeptModalOpen = true;
  }

  saveDept() {
    if (!this.selectedDept || !this.selectedDept.name.trim() || !this.selectedDept.head.trim()) {
      this.notify.showError('Required Fields', 'Please provide department name and designated head.');
      return;
    }
    if (this.isEditingDept) {
      this.state.updateDepartment(this.selectedDept);
      this.notify.showSuccess('Department Updated', `${this.selectedDept.name} leadership updated.`);
    } else {
      this.state.departments.update(list => [...list, this.selectedDept!]);
      this.notify.showSuccess('Department Added', `${this.selectedDept.name} registered.`);
    }
    this.isDeptModalOpen = false;
  }

  deleteDept(d: Department) {
    if (confirm(`Are you sure you want to delete ${d.name}?`)) {
      this.state.departments.update(list => list.filter(item => item.id !== d.id));
      this.notify.showSuccess('Department Deleted', `${d.name} removed.`);
    }
  }

  // 5. Category Handlers
  viewCategory(cat: CategoryItem) {
    this.viewingCategory = cat;
    this.isCategoryViewModalOpen = true;
  }

  editCategory(cat: CategoryItem) {
    this.selectedCategory = { ...cat };
    this.isEditingCategory = true;
    this.isCategoryModalOpen = true;
  }

  openAddCategoryModal() {
    this.selectedCategory = {
      id: `CAT-${String(this.categories().length + 1).padStart(2, '0')}`,
      scope: 'Inspection Finding',
      code: 'CAT-NEW',
      name: '',
      severityWeight: 'Medium',
      status: 'Active'
    };
    this.isEditingCategory = false;
    this.isCategoryModalOpen = true;
  }

  saveCategory() {
    if (!this.selectedCategory || !this.selectedCategory.name.trim()) {
      this.notify.showError('Required Field', 'Please provide a category name.');
      return;
    }
    if (this.isEditingCategory) {
      this.categories.update(list => list.map(item => item.id === this.selectedCategory!.id ? this.selectedCategory! : item));
      this.notify.showSuccess('Category Updated', `${this.selectedCategory.name} updated.`);
    } else {
      this.categories.update(list => [...list, this.selectedCategory!]);
      this.notify.showSuccess('Category Added', `${this.selectedCategory.name} added to ${this.selectedCategory.scope}.`);
    }
    this.isCategoryModalOpen = false;
  }

  deleteCategory(cat: CategoryItem) {
    if (confirm(`Are you sure you want to delete ${cat.name}?`)) {
      this.state.deleteCategory(cat.id);
      this.notify.showSuccess('Category Deleted', `${cat.name} removed.`);
    }
  }

  // 6. Inspector Handlers
  viewInspector(ins: InspectorItem) {
    this.viewingInspector = ins;
    this.isInspectorViewModalOpen = true;
  }

  editInspector(ins: InspectorItem) {
    this.selectedInspector = { ...ins };
    this.isEditingInspector = true;
    this.isInspectorModalOpen = true;
  }

  openAddInspectorModal() {
    this.selectedInspector = {
      id: `INS-P${String(this.inspectors().length + 1).padStart(2, '0')}`,
      name: '',
      organization: 'Classification Society',
      role: 'Lead Auditor',
      status: 'Active'
    };
    this.isEditingInspector = false;
    this.isInspectorModalOpen = true;
  }

  saveInspector() {
    if (!this.selectedInspector || !this.selectedInspector.name.trim()) {
      this.notify.showError('Required Field', 'Please provide inspector / auditor name.');
      return;
    }
    if (this.isEditingInspector) {
      this.state.updateInspector(this.selectedInspector);
      this.notify.showSuccess('Inspector Updated', `${this.selectedInspector.name} details saved.`);
    } else {
      this.state.addInspector(this.selectedInspector);
      this.notify.showSuccess('Inspector Registered', `${this.selectedInspector.name} added to central registry.`);
    }
    this.isInspectorModalOpen = false;
  }

  deleteInspector(ins: InspectorItem) {
    if (confirm(`Are you sure you want to remove ${ins.name}?`)) {
      this.state.deleteInspector(ins.id);
      this.notify.showSuccess('Inspector Removed', `${ins.name} removed from registry.`);
    }
  }

  // Bulk Import Handlers
  openImportModal() {
    this.selectedFileName = '';
    this.isImportModalOpen = true;
  }

  onFileSelected(event: any) {
    const file = event.target?.files?.[0];
    if (file) {
      this.selectedFileName = file.name;
      this.notify.showInfo('File Staged', `${file.name} ready for processing.`);
    }
  }

  removeSelectedFile(fileInput: HTMLInputElement) {
    this.selectedFileName = '';
    fileInput.value = '';
    this.notify.showInfo('File Cleared', 'Staged file removed.');
  }

  processImport() {
    this.state.bulkImportMasterData({
      vessels: [
        { id: `VES-${String(this.state.vessels().length + 1).padStart(2, '0')}`, name: 'MV Southern Cross', imoNumber: '9785123', flag: 'Panama', vesselType: 'Container Vessel', departmentCount: 4, crewCount: 22, status: 'Active' },
        { id: `VES-${String(this.state.vessels().length + 2).padStart(2, '0')}`, name: 'MT Arabian Crown', imoNumber: '9651842', flag: 'Saudi Arabia', vesselType: 'Crude Oil Tanker', departmentCount: 4, crewCount: 26, status: 'Active' }
      ],
      ports: [
        { id: `PRT-${String(this.state.ports().length + 1).padStart(2, '0')}`, code: 'SAJUB', name: 'Jubail Commercial Port', country: 'Saudi Arabia', region: 'Arabian Gulf', mouRegime: 'Riyadh MOU', status: 'Active' }
      ]
    });
    this.isImportModalOpen = false;
    this.selectedFileName = '';
    this.notify.showSuccess('Import Successful', 'Bulk master data import processed: 2 vessels and 1 operating port synchronized across all modules.');
  }

  downloadTemplate() {
    this.notify.showInfo('Template Downloaded', 'Master data standard template (HSEQ_Master_Template.xlsx) downloaded.');
  }
}
