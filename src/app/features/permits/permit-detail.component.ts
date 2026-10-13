import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PermitStore } from '../../core/stores/permit.store';
import { PermitToWorkRecord, GasTestReading, LotoRecord, PtwChecklistTemplate, PermitTypeItem } from '../../core/models/hseq.models';
import { COLD_WORK_SCOPES } from './permit-form.component';

@Component({
  selector: 'app-permit-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatTooltipModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    ModalComponent
  ],
  template: `
    @if (permit()) {
      <div class="module-container">
        <!-- Page Header -->
        <app-page-header
          [title]="permit()!.referenceNo + ' • ' + permit()!.permitType"
          [subtitle]="permit()!.vesselName + ' • ' + (permit()!.areaFieldLocation || 'Offshore') + ' • ' + (permit()!.locationOfWork || permit()!.worksiteLocation)"
          icon="vpn_key"
          [breadcrumbs]="[
            {label: 'Overview', link: '/dashboard'},
            {label: 'Permits to Work', link: '/permits'},
            {label: permit()!.referenceNo}
          ]">
          <div actions class="d-flex gap-2 flex-wrap align-items-center">
            <button mat-stroked-button routerLink="/permits" class="btn-cancel">
              <mat-icon>arrow_back</mat-icon> Back to Register
            </button>

            <!-- Edit Button for Draft / Requested -->
            @if (permit()!.status === 'Draft' || permit()!.status === 'Requested') {
              <button mat-stroked-button color="primary" [routerLink]="['/permits/edit', permit()!.id]">
                <mat-icon>edit</mat-icon> Edit Details
              </button>
            }

            <!-- Step 1 Active: Submit for Review -->
            @if (permit()!.status === 'Draft') {
              <button mat-flat-button color="primary" class="btn-primary-action" (click)="submitForReview()">
                <mat-icon>send</mat-icon> Submit for Area Review
              </button>
            }

            <!-- Step 2 Active: Area Safety Review -->
            @if (permit()!.status === 'Requested' && !permit()!.workflowProgress?.areaSafetyReviewed) {
              <button mat-flat-button color="primary" class="btn-primary-action" (click)="openAreaReviewModal = true">
                <mat-icon>verified_user</mat-icon> Endorse Area Safety
              </button>
            }

            <!-- Step 3 Active: Verify Controls -->
            @if (permit()!.status === 'Requested' && permit()!.workflowProgress?.areaSafetyReviewed && !permit()!.workflowProgress?.controlsVerified) {
              <span class="inline-step-pill">
                <mat-icon>check_circle</mat-icon> Area Safety Endorsed
              </span>
              <button mat-flat-button color="primary" class="btn-primary-action" (click)="verifyControls()">
                <mat-icon>fact_check</mat-icon> Verify Work Plan & Controls
              </button>
            }

            <!-- Step 4 Active: Master Approval -->
            @if (permit()!.status === 'Requested' && permit()!.workflowProgress?.areaSafetyReviewed && permit()!.workflowProgress?.controlsVerified) {
              <span class="inline-step-pill">
                <mat-icon>check_circle</mat-icon> Area & Controls Verified
              </span>
              <button mat-flat-button color="primary" class="btn-primary-action btn-master-approve" (click)="openApproveModal = true">
                <mat-icon>thumb_up</mat-icon> Master Formal Approval
              </button>
            }

            <!-- Step 5 Active - Pre-activation: Authorize & Activate -->
            @if (permit()!.status === 'Approved') {
              <button mat-flat-button color="primary" class="btn-primary-action" (click)="activatePermit()">
                <mat-icon>play_arrow</mat-icon> Authorize & Activate Work
              </button>
            }

            <!-- Step 5 Active - Ongoing Operation -->
            @if ((permit()!.status === 'Active' || permit()!.status === 'Extended') && !permit()!.workflowProgress?.workCompleted) {
              <button mat-stroked-button color="warn" (click)="openSuspendModal = true">
                <mat-icon>pause_circle</mat-icon> Suspend Work
              </button>
              <button mat-stroked-button color="primary" (click)="openExtendModal = true">
                <mat-icon>update</mat-icon> Extend Validity
              </button>
              <button mat-flat-button color="primary" class="btn-primary-action" (click)="declareWorkComplete()">
                <mat-icon>done_all</mat-icon> Declare Work Complete
              </button>
            }

            <!-- Step 5 Suspended: Resume -->
            @if (permit()!.status === 'Suspended') {
              <button mat-flat-button color="primary" class="btn-primary-action" (click)="resumeWork()">
                <mat-icon>play_circle</mat-icon> Resume & Re-activate
              </button>
            }

            <!-- Step 6 Active: Site Restoration & Closure -->
            @if (permit()!.workflowProgress?.workCompleted && !permit()!.workflowProgress?.siteRestored) {
              <button mat-flat-button class="btn-close-permit" (click)="openRestoreModal = true">
                <mat-icon>cleaning_services</mat-icon> Verify Site Restoration & Close Permit
              </button>
            }

            <!-- Closed Final State Badge -->
            @if (permit()!.status === 'Closed') {
              <span class="status-badge badge-closed-pill">
                <mat-icon>task_alt</mat-icon> Work Completed & Permit Closed
              </span>
            }
          </div>
        </app-page-header>

        <!-- 6-Stage Interactive Visual Flowchart Banner -->
        <div class="hseq-card flowchart-card mb-4">
          <div class="flowchart-header">
            <div class="flow-title-wrap">
              <mat-icon class="flow-header-icon">account_tree</mat-icon>
              <div>
                <span class="flow-title">Interactive PTW Lifecycle & Sign-Off Authorization Engine</span>
                <span class="flow-subtitle">Current Status: <strong>{{ permit()!.status }}</strong> &bull; Client Validity: Max 8 Hours (Single Shift)</span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <app-status-badge [status]="permit()!.status"></app-status-badge>
            </div>
          </div>

          <!-- Flowchart Nodes Diagram -->
          <div class="flow-chart-diagram">
            <!-- Stage 1: Draft Creation -->
            <div class="flow-node" [class.node-done]="isPastStep(1)" [class.node-current]="isCurrentStep(1)">
              <div class="node-icon-wrap">
                <mat-icon>{{ isPastStep(1) ? 'check' : 'edit_document' }}</mat-icon>
              </div>
              <span class="node-title">1. Draft Created</span>
              <span class="node-sub">Performing Authority</span>
              <span class="node-status">{{ getStepStatus(1) }}</span>
            </div>
            <div class="flow-arrow-wrap" [class.arrow-active]="isPastStep(1)">
              <mat-icon class="flow-arrow">arrow_forward</mat-icon>
            </div>

            <!-- Stage 2: Area Safety Review -->
            <div class="flow-node" [class.node-done]="isPastStep(2)" [class.node-current]="isCurrentStep(2)">
              <div class="node-icon-wrap">
                <mat-icon>{{ isPastStep(2) ? 'check' : 'verified_user' }}</mat-icon>
              </div>
              <span class="node-title">2. Area Safety Review</span>
              <span class="node-sub">Area Authority</span>
              <span class="node-status">{{ getStepStatus(2) }}</span>
            </div>
            <div class="flow-arrow-wrap" [class.arrow-active]="isPastStep(2)">
              <mat-icon class="flow-arrow">arrow_forward</mat-icon>
            </div>

            <!-- Stage 3: Controls Verification -->
            <div class="flow-node" [class.node-done]="isPastStep(3)" [class.node-current]="isCurrentStep(3)">
              <div class="node-icon-wrap">
                <mat-icon>{{ isPastStep(3) ? 'check' : 'fact_check' }}</mat-icon>
              </div>
              <span class="node-title">3. Controls Verified</span>
              <span class="node-sub">Responsible Supervisor</span>
              <span class="node-status">{{ getStepStatus(3) }}</span>
            </div>
            <div class="flow-arrow-wrap" [class.arrow-active]="isPastStep(3)">
              <mat-icon class="flow-arrow">arrow_forward</mat-icon>
            </div>

            <!-- Stage 4: Master Approval -->
            <div class="flow-node" [class.node-done]="isPastStep(4)" [class.node-current]="isCurrentStep(4)">
              <div class="node-icon-wrap">
                <mat-icon>{{ isPastStep(4) ? 'check' : 'thumb_up' }}</mat-icon>
              </div>
              <span class="node-title">4. Master Approved</span>
              <span class="node-sub">Master / Approver</span>
              <span class="node-status">{{ getStepStatus(4) }}</span>
            </div>
            <div class="flow-arrow-wrap" [class.arrow-active]="isPastStep(4)">
              <mat-icon class="flow-arrow">arrow_forward</mat-icon>
            </div>

            <!-- Stage 5: Active Operation -->
            <div class="flow-node" [class.node-done]="isPastStep(5)" [class.node-current]="isCurrentStep(5)">
              <div class="node-icon-wrap">
                <mat-icon>{{ isPastStep(5) ? 'check' : 'engineering' }}</mat-icon>
              </div>
              <span class="node-title">5. Active Operation</span>
              <span class="node-sub">Continuous Watch</span>
              <span class="node-status">{{ getStepStatus(5) }}</span>
            </div>
            <div class="flow-arrow-wrap" [class.arrow-active]="isPastStep(5)">
              <mat-icon class="flow-arrow">arrow_forward</mat-icon>
            </div>

            <!-- Stage 6: Site Restoration & Closure -->
            <div class="flow-node" [class.node-done]="isPastStep(6)" [class.node-current]="isCurrentStep(6)">
              <div class="node-icon-wrap">
                <mat-icon>{{ isPastStep(6) ? 'check' : 'task_alt' }}</mat-icon>
              </div>
              <span class="node-title">6. Site Restored & Closed</span>
              <span class="node-sub">Final Sign-off</span>
              <span class="node-status">{{ getStepStatus(6) }}</span>
            </div>
          </div>
        </div>

        <!-- Key Details Summary Grid (Client Fields Alignment) -->
        <div class="summary-grid mb-4">
          <div class="hseq-card summary-card card-accent-top">
            <div class="summary-card-header">
              <span class="lbl">Area / Field / Location</span>
              <mat-icon class="card-hint-icon text-primary">place</mat-icon>
            </div>
            <span class="val font-sm">{{ permit()!.areaFieldLocation || 'Offshore Operational Field' }}</span>
            <span class="sub">Worksite: <strong>{{ permit()!.locationOfWork || permit()!.worksiteLocation }}</strong></span>
          </div>

          <div class="hseq-card summary-card card-accent-top">
            <div class="summary-card-header">
              <span class="lbl">Validity Window (Max 8 Hours)</span>
              <mat-icon class="card-hint-icon text-primary">schedule</mat-icon>
            </div>
            <span class="val font-sm">{{ permit()!.startDateTime }}</span>
            <span class="sub">Expiry: <strong>{{ permit()!.expiryDateTime }}</strong> ({{ permit()!.validityHours }}h window)</span>
          </div>

          <div class="hseq-card summary-card card-accent-top">
            <div class="summary-card-header">
              <span class="lbl">Person in Attendance</span>
              <mat-icon class="card-hint-icon text-muted">person_pin</mat-icon>
            </div>
            <span class="val font-sm">{{ permit()!.responsiblePersonInAttendance || permit()!.responsibleSupervisor || 'Chief Officer K. Hansen' }}</span>
            <span class="sub">Performing Authority: <strong>{{ permit()!.performingAuthority }}</strong></span>
          </div>

          @if (currentPermitConfig()?.sections?.requiresSimops) {
            <div class="hseq-card summary-card card-accent-top">
              <div class="summary-card-header">
                <span class="lbl">SIMOPS Coordination</span>
                <mat-icon class="card-hint-icon" [class.text-green]="!permit()!.simopsRequired" [class.text-amber]="permit()!.simopsRequired">
                  {{ permit()!.simopsRequired ? 'warning' : 'check_circle' }}
                </mat-icon>
              </div>
              <span class="val" [class.text-green]="!permit()!.simopsRequired" [class.text-amber]="permit()!.simopsRequired">
                {{ permit()!.simopsRequired ? 'SIMOPS Active' : 'Clear (No Conflict)' }}
              </span>
              <span class="sub">{{ permit()!.simopsNotes || 'No adjacent hazard conflict detected' }}</span>
            </div>
          }
        </div>

        <!-- Tabbed Verification & Operational Panels -->
        <div class="hseq-card p-0">
          <mat-tab-group class="custom-tab-group">
            
            <!-- Tab 1: Scope & Safeguards -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">description</mat-icon>
                Scope & Safeguards
              </ng-template>
              <div class="tab-body">
                <!-- Work Scope Block -->
                <div class="detail-box mb-4">
                  <span class="box-title">Description of Work & Operational Scope</span>
                  <p class="box-content font-bold">{{ permit()!.workDescription }}</p>
                </div>

                <!-- Work Party Crew Members Table from Client PTW Form -->
                @if (currentPermitConfig()?.sections?.requiresWorkCrew) {
                  <div class="sub-records-block mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong class="font-sm block">Personnel Carrying Out Work ({{ (permit()!.personnelCarryingOutWork || []).length }})</strong>
                        <span class="text-xs text-muted">All personnel briefed on RA, JSA precautions and stop-work authority</span>
                      </div>
                      <button type="button" mat-stroked-button color="primary" class="btn-xs" (click)="openAddCrewModal = true">
                        <mat-icon>person_add</mat-icon> Add Crew Member
                      </button>
                    </div>

                    <div class="table-responsive">
                      <table class="hseq-table table-compact">
                        <thead>
                          <tr>
                            <th style="width: 50px;">No.</th>
                            <th>Crew Member Name</th>
                            <th>Rank / Role</th>
                            <th>Safety Briefing & JSA Status</th>
                            <th class="text-right" style="width: 60px;">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (crew of permit()!.personnelCarryingOutWork || []; track $index) {
                            <tr>
                              <td class="font-mono font-bold">{{ $index + 1 }}.</td>
                              <td><strong>{{ crew.name }}</strong></td>
                              <td><span class="cat-chip">{{ crew.rank }}</span></td>
                              <td>
                                <span class="badge-success inline-block p-1 text-xs font-bold rounded">
                                  <mat-icon class="inline-icon">check</mat-icon> Briefed & Acknowledged
                                </span>
                              </td>
                              <td class="text-right">
                                <button type="button" class="btn-del" (click)="deleteCrewMember($index)" title="Remove Crew Member">
                                  <mat-icon>delete_outline</mat-icon>
                                </button>
                              </td>
                            </tr>
                          }
                          @if (!permit()!.personnelCarryingOutWork || permit()!.personnelCarryingOutWork!.length === 0) {
                            <tr>
                              <td colspan="5" class="text-center text-muted p-3">
                                No additional work party members added. Click "Add Crew Member" above to add personnel.
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- Conditional Specific Client Safeguards Panels -->
                @if (isConfinedSpaceEntry()) {
                  <div class="detail-box mb-4 border-blue">
                    <span class="box-title text-blue">Enclosed Space Entry Safeguards</span>
                    <div class="form-grid-3 mt-2">
                      <div><span class="text-xs text-muted block">Space Classification:</span><strong>{{ permit()!.spaceType || 'Enclosed Space' }}</strong></div>
                      <div><span class="text-xs text-muted block">Last Cargo:</span><strong>{{ permit()!.lastCargo || 'Cleaned & Gas-Free' }}</strong></div>
                      <div><span class="text-xs text-muted block">Attendant at Entrance:</span><strong>{{ permit()!.attendantAtEntrance || 'Responsible Attendant Stationed' }}</strong></div>
                    </div>
                    <div class="mt-2 text-xs">
                      <span class="text-muted block">Connected / Adjacent Spaces:</span>
                      <span>{{ permit()!.connectedAdjacentSpaces || 'Adjacent Ballast Wing Tanks assessed and isolated.' }}</span>
                    </div>
                  </div>
                }

                @if (isHotWork()) {
                  <div class="detail-box mb-4 border-amber">
                    <span class="box-title text-amber">Hot Work Fire Precautions</span>
                    <div class="form-grid-3 mt-2 mb-3">
                      <div><span class="text-xs text-muted block">Nominated Fire Watch:</span><strong>{{ permit()!.fireWatchmanName || 'Able Seaman Standing By' }}</strong></div>
                      <div><span class="text-xs text-muted block">Bridge VHF Channel:</span><strong>{{ permit()!.fireWatchBridgeComm || permit()!.fireWatchBridgeCommMethod || 'VHF Ch 14 / Working Ch 16' }}</strong></div>
                      <div><span class="text-xs text-muted block">Fire Main & Hoses:</span><strong class="text-green">{{ permit()!.fireMainPressurized !== false ? 'Pressurized & Charged' : 'Unpressurized' }}</strong></div>
                    </div>
                    @if (permit()!.adjacentSpacesGasFreeDetails) {
                      <div class="mb-3 text-xs p-2 bg-white border rounded">
                        <span class="text-muted block font-bold mb-1">Adjacent Compartments / Bulkheads Gas-Free Status:</span>
                        <span>{{ permit()!.adjacentSpacesGasFreeDetails }}</span>
                      </div>
                    }

                    <!-- Dedicated Safety Watch Monitoring Table (Form 09F-006-03) -->
                    @if (currentPermitConfig()?.sections?.requiresSafetyWatch || (permit()!.safetyWatchPersonnel && permit()!.safetyWatchPersonnel!.length > 0)) {
                      <div class="safety-watch-box mt-3 mb-3 p-3 bg-white border rounded">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <strong class="text-amber font-sm d-flex align-items-center gap-1">
                            <mat-icon class="text-amber">visibility</mat-icon>
                            Safety Watch Monitoring Personnel
                          </strong>
                          <span class="text-xs text-muted">Continuous Vigilance &bull; 1 hr Post-Work Patrol</span>
                        </div>
                        <div class="table-responsive">
                          <table class="hseq-table table-compact font-xs">
                            <thead>
                              <tr>
                                <th>No.</th>
                                <th>Safety Watch Name</th>
                                <th>Rank</th>
                                <th>Briefed & Radio Tested</th>
                                <th>Station / Monitoring Area</th>
                                <th>Action on Alarm</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (sw of permit()!.safetyWatchPersonnel || []; track $index) {
                                <tr>
                                  <td class="font-mono text-muted">{{ $index + 1 }}.</td>
                                  <td><strong>{{ sw.name || 'Dedicated Watch' }}</strong></td>
                                  <td><span class="cat-chip">{{ sw.rank || 'AB' }}</span></td>
                                  <td>
                                    <span class="status-badge" [class.badge-success]="sw.briefedRadioTested" [class.badge-secondary]="!sw.briefedRadioTested">
                                      {{ sw.briefedRadioTested ? 'Verified & Tested' : 'Pending' }}
                                    </span>
                                  </td>
                                  <td>{{ sw.monitoringStationArea || 'Adjacent Bulkhead' }}</td>
                                  <td class="text-amber font-bold">{{ sw.actionOnAlarm || 'Sound Alarm & Fight Fire' }}</td>
                                </tr>
                              }
                              @if (!permit()!.safetyWatchPersonnel || permit()!.safetyWatchPersonnel!.length === 0) {
                                <tr>
                                  <td colspan="6" class="text-center text-muted p-2">Standard Fire Watch stationed: {{ permit()!.fireWatchmanName || 'Able Seaman' }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }

                    <!-- Emergency Equipment Table (Form 09F-006-03) -->
                    @if (currentPermitConfig()?.sections?.requiresEmergencyEquipment || (permit()!.hotWorkEmergencyEquipment && permit()!.hotWorkEmergencyEquipment!.length > 0)) {
                      <div class="emergency-equipment-box mt-3 p-3 bg-white border rounded">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <strong class="text-red font-sm d-flex align-items-center gap-1">
                            <mat-icon class="text-red">local_fire_department</mat-icon>
                            Emergency Firefighting Equipment & Appliances On Scene
                          </strong>
                          <span class="text-xs text-muted">Staged Emergency Equipment</span>
                        </div>
                        <div class="table-responsive">
                          <table class="hseq-table table-compact font-xs">
                            <thead>
                              <tr>
                                <th>No.</th>
                                <th>Emergency Appliance / Equipment</th>
                                <th>Staging Location</th>
                                <th>Readiness on Scene</th>
                                <th>Inspected By</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (eq of permit()!.hotWorkEmergencyEquipment || []; track $index) {
                                <tr>
                                  <td class="font-mono text-muted">{{ $index + 1 }}.</td>
                                  <td><strong>{{ eq.item }}</strong></td>
                                  <td>{{ eq.location }}</td>
                                  <td>
                                    <span class="status-badge" [class.badge-success]="eq.readyOnScene" [class.badge-danger]="!eq.readyOnScene">
                                      <mat-icon class="inline-icon">{{ eq.readyOnScene ? 'check_circle' : 'warning' }}</mat-icon>
                                      {{ eq.readyOnScene ? 'Ready on Scene' : 'Not Ready' }}
                                    </span>
                                  </td>
                                  <td>{{ eq.inspectedBy || 'Safety Officer' }}</td>
                                </tr>
                              }
                              @if (!permit()!.hotWorkEmergencyEquipment || permit()!.hotWorkEmergencyEquipment!.length === 0) {
                                <tr>
                                  <td colspan="5" class="text-center text-muted p-2">Standard firefighting appliances positioned on scene.</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }
                  </div>
                }

                @if (isElectricalWork()) {
                  <div class="detail-box mb-4 border-purple">
                    <span class="box-title text-purple">Electrical Systems Work & Isolation Safeguards</span>
                    <div class="mt-2 mb-3">
                      <span class="text-xs text-muted block mb-1">Sources of Energy Involved:</span>
                      <div class="d-flex flex-wrap gap-1">
                        @for (src of permit()!.energySources || ['Electrical 440V', 'Electrical 220V']; track src) {
                          <span class="cat-chip font-bold">{{ src }}</span>
                        }
                      </div>
                    </div>

                    @if (permit()!.electricalEquipmentChecklist) {
                      <div class="elec-detail-summary mt-3 p-3 bg-white border rounded">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <strong class="text-purple font-sm">ELECTRICAL EQUIPMENT-CHECKLIST</strong>
                          <span class="text-xs text-muted">Chief Engineer: <strong>{{ permit()!.electricalEquipmentChecklist?.chiefEngineer || 'Chief Engineer' }}</strong></span>
                        </div>
                        <div class="form-grid-3 mb-3 text-xs">
                          <div><span class="text-muted">System: </span><strong>{{ permit()!.electricalEquipmentChecklist?.system }}</strong></div>
                          <div><span class="text-muted">Section: </span><strong>{{ permit()!.electricalEquipmentChecklist?.section }}</strong></div>
                          <div><span class="text-muted">Components: </span><strong>{{ permit()!.electricalEquipmentChecklist?.components }}</strong></div>
                        </div>
                        <div class="form-grid-2 mb-3 text-xs">
                          <div><span class="text-muted">Engineers: </span><strong>{{ permit()!.electricalEquipmentChecklist?.engineers }}</strong></div>
                          <div><span class="text-muted">Duration: </span><strong>{{ permit()!.electricalEquipmentChecklist?.durationHours }} Hours</strong></div>
                        </div>

                        <!-- 440V to 6.6kV Checks Table -->
                        <div class="table-responsive">
                          <table class="hseq-table table-compact font-xs">
                            <thead>
                              <tr>
                                <th style="width: 40px;">No.</th>
                                <th>440 Volt to 6.6 kVolt Safety Check</th>
                                <th style="width: 80px;" class="text-center">Before</th>
                                <th style="width: 80px;" class="text-center">After</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (chk of permit()!.electricalEquipmentChecklist?.highVoltageChecks || []; track chk.id; let idx = $index) {
                                <tr>
                                  <td class="font-mono text-muted">{{ idx + 1 }}.</td>
                                  <td>{{ chk.description }}</td>
                                  <td class="text-center">
                                    <span class="status-badge" [class.badge-success]="chk.before" [class.badge-secondary]="!chk.before">{{ chk.before ? 'Verified' : 'Pending' }}</span>
                                  </td>
                                  <td class="text-center">
                                    <span class="status-badge" [class.badge-success]="chk.after" [class.badge-secondary]="!chk.after">{{ chk.after ? 'Verified' : 'Pending' }}</span>
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>

                        @if (permit()!.electricalEquipmentChecklist?.lowVoltageChecks && permit()!.electricalEquipmentChecklist!.lowVoltageChecks!.length > 0) {
                          <div class="mt-3">
                            <strong class="text-xs text-muted block mb-1">0 to 440 Volt Systems (Low Voltage) Checks</strong>
                            <div class="table-responsive">
                              <table class="hseq-table table-compact font-xs">
                                <thead>
                                  <tr>
                                    <th style="width: 40px;">No.</th>
                                    <th>0 to 440 Volt Safety Check</th>
                                    <th style="width: 80px;" class="text-center">Before</th>
                                    <th style="width: 80px;" class="text-center">After</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (chk of permit()!.electricalEquipmentChecklist?.lowVoltageChecks || []; track chk.id; let idx = $index) {
                                    <tr>
                                      <td class="font-mono text-muted">{{ idx + 1 }}.</td>
                                      <td>{{ chk.description }}</td>
                                      <td class="text-center">
                                        <span class="status-badge" [class.badge-success]="chk.before" [class.badge-secondary]="!chk.before">{{ chk.before ? 'Verified' : 'Pending' }}</span>
                                      </td>
                                      <td class="text-center">
                                        <span class="status-badge" [class.badge-success]="chk.after" [class.badge-secondary]="!chk.after">{{ chk.after ? 'Verified' : 'Pending' }}</span>
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }

                @if (isWorkingAloft()) {
                  <div class="detail-box mb-4 border-blue">
                    <span class="box-title text-blue">Working Aloft Fall Protection & Transmitters Isolation</span>
                    <p class="text-xs text-muted mt-2">
                      Full body harness with inertia reel line verified. Radar scanners turned off with warning notices posted on bridge consoles. Radio transmitters disabled and funnel emissions reduced.
                    </p>
                  </div>
                }

                @if (isWorkingOverboard()) {
                  <div class="detail-box mb-4 border-blue">
                    <span class="box-title text-blue">Working Outboard / Overboard Maritime Precautions</span>
                    <p class="text-xs text-muted mt-2">
                      Vessel stopped / lee made. GPS Navigator MOB function tested. Auto-inflate lifejackets donned. Standby man in attendance with VHF radio. Propeller and thrusters immobilized. Rescue boat on standby.
                    </p>
                  </div>
                }

                @if (isColdWork()) {
                  <div class="detail-box mb-4 border-slate">
                    <span class="box-title text-slate">Cold Work Operational Controls</span>
                    <p class="text-xs text-muted mt-2">
                      Mechanical lifting gear SWL checked and certified. Hand and pneumatic tools inspected. Secondary dropped object containment installed. Combustible materials cleared 5m radius.
                    </p>

                    <!-- Table 2: Machinery / High Pressure Isolation Points -->
                    @if (currentPermitConfig()?.sections?.requiresIsolationPointsTable || (permit()!.machineryIsolationRecords && permit()!.machineryIsolationRecords!.length > 0)) {
                      <div class="machinery-isolation-box mt-3 mb-3 p-3 bg-white border rounded">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <strong class="text-slate font-sm d-flex align-items-center gap-1">
                            <mat-icon class="text-slate">settings_suggest</mat-icon>
                            Machinery / High Pressure Isolation Points
                          </strong>
                          <span class="text-xs text-muted">Mechanical, Hydraulic & Pressure Isolation Verification</span>
                        </div>
                        <div class="table-responsive">
                          <table class="hseq-table table-compact font-xs">
                            <thead>
                              <tr>
                                <th>No.</th>
                                <th>Machinery / System Component</th>
                                <th>Isolation Point</th>
                                <th>Isolation Method / Device</th>
                                <th>Isolated By / Time</th>
                                <th>De-Isolated By / Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (rec of permit()!.machineryIsolationRecords || []; track $index) {
                                <tr>
                                  <td class="font-mono text-muted">{{ $index + 1 }}.</td>
                                  <td><strong>{{ rec.equipment }}</strong></td>
                                  <td>{{ rec.isolationPoint }}</td>
                                  <td><span class="cat-chip">{{ rec.isolationMethod }}</span></td>
                                  <td>{{ rec.isolatedBy }} <span class="text-muted text-xs">({{ rec.isolatedDateTime }})</span></td>
                                  <td>{{ rec.deIsolatedBy || 'Pending Completion' }}</td>
                                </tr>
                              }
                              @if (!permit()!.machineryIsolationRecords || permit()!.machineryIsolationRecords!.length === 0) {
                                <tr>
                                  <td colspan="6" class="text-center text-muted p-2">No machinery isolations required for this cold work scope.</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }

                    <!-- Cold Work 6 Sub-Checklists Dynamic Viewer -->
                    @if (currentPermitConfig()?.sections?.requiresColdWorkSubChecklists) {
                      <div class="subchecklists-view-box mt-3 p-3 bg-white border rounded">
                        <div class="d-flex align-items-center justify-content-between mb-2">
                          <strong class="font-sm d-flex align-items-center gap-1">
                            <mat-icon class="text-primary">fact_check</mat-icon>
                            Cold Work Activity Sub-Checklists
                          </strong>
                          <span class="text-xs text-muted">6 Dedicated Activity Scopes</span>
                        </div>

                        <!-- Scope Navigation Tabs -->
                        <div class="subscope-tabs-nav mb-3">
                          @for (sc of coldWorkScopes; track sc.id) {
                            <button 
                              type="button" 
                              class="subscope-tab-btn" 
                              [class.tab-btn-active]="activeColdWorkTab() === sc.id"
                              (click)="setActiveColdWorkTab(sc.id)">
                              <span>{{ sc.title }}</span>
                              <span class="tab-badge">{{ sc.items.length }}</span>
                            </button>
                          }
                        </div>

                        <!-- Active Subscope Table -->
                        @for (sc of coldWorkScopes; track sc.id) {
                          @if (activeColdWorkTab() === sc.id) {
                            <div class="table-responsive">
                              <table class="hseq-table table-compact font-xs">
                                <thead>
                                  <tr>
                                    <th style="width: 50px;">Item</th>
                                    <th>Safety Check ({{ sc.formRef }})</th>
                                    <th style="width: 100px;" class="text-center">Recorded Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (item of sc.items; track item.id) {
                                    <tr>
                                      <td class="font-mono font-bold text-muted">{{ item.id }}</td>
                                      <td>{{ item.question }}</td>
                                      <td class="text-center">
                                        <span 
                                          class="chk-status-pill"
                                          [class.pill-yes]="getColdWorkAnswer(item.id) === 'YES'"
                                          [class.pill-no]="getColdWorkAnswer(item.id) === 'NO'"
                                          [class.pill-na]="getColdWorkAnswer(item.id) === 'NA'">
                                          {{ getColdWorkAnswer(item.id) }}
                                        </span>
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>
                }

                @if (isDivingOperation()) {
                  <div class="detail-box mb-4 border-blue">
                    <span class="box-title text-blue">Diving Operation Maritime Controls</span>
                    <div class="form-grid-3 mt-2">
                      <div><span class="text-xs text-muted block">Diving Supervisor:</span><strong>{{ permit()!.divingSupervisor || 'Certified Diving Supervisor' }}</strong></div>
                      <div><span class="text-xs text-muted block">Flag Alpha Displayed:</span><strong class="text-green">{{ permit()!.flagAlphaHoisted !== false ? 'Yes (Day/Night Signals)' : 'No' }}</strong></div>
                      <div><span class="text-xs text-muted block">Propulsion & Thrusters:</span><strong class="text-green">LOTO Isolated & Tagged</strong></div>
                    </div>
                  </div>
                }

                @if (isAsbestosWork()) {
                  <div class="detail-box mb-4 border-amber">
                    <span class="box-title text-amber">Asbestos Handling Protocols</span>
                    <div class="form-grid-3 mt-2">
                      <div><span class="text-xs text-muted block">DPA Written Permission:</span><strong class="text-green">{{ permit()!.dpaPermissionReceived !== false ? 'Received in Writing' : 'Pending' }}</strong></div>
                      <div><span class="text-xs text-muted block">BS 4555 Respirator:</span><strong class="text-green">Mandatory HEPA Filter</strong></div>
                      <div><span class="text-xs text-muted block">Waste Containment:</span><strong class="text-green">Double-bagged & Labeled</strong></div>
                    </div>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Tab 2: Master Data Safety Checklist Answers -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">fact_check</mat-icon>
                Safety Verification Checklist
              </ng-template>
              <div class="tab-body">
                <div class="panel-section-header mb-3">
                  <div class="panel-title-group">
                    <div class="icon-circle">
                      <mat-icon class="text-primary">fact_check</mat-icon>
                    </div>
                    <div>
                      <h3 class="panel-heading">{{ currentTemplate()?.title || 'Safety Verification Checklist' }}</h3>
                      <p class="panel-subheading">Standard safety questions &bull; Master Data driven verification</p>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="hseq-table">
                    <thead>
                      <tr>
                        <th style="width: 90px;">Item ID</th>
                        <th style="width: 160px;">Category</th>
                        <th>Safety Verification Check</th>
                        <th style="width: 130px;" class="text-center">Recorded Answer</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of currentTemplate()?.items || []; track item.id) {
                        <tr>
                          <td class="font-mono font-bold text-primary">{{ item.id }}</td>
                          <td><span class="cat-chip">{{ item.category || 'Safety Check' }}</span></td>
                          <td><strong>{{ item.question }}</strong></td>
                          <td class="text-center">
                            <span 
                              class="chk-status-pill" 
                              [class.pill-yes]="getChecklistAnswer(item.id) === 'YES'"
                              [class.pill-no]="getChecklistAnswer(item.id) === 'NO'"
                              [class.pill-na]="getChecklistAnswer(item.id) === 'NA'">
                              {{ getChecklistAnswer(item.id) }}
                            </span>
                          </td>
                        </tr>
                      }
                      @for (item of permit()!.customChecklistItems || []; track item.id) {
                        <tr class="custom-check-row">
                          <td class="font-mono font-bold text-amber">{{ item.id }}</td>
                          <td><span class="cat-chip cat-chip-custom">Custom Check</span></td>
                          <td><strong>{{ item.question }}</strong></td>
                          <td class="text-center">
                            <span 
                              class="chk-status-pill" 
                              [class.pill-yes]="getChecklistAnswer(item.id) === 'YES'"
                              [class.pill-no]="getChecklistAnswer(item.id) === 'NO'"
                              [class.pill-na]="getChecklistAnswer(item.id) === 'NA'">
                              {{ getChecklistAnswer(item.id) }}
                            </span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </mat-tab>

            <!-- Tab 3: Safety Controls & PPE -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">shield</mat-icon>
                Safety Controls & PPE
              </ng-template>
              <div class="tab-body">
                <div class="form-grid-2 mb-4">
                  <div class="detail-box">
                    <span class="box-title">Identified Operational Hazards</span>
                    <p class="box-content">{{ permit()!.hazards || 'General maritime industrial hazards assessed.' }}</p>
                  </div>
                  <div class="detail-box">
                    <span class="box-title">Control Measures & Mitigations</span>
                    <p class="box-content">{{ permit()!.controlMeasures || 'Safety controls and toolbox talk briefing verified.' }}</p>
                  </div>
                </div>

                <div class="mb-4">
                  <span class="box-title mb-2 block">Mandatory Personal Protective Equipment (PPE)</span>
                  <div class="ppe-pills-wrap">
                    @for (ppe of permit()!.ppe; track ppe) {
                      <span class="ppe-badge">
                        <mat-icon class="badge-icon">check_circle</mat-icon>
                        {{ ppe }}
                      </span>
                    }
                    @if (!permit()!.ppe || permit()!.ppe!.length === 0) {
                      <span class="text-muted text-xs">Standard shipboard PPE required (Coverall, Safety Helmet, Safety Boots).</span>
                    }
                  </div>
                </div>

                <hr class="section-divider" />

                <div class="checklist-section">
                  <h4 class="checklist-title">Pre-work Precautions Verification Checklist</h4>
                  <div class="precautions-list">
                    @for (item of permit()!.precautionsChecklist; track item.item) {
                      <div class="precaution-item">
                        <mat-checkbox [(ngModel)]="item.checked" color="primary">
                          <span class="chk-label">{{ item.item }}</span>
                        </mat-checkbox>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Tab 4: Atmospheric Gas Testing Log -->
            @if (currentPermitConfig()?.sections?.requiresGasTesting || currentPermitConfig()?.sections?.requiresMultiLevelGas) {
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">cloud</mat-icon>
                  Gas Testing Log ({{ permit()!.gasTestReadings.length }})
                </ng-template>
                <div class="tab-body">
                  <div class="panel-section-header">
                    <div class="panel-title-group">
                      <div class="icon-circle">
                        <mat-icon class="text-primary">air</mat-icon>
                      </div>
                      <div>
                        <h3 class="panel-heading">Atmospheric Testing & Retest Register</h3>
                        <p class="panel-subheading">Multi-gas detector readings prior to entry & periodic surveillance</p>
                      </div>
                    </div>
                    <button mat-flat-button color="primary" class="btn-action-sm" (click)="openAddGasModal = true">
                      <mat-icon>add</mat-icon> Record Gas Test
                    </button>
                  </div>

                  <div class="table-responsive">
                    <table class="hseq-table mb-2">
                      <thead>
                        <tr>
                          <th>Gas Monitored</th>
                          <th>Measured Reading</th>
                          <th>Safe Working Limit</th>
                          <th>Qualified Tester</th>
                          <th>Recorded Timestamp</th>
                          <th>Retest Frequency</th>
                          <th>Safety Verdict</th>
                          <th class="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (g of permit()!.gasTestReadings; track $index) {
                          <tr>
                            <td class="font-bold">{{ g.gasType }}</td>
                            <td class="gas-val font-mono">{{ g.reading }}</td>
                            <td>{{ g.safePermissibleRange || 'Standard Safe Range' }}</td>
                            <td>{{ g.testerName }}</td>
                            <td>{{ g.timestamp }}</td>
                            <td><span class="tag-sub">{{ g.retestFrequency || 'Every 2 Hours' }}</span></td>
                            <td>
                              <span class="status-badge" [class.badge-success]="g.passed" [class.badge-danger]="!g.passed">
                                <mat-icon class="inline-icon">{{ g.passed ? 'done' : 'warning' }}</mat-icon>
                                {{ g.passed ? 'SAFE FOR ENTRY' : 'HAZARDOUS' }}
                              </span>
                            </td>
                            <td class="text-right">
                              <button type="button" class="btn-del" (click)="deleteGasTest($index)" title="Delete Gas Reading">
                                <mat-icon>delete_outline</mat-icon>
                              </button>
                            </td>
                          </tr>
                        }
                        @if (permit()!.gasTestReadings.length === 0) {
                          <tr>
                            <td colspan="8" class="text-center text-muted p-4">
                              No gas readings logged yet. Click "Record Gas Test" above to log atmosphere measurements.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </mat-tab>
            }

            <!-- Tab 5: Energy Isolation (LOTO) Log -->
            @if (currentPermitConfig()?.sections?.requiresLotoIsolation || currentPermitConfig()?.sections?.requiresIsolationPointsTable) {
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon class="tab-icon">lock</mat-icon>
                  Isolation / LOTO ({{ (permit()!.lotoRecords || []).length }})
                </ng-template>
                <div class="tab-body">
                  <div class="panel-section-header">
                    <div class="panel-title-group">
                      <div class="icon-circle">
                        <mat-icon class="text-primary">lock</mat-icon>
                      </div>
                      <div>
                        <h3 class="panel-heading">Isolation Points & Lockout / Tagout Register</h3>
                        <p class="panel-subheading">{{ permit()!.isolationType || 'Short term' }} Isolation &bull; {{ permit()!.isolationDetails || 'Physical isolation of valves, breakers, and mechanical hazards' }}</p>
                      </div>
                    </div>
                    <button mat-flat-button color="primary" class="btn-action-sm" (click)="openAddLotoModal = true">
                      <mat-icon>add</mat-icon> Add Isolation Point
                    </button>
                  </div>

                  <div class="table-responsive">
                    <table class="hseq-table mb-2">
                      <thead>
                        <tr>
                          <th style="width: 45px;">No</th>
                          <th style="width: 140px;">Equipment ID</th>
                          <th>Description</th>
                          <th>Isolation Device or Method</th>
                          <th style="width: 160px;">Isolated by / Date</th>
                          <th style="width: 160px;">De-Isolated by / Date</th>
                          <th style="width: 110px;">Status</th>
                          <th class="text-right" style="width: 60px;">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (l of permit()!.lotoRecords || []; track l.id; let idx = $index) {
                          <tr>
                            <td class="font-mono font-bold">{{ idx + 1 }}.</td>
                            <td class="font-mono font-bold text-primary">{{ l.equipmentId || l.isolationPoint }}</td>
                            <td class="font-bold">{{ l.description || l.isolationPoint }}</td>
                            <td>
                              <div class="d-flex flex-column gap-1">
                                <span>{{ l.isolationDeviceMethod || l.lotoNotes || 'Padlock applied' }}</span>
                                <span class="energy-tag">{{ l.energySource }} &bull; {{ l.lockNumber }}</span>
                              </div>
                            </td>
                            <td class="text-xs">
                              <span class="font-bold block">{{ l.isolatedBy || 'Chief Engineer' }}</span>
                              <span class="text-muted">{{ l.isolatedDate || l.isolatedTime || permit()!.startDateTime }}</span>
                            </td>
                            <td class="text-xs">
                              @if (l.status === 'De-isolated') {
                                <span class="font-bold block text-green">{{ l.deIsolatedBy || 'Chief Officer' }}</span>
                                <span class="text-muted">{{ l.deIsolatedDate || 'At Closure' }}</span>
                              } @else {
                                <span class="text-muted italic">Pending Completion</span>
                              }
                            </td>
                            <td>
                              <button 
                                type="button" 
                                class="loto-status-btn" 
                                [class.btn-isolated]="l.status !== 'De-isolated'"
                                [class.btn-deisolated]="l.status === 'De-isolated'"
                                (click)="toggleLotoStatus(l.id)">
                                <mat-icon class="inline-icon">{{ l.status === 'De-isolated' ? 'lock_open' : 'lock' }}</mat-icon>
                                {{ l.status || 'Isolated' }}
                              </button>
                            </td>
                            <td class="text-right">
                              <button type="button" class="btn-del" (click)="deleteLotoRecord(l.id)" title="Delete Isolation Record">
                                <mat-icon>delete_outline</mat-icon>
                              </button>
                            </td>
                          </tr>
                        }
                        @if (!permit()!.lotoRecords || permit()!.lotoRecords!.length === 0) {
                          <tr>
                            <td colspan="8" class="text-center text-muted p-4">
                              No energy isolation points logged. Click "Add Isolation Point" above to register mechanical/electrical locks.
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </mat-tab>
            }

            <!-- Tab 6: Mandatory Linkages (RA & TBT) -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">link</mat-icon>
                Mandatory Linkages
              </ng-template>
              <div class="tab-body">
                <div class="form-grid-2 mb-4">
                  <div class="linkage-card">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <mat-icon class="text-blue">assignment</mat-icon>
                      <h4 class="font-bold m-0">Attached Risk Assessment</h4>
                    </div>
                    <div class="link-meta mb-2">
                      <span class="text-xs text-muted block">Reference:</span>
                      <strong class="font-mono text-blue font-sm">{{ permit()!.linkedRaNumber }}</strong>
                    </div>
                    <p class="text-xs text-muted">
                      Formal hazard identification, ALARP risk matrix reduction, and control verification verified prior to issuance.
                    </p>
                    <button mat-stroked-button color="primary" class="btn-sm" [routerLink]="['/risk-assessment']">
                      <mat-icon>open_in_new</mat-icon> View RA Register
                    </button>
                  </div>

                  <div class="linkage-card">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <mat-icon class="text-green">groups</mat-icon>
                      <h4 class="font-bold m-0">Toolbox Talk (TBT) Briefing</h4>
                    </div>
                    <div class="link-meta mb-2">
                      <span class="text-xs text-muted block">Status & Date:</span>
                      <strong class="text-green font-sm">
                        {{ permit()!.toolboxTalkCompleted ? 'Completed on ' + (permit()!.toolboxTalkDate || 'Site') : 'Pending Briefing' }}
                      </strong>
                    </div>
                    <p class="text-xs text-muted">
                      Briefing Topic: {{ permit()!.toolboxTalkTopic || 'Emergency signals, stop work authority, and PPE requirements.' }}
                    </p>
                    <span class="badge-success inline-block p-1 text-xs font-bold rounded">
                      <mat-icon class="inline-icon">check</mat-icon> All work crew members acknowledged Stop-Work Authority
                    </span>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Tab 7: Audit Trail & Timeline -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon class="tab-icon">history</mat-icon>
                Audit Trail ({{ permit()!.auditTrail.length }})
              </ng-template>
              <div class="tab-body">
                <div class="audit-timeline">
                  @for (entry of permit()!.auditTrail; track $index) {
                    <div class="timeline-item">
                      <div class="timeline-dot"></div>
                      <div class="timeline-card">
                        <div class="timeline-header">
                          <span class="timeline-action">{{ entry.action }}</span>
                          <span class="timeline-time font-mono">{{ entry.timestamp }}</span>
                        </div>
                        <div class="timeline-actor">
                          <mat-icon class="actor-icon">person</mat-icon>
                          <span><strong>{{ entry.user }}</strong> ({{ entry.role }})</span>
                        </div>
                        @if (entry.notes) {
                          <div class="timeline-notes">
                            <mat-icon class="note-icon">notes</mat-icon>
                            <span>{{ entry.notes }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>

      <!-- Modal: Record Gas Test -->
      <app-modal
        [isOpen]="openAddGasModal"
        title="Record Atmospheric Gas Test"
        subtitle="Log calibrated detector measurements"
        icon="cloud"
        (close)="openAddGasModal = false">
        <div modal-body>
          <div class="form-group mb-3">
            <label class="form-label">Gas Monitored</label>
            <select [(ngModel)]="newGas.gasType" class="custom-select">
              <option value="Oxygen (O2)">Oxygen (O2)</option>
              <option value="Flammable (LEL)">Flammable (LEL)</option>
              <option value="Carbon Monoxide (CO)">Carbon Monoxide (CO)</option>
              <option value="Hydrogen Sulfide (H2S)">Hydrogen Sulfide (H2S)</option>
              <option value="VOC / Toxic">VOC / Toxic</option>
            </select>
          </div>

          <div class="form-grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Measured Reading</label>
              <input type="text" [(ngModel)]="newGas.reading" placeholder="e.g. 20.9% / 0.0 ppm" class="custom-input font-bold" />
            </div>
            <div class="form-group">
              <label class="form-label">Safe Permissible Limit</label>
              <input type="text" [(ngModel)]="newGas.safePermissibleRange" placeholder="e.g. 20.8% - 21.0%" class="custom-input" />
            </div>
          </div>

          <div class="form-grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Qualified Tester Name</label>
              <input type="text" [(ngModel)]="newGas.testerName" class="custom-input font-bold" />
            </div>
            <div class="form-group">
              <label class="form-label">Retest Frequency</label>
              <select [(ngModel)]="newGas.retestFrequency" class="custom-select">
                <option value="Continuous Monitoring">Continuous Monitoring</option>
                <option value="Every 2 Hours">Every 2 Hours</option>
                <option value="Every 4 Hours">Every 4 Hours</option>
                <option value="Prior to Shift">Prior to Shift</option>
              </select>
            </div>
          </div>

          <div class="form-group mb-2">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="newGas.passed" />
              <span class="font-bold text-green">Measurement is within permissible safe exposure limits</span>
            </label>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openAddGasModal = false">Cancel</button>
          <button mat-flat-button color="primary" (click)="saveGasTest()">Save Gas Reading</button>
        </div>
      </app-modal>

      <!-- Modal: Add LOTO Point (Form 09F-006-05 / 07) -->
      <app-modal
        [isOpen]="openAddLotoModal"
        title="Add Energy Isolation Point"
        subtitle="Energy Isolation & Lockout Register"
        icon="lock"
        (close)="openAddLotoModal = false">
        <div modal-body>
          <div class="form-grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Equipment ID <span class="required">*</span></label>
              <input type="text" [(ngModel)]="newLoto.equipmentId" placeholder="e.g. SWB-440-02 / V-102" class="custom-input font-mono font-bold" />
            </div>
            <div class="form-group">
              <label class="form-label">Lock / Tag ID</label>
              <input type="text" [(ngModel)]="newLoto.lockNumber" placeholder="LCK-HYD-402" class="custom-input font-mono font-bold" />
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Description of Equipment / Circuit</label>
            <input type="text" [(ngModel)]="newLoto.description" placeholder="e.g. Main switchboard generator feeder breaker cubicle" class="custom-input font-bold" />
          </div>

          <div class="form-grid-2 mb-3">
            <div class="form-group">
              <label class="form-label">Isolation Device or Method</label>
              <input type="text" [(ngModel)]="newLoto.isolationDeviceMethod" placeholder="e.g. Master Lockout clamp & danger tag" class="custom-input" />
            </div>
            <div class="form-group">
              <label class="form-label">Energy Source</label>
              <select [(ngModel)]="newLoto.energySource" class="custom-select font-bold">
                <option value="Electrical 440V">Electrical 440V</option>
                <option value="Electrical 220V">Electrical 220V</option>
                <option value="Hydraulic">Hydraulic</option>
                <option value="Pneumatic">Pneumatic</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Chemical / Toxic">Chemical / Toxic</option>
                <option value="Steam / Thermal">Steam / Thermal</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2 mb-2">
            <div class="form-group">
              <label class="form-label">Isolated By (Name & Rank)</label>
              <input type="text" [(ngModel)]="newLoto.isolatedBy" placeholder="e.g. Chief Engineer M. Rossi" class="custom-input font-bold" />
            </div>
            <div class="form-group">
              <label class="form-label">Isolated Date / Time</label>
              <input type="text" [(ngModel)]="newLoto.isolatedDate" placeholder="YYYY-MM-DD HH:mm" class="custom-input font-mono" />
            </div>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openAddLotoModal = false">Cancel</button>
          <button mat-flat-button color="primary" (click)="saveLotoPoint()">Add Isolation Point</button>
        </div>
      </app-modal>

      <!-- Modal: Suspend Permit -->
      <app-modal
        [isOpen]="openSuspendModal"
        title="Suspend Permit to Work"
        subtitle="Halt work due to unexpected hazard or operational shift"
        icon="pause_circle"
        (close)="openSuspendModal = false">
        <div modal-body>
          <div class="form-group mb-2">
            <label class="form-label">Reason for Suspension <span class="required">*</span></label>
            <textarea 
              [(ngModel)]="suspendReason" 
              rows="3" 
              placeholder="e.g. Adverse weather / Ballast transfer conflict / Gas alarm triggered..." 
              class="custom-input"></textarea>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openSuspendModal = false">Cancel</button>
          <button mat-flat-button color="warn" (click)="confirmSuspend()">Suspend Work Immediately</button>
        </div>
      </app-modal>

      <!-- Modal: Extend Permit -->
      <app-modal
        [isOpen]="openExtendModal"
        title="Extend Permit Validity"
        subtitle="Authorize additional working hours within safety parameters"
        icon="update"
        (close)="openExtendModal = false">
        <div modal-body>
          <div class="form-group mb-3">
            <label class="form-label">Additional Hours</label>
            <input type="number" [(ngModel)]="additionalHours" min="1" max="4" class="custom-input font-bold" />
            <span class="field-hint text-xs">Note: Client procedures require new permit issuance if shift boundary is exceeded.</span>
          </div>
          <div class="form-group mb-2">
            <label class="form-label">Justification for Extension</label>
            <textarea 
              [(ngModel)]="extendReason" 
              rows="3" 
              placeholder="e.g. Unforeseen bracket fitment delay; environment re-tested and verified safe." 
              class="custom-input"></textarea>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openExtendModal = false">Cancel</button>
          <button mat-flat-button color="primary" (click)="confirmExtend()">Authorize Extension</button>
        </div>
      </app-modal>

      <!-- Modal: Area Safety Review -->
      <app-modal
        [isOpen]="openAreaReviewModal"
        title="Endorse Area Safety (Stage 2 Review)"
        subtitle="Physical worksite inspection and isolation confirmation"
        icon="verified_user"
        (close)="openAreaReviewModal = false">
        <div modal-body>
          <div class="form-group mb-3">
            <label class="form-label">Area Authority Reviewer Name</label>
            <input type="text" [(ngModel)]="areaReviewerName" class="custom-input font-bold" />
          </div>
          <div class="form-group mb-2">
            <label class="form-label">Area Safety Findings & Notes</label>
            <textarea 
              [(ngModel)]="areaReviewNotes" 
              rows="3" 
              placeholder="e.g. Worksite inspected in person. Drain plugs clear, boundary fire hazards removed." 
              class="custom-input"></textarea>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openAreaReviewModal = false">Cancel</button>
          <button mat-flat-button color="primary" (click)="confirmAreaReview()">Endorse Area Safety</button>
        </div>
      </app-modal>

      <!-- Modal: Master Approval -->
      <app-modal
        [isOpen]="openApproveModal"
        title="Master Formal Approval (Stage 4 • Certificate of Authorization)"
        subtitle="Final shipboard executive authorization for task commencement"
        icon="thumb_up"
        (close)="openApproveModal = false">
        <div modal-body>
          <div class="declaration-callout-box mb-3">
            <span class="declaration-callout-title">
              <mat-icon class="dec-callout-icon">verified</mat-icon>
              Certificate of Authorization Declaration
            </span>
            <p class="declaration-callout-text">
              "I confirm that I have inspected the work area and verified that all safety requirements and controls have been put into place. Permission is granted for the work to proceed under the conditions specified."
            </p>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Approving Authority (Master)</label>
            <input type="text" [(ngModel)]="approverName" class="custom-input font-bold" />
          </div>
          <div class="form-group mb-2">
            <label class="form-label">Approval Conditions / Remarks</label>
            <textarea 
              [(ngModel)]="approveNotes" 
              rows="3" 
              placeholder="e.g. Approved as requested. Maintain continuous watch on VHF Ch 14." 
              class="custom-input"></textarea>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openApproveModal = false">Cancel</button>
          <button mat-flat-button color="primary" class="btn-master-approve" (click)="confirmApprove()">Grant Formal Master Approval</button>
        </div>
      </app-modal>

      <!-- Modal: Verify Site Restoration & Close -->
      <app-modal
        [isOpen]="openRestoreModal"
        title="Site Restoration & Final Permit Closure (Stage 6 • Certificate of Completion)"
        subtitle="Verify housekeeping, isolation removal, and return to safe operations"
        icon="cleaning_services"
        (close)="openRestoreModal = false">
        <div modal-body>
          <div class="declaration-callout-box mb-3">
            <span class="declaration-callout-title">
              <mat-icon class="dec-callout-icon">task_alt</mat-icon>
              Certificate of Completion & Restoration Declaration
            </span>
            <p class="declaration-callout-text">
              "The work has been completed and all persons under my supervision, materials and equipment have been withdrawn. All safeguards have been removed and the affected systems restored to safe operational status."
              @if (isAsbestosWork()) {
                <span class="block mt-1 font-bold text-amber-700">"All asbestos garbage kept in sealed container and suitably marked for shore disposal."</span>
              }
            </p>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Verifying Officer Name</label>
            <input type="text" [(ngModel)]="restoringOfficerName" class="custom-input font-bold" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Site Restoration Notes</label>
            <textarea 
              [(ngModel)]="restoreNotes" 
              rows="3" 
              placeholder="e.g. All tools, staging, and equipment removed. Padlocks de-isolated. Site clean and safe." 
              class="custom-input"></textarea>
          </div>
          <div class="sub-records-block">
            <span class="text-xs text-muted block mb-1">Automatic De-isolation:</span>
            <span class="font-bold text-xs">All {{ (permit()!.lotoRecords || []).length }} LOTO points will automatically transition to 'De-isolated' status upon closure.</span>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openRestoreModal = false">Cancel</button>
          <button mat-flat-button class="btn-close-permit" (click)="confirmRestoreAndClose()">Verify Restoration & Close Permit</button>
        </div>
      </app-modal>

      <!-- Modal: Add Crew Member -->
      <app-modal
        [isOpen]="openAddCrewModal"
        title="Add Work Party Member"
        subtitle="Register personnel carrying out task with confirmed safety briefing"
        icon="person_add"
        (close)="openAddCrewModal = false">
        <div modal-body>
          <div class="form-group mb-3">
            <label class="form-label">Crew Member Full Name <span class="required">*</span></label>
            <input type="text" [(ngModel)]="newCrew.name" placeholder="e.g. AB D. Silva / Fitter S. Kouris" class="custom-input font-bold" />
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Rank / Designation <span class="required">*</span></label>
            <input type="text" [(ngModel)]="newCrew.rank" placeholder="e.g. Able Seaman / Motorman / Welder" class="custom-input" />
          </div>
          <div class="checkbox-label mt-2">
            <input type="checkbox" checked disabled />
            <span class="text-xs font-bold text-green">JSA Safety Briefing & Stop-Work Authority Confirmed</span>
          </div>
        </div>
        <div modal-footer class="d-flex gap-2">
          <button mat-stroked-button (click)="openAddCrewModal = false">Cancel</button>
          <button mat-flat-button color="primary" [disabled]="!newCrew.name.trim()" (click)="saveCrewMember()">Add Crew Member</button>
        </div>
      </app-modal>
    }
  `,
  styles: [`
    :host { font-family: var(--font-sans); display: block; }
    .module-container { display: flex; flex-direction: column; gap: 16px; padding: 14px 20px; max-width: 1750px; margin: 0 auto; }
    .btn-cancel { height: 38px !important; border-color: var(--border) !important; color: var(--foreground) !important; font-weight: 600 !important; }
    .btn-primary-action { height: 38px !important; font-weight: 700 !important; }
    .btn-master-approve { background: var(--primary) !important; color: #ffffff !important; }
    .btn-close-permit { height: 38px !important; background: #16a34a !important; color: #ffffff !important; font-weight: 700 !important; }
    
    .inline-step-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      color: #16a34a;
    }
    .inline-step-pill mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .declaration-callout-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #2563eb;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .declaration-callout-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 800;
      color: #1e40af;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }
    .dec-callout-icon { font-size: 16px; width: 16px; height: 16px; color: #2563eb; }
    .declaration-callout-text {
      font-size: 12.5px;
      line-height: 1.5;
      color: #1e293b;
      margin: 0;
      font-style: italic;
    }

    /* Flowchart Card */
    .flowchart-card { padding: 18px 24px; border: 1px solid var(--border); border-radius: var(--radius-md); }
    .flowchart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .flow-title-wrap { display: flex; align-items: center; gap: 10px; }
    .flow-header-icon { color: var(--primary); font-size: 20px; width: 20px; height: 20px; }
    .flow-title { font-size: 13.5px; font-weight: 800; color: var(--foreground); letter-spacing: 0.3px; display: block; }
    .flow-subtitle { font-size: 11px; color: var(--muted-foreground); display: block; }

    .flow-chart-diagram {
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow-x: auto;
      padding: 8px 0;
      gap: 6px;
    }
    .flow-node {
      flex: 1;
      min-width: 130px;
      padding: 12px 10px;
      border-radius: var(--radius-sm);
      background: var(--muted);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.2s ease;
    }
    .node-icon-wrap {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--card);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      border: 1px solid var(--border);
    }
    .node-icon-wrap mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--muted-foreground); }
    .node-title { font-size: 11.5px; font-weight: 700; color: var(--foreground); line-height: 1.3; }
    .node-sub { font-size: 10px; color: var(--muted-foreground); margin-top: 2px; }
    .node-status { 
      font-size: 9.5px; 
      font-weight: 800; 
      text-transform: uppercase; 
      margin-top: 6px; 
      color: var(--muted-foreground); 
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.04);
    }

    .flow-node.node-done {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .flow-node.node-done .node-icon-wrap { background: #dcfce7; border-color: #86efac; }
    .flow-node.node-done .node-icon-wrap mat-icon { color: #16a34a; }
    .flow-node.node-done .node-status { color: #16a34a; background: #dcfce7; }

    .flow-node.node-current {
      background: #fffbeb;
      border-color: #fde68a;
      box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
    }
    .flow-node.node-current .node-icon-wrap { background: #fef3c7; border-color: #fde68a; }
    .flow-node.node-current .node-icon-wrap mat-icon { color: #d97706; }
    .flow-node.node-current .node-status { color: #d97706; background: #fef3c7; }

    .flow-arrow-wrap { display: flex; align-items: center; justify-content: center; color: var(--muted-foreground); }
    .flow-arrow { font-size: 18px; width: 18px; height: 18px; }
    .arrow-active { color: #16a34a; }

    /* Summary Grid */
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .summary-card { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .card-accent-top { border-top: 3px solid var(--primary); }
    .summary-card-header { display: flex; justify-content: space-between; align-items: center; }
    .lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .val { font-size: 15px; font-weight: 800; color: var(--foreground); }
    .sub { font-size: 11.5px; color: var(--muted-foreground); }
    .card-hint-icon { font-size: 18px; width: 18px; height: 18px; }

    .custom-tab-group { background: transparent; }
    .tab-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; }
    .tab-body { padding: 22px 24px; }

    .detail-box {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 16px;
    }
    .box-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--muted-foreground); display: block; margin-bottom: 6px; }
    .box-content { font-size: 13px; color: var(--foreground); margin: 0; line-height: 1.5; }

    .border-blue { border-left: 4px solid #2563eb !important; }
    .border-amber { border-left: 4px solid #d97706 !important; }

    .ppe-pills-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
    .ppe-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 9999px;
      background: var(--accent);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      border: 1px solid var(--border);
    }
    .badge-icon { font-size: 15px; width: 15px; height: 15px; }

    .checklist-title { font-size: 13px; font-weight: 800; margin: 0 0 12px 0; }
    .precautions-list { display: flex; flex-direction: column; gap: 8px; }
    .precaution-item { display: flex; align-items: center; }
    .chk-label { font-size: 12.5px; color: var(--foreground); }

    .chk-status-pill {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 9999px;
      display: inline-block;
    }
    .pill-yes { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .pill-no { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .pill-na { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }

    /* Panel Headers */
    .panel-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .panel-title-group { display: flex; align-items: center; gap: 12px; }
    .icon-circle { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; }
    .panel-heading { font-size: 14px; font-weight: 800; margin: 0; }
    .panel-subheading { font-size: 11.5px; color: var(--muted-foreground); margin: 2px 0 0 0; }
    .btn-action-sm { height: 32px !important; font-size: 12px !important; }

    .hseq-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .hseq-table th { padding: 10px 12px; text-align: left; background: var(--muted); border-bottom: 1px solid var(--border); font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted-foreground); }
    .hseq-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    .table-compact th, .table-compact td { padding: 7px 10px; }

    .gas-val { font-weight: 800; color: #2563eb; }
    .tag-sub { font-size: 11px; color: var(--muted-foreground); background: var(--muted); padding: 2px 6px; border-radius: 4px; }
    .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-closed-pill { background: #166534; color: #ffffff; padding: 8px 16px; border-radius: 9999px; font-size: 12px; }
    .inline-icon { font-size: 14px; width: 14px; height: 14px; }

    .energy-tag { background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .loto-status-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      border: 1px solid transparent;
      cursor: pointer;
    }
    .btn-isolated { background: #fee2e2; color: #dc2626; border-color: #fecaca; }
    .btn-deisolated { background: #dcfce7; color: #166534; border-color: #bbf7d0; }

    .btn-del {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: inline-flex;
      align-items: center;
      padding: 4px;
      border-radius: 4px;
    }
    .btn-del:hover { color: #dc2626; background: #fee2e2; }
    .btn-del mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .linkage-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sub-records-block {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px;
    }

    /* Timeline */
    .audit-timeline { display: flex; flex-direction: column; gap: 14px; position: relative; padding-left: 20px; }
    .audit-timeline::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: var(--border);
    }
    .timeline-item { position: relative; display: flex; gap: 14px; }
    .timeline-dot {
      position: absolute;
      left: -20px;
      top: 8px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--card);
      border: 3px solid var(--primary);
    }
    .timeline-card {
      flex: 1;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; }
    .timeline-action { font-size: 13px; font-weight: 800; color: var(--foreground); }
    .timeline-time { font-size: 11px; color: var(--muted-foreground); }
    .timeline-actor { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted-foreground); }
    .actor-icon { font-size: 14px; width: 14px; height: 14px; color: var(--primary); }
    .timeline-notes { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: var(--foreground); margin-top: 4px; font-style: italic; }
    .note-icon { font-size: 14px; width: 14px; height: 14px; color: var(--muted-foreground); flex-shrink: 0; }

    .section-divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 700; color: var(--foreground); }
    .checkbox-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
    .checkbox-label input { width: 16px; height: 16px; accent-color: var(--primary); }
    
    .custom-input, .custom-select {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 12.5px;
      color: var(--foreground);
      font-family: inherit;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .cat-chip {
      background: var(--muted);
      border: 1px solid var(--border);
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .form-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .p-0 { padding: 0 !important; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .add-table-row-tr td {
      padding: 8px 12px !important;
      background: var(--muted) !important;
      text-align: center;
      border-top: 1px dashed var(--border) !important;
    }
    .btn-table-add-row {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 8px 16px;
      background: #ffffff;
      border: 1px dashed var(--primary);
      border-radius: 6px;
      color: var(--primary);
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-table-add-row:hover {
      background: var(--accent);
      border-style: solid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .btn-table-add-row mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .btn-icon-head-add {
      background: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      width: 24px;
      height: 24px;
      transition: opacity 0.15s ease;
    }
    .btn-icon-head-add:hover {
      opacity: 0.85;
    }
    .btn-icon-head-add mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .subscope-tabs-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .subscope-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--muted);
      color: var(--foreground);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .subscope-tab-btn:hover {
      background: var(--accent);
      border-color: var(--primary);
    }
    .tab-btn-active {
      background: var(--primary) !important;
      color: #ffffff !important;
      border-color: var(--primary) !important;
    }
    .tab-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 800;
      background: rgba(0,0,0,0.12);
    }
    .tab-btn-active .tab-badge {
      background: rgba(255,255,255,0.25);
      color: #ffffff;
    }
    .text-slate { color: #475569 !important; }
    .border-slate { border-left: 4px solid #475569 !important; }
    .text-red { color: #dc2626 !important; }
  `]
})
export class PermitDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public state = inject(HseqStateService);
  public permitStore = inject(PermitStore);
  private notify = inject(NotificationService);

  permitId = signal<string>('');

  readonly permit = computed<PermitToWorkRecord | undefined>(() => {
    const id = this.permitId();
    if (!id) return undefined;
    return this.permitStore.getPermit(id);
  });

  readonly currentTemplate = computed<PtwChecklistTemplate | undefined>(() => {
    const p = this.permit();
    if (!p) return undefined;
    const type = p.permitType.toLowerCase();
    return this.state.ptwTemplates().find(t => 
      t.permitType.toLowerCase() === type ||
      (type.includes('confined') && t.permitType.toLowerCase().includes('confined')) ||
      (type.includes('enclosed') && t.permitType.toLowerCase().includes('confined'))
    ) || this.state.ptwTemplates()[0];
  });

  readonly coldWorkScopes = COLD_WORK_SCOPES;
  activeColdWorkTab = signal<string>('machinery');

  readonly currentPermitConfig = computed<PermitTypeItem | undefined>(() => {
    const p = this.permit();
    if (!p) return undefined;
    const type = p.permitType.toLowerCase();
    return this.state.permitTypes().find(t => 
      t.displayName.toLowerCase() === type ||
      t.code.toLowerCase() === type ||
      (type.includes('confined') && t.code === 'PT-CONF') ||
      (type.includes('enclosed') && t.code === 'PT-CONF') ||
      (type.includes('hot') && t.code === 'PT-HOT') ||
      (type.includes('electr') && t.code === 'PT-ELEC') ||
      (type.includes('aloft') && t.code === 'PT-ALOFT') ||
      (type.includes('overboard') && t.code === 'PT-OVER') ||
      (type.includes('cold') && t.code === 'PT-COLD') ||
      (type.includes('div') && t.code === 'PT-DIVE') ||
      (type.includes('asbest') && t.code === 'PT-ASB')
    ) || this.state.permitTypes()[0];
  });

  // Modal dialog states
  openAddGasModal = false;
  openAddLotoModal = false;
  openSuspendModal = false;
  openExtendModal = false;
  openAreaReviewModal = false;
  openApproveModal = false;
  openRestoreModal = false;
  openAddCrewModal = false;

  newCrew = {
    name: '',
    rank: 'Able Seaman'
  };

  // Form states for modals
  newGas: Partial<GasTestReading> = {
    gasType: 'Oxygen (O2)',
    reading: '20.9%',
    safePermissibleRange: '20.8% - 21.0%',
    testerName: 'Safety Officer A. Roy',
    retestFrequency: 'Continuous Monitoring',
    passed: true
  };

  newLoto: Partial<LotoRecord> = {
    equipmentId: 'SWB-440-BKR-02',
    description: 'Manifold Isolation Valve V-102',
    isolationDeviceMethod: 'Master Padlock & Danger Tag # 402',
    isolationPoint: 'Manifold Isolation Valve V-102',
    energySource: 'Electrical 440V',
    lockNumber: 'LCK-HYD-402',
    lotoNotes: 'Double block and bleed secured with padlock',
    isolatedBy: 'Chief Engineer M. Rossi',
    isolatedDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };

  suspendReason = '';
  additionalHours = 2;
  extendReason = '';
  areaReviewerName = 'Chief Officer K. Hansen';
  areaReviewNotes = 'Physical worksite inspected. Hazard isolations confirmed.';
  approverName = 'Capt. R. Sterling (Master)';
  approveNotes = 'Permit formally authorized. Continuous radio watch on VHF Ch 14.';
  restoringOfficerName = 'Chief Officer K. Hansen';
  restoreNotes = 'Work complete, area cleaned, all personnel withdrawn, padlocks de-isolated.';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.permitId.set(id);
      }
    });
  }

  isConfinedSpaceEntry(): boolean {
    const pt = this.permit()?.permitType.toLowerCase() || '';
    return pt.includes('confined') || pt.includes('enclosed');
  }

  isHotWork(): boolean {
    return (this.permit()?.permitType.toLowerCase() || '').includes('hot');
  }

  isElectricalWork(): boolean {
    return (this.permit()?.permitType.toLowerCase() || '').includes('electr');
  }

  isWorkingAloft(): boolean {
    return (this.permit()?.permitType.toLowerCase() || '').includes('aloft');
  }

  isWorkingOverboard(): boolean {
    const pt = this.permit()?.permitType.toLowerCase() || '';
    return pt.includes('overboard') || pt.includes('outboard');
  }

  isColdWork(): boolean {
    const pt = this.permit()?.permitType.toLowerCase() || '';
    return pt.includes('cold');
  }

  isDivingOperation(): boolean {
    const pt = this.permit()?.permitType.toLowerCase() || '';
    return pt.includes('diving');
  }

  isAsbestosWork(): boolean {
    const pt = this.permit()?.permitType.toLowerCase() || '';
    return pt.includes('asbestos');
  }

  getChecklistAnswer(itemId: string): 'YES' | 'NO' | 'NA' {
    const p = this.permit();
    if (!p || !p.checklistAnswers) return 'YES';
    return p.checklistAnswers[itemId] || 'YES';
  }

  getColdWorkAnswer(itemNum: string): 'YES' | 'NO' | 'NA' {
    const p = this.permit();
    if (!p || !p.coldWorkSubChecklistAnswers) return 'YES';
    return p.coldWorkSubChecklistAnswers[itemNum] || 'YES';
  }

  setActiveColdWorkTab(tabId: string) {
    this.activeColdWorkTab.set(tabId);
  }

  // 6-Stage sequential workflow status helpers
  getStepStatus(step: number): string {
    const p = this.permit();
    if (!p) return 'Pending';
    const wp = p.workflowProgress;
    const status = p.status;

    switch (step) {
      case 1:
        return 'Done';
      case 2:
        if (wp?.areaSafetyReviewed) return 'Endorsed';
        if (status === 'Requested') return 'Action Needed';
        return 'Pending';
      case 3:
        if (wp?.controlsVerified) return 'Verified';
        if (wp?.areaSafetyReviewed && status === 'Requested') return 'Action Needed';
        return 'Pending';
      case 4:
        if (wp?.masterApproved) return 'Approved';
        if (wp?.controlsVerified && status === 'Requested') return 'Action Needed';
        return 'Pending';
      case 5:
        if (status === 'Active' || status === 'Extended') return 'In Progress';
        if (status === 'Suspended') return 'Suspended';
        if (wp?.workCompleted) return 'Completed';
        if (status === 'Approved') return 'Ready to Start';
        return 'Pending';
      case 6:
        if (status === 'Closed') return 'Closed';
        if (wp?.workCompleted) return 'Action Needed';
        return 'Pending';
      default:
        return 'Pending';
    }
  }

  isPastStep(step: number): boolean {
    const p = this.permit();
    if (!p) return false;
    const wp = p.workflowProgress;

    switch (step) {
      case 1:
        return true;
      case 2:
        return !!wp?.areaSafetyReviewed;
      case 3:
        return !!wp?.controlsVerified;
      case 4:
        return !!wp?.masterApproved;
      case 5:
        return !!wp?.workCompleted;
      case 6:
        return p.status === 'Closed';
      default:
        return false;
    }
  }

  isCurrentStep(step: number): boolean {
    const p = this.permit();
    if (!p) return false;
    const wp = p.workflowProgress;
    const status = p.status;

    switch (step) {
      case 1:
        return status === 'Draft';
      case 2:
        return status === 'Requested' && !wp?.areaSafetyReviewed;
      case 3:
        return status === 'Requested' && !!wp?.areaSafetyReviewed && !wp?.controlsVerified;
      case 4:
        return status === 'Requested' && !!wp?.controlsVerified && !wp?.masterApproved;
      case 5:
        return (status === 'Approved' || status === 'Active' || status === 'Extended' || status === 'Suspended') && !wp?.workCompleted;
      case 6:
        return !!wp?.workCompleted && status !== 'Closed';
      default:
        return false;
    }
  }

  // Workflow Actions
  submitForReview() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.submitPermit(p.id, p.performingAuthority);
    this.notify.showSuccess('Submitted for Review', `Permit ${p.referenceNo} is now in Area Review.`);
  }

  confirmAreaReview() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.reviewAreaSafety(p.id, this.areaReviewerName, this.areaReviewNotes);
    this.openAreaReviewModal = false;
    this.notify.showSuccess('Area Safety Endorsed', 'Area safety confirmed. Ready for controls verification.');
  }

  verifyControls() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.verifyControls(p.id, p.responsibleSupervisor || 'Responsible Supervisor');
    this.notify.showSuccess('Controls Verified', 'Safety interlocks confirmed. Ready for Master Approval.');
  }

  confirmApprove() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.approvePermit(p.id, this.approverName, this.approveNotes);
    this.openApproveModal = false;
    this.notify.showSuccess('Master Approved', `Permit ${p.referenceNo} approved. Ready to activate work.`);
  }

  activatePermit() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.activatePermit(p.id, p.performingAuthority);
    this.notify.showSuccess('Permit Active', `Work on permit ${p.referenceNo} is now live.`);
  }

  confirmSuspend() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.suspendPermit(p.id, this.suspendReason || 'Operational hazard pause');
    this.openSuspendModal = false;
    this.notify.showWarning('Permit Suspended', 'Operations halted. Safety re-check required to resume.');
  }

  confirmExtend() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.extendPermit(p.id, this.additionalHours, this.extendReason || 'Approved extension');
    this.openExtendModal = false;
    this.notify.showSuccess('Validity Extended', `Permit extended by ${this.additionalHours} hours.`);
  }

  resumeWork() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.resumePermit(p.id);
    this.notify.showSuccess('Work Resumed', 'Permit reactivated following safety clearance.');
  }

  declareWorkComplete() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.declareWorkComplete(p.id, p.performingAuthority);
    this.notify.showSuccess('Work Complete', 'Tools removed, personnel withdrawn. Ready for site restoration.');
  }

  confirmRestoreAndClose() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.verifySiteRestoration(p.id, this.restoringOfficerName, this.restoreNotes);
    this.permitStore.closePermit(p.id, this.restoringOfficerName, 'Final verification satisfactory. Permit officially closed.');
    this.openRestoreModal = false;
    this.notify.showSuccess('Permit Closed', `Permit ${p.referenceNo} officially closed and archived.`);
  }

  // Gas testing handlers
  saveGasTest() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.addGasTest(p.id, this.newGas);
    this.openAddGasModal = false;
    this.notify.showSuccess('Gas Test Logged', `${this.newGas.gasType} reading recorded.`);
  }

  deleteGasTest(index: number) {
    const p = this.permit();
    if (!p) return;
    this.permitStore.deleteGasTest(p.id, index);
    this.notify.showInfo('Gas Reading Removed', 'Entry deleted.');
  }

  // LOTO handlers
  saveLotoPoint() {
    const p = this.permit();
    if (!p) return;
    this.permitStore.addLotoRecord(p.id, this.newLoto);
    this.openAddLotoModal = false;
    this.notify.showSuccess('Isolation Added', `Lock ${this.newLoto.lockNumber} registered.`);
  }

  deleteLotoRecord(lotoId: string) {
    const p = this.permit();
    if (!p) return;
    this.permitStore.deleteLotoRecord(p.id, lotoId);
    this.notify.showInfo('Isolation Removed', 'Point removed from LOTO log.');
  }

  toggleLotoStatus(lotoId: string) {
    const p = this.permit();
    if (!p) return;
    const loto = p.lotoRecords?.find(l => l.id === lotoId);
    if (!loto) return;
    const targetStatus = loto.status === 'De-isolated' ? 'Isolated' : 'De-isolated';
    this.permitStore.updateLotoStatus(p.id, lotoId, targetStatus);
    this.notify.showSuccess('LOTO Updated', `Point transitioned to ${targetStatus}.`);
  }

  saveCrewMember() {
    const p = this.permit();
    if (!p || !this.newCrew.name.trim()) return;
    const currentCrew = p.personnelCarryingOutWork ? [...p.personnelCarryingOutWork] : [];
    currentCrew.push({
      name: this.newCrew.name.trim(),
      rank: this.newCrew.rank || 'Able Seaman',
      briefed: true
    });
    this.permitStore.updatePermit(p.id, { personnelCarryingOutWork: currentCrew });
    this.openAddCrewModal = false;
    this.newCrew = { name: '', rank: 'Able Seaman' };
    this.notify.showSuccess('Crew Member Added', 'New personnel registered to work party.');
  }

  deleteCrewMember(index: number) {
    const p = this.permit();
    if (!p || !p.personnelCarryingOutWork) return;
    const currentCrew = [...p.personnelCarryingOutWork];
    currentCrew.splice(index, 1);
    this.permitStore.updatePermit(p.id, { personnelCarryingOutWork: currentCrew });
    this.notify.showInfo('Crew Member Removed', 'Personnel removed from work party.');
  }
}
