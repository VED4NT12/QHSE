import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PermitStore } from '../../core/stores/permit.store';
import { 
  PermitToWorkRecord, GasTestReading, LotoRecord, PtwChecklistTemplate, PtwChecklistItem, 
  PtwWorkCrewMember, ElectricalEquipmentChecklist, ElectricalCheckItem,
  PermitTypeItem, PermitTypeSectionsConfig, HotWorkSafetyWatchMember, HotWorkEmergencyEquipment, 
  ColdWorkSubChecklistItem, MachineryIsolationRecord
} from '../../core/models/hseq.models';

export interface ColdWorkScopeDef {
  id: string;
  title: string;
  formRef: string;
  items: Array<{ id: string; question: string }>;
}

export const COLD_WORK_SCOPES: ColdWorkScopeDef[] = [
  {
    id: 'machinery',
    title: 'Machinery Check List',
    formRef: '09F-006-06 (Table 3)',
    items: [
      { id: 'MC-01', question: 'Isolating switch for power source within reach.' },
      { id: 'MC-02', question: 'Isolating switch for power source out of reach but responsible person in attendance.' },
      { id: 'MC-03', question: 'Service and process lines isolated.' },
      { id: 'MC-04', question: 'Area roped off and Warning notices displayed.' },
      { id: 'MC-05', question: 'Exposure of the dangerous part is the minimum necessary.' },
      { id: 'MC-06', question: 'Illumination adequate.' },
      { id: 'MC-07', question: 'Revolving machinery clear of obstructions and loose material.' },
      { id: 'MC-08', question: 'Access adequate.' },
      { id: 'MC-09', question: 'Tools and instruments adequate and adjacent.' },
      { id: 'MC-10', question: 'Protective glasses and gloves issued.' },
      { id: 'MC-11', question: 'Close fitting protective clothes issued.' }
    ]
  },
  {
    id: 'pressure',
    title: 'Pressure Vessels & Pipelines',
    formRef: '09F-006-06 (Table 4)',
    items: [
      { id: 'PV-01', question: 'Pumps rendered non-operational.' },
      { id: 'PV-02', question: 'Pumps isolated.' },
      { id: 'PV-03', question: 'Pressure released and contents drained.' },
      { id: 'PV-04', question: 'Area roped off and suitable warning notices displayed.' },
      { id: 'PV-05', question: 'System lines disconnected and blanked off.' },
      { id: 'PV-06', question: 'Drip trays provided.' }
    ]
  },
  {
    id: 'cold_work_gen',
    title: 'Cold Work General Checklist',
    formRef: '09F-006-06 (Table 5)',
    items: [
      { id: 'CWG-01', question: 'Is work to be carried out in enclosed spaces? (If Yes, mandatory Enclosed Space permit).' },
      { id: 'CWG-02', question: 'Preparatory work: Equipment or pipelines drained.' },
      { id: 'CWG-03', question: 'Preparatory work: Equipment or pipelines washed.' },
      { id: 'CWG-04', question: 'Preparatory work: Purged with Nitrogen or Inert gas.' },
      { id: 'CWG-05', question: 'Preparatory work: Vented with air.' },
      { id: 'CWG-06', question: 'Isolation: Valves closed.' },
      { id: 'CWG-07', question: 'Isolation: Spades inserted.' },
      { id: 'CWG-08', question: 'Isolation: Lines disconnected.' },
      { id: 'CWG-09', question: 'Do work items include electrical equipment?' },
      { id: 'CWG-10', question: 'If Yes, isolate equipment from power supply with LOTO tags.' },
      { id: 'CWG-11', question: 'Final check: Equipment or pipeline free of cargo.' },
      { id: 'CWG-12', question: 'Final check: Equipment or pipeline depressurized.' },
      { id: 'CWG-13', question: 'Final check: Surrounding area clean and free from hazards.' },
      { id: 'CWG-14', question: 'Drip trays provided and waste containment in place.' },
      { id: 'CWG-15', question: 'Personal protection to be worn verified.' },
      { id: 'CWG-16', question: 'Non-sparking tools used where required.' },
      { id: 'CWG-17', question: 'Area roped off and warning notices displayed.' }
    ]
  },
  {
    id: 'outboard',
    title: 'Working Outboard / Overboard',
    formRef: '09F-006-06 (Table 6)',
    items: [
      { id: 'WOB-01', question: 'Working outboard should be avoided while vessel making way (Vessel stopped/lee made/speed reduced).' },
      { id: 'WOB-02', question: 'Adequate sea room to allow departure from passage plan.' },
      { id: 'WOB-03', question: "Master's Approval received." },
      { id: 'WOB-04', question: 'Officer of Watch informed.' },
      { id: 'WOB-05', question: 'Man Overboard Function on GPS Navigator operational and tested.' },
      { id: 'WOB-06', question: 'Weather conditions suitable, taking into account sea swell and vessel movement.' },
      { id: 'WOB-07', question: 'Are any vessels alongside, due alongside, or due to depart informed.' },
      { id: 'WOB-08', question: 'Have other vessels in vicinity been informed of overside work.' },
      { id: 'WOB-09', question: "Passing vessel's movements disruption evaluated." },
      { id: 'WOB-10', question: 'Illumination adequate and augmented where required.' },
      { id: 'WOB-11', question: 'Access adequate.' },
      { id: 'WOB-12', question: 'Safety Harness with Inertia Reel Line to be worn.' },
      { id: 'WOB-13', question: 'Inertia Reel Safety Line of appropriate length.' },
      { id: 'WOB-14', question: 'Safety Lines rigged.' },
      { id: 'WOB-15', question: 'Auto inflate Lifejacket donned.' },
      { id: 'WOB-16', question: 'Appropriate Personnel Protective Equipment issued.' },
      { id: 'WOB-17', question: 'Standby man in attendance with direct radio communication to O.O.W. / Duty Officer.' },
      { id: 'WOB-18', question: 'Engine Room Duty Officer informed.' },
      { id: 'WOB-19', question: 'Work in vicinity of Propeller or Thrusters: immobilized, Chief Engineer informed.' },
      { id: 'WOB-20', question: 'Aware of Overboard Discharges, shut off or diverted wherever possible.' },
      { id: 'WOB-21', question: "Staging / Bosun's chair / Gantlines inspected and in good order." },
      { id: 'WOB-22', question: 'Securing points of adequate strength with no sharp edges.' },
      { id: 'WOB-23', question: 'Tools and equipment secured from loss with lanyards.' },
      { id: 'WOB-24', question: 'Operator under 18 years or less than 12 months sea time adequately supervised.' },
      { id: 'WOB-25', question: 'Rescue boat / Lifeboat checked and ready for immediate use.' },
      { id: 'WOB-26', question: 'Painting punt or craft used suitable for purpose.' },
      { id: 'WOB-27', question: 'Guest warp / Securing lines for punt rigged.' },
      { id: 'WOB-28', question: 'Pilot Ladder / Jacobs Ladder rigged to waterline.' }
    ]
  },
  {
    id: 'aloft_sub',
    title: 'Working Aloft Checklist',
    formRef: '09F-006-06 (Table 7)',
    items: [
      { id: 'WAL-01', question: 'Operator under 18 years or less than 12 months sea time adequately supervised.' },
      { id: 'WAL-02', question: 'Weather conditions suitable, taking into account sea swell and vessel movement.' },
      { id: 'WAL-03', question: 'Officer of Watch informed, and passage plan consulted.' },
      { id: 'WAL-04', question: 'Safety Harness with Lifeline to be worn.' },
      { id: 'WAL-05', question: 'Work in vicinity of radio aerials: transmitters turned off and warning notices securely posted.' },
      { id: 'WAL-06', question: 'Radar scanners turned off, O.O.W. informed, and warning notices securely posted.' },
      { id: 'WAL-07', question: "Staging / Bosun's chair / Gantlines inspected and in good order." },
      { id: 'WAL-08', question: 'Securing points for safety lines of adequate strength with no sharp edges.' },
      { id: 'WAL-09', question: 'Work near Whistle: power turned off, warning notices posted on Bridge and Engine.' },
      { id: 'WAL-10', question: 'Work on Funnel: Inform Duty Engineer, reduce emissions from funnel as far as practicable.' },
      { id: 'WAL-11', question: 'Work aloft not to be in vicinity of, or in conflict with Cargo Operations.' },
      { id: 'WAL-12', question: 'Access adequate, warning notices posted at deck level / area roped off.' },
      { id: 'WAL-13', question: 'Tools and equipment secured from falling.' },
      { id: 'WAL-14', question: 'Appropriate Personal Protective Equipment.' },
      { id: 'WAL-15', question: 'Portable ladders secured.' },
      { id: 'WAL-16', question: 'Angle of portable ladder 65-70 degrees (4 up - 1 out).' },
      { id: 'WAL-17', question: 'Portable ladder inspected prior to use.' },
      { id: 'WAL-18', question: 'Extending ladders not over extended, sufficient overlap between sections.' },
      { id: 'WAL-19', question: 'Permit valid during daylight hours only unless authorized by Master.' }
    ]
  },
  {
    id: 'small_craft',
    title: 'Small Craft Alongside Checklist',
    formRef: '09F-006-06 (Table 8)',
    items: [
      { id: 'SCA-01', question: 'Permission given by the Responsible Officer for craft to come alongside.' },
      { id: 'SCA-02', question: 'Craft personnel instructed against smoking and use of naked lights (tankers & gas carriers).' },
      { id: 'SCA-03', question: 'Illumination adequate and augmented where required.' },
      { id: 'SCA-04', question: 'Have other vessels been informed of craft operations.' },
      { id: 'SCA-05', question: 'Access adequate.' },
      { id: 'SCA-06', question: "Passing vessel's movements liable to cause disruption assessed." },
      { id: 'SCA-07', question: 'Craft berthing in vicinity of Propeller or Thrusters: immobilized, Chief Engineer informed.' },
      { id: 'SCA-08', question: 'Fendering rigged if necessary.' },
      { id: 'SCA-09', question: 'Guest warp / Securing lines rigged.' },
      { id: 'SCA-10', question: 'Accommodation Ladder / Pilot Ladder / Jacobs Ladder rigged safely.' },
      { id: 'SCA-11', question: 'Aware of Overboard Discharges, shut off or diverted wherever possible.' }
    ]
  }
];

@Component({
  selector: 'app-permit-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="isEditMode ? 'Edit Permit to Work' : 'Create Permit to Work (PTW)'"
        [subtitle]="isEditMode ? 'Modify permit specifications, client checklist controls, and operational authorizations' : 'Formal safety authorization request for high-risk marine operations aligned with client PTW forms'"
        icon="vpn_key"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Permit to Work', link: '/permits'},
          {label: isEditMode ? 'Edit Permit' : 'New Permit'}
        ]">
        <div actions class="d-flex gap-3">
          <button mat-stroked-button routerLink="/permits" class="btn-cancel">
            <mat-icon>arrow_back</mat-icon> Cancel
          </button>
          <button mat-stroked-button color="primary" class="btn-draft" (click)="savePermit('Draft')">
            <mat-icon>edit_note</mat-icon> Save as Draft
          </button>
          <button 
            mat-flat-button 
            color="primary" 
            class="btn-primary-action" 
            [disabled]="!canSubmit()"
            (click)="savePermit('Requested')">
            <mat-icon>send</mat-icon> Submit for Authorization
          </button>
        </div>
      </app-page-header>

      <!-- Mandatory Linkages Alert / Warning Banner -->
      @if (!linkagesValid()) {
        <div class="linkage-warning-banner">
          <mat-icon class="banner-icon">lock</mat-icon>
          <div class="banner-content">
            <span class="banner-title">Mandatory Linkage Gate Active</span>
            <span class="banner-desc">
              Permits cannot be submitted for formal authorization until both a <strong>Risk Assessment / JSA</strong> reference is attached and the <strong>Toolbox Talk (TBT)</strong> briefing is verified.
            </span>
          </div>
          <span class="gate-status-pill">Draft Only</span>
        </div>
      } @else {
        <div class="linkage-success-banner">
          <mat-icon class="banner-icon text-green">verified</mat-icon>
          <div class="banner-content">
            <span class="banner-title text-green">Pre-Requisite Safety Interlocks Satisfied</span>
            <span class="banner-desc">Risk Assessment linked and Toolbox Talk confirmed. Ready for Area Authority review and signoff.</span>
          </div>
          <span class="gate-status-pill ready-pill">Submission Ready</span>
        </div>
      }

      <div class="form-layout">
        <!-- Main Form Column -->
        <div class="main-form-col">
          
          <!-- 1. Basic Information (Universal Client Header) -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge"></div>
              <div class="section-title-wrap">
                <h3 class="section-title">General Information & Permit Identity</h3>
                <p class="section-sub">Permit identity, vessel asset, offshore field/area, and detailed scope of work</p>
              </div>
            </div>

            <div class="form-grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Permit Reference Number</label>
                <input type="text" [value]="referenceNo()" class="custom-input bg-readonly font-mono" readonly />
                <span class="field-hint">Auto-generated sequence standard</span>
              </div>

              <div class="form-group">
                <label class="form-label">Permit Type <span class="required">*</span></label>
                <select [ngModel]="selectedPermitType()" (ngModelChange)="onPermitTypeChange($event)" class="custom-select font-bold">
                  @for (pt of state.activePermitTypes(); track pt.id) {
                    <option [value]="pt.displayName">{{ pt.displayName }}</option>
                  }
                </select>
                <div class="d-flex align-items-center gap-2 mt-1">
                  <span class="type-indicator-chip" [style.color]="currentConfig().badgeColor" [style.border-color]="currentConfig().badgeColor">
                    {{ currentConfig().displayName }}
                  </span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Fleet Vessel Asset <span class="required">*</span></label>
                <select 
                  [ngModel]="selectedVesselId()" 
                  (ngModelChange)="onVesselIdSelect($event)" 
                  class="custom-select">
                  @for (v of state.vessels(); track v.id) {
                    <option [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
                  }
                </select>
                <span class="field-hint">Dynamic Master Data Fleet Asset</span>
              </div>
            </div>

            <div class="form-grid-2 mb-4">
              <div class="form-group">
                <label class="form-label">Area / Field / Location <span class="required">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.areaFieldLocation" 
                  placeholder="e.g. Zuluf Field / Berri / Tanajib Anchorage / Ras Tanura" 
                  class="custom-input" />
                <span class="field-hint">Offshore marine concession or port anchorage</span>
              </div>

              <div class="form-group">
                <label class="form-label">Location of Work (Worksite on Vessel) <span class="required">*</span></label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.locationOfWork" 
                  placeholder="e.g. Cargo Tank 3 Port / MSB Cubicle 2 / Forward Radar Mast" 
                  class="custom-input font-bold" />
                <span class="field-hint">Exact shipboard physical workspace</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Detailed Description of Work <span class="required">*</span></label>
              <textarea 
                [(ngModel)]="formData.workDescription" 
                rows="3" 
                placeholder="Comprehensive description of the operational task, tools utilized, equipment dismantled, and scope boundaries..." 
                class="custom-input textarea-standard font-md"></textarea>
              <span class="field-hint">Specify exact activities, tools, and technical procedures</span>
            </div>
          </div>

          <!-- 2. Validity Window & Policy Note -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge"></div>
              <div class="section-title-wrap">
                <h3 class="section-title">Validity Window & Policy Enforcement</h3>
                <p class="section-sub">Client safety standard: Permits are strictly non-transferable and limited to single shifts</p>
              </div>
            </div>

            <div class="client-policy-note mb-4">
              <mat-icon class="policy-note-icon">warning_amber</mat-icon>
              <div>
                <strong>Client Standard Policy:</strong> Permit validity <strong>SHALL NOT exceed 8 hours</strong>. 
                Re-validation is <strong>NOT permitted</strong>. If work continues into the next shift, a new permit must be requested.
              </div>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label">Commencement Date & Time <span class="required">*</span></label>
                <div class="datetime-input-wrap">
                  <input 
                    type="datetime-local" 
                    [(ngModel)]="formData.startDateTime" 
                    (ngModelChange)="onDateTimeChange()"
                    class="custom-input date-picker-input font-bold" />
                </div>
                <span class="field-hint">Work cannot start prior to approval</span>
              </div>

              <div class="form-group">
                <label class="form-label">Expiry Date & Time <span class="required">*</span></label>
                <div class="datetime-input-wrap">
                  <input 
                    type="datetime-local" 
                    [(ngModel)]="formData.expiryDateTime" 
                    (ngModelChange)="onDateTimeChange()"
                    class="custom-input date-picker-input font-bold" />
                </div>
                <span class="field-hint">Enforces strict 8-hour cutoff</span>
              </div>

              <div class="form-group">
                <label class="form-label">Validity Window (Hours)</label>
                <div class="duration-badge-wrap">
                  <input 
                    type="number" 
                    [(ngModel)]="formData.validityHours" 
                    (ngModelChange)="onHoursChange()"
                    min="1" 
                    max="8" 
                    class="custom-input font-bold" />
                  <span class="duration-pill" [class.pill-warn]="formData.validityHours > 8">{{ formData.validityHours }}h Window</span>
                </div>
                <span class="field-hint">Maximum 8 hours per client policy</span>
              </div>
            </div>
          </div>

          <!-- 3. Assigned Authorities, Attendance & Work Party Crew -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge"></div>
              <div class="section-title-wrap">
                <h3 class="section-title">Assigned Authorities & Personnel Carrying Out Work</h3>
                <p class="section-sub">Responsible person in attendance, authorities, and work party personnel carrying out work</p>
              </div>
            </div>

            <div class="form-grid-2 mb-4">
              <div class="form-group">
                <label class="form-label">Responsible Person in Attendance <span class="required">*</span></label>
                <input 
                  type="text" 
                  list="ptwMasterCrewDatalist"
                  [(ngModel)]="formData.responsiblePersonInAttendance" 
                  placeholder="e.g. Chief Officer K. Hansen / 2nd Engineer J. Kowalski" 
                  class="custom-input font-bold" />
                <span class="field-hint">Designated officer in attendance</span>
              </div>

              <div class="form-group">
                <label class="form-label">Performing Authority <span class="required">*</span></label>
                <input 
                  type="text" 
                  list="ptwMasterCrewDatalist"
                  [(ngModel)]="formData.performingAuthority" 
                  placeholder="e.g. Bosun D. Silva / Fitter S. Kouris" 
                  class="custom-input" />
                <span class="field-hint">Person leading work in the field</span>
              </div>
            </div>

            <div class="form-grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Area Authority <span class="required">*</span></label>
                <select 
                  [(ngModel)]="formData.areaAuthority" 
                  class="custom-select">
                  <option value="">-- Select Area Authority --</option>
                  @for (u of state.users(); track u.id) {
                    <option [value]="u.fullName">{{ u.fullName }} ({{ u.roles.join(', ') }} · {{ u.assignedVessels.join(', ') }})</option>
                  }
                  @for (c of state.crewMembers(); track c.id) {
                    <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
                  }
                </select>
                <span class="field-hint">Officer in charge of physical area</span>
              </div>

              <div class="form-group">
                <label class="form-label">Responsible Supervisor</label>
                <select 
                  [(ngModel)]="formData.responsibleSupervisor" 
                  class="custom-select">
                  <option value="">-- Select Responsible Supervisor --</option>
                  @for (u of state.users(); track u.id) {
                    <option [value]="u.fullName">{{ u.fullName }} ({{ u.roles.join(', ') }} · {{ u.assignedVessels.join(', ') }})</option>
                  }
                  @for (c of state.crewMembers(); track c.id) {
                    <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
                  }
                </select>
                <span class="field-hint">Verifies controls & safety plan</span>
              </div>

              <div class="form-group">
                <label class="form-label">Approving Authority (Master) <span class="required">*</span></label>
                <select 
                  [(ngModel)]="formData.approvingAuthority" 
                  class="custom-select font-bold">
                  <option value="">-- Select Approving Authority --</option>
                  @for (u of state.getApprovers(); track u.id) {
                    <option [value]="u.fullName">{{ u.fullName }} ({{ u.roles.join(', ') }} · {{ u.assignedVessels.join(', ') }})</option>
                  }
                  @for (c of state.crewMembers(); track c.id) {
                    <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
                  }
                </select>
                <span class="field-hint">Master or designated approval officer</span>
              </div>
            </div>

            <!-- Personnel Carrying Out Work (Conditional by Master Data requiresWorkCrew) -->
            @if (currentConfig().sections.requiresWorkCrew) {
              <div class="embedded-sub-card">
                <div class="embedded-card-header">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                      <mat-icon class="sub-header-icon text-primary">groups</mat-icon>
                      <div>
                        <h4 class="sub-card-title">Personnel Carrying Out Work ({{ formData.personnelCarryingOutWork.length }})</h4>
                        <p class="sub-card-desc">All work party personnel must confirm receipt of JSA & safety briefing</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="hseq-table table-compact">
                    <thead>
                      <tr>
                        <th style="width: 50px;">No.</th>
                        <th>Crew Member Name</th>
                        <th>Rank / Designation</th>
                        <th style="width: 180px;">Briefing / JSA Confirmed</th>
                        <th class="text-right" style="width: 60px;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (m of formData.personnelCarryingOutWork; track $index) {
                        <tr>
                          <td class="font-mono font-bold">{{ $index + 1 }}.</td>
                          <td>
                            <input 
                              type="text" 
                              list="ptwMasterCrewDatalist"
                              [(ngModel)]="m.name" 
                              (change)="onPtwCrewSelected(m)"
                              placeholder="Full Name (select from Master Crew)" 
                              class="custom-input input-sm" />
                          </td>
                          <td>
                            <input type="text" [(ngModel)]="m.rank" placeholder="e.g. AB / Motorman / Fitter / Electrician" class="custom-input input-sm" />
                          </td>
                          <td>
                            <label class="checkbox-label text-xs">
                              <input type="checkbox" [(ngModel)]="m.briefed" />
                              <span class="ml-1 font-bold" [class.text-green]="m.briefed">Briefed & Signed</span>
                            </label>
                          </td>
                          <td class="text-right">
                            <button type="button" class="btn-icon-del" (click)="removeCrewMember($index)" [disabled]="formData.personnelCarryingOutWork.length <= 1">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </td>
                        </tr>
                      }
                      <tr class="add-table-row-tr">
                        <td colspan="5">
                          <button type="button" class="btn-table-add-row" (click)="addCrewMember()">
                            <mat-icon>person_add</mat-icon>
                            <span>+ Add Work Party Crew Member</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            }

            <!-- Dedicated Safety Watch / Standby Personnel (Client Forms: Hot Work 09F-006-03 Section 3, Overboard Standby) -->
            @if (currentConfig().sections.requiresSafetyWatch) {
              <div class="embedded-sub-card">
                <div class="embedded-card-header">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                      <mat-icon class="sub-header-icon text-amber">visibility</mat-icon>
                      <div>
                        <h4 class="sub-card-title text-amber">Dedicated Safety Watch / Standby Personnel ({{ formData.safetyWatchPersonnel.length }})</h4>
                        <p class="sub-card-desc">Designated Safety Watch with direct Bridge / CCR radio communication & monitoring post</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="hseq-table table-compact">
                    <thead>
                      <tr>
                        <th style="width: 45px;">No.</th>
                        <th>Safety Watch Name</th>
                        <th style="width: 140px;">Rank</th>
                        <th style="width: 160px;">Radio Tested</th>
                        <th>Station / Monitoring Area</th>
                        <th>Action on Alarm</th>
                        <th class="text-right" style="width: 60px;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (sw of formData.safetyWatchPersonnel; track $index) {
                        <tr>
                          <td class="font-mono font-bold">{{ $index + 1 }}.</td>
                          <td>
                            <input type="text" [(ngModel)]="sw.name" placeholder="Safety Watch Name" class="custom-input input-sm font-bold" />
                          </td>
                          <td>
                            <input type="text" [(ngModel)]="sw.rank" placeholder="e.g. AB / Motorman" class="custom-input input-sm" />
                          </td>
                          <td>
                            <label class="checkbox-label text-xs">
                              <input type="checkbox" [(ngModel)]="sw.briefedRadioTested" />
                              <span class="ml-1 font-bold" [class.text-green]="sw.briefedRadioTested">Tested & Confirmed</span>
                            </label>
                          </td>
                          <td>
                            <input type="text" [(ngModel)]="sw.monitoringStationArea" placeholder="e.g. Adjacent Bulkhead / Workshop" class="custom-input input-sm" />
                          </td>
                          <td>
                            <input type="text" [(ngModel)]="sw.actionOnAlarm" placeholder="e.g. Raise general alarm immediately" class="custom-input input-sm" />
                          </td>
                          <td class="text-right">
                            <button type="button" class="btn-icon-del" (click)="removeSafetyWatchMember($index)" [disabled]="formData.safetyWatchPersonnel.length <= 1">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </td>
                        </tr>
                      }
                      <tr class="add-table-row-tr">
                        <td colspan="7">
                          <button type="button" class="btn-table-add-row" (click)="addSafetyWatchMember()">
                            <mat-icon>person_add</mat-icon>
                            <span>+ Add Safety Watch / Standby Personnel</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>

          <!-- 4. Dynamic Master Data Safety Checklist (Driven by Permit Type Template) -->
          @if (currentConfig().sections.requiresMasterChecklist && (currentTemplate().items.length > 0 || currentConfig().sections.allowCustomChecks)) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Master Data Safety Checklist: {{ currentTemplate().title }}</h3>
                  <p class="section-sub">Standard Safety Checklist &bull; Dynamically loaded from Master Data</p>
                </div>
                <div class="d-flex align-items-center gap-2 ml-auto">
                  <span class="count-pill font-mono text-xs">{{ answeredCount() }} / {{ totalQuestionsCount() }} Answered</span>
                </div>
              </div>

              @if (currentTemplate().items.length === 0) {
                <div class="waived-info-card mb-4">
                  <mat-icon class="waived-icon text-amber">info</mat-icon>
                  <div class="waived-body">
                    <strong class="font-bold text-sm">No Master Checklist Questions Configured</strong>
                    <span class="text-xs text-muted">This permit type does not have pre-configured template questions. You can add custom questions below, or configure the template in Master Data > PTW Templates.</span>
                  </div>
                </div>
              }

              <div class="checklist-container">
                <div class="table-responsive">
                  <table class="hseq-table checklist-table">
                    <thead>
                      <tr>
                        <th style="width: 80px;">Item ID</th>
                        <th style="width: 160px;">Category</th>
                        <th>Safety Check / Pre-job Verification Question</th>
                        <th style="width: 210px;" class="text-center">Verification Answer</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of currentTemplate().items; track item.id) {
                        <tr>
                          <td class="font-mono font-bold text-primary">{{ item.id }}</td>
                          <td><span class="cat-chip">{{ item.category || 'Safety Check' }}</span></td>
                          <td>
                            <span class="chk-question-text">{{ item.question }}</span>
                          </td>
                          <td class="text-center">
                            <div class="chk-segmented-group">
                              <button 
                                type="button" 
                                class="chk-seg-btn btn-yes" 
                                [class.active]="getChecklistAnswer(item.id) === 'YES'"
                                (click)="setChecklistAnswer(item.id, 'YES')">
                                YES
                              </button>
                              <button 
                                type="button" 
                                class="chk-seg-btn btn-no" 
                                [class.active]="getChecklistAnswer(item.id) === 'NO'"
                                (click)="setChecklistAnswer(item.id, 'NO')">
                                NO
                              </button>
                              <button 
                                type="button" 
                                class="chk-seg-btn btn-na" 
                                [class.active]="getChecklistAnswer(item.id) === 'NA'"
                                (click)="setChecklistAnswer(item.id, 'NA')">
                                N/A
                              </button>
                            </div>
                          </td>
                        </tr>
                      }

                      <!-- Custom Checklist Items Added by User -->
                      @for (item of formData.customChecklistItems; track item.id; let idx = $index) {
                        <tr class="custom-check-row">
                          <td class="font-mono font-bold text-amber">{{ item.id }}</td>
                          <td><span class="cat-chip cat-chip-custom">Custom Check</span></td>
                          <td>
                            <div class="d-flex align-items-center gap-2">
                              <input 
                                type="text" 
                                [(ngModel)]="item.question" 
                                placeholder="Type custom verification check requirement..." 
                                class="custom-input input-sm font-bold flex-1" />
                              <button type="button" class="btn-icon-del" (click)="removeCustomChecklistItem(idx)" title="Remove Custom Check">
                                <mat-icon>delete_outline</mat-icon>
                              </button>
                            </div>
                          </td>
                          <td class="text-center">
                            <div class="chk-segmented-group">
                              <button 
                                type="button" 
                                class="chk-seg-btn btn-yes" 
                                [class.active]="getChecklistAnswer(item.id) === 'YES'"
                                (click)="setChecklistAnswer(item.id, 'YES')">
                                YES
                              </button>
                              <button 
                                type="button" 
                                class="chk-seg-btn btn-no" 
                                [class.active]="getChecklistAnswer(item.id) === 'NO'"
                                (click)="setChecklistAnswer(item.id, 'NO')">
                                NO
                              </button>
                              <button 
                                type="button" 
                                class="chk-seg-btn btn-na" 
                                [class.active]="getChecklistAnswer(item.id) === 'NA'"
                                (click)="setChecklistAnswer(item.id, 'NA')">
                                N/A
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                      <tr class="add-table-row-tr">
                        <td colspan="4">
                          <button type="button" class="btn-table-add-row" (click)="addCustomChecklistItem()">
                            <mat-icon>add_circle</mat-icon>
                            <span>+ Add Custom Safety Verification Question / Check</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }

          <!-- 5. Dynamic Permit-Specific Safeguards (Conditionally rendered by Permit Type) -->
          
          <!-- 5A. CONFINED SPACE / ENCLOSED SPACE ENTRY SPECIFIC SECTION -->
          @if (isConfinedSpaceEntry()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Enclosed Space Entry Specific Safeguards</h3>
                  <p class="section-sub">Space categorization, attendant at entrance, and multi-level atmosphere verification</p>
                </div>
              </div>

              <!-- Space Type & Pre-entry Data -->
              <div class="form-grid-3 mb-4">
                <div class="form-group">
                  <label class="form-label">Type of Space <span class="required">*</span></label>
                  <div class="radio-pill-group">
                    <label class="radio-pill" [class.active]="formData.spaceType === 'Enclosed'">
                      <input type="radio" name="spaceType" [(ngModel)]="formData.spaceType" value="Enclosed" /> Enclosed
                    </label>
                    <label class="radio-pill" [class.active]="formData.spaceType === 'Connected'">
                      <input type="radio" name="spaceType" [(ngModel)]="formData.spaceType" value="Connected" /> Connected
                    </label>
                    <label class="radio-pill" [class.active]="formData.spaceType === 'Adjacent'">
                      <input type="radio" name="spaceType" [(ngModel)]="formData.spaceType" value="Adjacent" /> Adjacent
                    </label>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Last Cargo (If Applicable)</label>
                  <input type="text" [(ngModel)]="formData.lastCargo" placeholder="e.g. HFO / Crude Oil / Ballast Water" class="custom-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">Reason for Entry <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.reasonForEntry" placeholder="e.g. Ultrasonic gauging / Anode inspection" class="custom-input font-bold" />
                </div>
              </div>

              <div class="form-grid-2 mb-4">
                <div class="form-group">
                  <label class="form-label">Responsible Attendant at Entrance (Name & Rank) <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.attendantAtEntrance" placeholder="e.g. AB D. Silva (Stationed at Hatch with VHF Ch 14)" class="custom-input font-bold" />
                  <span class="field-hint text-red font-bold">Client Rule: Single-person entry PROHIBITED under all circumstances</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Forced Ventilation Type & Air Changes</label>
                  <input type="text" [(ngModel)]="formData.ventilationType" placeholder="e.g. Electric explosion-proof blower (≥ 3 air changes complete, continuous)" class="custom-input" />
                  <span class="field-hint">Mechanical forced ventilation must remain continuous during entry</span>
                </div>
              </div>

              <!-- Multi-Level Atmosphere Testing Matrix (Simultaneous Limits) -->
              <div class="embedded-sub-card">
                <div class="embedded-card-header">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                      <mat-icon class="sub-header-icon text-primary">air</mat-icon>
                      <div>
                        <h4 class="sub-card-title">Atmospheric Multi-Level Testing (Top, Middle, Bottom)</h4>
                        <p class="sub-card-desc">Simultaneous permissible limits per client procedure 09-006</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="hseq-table table-compact font-xs">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Acceptable Limit</th>
                        <th>Top Reading</th>
                        <th>Middle Reading</th>
                        <th>Bottom Reading</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Oxygen (O₂)</strong></td>
                        <td class="font-mono">≥ 20.9 %</td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.top.o2" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.middle.o2" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.bottom.o2" class="custom-input input-sm font-mono" /></td>
                        <td><span class="tag-safe">Pass</span></td>
                      </tr>
                      <tr>
                        <td><strong>Flammable Gas (LEL)</strong></td>
                        <td class="font-mono">&lt; 1 % LEL</td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.top.lel" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.middle.lel" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.bottom.lel" class="custom-input input-sm font-mono" /></td>
                        <td><span class="tag-safe">Pass</span></td>
                      </tr>
                      <tr>
                        <td><strong>Carbon Monoxide (CO)</strong></td>
                        <td class="font-mono">≤ 10 ppm</td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.top.co" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.middle.co" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.bottom.co" class="custom-input input-sm font-mono" /></td>
                        <td><span class="tag-safe">Pass</span></td>
                      </tr>
                      <tr>
                        <td><strong>Carbon Dioxide (CO₂)</strong></td>
                        <td class="font-mono">&lt; 0.5 % (5000 ppm)</td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.top.co2" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.middle.co2" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.bottom.co2" class="custom-input input-sm font-mono" /></td>
                        <td><span class="tag-safe">Pass</span></td>
                      </tr>
                      <tr>
                        <td><strong>Toxic Gases (H2S / VOC)</strong></td>
                        <td class="font-mono">0 ppm</td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.top.toxic" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.middle.toxic" class="custom-input input-sm font-mono" /></td>
                        <td><input type="text" [(ngModel)]="formData.multiLevelGas.bottom.toxic" class="custom-input input-sm font-mono" /></td>
                        <td><span class="tag-safe">Pass</span></td>
                      </tr>
                      @for (r of formData.customMultiLevelGas; track $index) {
                        <tr>
                          <td><input type="text" [(ngModel)]="r.parameter" placeholder="Custom gas e.g. Benzene" class="custom-input input-sm font-bold" /></td>
                          <td><input type="text" [(ngModel)]="r.limit" placeholder="Limit" class="custom-input input-sm font-mono" /></td>
                          <td><input type="text" [(ngModel)]="r.top" class="custom-input input-sm font-mono" /></td>
                          <td><input type="text" [(ngModel)]="r.middle" class="custom-input input-sm font-mono" /></td>
                          <td><input type="text" [(ngModel)]="r.bottom" class="custom-input input-sm font-mono" /></td>
                          <td>
                            <div class="d-flex align-items-center gap-1">
                              <span class="tag-safe">Pass</span>
                              <button type="button" class="btn-icon-del" (click)="removeCustomMultiLevelGas($index)">
                                <mat-icon>delete_outline</mat-icon>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                      <tr class="add-table-row-tr">
                        <td colspan="6">
                          <button type="button" class="btn-table-add-row" (click)="addCustomMultiLevelGas()">
                            <mat-icon>add_circle</mat-icon>
                            <span>+ Add Custom Gas Parameter to Atmospheric Testing Matrix</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Emergency Equipment Available at Entrance Counts -->
              <div class="embedded-sub-card">
                <div class="embedded-card-header">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                      <mat-icon class="sub-header-icon text-primary">medical_services</mat-icon>
                      <div>
                        <h4 class="sub-card-title">Emergency Equipment Staged at Entrance to Space</h4>
                        <p class="sub-card-desc">Mandatory rescue and resuscitation gear verified ready on scene</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-grid-3 mt-3">
                  <div class="gear-count-item">
                    <span class="gear-label">SCBA Sets Complete:</span>
                    <input type="number" [(ngModel)]="formData.emergencyGear.scbaSets" min="1" max="10" class="custom-input input-sm font-bold" />
                  </div>
                  <div class="gear-count-item">
                    <span class="gear-label">Spare Air Cylinders:</span>
                    <input type="number" [(ngModel)]="formData.emergencyGear.spareCylinders" min="2" max="20" class="custom-input input-sm font-bold" />
                  </div>
                  <div class="gear-count-item">
                    <span class="gear-label">EEBD Escape Sets:</span>
                    <input type="number" [(ngModel)]="formData.emergencyGear.eebdSets" min="1" max="10" class="custom-input input-sm font-bold" />
                  </div>
                  <div class="gear-count-item">
                    <span class="gear-label">Safety Lines Rigged:</span>
                    <input type="number" [(ngModel)]="formData.emergencyGear.safetyLines" min="1" max="10" class="custom-input input-sm font-bold" />
                  </div>
                  <div class="gear-count-item">
                    <label class="checkbox-label text-xs">
                      <input type="checkbox" [(ngModel)]="formData.emergencyGear.resuscitation" />
                      <span class="ml-1 font-bold">Resuscitation Set Ready</span>
                    </label>
                  </div>
                  <div class="gear-count-item">
                    <label class="checkbox-label text-xs">
                      <input type="checkbox" [(ngModel)]="formData.emergencyGear.rescueStretcher" />
                      <span class="ml-1 font-bold">Rescue Stretcher Rigged</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- 5B. HOT WORK SPECIFIC SECTION (Client Form 09F-006-03) -->
          @if (isHotWork() && currentConfig().sections.requiresEmergencyEquipment) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Hot Work Precautions & Fire Watch Readiness</h3>
                  <p class="section-sub">Fire watch stationed, pressurized fire main, boundary cooling & emergency equipment</p>
                </div>
              </div>

              <div class="form-grid-3 mb-4">
                <div class="form-group">
                  <label class="form-label">Fire-Watchman Nominated (Name & Rank) <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.fireWatchmanName" placeholder="e.g. Able Seaman M. Santos" class="custom-input font-bold" />
                  <span class="field-hint">Must remain on site during work and minimum 30 min post-work</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Bridge / CCR Communication Method <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.fireWatchBridgeCommMethod" placeholder="e.g. VHF Radio Channel 14 / Sound-powered phone" class="custom-input font-bold" />
                  <span class="field-hint">Direct two-way continuous link to Duty Officer</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Ventilation Type & Extraction Arrangement <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.ventilationType" placeholder="e.g. Natural draft / Flameproof extraction fan" class="custom-input font-bold" />
                  <span class="field-hint">Adequate air displacement to prevent fume/gas buildup</span>
                </div>
              </div>

              <div class="form-grid-2 mb-4">
                <div class="form-group">
                  <label class="form-label">Adjacent Compartments Gas-Free Status & Boundaries <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.adjacentSpacesGasFreeDetails" placeholder="e.g. Adjacent Coffer Dam & Wing Tank verified gas-free (<1% LEL)" class="custom-input font-bold" />
                  <span class="field-hint">Boundary bulkheads inspected, combustibles cleared min 15m</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Fire Main & Hose Readiness</label>
                  <div class="d-flex align-items-center gap-3 mt-2">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="formData.fireMainPressurized" />
                      <span class="font-bold text-green">Fire Main Pressurized & Hoses Charged</span>
                    </label>
                  </div>
                  <span class="field-hint">Continuous pressure with spray/jet nozzle ready at worksite</span>
                </div>
              </div>

              <!-- Emergency Equipment Staged on Scene (Client Form 09F-006-03 Section 3) -->
              <div class="embedded-sub-card">
                <div class="embedded-card-header">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-2">
                      <mat-icon class="sub-header-icon text-red">local_fire_department</mat-icon>
                      <div>
                        <h4 class="sub-card-title">Emergency Firefighting Equipment Ready on Scene ({{ formData.hotWorkEmergencyEquipment.length }})</h4>
                        <p class="sub-card-desc">Extinguishers, charged hoses, safety lines, and protective suits verified on scene</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="hseq-table table-compact font-xs">
                    <thead>
                      <tr>
                        <th style="width: 45px;">No.</th>
                        <th>Emergency Appliance / Safety Equipment</th>
                        <th>Staging Location Rigged</th>
                        <th style="width: 150px;">Ready on Scene</th>
                        <th>Inspected & Verified By</th>
                        <th class="text-right" style="width: 50px;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (eq of formData.hotWorkEmergencyEquipment; track $index) {
                        <tr>
                          <td class="font-mono font-bold">{{ $index + 1 }}.</td>
                          <td>
                            <input type="text" [(ngModel)]="eq.item" placeholder="Equipment description" class="custom-input input-sm font-bold" />
                          </td>
                          <td>
                            <input type="text" [(ngModel)]="eq.location" placeholder="Rigged location" class="custom-input input-sm" />
                          </td>
                          <td>
                            <label class="checkbox-label text-xs">
                              <input type="checkbox" [(ngModel)]="eq.readyOnScene" />
                              <span class="ml-1 font-bold" [class.text-green]="eq.readyOnScene">Ready on Scene</span>
                            </label>
                          </td>
                          <td>
                            <input type="text" [(ngModel)]="eq.inspectedBy" placeholder="Inspector Name" class="custom-input input-sm" />
                          </td>
                          <td class="text-right">
                            <button type="button" class="btn-icon-del" (click)="removeEmergencyEquipmentRow($index)" [disabled]="formData.hotWorkEmergencyEquipment.length <= 1">
                              <mat-icon>delete_outline</mat-icon>
                            </button>
                          </td>
                        </tr>
                      }
                      <tr class="add-table-row-tr">
                        <td colspan="6">
                          <button type="button" class="btn-table-add-row" (click)="addEmergencyEquipmentRow()">
                            <mat-icon>add_circle</mat-icon>
                            <span>+ Add Emergency Firefighting Appliance / Equipment Row</span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          }

          <!-- 5C. ELECTRICAL WORK SPECIFIC SECTION (FORM 09F-006-05) -->
          @if (isElectricalWork()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Electrical Systems Work & Isolation (PTW)</h3>
                  <p class="section-sub">Sources of energy, voltage classification & Electrical Equipment Checklist</p>
                </div>
              </div>

              <!-- Sources of Energy Multi-Select Pills -->
              <div class="form-group mb-4">
                <label class="form-label">Sources Of Energy Involved (Select Appropriate Options) <span class="required">*</span></label>
                <div class="energy-sources-grid mt-2 mb-3">
                  @for (source of availableEnergySources; track source) {
                    <button 
                      type="button" 
                      class="energy-chip" 
                      [class.chip-selected]="isEnergySourceSelected(source)"
                      (click)="toggleEnergySource(source)">
                      <mat-icon class="chip-icon">{{ isEnergySourceSelected(source) ? 'check_box' : 'check_box_outline_blank' }}</mat-icon>
                      {{ source }}
                    </button>
                  }
                </div>

                <!-- Others (Specify) Add Energy Source -->
                <div class="d-flex align-items-center gap-2">
                  <input 
                    type="text" 
                    [(ngModel)]="formData.customEnergySourceInput" 
                    placeholder="Others (Specify custom energy source)..." 
                    class="custom-input input-sm flex-1" />
                  <button type="button" mat-stroked-button color="primary" class="btn-sm" (click)="addCustomEnergySource()">
                    <mat-icon>add</mat-icon> Add Source
                  </button>
                </div>
              </div>

              <div class="form-grid-2 mb-4">
                <div class="form-group">
                  <label class="form-label">Voltage System Category <span class="required">*</span></label>
                  <select [(ngModel)]="formData.voltageClassification" class="custom-select font-bold">
                    <option value="0 to 440V">0 to 440 Volt Systems (Low Voltage)</option>
                    <option value="440V to 6.6 kV">440 Volt to 6.6 kVolt Systems (High Voltage)</option>
                    <option value="Both">Both Low & High Voltage Involved</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">High Voltage Safeguards & Earthing</label>
                  <span class="text-xs text-muted block mb-1">\"No Voltage\" test verified & Earthing switch visually checked</span>
                  <div class="d-flex gap-2">
                    <span class="v-chip font-bold">Earthing Connected</span>
                    <span class="v-chip font-bold">\"In Service\" Keys Removed</span>
                  </div>
                </div>
              </div>

              <!-- Client Form: ELECTRICAL EQUIPMENT-CHECKLIST Card -->
              <div class="embedded-sub-card">
                <div class="embedded-card-header">
                  <div class="d-flex align-items-center gap-2">
                    <mat-icon class="sub-header-icon text-primary">electric_bolt</mat-icon>
                    <div>
                      <h4 class="sub-card-title">ELECTRICAL EQUIPMENT-CHECKLIST</h4>
                      <p class="sub-card-desc">Equipment details, schedule & dual Before/After verification checks</p>
                    </div>
                  </div>
                </div>

                <!-- Header Metadata Grid -->
                <div class="elec-meta-container mb-4">
                  <div class="form-grid-3 mb-3">
                    <div class="form-group">
                      <label class="form-label text-xs">System:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.system" placeholder="e.g. Main Switchboard 440V" class="custom-input input-sm font-bold" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Section:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.section" placeholder="e.g. Engine Room MSB Starboard" class="custom-input input-sm" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Components:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.components" placeholder="e.g. Generator 2 Feeder Breaker ACB-02" class="custom-input input-sm" />
                    </div>
                  </div>

                  <div class="form-grid-2 mb-3">
                    <div class="form-group">
                      <label class="form-label text-xs">Company/Crew:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.companyCrew" placeholder="e.g. Shipboard Engineering Crew" class="custom-input input-sm" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Name of Engineers:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.engineers" placeholder="e.g. ETO L. Chen, 1st Engineer D. Santos" class="custom-input input-sm font-bold" />
                    </div>
                  </div>

                  <div class="form-grid-3 mb-3">
                    <div class="form-group">
                      <label class="form-label text-xs">Start Date & Time:</label>
                      <div class="d-flex gap-2">
                        <input type="date" [(ngModel)]="formData.electricalEquipmentChecklist.startDate" class="custom-input input-sm" />
                        <input type="time" [(ngModel)]="formData.electricalEquipmentChecklist.startTime" class="custom-input input-sm" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Finish Date & Time:</label>
                      <div class="d-flex gap-2">
                        <input type="date" [(ngModel)]="formData.electricalEquipmentChecklist.finishDate" class="custom-input input-sm" />
                        <input type="time" [(ngModel)]="formData.electricalEquipmentChecklist.finishTime" class="custom-input input-sm" />
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Duration of Work:</label>
                      <div class="d-flex gap-2 align-items-center">
                        <input type="number" [(ngModel)]="formData.electricalEquipmentChecklist.durationDays" placeholder="Days" class="custom-input input-sm font-bold" style="width: 70px;" />
                        <span class="text-xs text-muted">Days</span>
                        <input type="number" [(ngModel)]="formData.electricalEquipmentChecklist.durationHours" placeholder="Hrs" class="custom-input input-sm font-bold" style="width: 70px;" />
                        <span class="text-xs text-muted">Hrs</span>
                        <input type="number" [(ngModel)]="formData.electricalEquipmentChecklist.durationMins" placeholder="Mins" class="custom-input input-sm font-bold" style="width: 70px;" />
                        <span class="text-xs text-muted">Mins</span>
                      </div>
                    </div>
                  </div>

                  <div class="form-grid-3">
                    <div class="form-group">
                      <label class="form-label text-xs">Chief Engineer Name:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.chiefEngineer" placeholder="Chief Engineer Name" class="custom-input input-sm font-bold" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Date:</label>
                      <input type="date" [(ngModel)]="formData.electricalEquipmentChecklist.chiefEngineerDate" class="custom-input input-sm" />
                    </div>
                    <div class="form-group">
                      <label class="form-label text-xs">Signature / Sign-off:</label>
                      <input type="text" [(ngModel)]="formData.electricalEquipmentChecklist.chiefEngineerSignature" placeholder="M. Rossi (Chief Engineer)" class="custom-input input-sm font-mono font-bold" />
                    </div>
                  </div>
                </div>

                <!-- 440 Volt to 6.6 kVolt Systems Table -->
                <div class="elec-table-wrap mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <span class="font-bold text-sm text-foreground">440 Volt to 6.6 kVolt Systems Checklist ({{ formData.electricalEquipmentChecklist.highVoltageChecks.length }})</span>
                      <span class="text-xs text-muted">&bull; Dual Verification: Before Work & After Completion</span>
                    </div>
                  </div>

                  <div class="table-responsive">
                    <table class="hseq-table elec-table">
                      <thead>
                        <tr>
                          <th style="width: 45px;">No.</th>
                          <th>440 Volt to 6.6 kVolt Systems Safety Check</th>
                          <th style="width: 90px;" class="text-center">Before</th>
                          <th style="width: 90px;" class="text-center">After</th>
                          <th style="width: 50px;" class="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (chk of formData.electricalEquipmentChecklist.highVoltageChecks; track chk.id; let idx = $index) {
                          <tr [class.custom-chk-row]="chk.isCustom">
                            <td class="font-mono font-bold text-muted">{{ idx + 1 }}.</td>
                            <td>
                              @if (chk.isCustom) {
                                <input type="text" [(ngModel)]="chk.description" placeholder="Custom check requirement..." class="custom-input input-sm font-bold" />
                              } @else {
                                <span class="font-sm text-foreground">{{ chk.description }}</span>
                              }
                            </td>
                            <td class="text-center">
                              <label class="chk-box-inline">
                                <input type="checkbox" [(ngModel)]="chk.before" />
                                <span class="chk-pill" [class.chk-active]="chk.before">Before</span>
                              </label>
                            </td>
                            <td class="text-center">
                              <label class="chk-box-inline">
                                <input type="checkbox" [(ngModel)]="chk.after" />
                                <span class="chk-pill" [class.chk-active]="chk.after">After</span>
                              </label>
                            </td>
                            <td class="text-right">
                              @if (chk.isCustom) {
                                <button type="button" class="btn-icon-del" (click)="removeHighVoltageCheck(idx)" title="Remove Custom Check">
                                  <mat-icon>delete_outline</mat-icon>
                                </button>
                              } @else {
                                <span class="text-muted text-xs">&mdash;</span>
                              }
                            </td>
                          </tr>
                        }
                        <tr class="add-table-row-tr">
                          <td colspan="5">
                            <button type="button" class="btn-table-add-row" (click)="addHighVoltageCheck()">
                              <mat-icon>add_circle</mat-icon>
                              <span>+ Add Custom Safety Check to 440V – 6.6kV Systems Checklist</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- 0 to 440 Volt Systems Checklist (Low Voltage) -->
                @if (formData.voltageClassification === '0 to 440V' || formData.voltageClassification === 'Both') {
                  <div class="elec-table-wrap">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="d-flex align-items-center gap-2">
                        <span class="font-bold text-sm text-foreground">0 to 440 Volt Systems Checklist (Low Voltage)</span>
                        <span class="text-xs text-muted">&bull; Dual Verification: Before Work & After Completion</span>
                      </div>
                    </div>

                    <div class="table-responsive">
                      <table class="hseq-table elec-table">
                        <thead>
                          <tr>
                            <th style="width: 45px;">No.</th>
                            <th>0 to 440 Volt Systems Safety Check</th>
                            <th style="width: 90px;" class="text-center">Before</th>
                            <th style="width: 90px;" class="text-center">After</th>
                            <th style="width: 50px;" class="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (chk of formData.electricalEquipmentChecklist.lowVoltageChecks || []; track chk.id; let idx = $index) {
                            <tr [class.custom-chk-row]="chk.isCustom">
                              <td class="font-mono font-bold text-muted">{{ idx + 1 }}.</td>
                              <td>
                                @if (chk.isCustom) {
                                  <input type="text" [(ngModel)]="chk.description" placeholder="Custom low voltage check..." class="custom-input input-sm font-bold" />
                                } @else {
                                  <span class="font-sm text-foreground">{{ chk.description }}</span>
                                }
                              </td>
                              <td class="text-center">
                                <label class="chk-box-inline">
                                  <input type="checkbox" [(ngModel)]="chk.before" />
                                  <span class="chk-pill" [class.chk-active]="chk.before">Before</span>
                                </label>
                              </td>
                              <td class="text-center">
                                <label class="chk-box-inline">
                                  <input type="checkbox" [(ngModel)]="chk.after" />
                                  <span class="chk-pill" [class.chk-active]="chk.after">After</span>
                                </label>
                              </td>
                              <td class="text-right">
                                @if (chk.isCustom) {
                                  <button type="button" class="btn-icon-del" (click)="removeLowVoltageCheck(idx)" title="Remove Check">
                                    <mat-icon>delete_outline</mat-icon>
                                  </button>
                                } @else {
                                  <span class="text-muted text-xs">&mdash;</span>
                                }
                              </td>
                            </tr>
                          }
                          <tr class="add-table-row-tr">
                            <td colspan="5">
                              <button type="button" class="btn-table-add-row" (click)="addLowVoltageCheck()">
                                <mat-icon>add_circle</mat-icon>
                                <span>+ Add Custom Safety Check to 0 – 440V Low Voltage Checklist</span>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- 5D. WORKING ALOFT SPECIFIC SECTION -->
          @if (isWorkingAloft()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Working Aloft Fall Protection & Aerials Isolation</h3>
                  <p class="section-sub">Fall arrest harness, radar scanners locked, transmitter isolation</p>
                </div>
              </div>

              <div class="aloft-checks-grid">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.aloftHarnessInspected" />
                  <span>Full body safety harness with inertia reel lifeline inspected and donned</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.aloftRadarsOff" />
                  <span>Radar scanners turned off, O.O.W. informed, warning notices securely posted on consoles</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.aloftRadiosOff" />
                  <span>Radio aerial transmitters turned off and warning notices securely posted</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.aloftFunnelEmissionsReduced" />
                  <span>Duty engineer informed: emissions from funnel reduced as far as practicable</span>
                </label>
              </div>
            </div>
          }

          <!-- 5E. WORKING OVERBOARD SPECIFIC SECTION -->
          @if (isWorkingOverboard()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Working Outboard / Overboard Maritime Precautions</h3>
                  <p class="section-sub">GPS MOB tested, propeller immobilized, rescue boat in readiness</p>
                </div>
              </div>

              <div class="form-grid-2 mb-4">
                <div class="form-group">
                  <label class="form-label">Dedicated Standby Man (Name & VHF Channel) <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.overboardStandbyMan" placeholder="e.g. AB K. Patel with VHF Channel 14" class="custom-input font-bold" />
                </div>
                <div class="form-group">
                  <label class="form-label">Vessel Motion State</label>
                  <span class="v-chip font-bold block p-2">Vessel Stopped / Lee Made (Overboard work avoided while underway)</span>
                </div>
              </div>

              <div class="aloft-checks-grid">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.overboardGpsMobTested" />
                  <span>GPS Navigator Man Overboard (MOB) function operational and tested on Bridge</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.overboardLifejacketWorn" />
                  <span>Auto-inflate SOLAS lifejacket + safety harness with inertia reel line donned</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.overboardPropellerImmobilized" />
                  <span>Propeller and thrusters immobilized, Chief Engineer informed</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.overboardRescueBoatReady" />
                  <span>Rescue boat / Lifeboat checked, manned, and ready for immediate deployment</span>
                </label>
              </div>
            </div>
          }

          <!-- 5F. COLD WORK SPECIFIC SECTION (Client Form 09F-006-06) -->
          @if (isColdWork()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Cold Work Scope & Activity Sub-Checklists</h3>
                  <p class="section-sub">Tool inspection, rigging SWL, machinery isolation, and activity-specific sub-checklists</p>
                </div>
              </div>

              <!-- General Mechanical Safeguards -->
              <div class="form-grid-2 mb-4">
                <div class="form-group">
                  <label class="form-label">Lifting Appliance & Rigging SWL Verification</label>
                  <input type="text" [(ngModel)]="formData.coldWorkRiggingSwl" placeholder="e.g. 2T Lever Hoist Cert #LH-402 with valid color code" class="custom-input font-bold" />
                  <span class="field-hint">Certified rigging gear with current marine inspection tag</span>
                </div>
                <div class="form-group">
                  <label class="form-label">Pneumatic / Hydraulic Tool Line Securing</label>
                  <input type="text" [(ngModel)]="formData.coldWorkLineSecuring" placeholder="e.g. Whip-checks installed on 7-bar air line connections" class="custom-input" />
                  <span class="field-hint">Safety pins & whip-checks on all high pressure couplings</span>
                </div>
              </div>

              <div class="checks-grid-panel mb-4">
                <label class="checkbox-card-item">
                  <input type="checkbox" [(ngModel)]="formData.coldWorkToolsInspected" />
                  <div class="checkbox-card-text">
                    <strong>Hand & Power Tools Inspected</strong>
                    <span>Inspected for defects, insulation integrity, calibration, and dead-man switch operation</span>
                  </div>
                </label>
                <label class="checkbox-card-item">
                  <input type="checkbox" [(ngModel)]="formData.coldWorkDropContainment" />
                  <div class="checkbox-card-text">
                    <strong>Secondary Dropped Object Containment</strong>
                    <span>Debris netting, tethered tool lanyards, and toe-boards rigged below worksite</span>
                  </div>
                </label>
                <label class="checkbox-card-item">
                  <input type="checkbox" [(ngModel)]="formData.coldWorkCombustiblesCleared" />
                  <div class="checkbox-card-text">
                    <strong>Combustible Hazards Cleared</strong>
                    <span>Combustible materials cleared minimum 5m radius and physical perimeter barricaded</span>
                  </div>
                </label>
              </div>

              <!-- Client Form 09F-006-06 6 Sub-Checklists Activity Navigator (Tables 3 to 8) -->
              @if (currentConfig().sections.requiresColdWorkSubChecklists) {
                <div class="embedded-sub-card">
                  <div class="embedded-card-header">
                    <div class="d-flex align-items-center justify-content-between">
                      <div class="d-flex align-items-center gap-2">
                        <mat-icon class="sub-header-icon text-primary">engineering</mat-icon>
                        <div>
                          <h4 class="sub-card-title">Specific Activity Sub-Checklists</h4>
                          <p class="sub-card-desc">Select applicable cold work activity scope to verify mandatory safety checklist requirements</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Scope Tab Selector Pills -->
                  <div class="subscope-tabs-nav">
                    @for (scope of coldWorkScopes; track scope.id) {
                      <button 
                        type="button" 
                        class="subscope-tab-btn" 
                        [class.tab-active]="activeColdWorkTab() === scope.id"
                        (click)="setActiveColdWorkTab(scope.id)">
                        <span>{{ scope.title }}</span>
                        <span class="tab-badge">{{ scope.items.length }}</span>
                      </button>
                    }
                  </div>

                  <!-- Active Sub-Checklist Table -->
                  @for (scope of coldWorkScopes; track scope.id) {
                    @if (activeColdWorkTab() === scope.id) {
                      <div class="sub-scope-table-wrap">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                          <div class="d-flex align-items-center gap-2">
                            <span class="font-bold text-sm text-foreground">{{ scope.title }}</span>
                          </div>
                          <span class="count-pill font-mono text-xs">{{ scope.items.length }} Verification Items</span>
                        </div>

                        <div class="table-responsive">
                          <table class="hseq-table checklist-table">
                            <thead>
                              <tr>
                                <th style="width: 85px;">Item ID</th>
                                <th>Safety Verification Item</th>
                                <th style="width: 210px;" class="text-center">Verification Answer</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (item of scope.items; track item.id) {
                                <tr>
                                  <td class="font-mono font-bold text-primary">{{ item.id }}</td>
                                  <td>
                                    <span class="chk-question-text">{{ item.question }}</span>
                                  </td>
                                  <td class="text-center">
                                    <div class="chk-segmented-group">
                                      <button 
                                        type="button" 
                                        class="chk-seg-btn btn-yes" 
                                        [class.active]="getColdWorkAnswer(item.id) === 'YES'"
                                        (click)="setColdWorkAnswer(item.id, 'YES')">
                                        YES
                                      </button>
                                      <button 
                                        type="button" 
                                        class="chk-seg-btn btn-no" 
                                        [class.active]="getColdWorkAnswer(item.id) === 'NO'"
                                        (click)="setColdWorkAnswer(item.id, 'NO')">
                                        NO
                                      </button>
                                      <button 
                                        type="button" 
                                        class="chk-seg-btn btn-na" 
                                        [class.active]="getColdWorkAnswer(item.id) === 'NA'"
                                        (click)="setColdWorkAnswer(item.id, 'NA')">
                                        N/A
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }

          <!-- 5G. DIVING OPERATION SPECIFIC SECTION -->
          @if (isDivingOperation()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Diving Operation Safety Safeguards</h3>
                  <p class="section-sub">Propulsion LOTO, sea chest isolation, Alpha flag hoisted</p>
                </div>
              </div>

              <div class="form-grid-3 mb-4">
                <div class="form-group">
                  <label class="form-label">Diving Supervisor <span class="required">*</span></label>
                  <input type="text" [(ngModel)]="formData.divingSupervisor" placeholder="Supervisor Name & Company" class="custom-input font-bold" />
                </div>
                <div class="form-group">
                  <label class="form-label">Class Surveyor</label>
                  <input type="text" [(ngModel)]="formData.classSurveyor" placeholder="e.g. A. Moreau (DNV)" class="custom-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">Client Representative</label>
                  <input type="text" [(ngModel)]="formData.clientRep" placeholder="Client Rep Name" class="custom-input" />
                </div>
              </div>

              <div class="aloft-checks-grid">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.divingPropellerLoto" />
                  <span>Main propulsion, tunnel thrusters & steering gear isolated with LOTO</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.divingEcrSignPosted" />
                  <span>ECR Warning Sign posted: \"DIVERS AT WORK - DO NOT START\"</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.flagAlphaHoisted" />
                  <span>Alpha Flag ('A' flag - diver down) hoisted on mast</span>
                </label>
              </div>
            </div>
          }

          <!-- 5H. ASBESTOS WORK SPECIFIC SECTION -->
          @if (isAsbestosWork()) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Asbestos Work Containment & Disposal</h3>
                  <p class="section-sub">DPA permission, BS 4555 face mask, sealed shore disposal</p>
                </div>
              </div>

              <div class="aloft-checks-grid">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.dpaPermissionReceived" />
                  <span>Explicit written permission from Designated Person Ashore (DPA) received</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.asbestosCoverallsPocketless" />
                  <span>Pocket-less disposable coveralls & disposable headgear issued and worn</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.asbestosFaceMaskApproved" />
                  <span>Approved respirator face mask BS 4555:1970 worn with confirmed facial seal</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.wasteDisposalSealed" />
                  <span>All asbestos waste kept in heavy-duty sealed containers marked for shore disposal</span>
                </label>
              </div>
            </div>
          }

          <!-- 6. Mandatory Safety Linkages (Interlock Gate) -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge"></div>
              <div class="section-title-wrap">
                <h3 class="section-title">Mandatory Linkages (Safety Interlock Gate)</h3>
                <p class="section-sub">Required risk assessment and pre-job safety briefing attachments</p>
              </div>
            </div>

            <div class="form-grid-2 mb-4">
              <div class="form-group">
                <label class="form-label">Linked Risk Assessment (RA) <span class="required">*</span></label>
                <select [(ngModel)]="formData.linkedRaNumber" class="custom-select font-bold">
                  @for (ra of state.riskAssessments(); track ra.id) {
                    <option [value]="ra.referenceNo">{{ ra.referenceNo }} - {{ ra.activityTitle }}</option>
                  }
                  <option value="RA-2026-0099">RA-2026-0099 - Ad-hoc Task Assessment</option>
                </select>
                <span class="field-hint">Must correspond to task hazards</span>
              </div>

              <div class="form-group">
                <label class="form-label">Attached Job Safety Analysis (JSA) Title</label>
                <input 
                  type="text" 
                  [(ngModel)]="formData.linkedJsa" 
                  placeholder="e.g. JSA-HW-012: Enclosed Hot Work & Grinding Procedures" 
                  class="custom-input font-bold" />
                <span class="field-hint">Operational safe system of work</span>
              </div>
            </div>

            <!-- Toolbox Talk Box -->
            <div class="tbt-box">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.toolboxTalkCompleted" />
                  <span class="font-bold text-foreground">Toolbox Talk (TBT) Briefing Conducted On Site <span class="required">*</span></span>
                </label>
                <span class="tbt-badge" [class.badge-pass]="formData.toolboxTalkCompleted" [class.badge-pending]="!formData.toolboxTalkCompleted">
                  {{ formData.toolboxTalkCompleted ? 'Briefing Confirmed' : 'Briefing Pending' }}
                </span>
              </div>

              @if (formData.toolboxTalkCompleted) {
                <div class="form-grid-2 mt-2">
                  <div class="form-group">
                    <label class="form-label">TBT Briefing Timestamp</label>
                    <input type="datetime-local" [(ngModel)]="formData.toolboxTalkDate" class="custom-input input-sm font-bold" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Briefing Key Topics</label>
                    <input type="text" [(ngModel)]="formData.toolboxTalkTopic" placeholder="Briefing topic and emergency communication" class="custom-input" />
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- 7. Safety Information: Hazards, PPE & Controls -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge"></div>
              <div class="section-title-wrap">
                <h3 class="section-title">Safety Information & Controls</h3>
                <p class="section-sub">Identified workplace hazards, mandatory PPE, and control measures for {{ selectedPermitType() }}</p>
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Identified Hazards <span class="required">*</span></label>
              <textarea 
                [(ngModel)]="formData.hazards" 
                rows="2" 
                placeholder="Identify operational hazards e.g. Toxic gases, sparks, fall from height, electrical shock..." 
                class="custom-input textarea-standard font-md"></textarea>
            </div>

            <!-- PPE Multi-select Pills -->
            <div class="form-group mb-4">
              <label class="form-label">Mandatory Personal Protective Equipment (PPE)</label>
              <div class="ppe-pills-wrap mt-2">
                @for (ppeItem of availablePpeList; track ppeItem) {
                  <button 
                    type="button" 
                    class="ppe-chip" 
                    [class.chip-selected]="isPpeSelected(ppeItem)"
                    (click)="togglePpe(ppeItem)">
                    <mat-icon class="chip-icon">{{ isPpeSelected(ppeItem) ? 'check_circle' : 'add_circle_outline' }}</mat-icon>
                    {{ ppeItem }}
                  </button>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Control Measures & Mitigations <span class="required">*</span></label>
              <textarea 
                [(ngModel)]="formData.controlMeasures" 
                rows="2" 
                placeholder="Specific preventive controls e.g. Mechanical ventilation, fire watch stationed, continuous gas check..." 
                class="custom-input textarea-standard font-md"></textarea>
            </div>
          </div>

          <!-- 8. Energy Isolation / Lockout Tagout (LOTO) Log -->
          @if (currentConfig().sections.requiresLotoIsolation || currentConfig().sections.requiresIsolationPointsTable) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Lock Out / Tag Out Log (LOTO) & Energy Isolation Register</h3>
                  <p class="section-sub">Short-term, long-term, and machinery isolation points tracking</p>
                </div>
              </div>

              <!-- Mode Segmented Switch -->
              <div class="segmented-control-group mb-4">
                <button 
                  type="button" 
                  class="segment-btn" 
                  [class.segment-active]="formData.isolationLotoRequired"
                  (click)="onLotoToggle(true)">
                  <mat-icon class="btn-icon">lock</mat-icon>
                  <span>Energy Isolation Required (LOTO Active)</span>
                </button>
                <button 
                  type="button" 
                  class="segment-btn" 
                  [class.segment-active]="!formData.isolationLotoRequired"
                  (click)="onLotoToggle(false)">
                  <mat-icon class="btn-icon">lock_open</mat-icon>
                  <span>No Energy Isolation Required</span>
                </button>
              </div>

              @if (formData.isolationLotoRequired) {
                <div class="loto-content-wrap">
                  <!-- Isolation Mode & Sub-Form Switcher -->
                  <div class="form-group mb-4">
                    <label class="form-label">Isolation Scope & Register Category <span class="required">*</span></label>
                    <div class="loto-reg-chips-group">
                      <button 
                        type="button" 
                        class="loto-chip-btn" 
                        [class.chip-active]="formData.isolationType === 'Short term'"
                        (click)="formData.isolationType = 'Short term'">
                        <mat-icon class="chip-icon">timer</mat-icon>
                        <span>Short-Term Isolation Log</span>
                      </button>
                      <button 
                        type="button" 
                        class="loto-chip-btn" 
                        [class.chip-active]="formData.isolationType === 'Long term'"
                        (click)="formData.isolationType = 'Long term'">
                        <mat-icon class="chip-icon">event</mat-icon>
                        <span>Long-Term Isolation Log</span>
                      </button>
                      <button 
                        type="button" 
                        class="loto-chip-btn" 
                        [class.chip-active]="formData.isolationType === 'Machinery'"
                        (click)="formData.isolationType = 'Machinery'">
                        <mat-icon class="chip-icon">precision_manufacturing</mat-icon>
                        <span>Machinery & Piping Isolation Log</span>
                      </button>
                    </div>
                  </div>

                  <div class="form-group mb-4">
                    <label class="form-label">Overarching Isolation Strategy / Scheme</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.isolationDetails" 
                      placeholder="e.g. Double block and bleed on cargo line with physical lockouts & breaker toggle tags" 
                      class="custom-input font-bold" />
                    <span class="field-hint">High-level energy boundary description and padlock key control strategy</span>
                  </div>

                  <div class="embedded-sub-card">
                    <div class="embedded-card-header">
                      <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                          <mat-icon class="sub-header-icon text-primary">lock</mat-icon>
                          <div>
                            <h4 class="sub-card-title">Registered Isolation Points ({{ formData.lotoRecords.length }})</h4>
                            <p class="sub-card-desc">Individual physical isolations, lockouts, and tags</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="table-responsive">
                      <table class="hseq-table table-compact font-xs">
                        <thead>
                          <tr>
                            <th style="width: 45px;">No.</th>
                            <th style="width: 140px;">Equipment ID</th>
                            <th>Equipment / Location Description</th>
                            <th>Locked or Tagged Out / Method</th>
                            <th style="width: 180px;">Isolated by / Date-Time</th>
                            <th style="width: 180px;">De-Isolated by / Date-Time</th>
                            <th style="width: 50px;" class="text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (l of formData.lotoRecords; track $index) {
                            <tr>
                              <td class="font-mono font-bold">{{ $index + 1 }}.</td>
                              <td>
                                <input type="text" [(ngModel)]="l.equipmentId" placeholder="e.g. SWB-440-02" class="custom-input input-sm font-mono font-bold" />
                              </td>
                              <td>
                                <input type="text" [(ngModel)]="l.description" placeholder="e.g. Main Fuel Oil Purifier Supply Valve" class="custom-input input-sm" />
                              </td>
                              <td>
                                <input type="text" [(ngModel)]="l.isolationDeviceMethod" placeholder="e.g. Padlock #401 & Danger Tag / Blank Flange" class="custom-input input-sm" />
                              </td>
                              <td>
                                <div class="d-flex flex-column gap-1">
                                  <input type="text" [(ngModel)]="l.isolatedBy" placeholder="Officer Rank/Name" class="custom-input input-xs font-bold" />
                                  <input type="text" [(ngModel)]="l.isolatedDate" placeholder="Date & Time" class="custom-input input-xs font-mono" />
                                </div>
                              </td>
                              <td>
                                <div class="d-flex flex-column gap-1">
                                  <input type="text" [(ngModel)]="l.deIsolatedBy" placeholder="De-isolated by" class="custom-input input-xs" />
                                  <input type="text" [(ngModel)]="l.deIsolatedDate" placeholder="Date & Time" class="custom-input input-xs font-mono" />
                                </div>
                              </td>
                              <td class="text-right">
                                <button type="button" class="btn-icon-del" (click)="removeLotoRow($index)" title="Remove Isolation Point">
                                  <mat-icon>delete_outline</mat-icon>
                                </button>
                              </td>
                            </tr>
                          }
                          <tr class="add-table-row-tr">
                            <td colspan="7">
                              <button type="button" class="btn-table-add-row" (click)="addLotoRow()">
                                <mat-icon>add_circle</mat-icon>
                                <span>+ Add Isolation Point ({{ formData.isolationType }} Log)</span>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- 9. Atmospheric Gas Testing Register -->
          @if (currentConfig().sections.requiresGasTesting && !currentConfig().sections.requiresMultiLevelGas) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Atmospheric Gas Testing Log</h3>
                  <p class="section-sub">Mandatory testing for enclosed space entry, hot work, and volatile atmospheres</p>
                </div>
              </div>

              <!-- Mode Segmented Switch -->
              <div class="segmented-control-group mb-4">
                <button 
                  type="button" 
                  class="segment-btn" 
                  [class.segment-active]="formData.gasTestingRequired"
                  (click)="formData.gasTestingRequired = true">
                  <mat-icon class="btn-icon">cloud</mat-icon>
                  <span>Atmospheric Gas Testing Mandatory</span>
                </button>
                <button 
                  type="button" 
                  class="segment-btn" 
                  [class.segment-active]="!formData.gasTestingRequired"
                  (click)="formData.gasTestingRequired = false">
                  <mat-icon class="btn-icon">check_circle</mat-icon>
                  <span>No Atmospheric Hazard (Waived)</span>
                </button>
              </div>

              @if (formData.gasTestingRequired) {
                <div class="section-content-box">
                  <div class="embedded-sub-card" style="margin-top: 0;">
                    <div class="embedded-card-header">
                      <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                          <mat-icon class="sub-header-icon text-primary">air</mat-icon>
                          <div>
                            <h4 class="sub-card-title">Atmospheric Test Baseline Readings ({{ formData.gasTestReadings.length }})</h4>
                            <p class="sub-card-desc">Calibrated 4-gas or PID detector measurements prior to task authorization</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="table-responsive">
                      <table class="hseq-table table-compact">
                        <thead>
                          <tr>
                            <th>Gas Monitored</th>
                            <th>Measured Reading</th>
                            <th>Safe Working Limit</th>
                            <th>Tester Name</th>
                            <th>Retest Frequency</th>
                            <th class="text-right" style="width: 60px;">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (g of formData.gasTestReadings; track $index) {
                            <tr>
                              <td>
                                <select [(ngModel)]="g.gasType" class="custom-select select-sm font-bold">
                                  <option value="Oxygen (O2)">Oxygen (O2)</option>
                                  <option value="Flammable (LEL)">Flammable (LEL)</option>
                                  <option value="Carbon Monoxide (CO)">Carbon Monoxide (CO)</option>
                                  <option value="Hydrogen Sulfide (H2S)">Hydrogen Sulfide (H2S)</option>
                                  <option value="VOC / Benzene">VOC / Benzene</option>
                                </select>
                              </td>
                              <td>
                                <input type="text" [(ngModel)]="g.reading" placeholder="e.g. 20.9% / 0.0%" class="custom-input input-sm font-mono font-bold" />
                              </td>
                              <td>
                                <input type="text" [(ngModel)]="g.safePermissibleRange" placeholder="e.g. 20.8% - 21.0%" class="custom-input input-sm" />
                              </td>
                              <td>
                                <input type="text" [(ngModel)]="g.testerName" placeholder="Certified Tester" class="custom-input input-sm" />
                              </td>
                              <td>
                                <select [(ngModel)]="g.retestFrequency" class="custom-select select-sm">
                                  <option value="Continuous Monitoring">Continuous Monitoring</option>
                                  <option value="Every 2 Hours">Every 2 Hours</option>
                                  <option value="Every 4 Hours">Every 4 Hours</option>
                                  <option value="Prior to Entry">Prior to Entry</option>
                                </select>
                              </td>
                              <td class="text-right">
                                <button type="button" class="btn-icon-del" (click)="removeGasTestRow($index)">
                                  <mat-icon>delete_outline</mat-icon>
                                </button>
                              </td>
                            </tr>
                          }
                          @if (formData.gasTestReadings.length === 0) {
                            <tr>
                              <td colspan="6" class="text-center text-muted p-3">
                                No gas readings logged yet. Click <strong>"+ Add Gas Reading"</strong> to record baseline measurements.
                              </td>
                            </tr>
                          }
                          <tr class="add-table-row-tr">
                            <td colspan="6">
                              <button type="button" class="btn-table-add-row" (click)="addGasTestRow()">
                                <mat-icon>add_circle</mat-icon>
                                <span>+ Add Atmospheric Gas Reading to Register</span>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- 10. Simultaneous Operations (SIMOPS) -->
          @if (currentConfig().sections.requiresSimops) {
            <div class="hseq-card form-section-card">
              <div class="form-section-header">
                <div class="section-num-badge"></div>
                <div class="section-title-wrap">
                  <h3 class="section-title">Simultaneous Operations (SIMOPS)</h3>
                  <p class="section-sub">Cross-boundary operational conflict management and coordination</p>
                </div>
              </div>

              <!-- Mode Segmented Switch -->
              <div class="segmented-control-group mb-4">
                <button 
                  type="button" 
                  class="segment-btn" 
                  [class.segment-active]="formData.simopsRequired"
                  (click)="formData.simopsRequired = true">
                  <mat-icon class="btn-icon text-amber">warning</mat-icon>
                  <span>SIMOPS Conflict Active (Requires Coordination)</span>
                </button>
                <button 
                  type="button" 
                  class="segment-btn" 
                  [class.segment-active]="!formData.simopsRequired"
                  (click)="formData.simopsRequired = false">
                  <mat-icon class="btn-icon text-green">verified</mat-icon>
                  <span>No SIMOPS Conflict (Clear Zone)</span>
                </button>
              </div>

              @if (formData.simopsRequired) {
                <div class="section-content-box border-amber">
                  <div class="form-group">
                    <label class="form-label text-amber font-bold">SIMOPS Coordination Restrictions & Mandatory Controls <span class="required">*</span></label>
                    <textarea 
                      [(ngModel)]="formData.simopsNotes" 
                      rows="3" 
                      placeholder="Specify boundary controls e.g. Hot work and bunkering suspended within 20m radius; VHF Channel 14 continuous radio watch maintained..." 
                      class="custom-input textarea-standard font-md"></textarea>
                    <span class="field-hint">Specify adjacent activity restrictions and communications protocol</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Sidebar Summary & Action Panel -->
        <div class="form-sidebar-col">
          <div class="hseq-card sticky-sidebar">
            <h4 class="sidebar-title">Permit Authorization Summary</h4>
            
            <div class="summary-line">
              <span class="line-label">Status</span>
              <span class="status-pill status-draft">{{ isEditMode ? 'Editing' : 'Drafting' }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Vessel Asset</span>
              <span class="line-val text-primary font-bold">{{ selectedVesselName() }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Permit Type</span>
              <span class="line-val font-bold">{{ selectedPermitType() }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Checklist Template</span>
              <span class="line-val font-medium text-xs">{{ currentTemplate().title }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Duration</span>
              <span class="line-val font-bold">{{ formData.validityHours }} Hours (Max 8h)</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Work Party</span>
              <span class="line-val">{{ formData.personnelCarryingOutWork.length }} Personnel</span>
            </div>

            <div class="summary-line">
              <span class="line-label">LOTO Required</span>
              <span class="line-val">{{ formData.isolationLotoRequired ? 'Yes (' + formData.lotoRecords.length + ' points)' : 'No' }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Gas Testing</span>
              <span class="line-val">{{ formData.gasTestingRequired ? 'Yes (' + formData.gasTestReadings.length + ' readings)' : 'No' }}</span>
            </div>

            <hr class="sidebar-divider" />

            <h5 class="check-title">Mandatory Gates Checklist</h5>
            <div class="gate-check-list">
              <div class="gate-item" [class.item-done]="!!formData.workDescription.trim()">
                <mat-icon class="gate-icon">{{ !!formData.workDescription.trim() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Work Scope Detailed</span>
              </div>
              <div class="gate-item" [class.item-done]="!!formData.areaFieldLocation.trim() && !!formData.locationOfWork.trim()">
                <mat-icon class="gate-icon">{{ !!formData.areaFieldLocation.trim() && !!formData.locationOfWork.trim() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Client Location Fields Set</span>
              </div>
              <div class="gate-item" [class.item-done]="!!formData.performingAuthority.trim() && !!formData.responsiblePersonInAttendance.trim()">
                <mat-icon class="gate-icon">{{ !!formData.performingAuthority.trim() && !!formData.responsiblePersonInAttendance.trim() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Authorities & Attendance Set</span>
              </div>
              <div class="gate-item" [class.item-done]="formData.personnelCarryingOutWork.length > 0">
                <mat-icon class="gate-icon">{{ formData.personnelCarryingOutWork.length > 0 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Work Party Registered</span>
              </div>
              <div class="gate-item" [class.item-done]="!!formData.linkedRaNumber">
                <mat-icon class="gate-icon">{{ !!formData.linkedRaNumber ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Risk Assessment Attached</span>
              </div>
              <div class="gate-item" [class.item-done]="formData.toolboxTalkCompleted">
                <mat-icon class="gate-icon">{{ formData.toolboxTalkCompleted ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <span>Toolbox Talk Signed</span>
              </div>
            </div>

            <hr class="sidebar-divider" />

            <div class="sidebar-actions">
              <button 
                mat-flat-button 
                color="primary" 
                class="btn-full" 
                [disabled]="!canSubmit()"
                (click)="savePermit('Requested')">
                <mat-icon>send</mat-icon> Submit for Authorization
              </button>
              <button mat-stroked-button class="btn-full" (click)="savePermit('Draft')">
                <mat-icon>save</mat-icon> Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: var(--font-sans); display: block; }
    
    .module-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 24px 32px;
      max-width: 1720px;
      margin: 0 auto;
    }

    .btn-cancel {
      height: 40px !important;
      border-color: var(--border) !important;
      color: var(--foreground) !important;
      font-weight: 600 !important;
    }
    .btn-draft {
      height: 40px !important;
      font-weight: 600 !important;
    }
    .btn-primary-action {
      height: 40px !important;
      font-weight: 700 !important;
    }

    /* Warning & Success Banners */
    .linkage-warning-banner {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .linkage-success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .banner-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      color: #d97706;
      flex-shrink: 0;
    }
    .text-green { color: #16a34a !important; }
    .text-amber { color: #d97706 !important; }
    .text-blue { color: #2563eb !important; }
    .text-purple { color: #7c3aed !important; }
    .text-red { color: #dc2626 !important; }
    .text-slate { color: #475569 !important; }

    .banner-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .banner-title { font-size: 13.5px; font-weight: 800; color: #92400e; }
    .banner-desc { font-size: 12.5px; color: #78350f; line-height: 1.4; }
    
    .gate-status-pill {
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      white-space: nowrap;
    }
    .ready-pill {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }

    .client-policy-note {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
      font-size: 12.5px;
      line-height: 1.4;
    }
    .policy-note-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #dc2626;
      flex-shrink: 0;
    }

    /* Main Form Layout & Spacing */
    .form-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 28px;
      align-items: start;
      width: 100%;
    }
    @media (max-width: 1080px) {
      .form-layout { grid-template-columns: minmax(0, 1fr); }
    }

    .main-form-col {
      min-width: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      counter-reset: ptw-section;
    }

    .form-sidebar-col {
      min-width: 0;
    }

    /* Cards - Generous Spacing and Padding */
    .form-section-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 28px 32px;
      margin-bottom: 28px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: border-color 0.15s ease;
      counter-increment: ptw-section;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
    }

    .form-section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }

    .section-num-badge {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .section-num-badge::after {
      content: counter(ptw-section);
    }
    .section-num-badge.bg-blue { background: #2563eb !important; color: #fff !important; }
    .section-num-badge.bg-amber { background: #d97706 !important; color: #fff !important; }
    .section-num-badge.bg-purple { background: #7c3aed !important; color: #fff !important; }
    .section-num-badge.bg-slate { background: #475569 !important; color: #fff !important; }
    .section-num-badge.bg-red { background: #dc2626 !important; color: #fff !important; }

    .section-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--foreground);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .section-sub {
      font-size: 12.5px;
      color: var(--muted-foreground);
      margin: 0;
    }

    .section-divider {
      height: 1px;
      background: var(--border);
      margin: 28px 0;
      width: 100%;
    }

    /* Embedded Sub-Card for Tables & Dynamic Grids */
    .embedded-sub-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px 22px;
      margin-top: 24px;
      width: 100%;
      box-sizing: border-box;
    }
    .embedded-card-header {
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .sub-card-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }
    .sub-card-desc {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 2px 0 0 0;
    }
    .sub-header-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .table-responsive {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border-radius: var(--radius-sm);
    }

    /* Colored Section Left Accents */
    .border-blue { border-left: 4px solid #2563eb !important; }
    .border-amber { border-left: 4px solid #d97706 !important; }
    .border-purple { border-left: 4px solid #7c3aed !important; }
    .border-slate { border-left: 4px solid #475569 !important; }
    .border-red { border-left: 4px solid #dc2626 !important; }

    /* Grids & Form Controls */
    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-label {
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--foreground);
    }
    .required { color: #dc2626; margin-left: 2px; }
    .field-hint { font-size: 11.5px; color: var(--muted-foreground); line-height: 1.3; }
    .bg-readonly { background-color: var(--muted) !important; color: var(--muted-foreground) !important; cursor: default; }
    .font-mono { font-family: monospace !important; }
    .textarea-standard { min-height: 85px; padding: 12px 14px; resize: vertical; }

    /* Controls Styling */
    .custom-input, .custom-select {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-size: 13px;
      color: var(--foreground);
      font-family: inherit;
      outline: none;
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .custom-select {
      padding-right: 32px !important;
      appearance: none !important;
      -webkit-appearance: none !important;
      cursor: pointer;
    }
    .custom-input:focus, .custom-select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
    }
    .input-sm, .select-sm { padding: 6px 10px; font-size: 12px; height: 34px; }

    .type-indicator-chip {
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Duration & Datetime */
    .datetime-input-wrap { position: relative; }
    .date-picker-input { height: 42px; cursor: pointer; }
    .duration-badge-wrap { display: flex; align-items: center; gap: 10px; }
    .duration-pill {
      font-size: 12px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      background: var(--accent);
      color: var(--primary);
      border: 1px solid var(--border);
      white-space: nowrap;
    }
    .pill-warn { background: #fee2e2 !important; color: #dc2626 !important; border-color: #fca5a5 !important; }

    /* Segmented Switches */
    .segmented-control-group {
      display: flex;
      gap: 8px;
      background: var(--muted);
      padding: 6px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .segment-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--muted-foreground);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .segment-btn:hover { color: var(--foreground); }
    .segment-btn.segment-active {
      background: var(--card);
      color: var(--foreground);
      border-color: var(--border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    .btn-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Section content boxes */
    .section-content-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
    }

    .waived-info-card {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 20px;
      background: var(--muted);
      border-radius: 8px;
      border: 1px dashed var(--border);
    }
    .waived-icon { font-size: 24px; width: 24px; height: 24px; color: var(--muted-foreground); flex-shrink: 0; }
    .waived-body { display: flex; flex-direction: column; gap: 3px; }

    .sub-records-block {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 20px;
    }

    /* Checklist Table & Segmented Yes/No/NA Controls */
    .checklist-table th { font-size: 12px; font-weight: 800; background: var(--muted); padding: 10px 12px; }
    .checklist-table td { padding: 12px; }
    .chk-question-text { font-size: 13px; font-weight: 600; color: var(--foreground); line-height: 1.45; }
    .chk-segmented-group {
      display: inline-flex;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
    }
    .chk-seg-btn {
      padding: 5px 12px;
      font-size: 11.5px;
      font-weight: 800;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chk-seg-btn:hover { color: var(--foreground); }
    .chk-seg-btn.btn-yes.active { background: #16a34a; color: #fff; }
    .chk-seg-btn.btn-no.active { background: #dc2626; color: #fff; }
    .chk-seg-btn.btn-na.active { background: #64748b; color: #fff; }

    /* Work Crew Box */
    .crew-section-box {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 20px;
    }

    /* Radio pills */
    .radio-pill-group { display: flex; gap: 10px; }
    .radio-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 6px;
      background: var(--card);
      border: 1px solid var(--border);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .radio-pill.active { border-color: var(--primary); background: var(--accent); color: var(--primary); }

    /* Energy chips */
    .energy-sources-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .energy-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--card);
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
      cursor: pointer;
    }
    .energy-chip:hover { border-color: var(--primary); color: var(--foreground); }
    .energy-chip.chip-selected { background: var(--accent); border-color: var(--primary); color: var(--primary); }

    /* Aloft checks grid */
    .aloft-checks-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 18px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
    }

    /* Gear count item */
    .gear-count-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 12px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .gear-label { font-size: 12px; font-weight: 600; }

    /* Tag safe */
    .tag-safe {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 11.5px;
      font-weight: 700;
    }

    .v-chip {
      background: #fef3c7;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
    }

    /* Electrical Equipment Checklist Card Styling */
    .elec-checklist-card {
      background: var(--card);
      border: 1px solid #c4b5fd;
      border-radius: 8px;
      padding: 20px;
      margin-top: 16px;
      background: #faf5ff;
    }
    .elec-card-header { margin-bottom: 16px; border-bottom: 1px solid #e9d5ff; padding-bottom: 12px; }
    .elec-card-title { font-size: 14.5px; font-weight: 800; color: #581c87; margin: 0; letter-spacing: 0.3px; }
    .elec-card-sub { font-size: 12px; color: #7e22ce; margin: 2px 0 0; }
    .elec-meta-container { background: #ffffff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 16px; }
    .elec-table-wrap { background: #ffffff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 16px; }
    .elec-table th { background: #f3e8ff !important; color: #581c87 !important; font-size: 11.5px; font-weight: 800; }
    .elec-table td { padding: 8px 12px; font-size: 12.5px; }

    .chk-box-inline {
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    .chk-box-inline input[type="checkbox"] { display: none; }
    .chk-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
      transition: all 0.15s ease;
    }
    .chk-pill.chk-active {
      background: #16a34a;
      color: #ffffff;
      border-color: #15803d;
      box-shadow: 0 1px 2px rgba(22, 163, 74, 0.2);
    }
    .cat-chip-custom { background: #fef3c7 !important; color: #b45309 !important; border-color: #fde68a !important; }
    .custom-check-row { background: #fffdf5; }
    .custom-chk-row { background: #faf5ff; }

    /* PPE Chips */
    .ppe-pills-wrap { display: flex; flex-wrap: wrap; gap: 10px; }
    .ppe-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 9999px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .ppe-chip:hover { border-color: var(--primary); }
    .ppe-chip.chip-selected {
      background: var(--accent);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 700;
    }
    .chip-icon { font-size: 17px; width: 17px; height: 17px; }

    /* TBT Box */
    .tbt-box {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 20px;
    }
    .tbt-badge { font-size: 11.5px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; }
    .badge-pass { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-pending { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }

    /* Sticky Sidebar */
    .sticky-sidebar {
      position: sticky;
      top: 24px;
      padding: 24px;
      border-radius: 10px;
    }
    .sidebar-title {
      font-size: 15px;
      font-weight: 800;
      margin: 0 0 18px 0;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      letter-spacing: -0.01em;
    }
    .summary-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 12.5px;
    }
    .line-label { color: var(--muted-foreground); font-weight: 600; }
    .line-val { font-weight: 700; color: var(--foreground); text-align: right; }
    .sidebar-divider { border: 0; border-top: 1px solid var(--border); margin: 18px 0; }
    .check-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted-foreground);
      margin: 0 0 14px 0;
    }
    .gate-check-list { display: flex; flex-direction: column; gap: 12px; }
    .gate-item { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--muted-foreground); }
    .gate-item.item-done { color: var(--foreground); font-weight: 600; }
    .gate-item.item-done .gate-icon { color: #16a34a; }
    .gate-icon { font-size: 19px; width: 19px; height: 19px; color: var(--muted-foreground); flex-shrink: 0; }
    
    .sidebar-actions { display: flex; flex-direction: column; gap: 10px; }
    .btn-full { width: 100% !important; height: 42px !important; font-weight: 700 !important; }

    .btn-icon-del {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #dc2626;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: 4px;
    }
    .btn-icon-del:hover { background: #fee2e2; }
    .btn-icon-del mat-icon { font-size: 19px; width: 19px; height: 19px; }

    .checkbox-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; }
    .table-compact th, .table-compact td { padding: 8px 12px !important; }
    .text-2xs { font-size: 10px; }
    .cat-chip {
      background: var(--muted);
      border: 1px solid var(--border);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      color: var(--muted-foreground);
    }
    .count-pill {
      background: var(--muted);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 9999px;
      font-weight: 700;
    }
    .status-pill {
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-draft { background: var(--muted); color: var(--muted-foreground); border: 1px solid var(--border); }

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

    /* Subscope tab navigation for Cold Work 6 Sub-Checklists */
    .subscope-tabs-nav {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 2px 10px 2px;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .subscope-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .subscope-tab-btn:hover {
      background: var(--muted);
      color: var(--foreground);
    }
    .subscope-tab-btn.tab-active {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    .tab-badge {
      font-size: 10px;
      padding: 1px 7px;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.25);
    }
    .subscope-tab-btn:not(.tab-active) .tab-badge {
      background: var(--muted);
      color: var(--foreground);
    }

    /* Safety Watch, Emergency Gear & Machinery Isolation Boxes */
    .safety-watch-box, .emergency-equipment-box, .machinery-isolation-box, .sub-scope-checklist-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px;
    }

    /* Cold Work Checks Grid & Checkbox Cards */
    .checks-grid-panel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .checkbox-card-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .checkbox-card-item:hover {
      background: var(--accent);
      border-color: var(--primary);
    }
    .checkbox-card-item input[type="checkbox"] {
      margin-top: 3px;
      accent-color: var(--primary);
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
    .checkbox-card-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .checkbox-card-text strong {
      font-size: 13px;
      color: var(--foreground);
      font-weight: 700;
    }
    .checkbox-card-text span {
      font-size: 11.5px;
      color: var(--muted-foreground);
      line-height: 1.4;
    }

    /* Sub-scope Table Wrap */
    .sub-scope-table-wrap {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 16px;
    }

    /* LOTO Register Chips & Content */
    .loto-content-wrap {
      margin-top: 16px;
    }
    .loto-reg-chips-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 8px;
    }
    .loto-chip-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--muted);
      border: 1.5px solid var(--border);
      color: var(--muted-foreground);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .loto-chip-btn:hover {
      background: var(--card);
      border-color: var(--primary);
      color: var(--foreground);
    }
    .loto-chip-btn.chip-active {
      background: rgba(37, 99, 235, 0.1);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 700;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12);
    }
    .loto-chip-btn .chip-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `]
})
export class PermitFormComponent implements OnInit {
  public state = inject(HseqStateService);
  private permitStore = inject(PermitStore);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  permitId?: string;
  referenceNo = signal<string>('PTW-2026-0190');
  selectedVesselId = signal<string>('VES-01');

  // Primary Reactive Signal for Dynamic Permit Type Behavior
  readonly selectedPermitType = signal<string>('Hot Work');

  availablePpeList: string[] = [
    'Safety Helmet',
    'Safety Boots (Steel Toe)',
    'High-Visibility Vest',
    'Leather Work Gloves',
    'Safety Glasses / Goggles',
    'Gas Detector 4-Way',
    'Full Body Safety Harness',
    'Welding Shield / Face Visor',
    'Leather Welding Gauntlets',
    'Leather Apron & Spats',
    'Chemical Resistant Coverall',
    'Escape SCBA (EEBD)',
    'Intrinsically Safe Torch',
    'Auto-inflate Lifejacket',
    'Arc-Flash Electrical Shield',
    'Dielectric Insulating Gloves',
    'Dust / Fume Respirator',
    'Hearing Protection'
  ];

  availableEnergySources: string[] = [
    'Electrical 110V',
    'Electrical 220V',
    'Electrical 440V',
    'Gas / Inert Gas',
    'Pneumatic',
    'Hydraulic',
    'Steam',
    'Water',
    'Thermal',
    'Chemical',
    'Radiation',
    'Sound',
    'Compressed Air',
    'Refrigerants'
  ];

  formData = {
    permitType: 'Hot Work',
    areaFieldLocation: 'Zuluf Field / Tanajib Anchorage',
    locationOfWork: 'Workshop Intermediate Level',
    location: 'Engine Room',
    worksite: 'Workshop Stanchion Frame',
    workDescription: '',
    startDateTime: '',
    expiryDateTime: '',
    validityHours: 8,
    validityPeriod: '8 Hours',
    performingAuthority: 'Fitter S. Kouris',
    areaAuthority: 'Chief Engineer M. Rossi',
    responsibleSupervisor: '2nd Engineer J. Kowalski',
    approvingAuthority: 'Capt. R. Sterling (Master)',
    responsiblePersonInAttendance: 'Chief Officer K. Hansen',
    personnelCarryingOutWork: [
      { name: 'S. Kouris', rank: 'Fitter', briefed: true },
      { name: 'D. Silva', rank: 'Bosun', briefed: true }
    ] as PtwWorkCrewMember[],
    hazards: 'Hot sparks, molten slag, flammable paint/coating ignition, toxic welding fumes, UV arc radiation, burn injury.',
    ppe: ['Welding Helmet / Face Visor', 'Leather Welding Gauntlets', 'Leather Apron & Spats', 'Safety Boots (Steel Toe)', 'Dust / Fume Respirator'],
    controlMeasures: 'Nominated fire watch stationed with charged fire hose & 2x 9L foam extinguishers. 15m radius cleared of combustibles. Mandatory 30-minute post-work fire monitoring.',
    linkedRaNumber: 'RA-2026-0044',
    linkedJsa: 'JSA-HW-012: Enclosed Hot Work & Grinding Procedures',
    toolboxTalkCompleted: true,
    toolboxTalkDate: '',
    toolboxTalkTopic: 'Hot work fire watch protocols and post-work monitoring',
    isolationLotoRequired: false,
    isolationType: 'Short term' as 'Short term' | 'Long term' | 'Machinery',
    isolationDetails: '',
    lotoRecords: [] as Partial<LotoRecord>[],
    gasTestingRequired: false,
    gasTestReadings: [] as Partial<GasTestReading>[],
    simopsRequired: true,
    simopsNotes: 'No bunkering, fuel transfer, or painting within 15 meters during hot work operations.',
    checklistAnswers: {} as Record<string, 'YES' | 'NO' | 'NA'>,
    customChecklistItems: [] as PtwChecklistItem[],
    customEnergySourceInput: '',

    // Electrical Equipment Checklist (Client Form 09F-006-05)
    electricalEquipmentChecklist: {
      system: 'Main Switchboard & 440V Generation Distribution',
      section: 'Engine Room Starboard Switchboard 440V',
      components: 'Main Circuit Breaker ACB-02, Busbars & Feeder Shutter',
      companyCrew: 'Vessel Engineering Crew',
      engineers: 'ETO L. Chen, 1st Engineer D. Santos',
      startDate: '',
      startTime: '08:00',
      durationDays: '1',
      finishDate: '',
      finishTime: '16:00',
      durationHours: '8',
      durationMins: '00',
      chiefEngineer: 'Chief Engineer M. Rossi',
      chiefEngineerDate: '',
      chiefEngineerSignature: 'M. Rossi',
      highVoltageChecks: [
        { id: 'EHV-01', description: 'Safety distance known for the switchboard / Working area', before: true, after: true, isCustom: false },
        { id: 'EHV-02', description: 'Warning signs displayed', before: true, after: true, isCustom: false },
        { id: 'EHV-03', description: 'Authorized Person and Person in charge to be appointed', before: true, after: true, isCustom: false },
        { id: 'EHV-04', description: 'Approved tools and insulating rubber equipment available', before: true, after: true, isCustom: false },
        { id: 'EHV-05', description: 'Fire appliances suitable for electrical equipment in readiness', before: true, after: true, isCustom: false },
        { id: 'EHV-06', description: 'Circuit isolated, supply breaker removed to park position (Authorized Person/Person in charge)', before: true, after: true, isCustom: false },
        { id: 'EHV-07', description: 'Exposure to dangerous parts is reduced to the minimum possible', before: true, after: true, isCustom: false },
        { id: 'EHV-08', description: 'High voltage measuring device functionality confirmed (Authorized Person/Person in charge)', before: true, after: true, isCustom: false },
        { id: 'EHV-09', description: '"No Voltage" measurement performed on isolated circuit (Authorized Person/Person in charge)', before: true, after: true, isCustom: false },
        { id: 'EHV-10', description: 'Earthing switch connected and visually checked (Authorized Person)', before: true, after: true, isCustom: false },
        { id: 'EHV-11', description: '"In Service" keys removed and handed over to Authorized Person.', before: true, after: true, isCustom: false },
        { id: 'EHV-12', description: '"No Voltage" measurement performed where work is to be carried out (Authorized Person/Person in charge)', before: true, after: true, isCustom: false },
        { id: 'EHV-13', description: 'Portable earth cables connected and checked (Authorized Person/Person in charge)', before: true, after: true, isCustom: false },
        { id: 'EHV-14', description: 'Working area cleared for tools', before: true, after: true, isCustom: false },
        { id: 'EHV-15', description: 'Portable working earth-cables disconnected', before: false, after: true, isCustom: false },
        { id: 'EHV-16', description: 'Removed covers and doors secured in place', before: false, after: true, isCustom: false },
        { id: 'EHV-17', description: 'Earthing switch disconnected', before: false, after: true, isCustom: false },
        { id: 'EHV-18', description: 'Earthing switch visually checked for disconnection', before: false, after: true, isCustom: false },
        { id: 'EHV-19', description: 'In service keys in normal position', before: false, after: true, isCustom: false },
        { id: 'EHV-20', description: 'Supply breaker gas pressure on and open / moved to normal position', before: false, after: true, isCustom: false },
        { id: 'EHV-21', description: 'Power re-established by Authorized Person', before: false, after: true, isCustom: false }
      ] as ElectricalCheckItem[],
      lowVoltageChecks: [
        { id: 'ELV-01', description: 'Warning sign displayed', before: true, after: true, isCustom: false },
        { id: 'ELV-02', description: 'Approved tools and insulating rubber equipment available', before: true, after: true, isCustom: false },
        { id: 'ELV-03', description: 'Fire appliances suitable for electrical equipment in readiness', before: true, after: true, isCustom: false },
        { id: 'ELV-04', description: 'Circuit isolated', before: true, after: true, isCustom: false },
        { id: 'ELV-05', description: 'If not isolated, skilled personnel to perform work', before: true, after: true, isCustom: false },
        { id: 'ELV-06', description: 'Exposure to dangerous parts is reduced to the minimum possible', before: true, after: true, isCustom: false }
      ] as ElectricalCheckItem[]
    } as ElectricalEquipmentChecklist,

    // Confined Space:
    spaceType: 'Enclosed' as string,
    connectedAdjacentSpaces: 'Adjacent Ballast Tank 3P & Pipe Tunnel',
    lastCargo: 'HFO / Diesel Oil (Cleaned & Gas-Freed)',
    reasonForEntry: 'Ultrasonic thickness gauging & sacrificial zinc anode inspection',
    attendantAtEntrance: 'AB D. Silva (Stationed with VHF Ch 14 & Entry Logboard)',
    ventilationType: 'Electric explosion-proof forced blower (≥ 3 air changes complete, continuous)',
    multiLevelGas: {
      top: { o2: '20.9%', co2: '0.03%', co: '0 ppm', lel: '0.0%', toxic: '0 ppm' },
      middle: { o2: '20.9%', co2: '0.03%', co: '0 ppm', lel: '0.0%', toxic: '0 ppm' },
      bottom: { o2: '20.9%', co2: '0.04%', co: '0 ppm', lel: '0.0%', toxic: '0 ppm' }
    },
    customMultiLevelGas: [] as Array<{
      parameter: string;
      limit: string;
      top: string;
      middle: string;
      bottom: string;
      status: string;
    }>,
    emergencyGear: {
      scbaSets: 2,
      spareCylinders: 4,
      eebdSets: 2,
      resuscitation: true,
      safetyLines: 2,
      rescueStretcher: true
    },

    // Hot Work:
    fireWatchmanName: 'Able Seaman M. Santos',
    fireWatchBridgeComm: 'VHF Channel 14 / Working Ch 16',
    fireMainPressurized: true,
    portableExtinguishers: '2x 9L Foam + 1x 5kg Dry Powder',
    adjacentSpacesGasFree: 'Adjacent Coffer Dam & Port Wing Tank verified gas-free (<1% LEL)',

    // Electrical:
    energySources: ['Electrical 440V', 'Electrical 220V'] as string[],
    voltageClassification: '440V to 6.6 kV' as string,

    // Aloft:
    aloftRadarsOff: true,
    aloftRadiosOff: true,
    aloftFunnelEmissionsReduced: true,
    aloftHarnessInspected: true,

    // Overboard:
    overboardVesselStopped: true,
    overboardGpsMobTested: true,
    overboardLifejacketWorn: true,
    overboardStandbyMan: 'AB K. Patel with VHF Radio Ch 14',
    overboardRescueBoatReady: true,
    overboardPropellerImmobilized: true,

    // Cold Work:
    coldWorkRiggingSwl: '2T Lever Hoist Cert #LH-402 inspected with current color code',
    coldWorkLineSecuring: 'Whip-checks rigged on pneumatic impact wrench line',
    coldWorkToolsInspected: true,
    coldWorkDropContainment: true,
    coldWorkCombustiblesCleared: true,

    // Diving:
    divingSupervisor: 'J. Dupont (Commercial Diving Supv)',
    classSurveyor: 'A. Moreau (DNV Surveyor)',
    clientRep: 'F. Al-Mansoor (Client Operations)',
    flagAlphaHoisted: true,
    divingPropellerLoto: true,
    divingEcrSignPosted: true,

    // Asbestos:
    dpaPermissionReceived: true,
    asbestosFaceMaskApproved: true,
    asbestosCoverallsPocketless: true,
    wasteDisposalSealed: true,

    // Hot Work (Client Form 09F-006-03):
    safetyWatchPersonnel: [
      { name: 'Able Seaman M. Santos', rank: 'AB', briefedRadioTested: true, monitoringStationArea: 'Adjacent space / Boundary bulkhead', actionOnAlarm: 'Raise alarm immediately & activate fire hose' }
    ] as HotWorkSafetyWatchMember[],
    hotWorkEmergencyEquipment: [
      { item: 'Portable Extinguishers (9L Foam / 5kg Powder)', location: 'Adjacent to Welding Set', readyOnScene: true, inspectedBy: 'Safety Officer A. Roy' },
      { item: 'Pressurized Fire Hose with Jet/Spray Nozzle', location: 'Hydrant #4 Port Side', readyOnScene: true, inspectedBy: 'Bosun D. Silva' },
      { item: 'Fireman’s Outfit & SCBA Standby', location: 'Emergency Locker Outside Space', readyOnScene: true, inspectedBy: '2nd Officer A. Vance' },
      { item: 'Fire Blankets & Spark Arrestor Curtains', location: 'Surrounding 10m perimeter', readyOnScene: true, inspectedBy: 'Fitter S. Kouris' }
    ] as HotWorkEmergencyEquipment[],
    adjacentSpacesGasFreeDetails: 'Adjacent Coffer Dam & Port Wing Tank verified gas-free (<1% LEL hydrocarbon vapor)',
    fireWatchBridgeCommMethod: 'VHF Ch 14 (Dedicated Marine Band Channel)',

    // Cold Work (Client Form 09F-006-06):
    machineryIsolationRecords: [
      { equipment: 'Main L.O. Purifier Pump #1', isolationPoint: 'Suction/Discharge Valves & Control Breaker', isolationMethod: 'Lockout Clasp & Blank Flange', isolatedBy: '2nd Engineer J. Kowalski', isolatedDateTime: '2026-10-08 08:30', deIsolatedBy: '', deIsolatedDateTime: '' }
    ] as MachineryIsolationRecord[],
    coldWorkSubChecklistAnswers: {} as Record<string, 'YES' | 'NO' | 'NA'>
  };

  readonly coldWorkScopes = COLD_WORK_SCOPES;
  activeColdWorkTab = signal<string>('machinery');

  readonly ptwCategories = computed(() => {
    const cats = this.state.categories()
      .filter(c => c.scope === 'Permit to Work')
      .map(c => c.name);
    return cats.length > 0
      ? cats
      : ['Hot Work', 'Cold Work', 'Confined Space Entry', 'Electrical Work', 'Working Aloft', 'Working Overboard', 'Diving Operation', 'Asbestos Work'];
  });

  readonly selectedVesselName = computed(() => {
    const vId = this.selectedVesselId();
    const v = this.state.vessels().find(x => x.id === vId || x.name === vId);
    return v?.name || vId || (this.state.vessels()[0]?.name || 'Fleet Vessel');
  });

  readonly currentConfig = computed<PermitTypeItem>(() => {
    const type = this.selectedPermitType();
    return this.getPermitConfig(type);
  });

  readonly currentTemplate = computed<PtwChecklistTemplate>(() => {
    const selectedType = this.selectedPermitType();
    const config = this.currentConfig();
    
    // 1. Direct template link from Master Data configuration
    if (config?.associatedTemplateId) {
      const linked = this.state.ptwTemplates().find(t => t.id === config.associatedTemplateId);
      if (linked) return linked;
    }

    // 2. Lookup by permitType name or matching standard type
    const match = this.state.ptwTemplates().find(t => 
      t.permitType.toLowerCase() === selectedType.toLowerCase() ||
      (config?.displayName && t.permitType.toLowerCase() === config.displayName.toLowerCase()) ||
      (selectedType.toLowerCase().includes('confined') && t.permitType.toLowerCase().includes('confined')) ||
      (selectedType.toLowerCase().includes('enclosed') && t.permitType.toLowerCase().includes('confined')) ||
      (selectedType.toLowerCase().includes('aloft') && t.permitType.toLowerCase().includes('aloft')) ||
      (selectedType.toLowerCase().includes('overboard') && t.permitType.toLowerCase().includes('overboard')) ||
      (selectedType.toLowerCase().includes('diving') && t.permitType.toLowerCase().includes('diving')) ||
      (selectedType.toLowerCase().includes('asbestos') && t.permitType.toLowerCase().includes('asbestos')) ||
      (selectedType.toLowerCase().includes('cold') && t.permitType.toLowerCase().includes('cold')) ||
      (selectedType.toLowerCase().includes('electr') && t.permitType.toLowerCase().includes('electr')) ||
      (selectedType.toLowerCase().includes('hot') && t.permitType.toLowerCase().includes('hot'))
    );
    if (match) return match;

    // 3. Fully dynamic empty template for new / unconfigured permit types - NO hardcoded Hot Work fallback!
    return {
      id: `TMPL-${config?.code || 'CUSTOM'}`,
      title: `${config?.displayName || selectedType} Checklist`,
      permitType: config?.displayName || selectedType,
      formReference: config?.formRef || '',
      description: 'Permit type specific checklist questions configured by administrator.',
      items: [],
      defaultPpe: config?.defaultPpe || [],
      specificValidations: []
    };
  });

  // Dynamic Boolean Signals for Section Display - Driven by Master Data Configuration
  readonly isHotWork = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-HOT' || cfg.displayName.toLowerCase().includes('hot');
  });
  
  readonly isConfinedSpaceEntry = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-CONF' || 
      cfg.displayName.toLowerCase().includes('confined') || 
      cfg.displayName.toLowerCase().includes('enclosed') ||
      cfg.sections.requiresMultiLevelGas ||
      cfg.sections.requiresPeriodicGasLog;
  });

  readonly isElectricalWork = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-ELEC' || 
      cfg.displayName.toLowerCase().includes('electr') ||
      cfg.sections.requiresEnergySources ||
      cfg.sections.requiresElectricalChecklist;
  });

  readonly isWorkingAloft = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-ALOFT' || cfg.displayName.toLowerCase().includes('aloft');
  });

  readonly isWorkingOverboard = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-OVER' || 
      cfg.displayName.toLowerCase().includes('overboard') || 
      cfg.displayName.toLowerCase().includes('outboard');
  });

  readonly isColdWork = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-COLD' || 
      cfg.displayName.toLowerCase().includes('cold') ||
      cfg.sections.requiresColdWorkSubChecklists;
  });

  readonly isDivingOperation = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-DIVE' || 
      cfg.displayName.toLowerCase().includes('div') ||
      cfg.sections.requiresDivingControls;
  });

  readonly isAsbestosWork = computed(() => {
    const cfg = this.currentConfig();
    return cfg.code === 'PT-ASB' || 
      cfg.displayName.toLowerCase().includes('asbest') ||
      cfg.sections.requiresAsbestosControls;
  });

  readonly linkagesValid = computed(() => {
    return !!this.formData.linkedRaNumber && this.formData.toolboxTalkCompleted;
  });

  readonly answeredCount = computed(() => {
    const tmpl = this.currentTemplate();
    const answers = this.formData.checklistAnswers || {};
    const baseCount = tmpl.items.filter(item => !!answers[item.id]).length;
    const customCount = (this.formData.customChecklistItems || []).filter(item => !!answers[item.id]).length;
    return baseCount + customCount;
  });

  readonly totalQuestionsCount = computed(() => {
    const tmpl = this.currentTemplate();
    return tmpl.items.length + (this.formData.customChecklistItems?.length || 0);
  });

  ngOnInit() {
    // Initialize default timestamps
    const now = new Date();
    const startStr = this.toLocalIsoDateTime(now);
    const endStr = this.toLocalIsoDateTime(new Date(now.getTime() + 8 * 3600000));
    this.formData.startDateTime = startStr;
    this.formData.expiryDateTime = endStr;
    this.formData.toolboxTalkDate = startStr;

    // Default to first vessel in Master Data
    const defaultVessel = this.state.vessels()[0];
    if (defaultVessel) {
      this.selectedVesselId.set(defaultVessel.id);
    }

    this.permitId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.permitId) {
      this.isEditMode = true;
      const record = this.permitStore.getPermit(this.permitId);
      if (record) {
        this.loadRecordForEdit(record);
      }
    } else {
      const count = this.permitStore.totalCount() + 1;
      this.referenceNo.set(`PTW-${new Date().getFullYear()}-0${190 + count}`);
      this.onPermitTypeChange('Hot Work');

      const raRef = this.route.snapshot.queryParamMap.get('fromRa') || 
                    this.route.snapshot.queryParamMap.get('raId') || 
                    this.route.snapshot.queryParamMap.get('raNumber');
      if (raRef) {
        this.prefillFromRiskAssessment(raRef);
      }
    }
  }

  loadRecordForEdit(record: PermitToWorkRecord) {
    this.referenceNo.set(record.referenceNo);
    const match = this.state.vessels().find(v => v.id === record.vesselId || v.name === record.vesselName);
    this.selectedVesselId.set(match ? match.id : (record.vesselId || record.vesselName));
    
    // Sync the signal first
    this.selectedPermitType.set(record.permitType);
    this.formData.permitType = record.permitType;

    this.formData.areaFieldLocation = record.areaFieldLocation || 'Zuluf Field / Tanajib Anchorage';
    this.formData.locationOfWork = record.locationOfWork || record.worksiteLocation || 'Deck Area';
    this.formData.location = record.location || record.worksiteLocation?.split('•')[0]?.trim() || 'Deck Area';
    this.formData.worksite = record.worksite || record.worksiteLocation?.split('•')[1]?.trim() || 'Worksite 1';
    this.formData.workDescription = record.workDescription;
    this.formData.startDateTime = record.startDateTime.replace(' ', 'T');
    this.formData.expiryDateTime = record.expiryDateTime.replace(' ', 'T');
    this.formData.validityHours = record.validityHours || 8;
    this.formData.validityPeriod = record.validityPeriod || `${record.validityHours || 8} Hours`;
    this.formData.performingAuthority = record.performingAuthority;
    this.formData.areaAuthority = record.areaAuthority;
    this.formData.responsibleSupervisor = record.responsibleSupervisor || 'Responsible Supervisor';
    this.formData.approvingAuthority = record.approvingAuthority;
    this.formData.responsiblePersonInAttendance = record.responsiblePersonInAttendance || 'Chief Officer K. Hansen';
    this.formData.personnelCarryingOutWork = record.personnelCarryingOutWork ? [...record.personnelCarryingOutWork] : [
      { name: record.performingAuthority, rank: 'Performing Authority', briefed: true }
    ];
    this.formData.hazards = record.hazards || '';
    this.formData.ppe = record.ppe || ['Safety Helmet', 'Safety Boots (Steel Toe)'];
    this.formData.controlMeasures = record.controlMeasures || '';
    this.formData.linkedRaNumber = record.linkedRaNumber;
    this.formData.linkedJsa = record.linkedJsa || '';
    this.formData.toolboxTalkCompleted = record.toolboxTalkCompleted;
    this.formData.toolboxTalkDate = (record.toolboxTalkDate || record.startDateTime).replace(' ', 'T');
    this.formData.toolboxTalkTopic = record.toolboxTalkTopic || '';
    this.formData.isolationLotoRequired = record.isolationLotoRequired;
    this.formData.isolationDetails = record.isolationDetails || '';
    this.formData.lotoRecords = record.lotoRecords ? [...record.lotoRecords] : [];
    this.formData.gasTestingRequired = record.gasTestingRequired;
    this.formData.gasTestReadings = record.gasTestReadings ? [...record.gasTestReadings] : [];
    this.formData.simopsRequired = record.simopsRequired || false;
    this.formData.simopsNotes = record.simopsNotes || '';
    this.formData.checklistAnswers = record.checklistAnswers ? { ...record.checklistAnswers } : {};

    // Specific fields
    if (record.spaceType) this.formData.spaceType = record.spaceType as any;
    if (record.lastCargo) this.formData.lastCargo = record.lastCargo;
    if (record.reasonForEntry) this.formData.reasonForEntry = record.reasonForEntry;
    if (record.attendantAtEntrance) this.formData.attendantAtEntrance = record.attendantAtEntrance;
    if (record.ventilationType) this.formData.ventilationType = record.ventilationType;
    if (record.fireWatchmanName) this.formData.fireWatchmanName = record.fireWatchmanName;
    if (record.fireWatchBridgeComm) this.formData.fireWatchBridgeComm = String(record.fireWatchBridgeComm);
    if (record.fireMainPressurized !== undefined) this.formData.fireMainPressurized = record.fireMainPressurized;
    if (record.safetyWatchPersonnel) this.formData.safetyWatchPersonnel = [...record.safetyWatchPersonnel];
    if (record.hotWorkEmergencyEquipment) this.formData.hotWorkEmergencyEquipment = [...record.hotWorkEmergencyEquipment];
    if (record.machineryIsolationRecords) this.formData.machineryIsolationRecords = [...record.machineryIsolationRecords];
    if (record.coldWorkSubChecklistAnswers) this.formData.coldWorkSubChecklistAnswers = { ...record.coldWorkSubChecklistAnswers };
    if (record.adjacentSpacesGasFreeDetails) this.formData.adjacentSpacesGasFreeDetails = record.adjacentSpacesGasFreeDetails;
    if (record.fireWatchBridgeCommMethod) this.formData.fireWatchBridgeCommMethod = record.fireWatchBridgeCommMethod;
    if (record.energySources) this.formData.energySources = [...record.energySources];
    if (record.voltageClassification) this.formData.voltageClassification = record.voltageClassification as any;
    if (record.divingSupervisor) this.formData.divingSupervisor = record.divingSupervisor;
    if (record.classSurveyor) this.formData.classSurveyor = record.classSurveyor;
    if (record.clientRep) this.formData.clientRep = record.clientRep;
    if (record.flagAlphaHoisted !== undefined) this.formData.flagAlphaHoisted = record.flagAlphaHoisted;
    if (record.dpaPermissionReceived !== undefined) this.formData.dpaPermissionReceived = record.dpaPermissionReceived;
    if (record.wasteDisposalSealed !== undefined) this.formData.wasteDisposalSealed = record.wasteDisposalSealed;
    if (record.isolationType) this.formData.isolationType = record.isolationType as 'Short term' | 'Long term' | 'Machinery';
    if (record.electricalEquipmentChecklist) {
      this.formData.electricalEquipmentChecklist = JSON.parse(JSON.stringify(record.electricalEquipmentChecklist));
    }
    if (record.customChecklistItems) {
      this.formData.customChecklistItems = [...record.customChecklistItems];
    }

    this.initDefaultChecklistAnswers();
    this.cdr.markForCheck();
  }

  getPermitConfig(type: string): PermitTypeItem {
    const match = this.state.permitTypes().find(k => 
      k.displayName.toLowerCase() === type.toLowerCase() ||
      k.code.toLowerCase() === type.toLowerCase() ||
      (type.toLowerCase().includes('confined') && k.code === 'PT-CONF') ||
      (type.toLowerCase().includes('enclosed') && k.code === 'PT-CONF') ||
      (type.toLowerCase().includes('hot') && k.code === 'PT-HOT') ||
      (type.toLowerCase().includes('electr') && k.code === 'PT-ELEC') ||
      (type.toLowerCase().includes('aloft') && k.code === 'PT-ALOFT') ||
      (type.toLowerCase().includes('overboard') && k.code === 'PT-OVER') ||
      (type.toLowerCase().includes('cold') && k.code === 'PT-COLD') ||
      (type.toLowerCase().includes('div') && k.code === 'PT-DIVE') ||
      (type.toLowerCase().includes('asbest') && k.code === 'PT-ASB')
    );
    if (match) return match;

    const byName = this.state.permitTypes().find(k => k.displayName.toLowerCase() === type.toLowerCase());
    if (byName) return byName;

    return {
      id: `PT-${type.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}`,
      code: `PT-${type.toUpperCase().replace(/\s+/g, '-').slice(0, 8)}`,
      displayName: type,
      description: `${type} operations`,
      associatedTemplateId: '',
      formRef: '',
      sortOrder: 99,
      isActive: true,
      badgeColor: '#0284c7',
      defaultHazards: '',
      defaultControls: '',
      defaultPpe: [],
      sections: {
        requiresWorkCrew: true,
        requiresSafetyWatch: false,
        requiresMasterChecklist: false,
        requiresGasTesting: false,
        requiresMultiLevelGas: false,
        requiresPeriodicGasLog: false,
        requiresLotoIsolation: false,
        requiresIsolationPointsTable: false,
        requiresEnergySources: false,
        requiresElectricalChecklist: false,
        requiresColdWorkSubChecklists: false,
        requiresEmergencyEquipment: false,
        requiresSimops: false,
        requiresDivingControls: false,
        requiresAsbestosControls: false,
        allowCustomChecks: true
      }
    };
  }

  onPermitTypeChange(type: string) {
    this.selectedPermitType.set(type);
    this.formData.permitType = type;
    
    const config = this.getPermitConfig(type);

    // In create mode or when switching permit types, adapt defaults to match the selected type
    if (!this.isEditMode && config) {
      this.formData.hazards = config.defaultHazards || '';
      this.formData.controlMeasures = config.defaultControls || '';
      this.formData.ppe = config.defaultPpe ? [...config.defaultPpe] : [];
      this.formData.gasTestingRequired = !!config.sections?.requiresGasTesting;
      this.formData.isolationLotoRequired = !!config.sections?.requiresLotoIsolation;
      this.formData.simopsRequired = !!config.sections?.requiresSimops;
      if (config.simopsDefaultNotes) {
        this.formData.simopsNotes = config.simopsDefaultNotes;
      }
      if (this.formData.isolationLotoRequired && this.formData.lotoRecords.length === 0) {
        this.addLotoRow();
      }
      if (this.formData.gasTestingRequired && this.formData.gasTestReadings.length === 0) {
        this.addGasTestRow();
      }
    }

    // Auto-update default PPE from template if available
    const tmpl = this.currentTemplate();
    if (tmpl && tmpl.defaultPpe && tmpl.defaultPpe.length > 0 && !this.isEditMode) {
      this.formData.ppe = [...tmpl.defaultPpe];
    }

    // Re-initialize checklist answers for the new template
    this.initDefaultChecklistAnswers();

    // Trigger OnPush change detection immediately
    this.cdr.markForCheck();
  }

  initDefaultChecklistAnswers() {
    const tmpl = this.currentTemplate();
    if (!tmpl || !tmpl.items || tmpl.items.length === 0) {
      this.formData.checklistAnswers = {};
      return;
    }
    
    const answers: Record<string, 'YES' | 'NO' | 'NA'> = {};
    for (const item of tmpl.items) {
      // Retain existing answer if user had already picked one for this item, otherwise use template default
      answers[item.id] = (this.formData.checklistAnswers && this.formData.checklistAnswers[item.id])
        ? this.formData.checklistAnswers[item.id]
        : (item.requiredAnswer || 'YES');
    }
    this.formData.checklistAnswers = answers;
  }

  setChecklistAnswer(itemId: string, answer: 'YES' | 'NO' | 'NA') {
    this.formData.checklistAnswers = {
      ...this.formData.checklistAnswers,
      [itemId]: answer
    };
    this.cdr.markForCheck();
  }

  getChecklistAnswer(itemId: string): 'YES' | 'NO' | 'NA' {
    return this.formData.checklistAnswers[itemId] || 'YES';
  }

  onPtwCrewSelected(m: PtwWorkCrewMember): void {
    if (!m.name) return;
    const match = this.state.crewMembers().find(c => c.name.toLowerCase() === m.name.toLowerCase());
    if (match) {
      m.rank = match.rank;
      this.cdr.markForCheck();
    }
  }

  addCrewMember() {
    this.formData.personnelCarryingOutWork.push({
      name: '',
      rank: 'Able Seaman',
      briefed: true
    });
    this.cdr.markForCheck();
  }

  removeCrewMember(index: number) {
    if (this.formData.personnelCarryingOutWork.length > 1) {
      this.formData.personnelCarryingOutWork.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  toggleEnergySource(source: string) {
    if (this.isEnergySourceSelected(source)) {
      this.formData.energySources = this.formData.energySources.filter(s => s !== source);
    } else {
      this.formData.energySources = [...this.formData.energySources, source];
    }
    this.cdr.markForCheck();
  }

  isEnergySourceSelected(source: string): boolean {
    return this.formData.energySources.includes(source);
  }

  onVesselIdSelect(id: string) {
    this.selectedVesselId.set(id);
    this.cdr.markForCheck();
  }

  toLocalIsoDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  formatDateTimeDisplay(dtStr: string): string {
    if (!dtStr) return 'Not set';
    return dtStr.replace('T', ' ');
  }

  onDateTimeChange() {
    if (this.formData.startDateTime && this.formData.expiryDateTime) {
      const start = new Date(this.formData.startDateTime).getTime();
      const end = new Date(this.formData.expiryDateTime).getTime();
      if (end > start) {
        const hours = Math.round((end - start) / (1000 * 60 * 60));
        this.formData.validityHours = Math.min(8, Math.max(1, hours));
        this.formData.validityPeriod = `${this.formData.validityHours} Hours`;
      }
    }
    this.cdr.markForCheck();
  }

  onHoursChange() {
    if (this.formData.validityHours > 8) {
      this.formData.validityHours = 8;
      this.notify.showWarning('Client Limit Exceeded', 'Permit validity cannot exceed 8 hours per client policy.');
    }
    if (this.formData.startDateTime && this.formData.validityHours) {
      const start = new Date(this.formData.startDateTime).getTime();
      const end = new Date(start + this.formData.validityHours * 3600000);
      this.formData.expiryDateTime = this.toLocalIsoDateTime(end);
      this.formData.validityPeriod = `${this.formData.validityHours} Hours`;
    }
    this.cdr.markForCheck();
  }

  isPpeSelected(ppeItem: string): boolean {
    return this.formData.ppe.includes(ppeItem);
  }

  togglePpe(ppeItem: string) {
    if (this.isPpeSelected(ppeItem)) {
      this.formData.ppe = this.formData.ppe.filter(p => p !== ppeItem);
    } else {
      this.formData.ppe = [...this.formData.ppe, ppeItem];
    }
    this.cdr.markForCheck();
  }

  addCustomChecklistItem() {
    const newId = `CST-${Date.now().toString().slice(-4)}`;
    const newItem: PtwChecklistItem = {
      id: newId,
      question: 'New custom safety verification check',
      category: 'Custom Verification',
      requiredAnswer: 'YES',
      isMandatory: true,
      clientFormRef: 'Ad-hoc Check'
    };
    this.formData.customChecklistItems.push(newItem);
    this.formData.checklistAnswers[newId] = 'YES';
    this.cdr.markForCheck();
  }

  removeCustomChecklistItem(index: number) {
    const item = this.formData.customChecklistItems[index];
    if (item) {
      delete this.formData.checklistAnswers[item.id];
      this.formData.customChecklistItems.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  addHighVoltageCheck() {
    const num = this.formData.electricalEquipmentChecklist.highVoltageChecks.length + 1;
    this.formData.electricalEquipmentChecklist.highVoltageChecks.push({
      id: `EHV-CUST-${num}`,
      description: 'Custom switchboard / system verification check',
      before: true,
      after: true,
      isCustom: true
    });
    this.cdr.markForCheck();
  }

  removeHighVoltageCheck(index: number) {
    this.formData.electricalEquipmentChecklist.highVoltageChecks.splice(index, 1);
    this.cdr.markForCheck();
  }

  addLowVoltageCheck() {
    if (!this.formData.electricalEquipmentChecklist.lowVoltageChecks) {
      this.formData.electricalEquipmentChecklist.lowVoltageChecks = [];
    }
    const num = this.formData.electricalEquipmentChecklist.lowVoltageChecks.length + 1;
    this.formData.electricalEquipmentChecklist.lowVoltageChecks.push({
      id: `ELV-CUST-${num}`,
      description: 'Custom low voltage verification check',
      before: true,
      after: true,
      isCustom: true
    });
    this.cdr.markForCheck();
  }

  removeLowVoltageCheck(index: number) {
    this.formData.electricalEquipmentChecklist.lowVoltageChecks?.splice(index, 1);
    this.cdr.markForCheck();
  }

  addCustomEnergySource() {
    if (this.formData.customEnergySourceInput?.trim()) {
      const src = this.formData.customEnergySourceInput.trim();
      if (!this.availableEnergySources.includes(src)) {
        this.availableEnergySources.push(src);
      }
      if (!this.formData.energySources.includes(src)) {
        this.formData.energySources.push(src);
      }
      this.formData.customEnergySourceInput = '';
      this.cdr.markForCheck();
    }
  }

  onLotoToggle(required: boolean) {
    this.formData.isolationLotoRequired = required;
    if (required && this.formData.lotoRecords.length === 0) {
      this.addLotoRow();
    }
    this.cdr.markForCheck();
  }

  addLotoRow() {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const count = this.formData.lotoRecords.length + 1;
    this.formData.lotoRecords.push({
      id: `LOTO-${Date.now()}`,
      equipmentId: `EQP-${count}`,
      description: 'Main breaker / isolation point',
      isolationDeviceMethod: 'Master Padlock & Danger Tag # ' + count,
      isolatedBy: this.formData.responsibleSupervisor || 'Chief Engineer',
      isolatedDate: nowStr,
      deIsolatedBy: '',
      deIsolatedDate: '',
      isolationPoint: 'Main breaker / isolation point',
      energySource: 'Electrical 440V',
      lockNumber: `LCK-${Math.floor(100 + Math.random() * 900)}`,
      lotoNotes: 'Master Padlock & Danger Tag applied',
      status: 'Isolated'
    });
    this.cdr.markForCheck();
  }

  removeLotoRow(index: number) {
    this.formData.lotoRecords.splice(index, 1);
    this.cdr.markForCheck();
  }

  addCustomMultiLevelGas() {
    this.formData.customMultiLevelGas.push({
      parameter: 'H2S / Toxic Gas',
      limit: '< 5 ppm',
      top: '0 ppm',
      middle: '0 ppm',
      bottom: '0 ppm',
      status: 'Pass'
    });
    this.cdr.markForCheck();
  }

  removeCustomMultiLevelGas(index: number) {
    this.formData.customMultiLevelGas.splice(index, 1);
    this.cdr.markForCheck();
  }

  addGasTestRow() {
    this.formData.gasTestReadings.push({
      id: `GT-${Date.now()}`,
      gasType: 'Oxygen (O2)',
      reading: '20.9%',
      safePermissibleRange: '20.8% - 21.0%',
      testerName: 'Safety Officer A. Roy',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      retestFrequency: 'Continuous Monitoring',
      passed: true,
      status: 'Safe'
    });
    this.cdr.markForCheck();
  }

  removeGasTestRow(index: number) {
    this.formData.gasTestReadings.splice(index, 1);
    this.cdr.markForCheck();
  }

  addSafetyWatchMember() {
    this.formData.safetyWatchPersonnel.push({
      name: '',
      rank: 'Able Seaman',
      briefedRadioTested: true,
      monitoringStationArea: 'Work site boundary',
      actionOnAlarm: 'Raise alarm immediately & activate fire hose'
    });
    this.cdr.markForCheck();
  }

  removeSafetyWatchMember(index: number) {
    if (this.formData.safetyWatchPersonnel.length > 1) {
      this.formData.safetyWatchPersonnel.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  addEmergencyEquipmentRow() {
    this.formData.hotWorkEmergencyEquipment.push({
      item: '',
      location: '',
      readyOnScene: true,
      inspectedBy: this.formData.performingAuthority || 'Safety Officer'
    });
    this.cdr.markForCheck();
  }

  removeEmergencyEquipmentRow(index: number) {
    if (this.formData.hotWorkEmergencyEquipment.length > 1) {
      this.formData.hotWorkEmergencyEquipment.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  addMachineryIsolationRow() {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.formData.machineryIsolationRecords.push({
      equipment: '',
      isolationPoint: '',
      isolationMethod: 'LOTO Lock & Tag',
      isolatedBy: this.formData.responsibleSupervisor || 'Chief Engineer',
      isolatedDateTime: nowStr,
      deIsolatedBy: '',
      deIsolatedDateTime: ''
    });
    this.cdr.markForCheck();
  }

  removeMachineryIsolationRow(index: number) {
    if (this.formData.machineryIsolationRecords.length > 1) {
      this.formData.machineryIsolationRecords.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  setActiveColdWorkTab(tabId: string) {
    this.activeColdWorkTab.set(tabId);
    this.cdr.markForCheck();
  }

  setColdWorkAnswer(itemNum: string, answer: 'YES' | 'NO' | 'NA') {
    this.formData.coldWorkSubChecklistAnswers = {
      ...this.formData.coldWorkSubChecklistAnswers,
      [itemNum]: answer
    };
    this.cdr.markForCheck();
  }

  getColdWorkAnswer(itemNum: string): 'YES' | 'NO' | 'NA' {
    return this.formData.coldWorkSubChecklistAnswers[itemNum] || 'YES';
  }

  canSubmit(): boolean {
    return (
      !!this.formData.workDescription.trim() &&
      !!this.formData.areaFieldLocation.trim() &&
      !!this.formData.locationOfWork.trim() &&
      !!this.formData.performingAuthority.trim() &&
      !!this.formData.areaAuthority.trim() &&
      !!this.formData.responsiblePersonInAttendance.trim() &&
      this.linkagesValid()
    );
  }

  savePermit(targetStatus: 'Draft' | 'Requested') {
    if (!this.formData.workDescription.trim()) {
      this.notify.showWarning('Work Scope Missing', 'Please state the work scope and description.');
      return;
    }

    if (targetStatus === 'Requested' && !this.linkagesValid()) {
      this.notify.showError(
        'Mandatory Gate Block',
        'Permit cannot be submitted without attached Risk Assessment and confirmed Toolbox Talk.'
      );
      return;
    }

    const vId = this.selectedVesselId();
    const actualVessel = this.state.vessels().find(v => v.id === vId);
    const finalVesselId = actualVessel ? actualVessel.id : (vId || 'VES-01');
    const finalVesselName = actualVessel ? actualVessel.name : (this.selectedVesselName() || 'Fleet Vessel');

    const cleanStart = this.formData.startDateTime.replace('T', ' ');
    const cleanExpiry = this.formData.expiryDateTime.replace('T', ' ');

    const payload: Partial<PermitToWorkRecord> = {
      referenceNo: this.referenceNo(),
      permitType: this.selectedPermitType(),
      vesselId: finalVesselId,
      vesselName: finalVesselName,
      areaFieldLocation: this.formData.areaFieldLocation,
      locationOfWork: this.formData.locationOfWork,
      location: this.formData.location,
      worksite: this.formData.worksite,
      worksiteLocation: `${this.formData.areaFieldLocation} • ${this.formData.locationOfWork}`,
      workDescription: this.formData.workDescription,
      startDateTime: cleanStart,
      expiryDateTime: cleanExpiry,
      requestedStartTime: cleanStart,
      requestedEndTime: cleanExpiry,
      validityHours: this.formData.validityHours,
      validityPeriod: `${this.formData.validityHours} Hours`,
      duration: this.formData.validityHours,
      performingAuthority: this.formData.performingAuthority,
      areaAuthority: this.formData.areaAuthority,
      responsibleSupervisor: this.formData.responsibleSupervisor,
      approvingAuthority: this.formData.approvingAuthority,
      responsiblePersonInAttendance: this.formData.responsiblePersonInAttendance,
      personnelCarryingOutWork: this.formData.personnelCarryingOutWork,
      checklistAnswers: this.formData.checklistAnswers,
      hazards: this.formData.hazards,
      ppe: this.formData.ppe,
      controlMeasures: this.formData.controlMeasures,
      linkedRaNumber: this.formData.linkedRaNumber,
      linkedJsa: this.formData.linkedJsa,
      toolboxTalkCompleted: this.formData.toolboxTalkCompleted,
      toolboxTalkDate: (this.formData.toolboxTalkDate || this.formData.startDateTime).replace('T', ' '),
      toolboxTalkTopic: this.formData.toolboxTalkTopic,
      isolationLotoRequired: this.formData.isolationLotoRequired,
      isolationDetails: this.formData.isolationDetails,
      lotoRecords: this.formData.lotoRecords as any,
      gasTestingRequired: this.formData.gasTestingRequired,
      gasTestReadings: this.formData.gasTestReadings as any,
      simopsRequired: this.formData.simopsRequired,
      simopsCheckDone: true,
      simopsNotes: this.formData.simopsNotes,

      // Conditional sections:
      spaceType: this.formData.spaceType,
      connectedAdjacentSpaces: this.formData.connectedAdjacentSpaces,
      lastCargo: this.formData.lastCargo,
      reasonForEntry: this.formData.reasonForEntry,
      attendantAtEntrance: this.formData.attendantAtEntrance,
      ventilationType: this.formData.ventilationType,
      fireWatchmanName: this.formData.fireWatchmanName,
      fireWatchBridgeComm: this.formData.fireWatchBridgeComm,
      fireWatchBridgeCommMethod: this.formData.fireWatchBridgeCommMethod,
      adjacentSpacesGasFreeDetails: this.formData.adjacentSpacesGasFreeDetails,
      safetyWatchPersonnel: this.formData.safetyWatchPersonnel,
      hotWorkEmergencyEquipment: this.formData.hotWorkEmergencyEquipment,
      machineryIsolationRecords: this.formData.machineryIsolationRecords,
      coldWorkSubChecklistAnswers: this.formData.coldWorkSubChecklistAnswers,
      fireMainPressurized: this.formData.fireMainPressurized,
      energySources: this.formData.energySources,
      voltageClassification: this.formData.voltageClassification,
      divingSupervisor: this.formData.divingSupervisor,
      classSurveyor: this.formData.classSurveyor,
      clientRep: this.formData.clientRep,
      flagAlphaHoisted: this.formData.flagAlphaHoisted,
      dpaPermissionReceived: this.formData.dpaPermissionReceived,
      wasteDisposalSealed: this.formData.wasteDisposalSealed,
      isolationType: this.formData.isolationType,
      electricalEquipmentChecklist: this.formData.electricalEquipmentChecklist,
      customChecklistItems: this.formData.customChecklistItems,

      status: targetStatus
    };

    if (this.isEditMode && this.permitId) {
      this.permitStore.updatePermit(this.permitId, payload);
      this.notify.showSuccess('Permit Updated', `Permit ${this.referenceNo()} updated successfully.`);
      this.router.navigate(['/permits', this.permitId]);
    } else {
      const created = this.permitStore.addPermit(payload);
      // Create relationship: Risk Assessment ↔ PTW
      if (this.formData.linkedRaNumber) {
        this.state.linkPermitToRiskAssessment(this.formData.linkedRaNumber, created.referenceNo);
      }
      if (targetStatus === 'Requested') {
        this.permitStore.submitPermit(created.id, this.formData.performingAuthority);
        this.notify.showSuccess(
          'Permit Requested',
          `Permit ${created.referenceNo} submitted for Area Authority review.`
        );
      } else {
        this.notify.showSuccess('Draft Saved', `Permit ${created.referenceNo} saved as Draft.`);
      }
      this.router.navigate(['/permits']);
    }
  }

  prefillFromRiskAssessment(raRef: string) {
    const ra = this.state.getRiskAssessment(raRef);
    if (!ra) return;

    if (ra.status !== 'Approved') {
      this.notify.showError(
        'Permit Creation Prohibited',
        `Risk Assessment ${ra.referenceNo} is in "${ra.status}" status. Permits to Work can ONLY be created after final authorization is approved.`
      );
      this.router.navigate(['/risk-assessment', ra.id]);
      return;
    }

    // 1. Vessel
    if (ra.vesselId) {
      const match = this.state.vessels().find(v => v.id === ra.vesselId || v.name === ra.vesselName);
      if (match) {
        this.selectedVesselId.set(match.id);
      }
    }

    // 2. Derive Permit Type
    let targetType = 'Hot Work';
    const explicitPtwStep = ra.steps.find(s => s.ptwRequired && s.ptwType);
    if (explicitPtwStep?.ptwType) {
      targetType = explicitPtwStep.ptwType;
    } else {
      const act = ra.activityTitle.toLowerCase();
      if (act.includes('confined') || act.includes('tank') || act.includes('enclosed')) {
        targetType = 'Confined Space Entry';
      } else if (act.includes('weld') || act.includes('hot') || act.includes('cut') || act.includes('burn')) {
        targetType = 'Hot Work';
      } else if (act.includes('aloft') || act.includes('mast') || act.includes('height')) {
        targetType = 'Working Aloft';
      } else if (act.includes('overboard') || act.includes('outboard')) {
        targetType = 'Working Overboard';
      } else if (act.includes('electr') || act.includes('switchboard') || act.includes('voltage')) {
        targetType = 'Electrical Work';
      } else if (act.includes('diving') || act.includes('underwater')) {
        targetType = 'Diving Operation';
      } else if (act.includes('cold') || act.includes('pipe') || act.includes('pump')) {
        targetType = 'Cold Work';
      }
    }
    this.onPermitTypeChange(targetType);

    // 3. Department, location, activity
    this.formData.areaFieldLocation = ra.department || this.formData.areaFieldLocation;
    this.formData.locationOfWork = ra.location || this.formData.locationOfWork;
    this.formData.location = ra.location || this.formData.location;
    this.formData.workDescription = ra.activityTitle;

    // 4. Responsible Person
    this.formData.performingAuthority = ra.leadAssessor;
    this.formData.responsibleSupervisor = ra.leadAssessor;

    // 5. Assessment Team
    if (ra.assessmentTeam && ra.assessmentTeam.length > 0) {
      this.formData.personnelCarryingOutWork = ra.assessmentTeam.map(m => ({
        name: m.name,
        rank: m.rank,
        briefed: true
      }));
    } else if (ra.teamMembers && ra.teamMembers.length > 0) {
      this.formData.personnelCarryingOutWork = ra.teamMembers.map(name => ({
        name,
        rank: 'Work Crew',
        briefed: true
      }));
    }

    // 6. Hazards
    const gatheredHazards = ra.steps
      .map(s => s.hazards)
      .filter(Boolean)
      .join('; ');
    if (gatheredHazards) {
      this.formData.hazards = gatheredHazards;
    }

    // 7. Existing Controls & Additional Controls
    const controls: string[] = [];
    ra.steps.forEach(s => {
      if (s.existingControls) controls.push(`• Existing: ${s.existingControls}`);
      if (s.additionalControls) controls.push(`• Additional: ${s.additionalControls}`);
    });
    if (controls.length > 0) {
      this.formData.controlMeasures = controls.join('\n');
    }

    // 8. RA Reference Number
    this.formData.linkedRaNumber = ra.referenceNo;
    this.formData.linkedJsa = `${ra.referenceNo}: ${ra.activityTitle}`;

    this.notify.showSuccess(
      'Risk Assessment Prefill Applied',
      `Data successfully transferred from ${ra.referenceNo} into PTW.`
    );
    this.cdr.markForCheck();
  }
}
