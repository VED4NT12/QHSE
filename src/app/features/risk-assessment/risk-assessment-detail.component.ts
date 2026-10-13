import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { RiskAssessmentRecord, MarineRiskFactor } from '../../core/models/hseq.models';

@Component({
  selector: 'app-risk-assessment-detail',
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
    ModalComponent
  ],
  template: `
    <div class="module-container" *ngIf="ra">
      <app-page-header
        [title]="ra.referenceNo + ' - ' + ra.activityTitle"
        [subtitle]="ra.vesselName + ' • ' + ra.department + (ra.location ? ' • ' + ra.location : '')"
        icon="rule"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Risk Assessments', link: '/risk-assessment'},
          {label: ra.referenceNo}
        ]">
        <div badge>
          <app-status-badge [status]="ra.status"></app-status-badge>
        </div>

        <div actions class="d-flex align-items-center gap-2 flex-wrap">
          <button mat-stroked-button routerLink="/risk-assessment" class="btn-cancel">
            <mat-icon>arrow_back</mat-icon> Back to Register
          </button>

          <button mat-stroked-button (click)="simulatePrint()" class="btn-export">
            <mat-icon>print</mat-icon> Printable JSA
          </button>

          <!-- Edit RA: Always available to assessors/supervisors -->
          <button mat-stroked-button [routerLink]="['/risk-assessment/edit', ra.id]" class="btn-edit">
            <mat-icon>edit</mat-icon> Edit RA
          </button>

          <!-- Under Review: Approver Action Pair (Approve + Reject) -->
          @if (ra.status === 'Under Review') {
            <button 
              mat-stroked-button 
              color="warn" 
              class="btn-reject-header" 
              (click)="openRejectModal()">
              <mat-icon>cancel</mat-icon> Reject
            </button>

            <button 
              mat-flat-button 
              color="accent" 
              class="btn-approve" 
              (click)="approveAssessment()">
              <mat-icon>verified</mat-icon> Approve ({{ ra.requiredApproverRole || 'Approver' }})
            </button>
          }

          <!-- Draft Status: Submit for Review -->
          @if (ra.status === 'Draft') {
            <button 
              mat-flat-button 
              color="primary" 
              class="btn-primary-action" 
              (click)="submitDraftForReview()">
              <mat-icon>send</mat-icon> Submit for Review
            </button>
          }

          <!-- Rejected Status: Resubmit for Review -->
          @if (ra.status === 'Rejected') {
            <button 
              mat-flat-button 
              color="primary" 
              class="btn-primary-action" 
              (click)="openResubmitModal()">
              <mat-icon>send</mat-icon> Resubmit for Review
            </button>
          }

          <!-- TARGET PTW WORKFLOW: Create PTW From Risk Assessment (Active ONLY when Approved) -->
          @if (ra.status === 'Approved') {
            <button 
              mat-flat-button 
              color="primary" 
              class="btn-create-ptw" 
              (click)="createPtwFromRa()">
              <mat-icon>vpn_key</mat-icon> Create PTW From Risk Assessment
            </button>
          }
        </div>
      </app-page-header>

      <!-- 1. APPROVED WORKFLOW BANNER -->
      @if (ra.status === 'Approved') {
        <div class="workflow-banner banner-approved">
          <mat-icon class="banner-icon text-green">verified</mat-icon>
          <div class="banner-body">
            <span class="banner-heading text-green">Risk Assessment Approved & Safety Interlock Satisfied</span>
            <span class="banner-text">
              This Risk Assessment has been formally approved by <strong>{{ ra.approver }}</strong> ({{ ra.approverRank || ra.requiredApproverRole || 'Master / Approver' }}).
              Permit to Work (PTW) generation is unlocked. Click below to generate the Permit with all hazards and control measures prefilled.
            </span>
          </div>
          <button mat-flat-button color="primary" class="btn-banner-action" (click)="createPtwFromRa()">
            <mat-icon>vpn_key</mat-icon> Create PTW Now
          </button>
        </div>
      }

      <!-- 2. REJECTED WORKFLOW BANNER -->
      @if (ra.status === 'Rejected') {
        <div class="workflow-banner banner-rejected">
          <mat-icon class="banner-icon text-red">gpp_bad</mat-icon>
          <div class="banner-body">
            <span class="banner-heading text-red">Risk Assessment Rejected by {{ ra.rejectedBy || 'Reviewer' }}</span>
            <span class="banner-text">
              <strong>Mandatory Correction Reason:</strong> {{ ra.rejectionReason || 'Deficiencies identified by reviewing authority. Modifications required before approval.' }}
              @if (ra.rejectedAt) {
                <span class="text-xs text-muted d-block mt-1">Logged on {{ ra.rejectedAt | date:'medium' }}</span>
              }
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button mat-stroked-button color="primary" [routerLink]="['/risk-assessment/edit', ra.id]">
              <mat-icon>edit</mat-icon> Edit & Revise
            </button>
            <button mat-flat-button color="primary" (click)="openResubmitModal()">
              <mat-icon>send</mat-icon> Resubmit for Review
            </button>
          </div>
        </div>
      }

      <!-- 3. UNDER REVIEW WORKFLOW BANNER -->
      @if (ra.status === 'Under Review') {
        <div class="workflow-banner banner-pending">
          <mat-icon class="banner-icon text-amber">hourglass_top</mat-icon>
          <div class="banner-body">
            <span class="banner-heading text-amber">Review & Authorization Pending: {{ ra.requiredApproverRole || 'Designated Approver' }}</span>
            <span class="banner-text">
              Assigned for review per company approval matrix.
              @if (ra.escalationRequired) {
                <strong class="text-red"> [Shore Escalation Required: {{ ra.escalationRole || 'HSEQ Manager' }}]</strong>
              }
              PTW cannot be generated until authorization is finalized.
            </span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button mat-stroked-button class="btn-reject-banner" (click)="openRejectModal()">
              <mat-icon>cancel</mat-icon> Reject
            </button>
            <button mat-flat-button class="btn-approve-banner" (click)="approveAssessment()">
              <mat-icon>verified</mat-icon> Approve Now
            </button>
          </div>
        </div>
      }

      <!-- 4. DRAFT WORKFLOW BANNER -->
      @if (ra.status === 'Draft') {
        <div class="workflow-banner banner-draft">
          <mat-icon class="banner-icon text-muted">edit_note</mat-icon>
          <div class="banner-body">
            <span class="banner-heading">Draft Risk Assessment</span>
            <span class="banner-text">
              This risk assessment is in draft status. Verify all operational steps and hierarchy of controls before submitting to <strong>{{ ra.requiredApproverRole || 'Approver' }}</strong>.
            </span>
          </div>
          <button mat-flat-button color="primary" (click)="submitDraftForReview()">
            <mat-icon>send</mat-icon> Submit for Approval
          </button>
        </div>
      }

      <!-- Key Metadata Row (Client Form Header 07F-001-01) -->
      <div class="hseq-card ra-meta-grid mb-3">
        <div class="meta-item">
          <span class="meta-lbl">Assessment Methodology</span>
          <span class="meta-val text-primary font-bold">{{ ra.formReference || 'Marine 5×5 Risk Matrix' }}</span>
        </div>

        <div class="meta-item">
          <span class="meta-lbl">Charterer / Field</span>
          <span class="meta-val">{{ ra.charterer || 'ADNOC L&S / MOMs' }}</span>
        </div>

        <div class="meta-item">
          <span class="meta-lbl">Assessment & Review Window</span>
          <span class="meta-val">{{ ra.assessmentDate }} to {{ ra.validityExpiryDate }}</span>
        </div>

        <div class="meta-item">
          <span class="meta-lbl">Last Similar Task</span>
          <span class="meta-val font-mono">{{ ra.similarTaskReference || 'None Logged' }} {{ ra.lastAssessmentDate ? '(' + ra.lastAssessmentDate + ')' : '' }}</span>
        </div>

        <div class="meta-item">
          <span class="meta-lbl">Lead Assessor & Approver</span>
          <span class="meta-val">{{ ra.leadAssessor }} &bull; {{ ra.approver }}</span>
        </div>

        <div class="meta-item">
          <span class="meta-lbl">Risk Mitigation Status</span>
          <div class="d-flex align-items-center gap-1 mt-1">
            <span class="risk-badge" [ngClass]="getRiskFactorBadgeClass(ra.maxInitialRisk)">Initial: {{ ra.maxInitialRisk }}</span>
            <mat-icon class="arrow-tiny">arrow_forward</mat-icon>
            <span class="risk-badge" [ngClass]="getRiskFactorBadgeClass(ra.maxResidualRisk)">Residual: {{ ra.maxResidualRisk }}</span>
          </div>
        </div>
      </div>

      <!-- Personnel Involved & Briefing Roster (Client Form Table) -->
      <div class="hseq-card mb-3">
        <div class="hseq-card-header">
          <div class="title-wrap">
            <mat-icon class="card-icon text-blue">groups</mat-icon>
            <div>
              <h3 class="card-heading">Assessment Team & Pre-Job Briefing Confirmation</h3>
              <span class="card-subheading">Personnel involved in Risk Assessment and briefed prior to commencement of work</span>
            </div>
          </div>
          <span class="team-count-badge">{{ ra.assessmentTeam ? ra.assessmentTeam.length : ra.teamMembers.length }} Members Briefed</span>
        </div>

        <div class="table-responsive">
          <table class="hseq-table table-compact">
            <thead>
              <tr>
                <th>Personnel Name</th>
                <th>Rank / Operational Role</th>
                <th>Safety Briefing Verified</th>
                <th>Electronic Signature / Sign-Off</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngIf="ra.assessmentTeam && ra.assessmentTeam.length > 0; else fallbackTeam">
                <tr *ngFor="let member of ra.assessmentTeam">
                  <td><strong>{{ member.name }}</strong></td>
                  <td><span class="rank-pill">{{ member.rank }}</span></td>
                  <td>
                    <span class="briefed-pill">
                      <mat-icon class="check-tiny">check_circle</mat-icon> Briefed before job commencement
                    </span>
                  </td>
                  <td class="font-mono text-xs text-muted">{{ member.signature || 'Acknowledged Digitally' }}</td>
                </tr>
              </ng-container>
              <ng-template #fallbackTeam>
                <tr *ngFor="let member of ra.teamMembers">
                  <td><strong>{{ member }}</strong></td>
                  <td><span class="rank-pill">Work Party Member</span></td>
                  <td>
                    <span class="briefed-pill">
                      <mat-icon class="check-tiny">check_circle</mat-icon> Briefed before job commencement
                    </span>
                  </td>
                  <td class="font-mono text-xs text-muted">Acknowledged Digitally</td>
                </tr>
              </ng-template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 1 & Section 2: Step-by-Step Hazard Breakdown -->
      <div class="hseq-card mb-3">
        <div class="hseq-card-header">
          <div class="title-wrap">
            <mat-icon class="card-icon text-blue">table_chart</mat-icon>
            <div>
              <h3 class="card-heading">Hazard Identification & Control Measures Breakdown</h3>
              <span class="card-subheading">Section 1 (Hazard Analysis & Initial Risk) & Section 2 (Additional Controls & Residual Risk)</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button mat-stroked-button class="btn-sm" (click)="toggleMatrixLegend()">
              <mat-icon>grid_on</mat-icon> {{ showMatrixLegend ? 'Hide 5x5 Matrix' : 'Show 5x5 Matrix' }}
            </button>
            <span class="status-badge badge-success">ALARP Achieved</span>
          </div>
        </div>

        <!-- Collapsible Marine 5x5 Matrix Poster / Guide -->
        <div *ngIf="showMatrixLegend" class="matrix-poster-box mb-3">
          <div class="poster-title-row">
            <span class="font-bold text-sm">Marine 5×5 Risk Matrix Standard</span>
            <span class="text-xs text-muted">Likelihood of harm (Letters A–E) &times; Severity of Harm (Roman Numerals I–V)</span>
          </div>

          <div class="matrix-grid-table-wrap">
            <table class="matrix-grid-table">
              <thead>
                <tr>
                  <th rowspan="2" class="th-corner">Likelihood \\ Severity</th>
                  <th>I</th>
                  <th>II</th>
                  <th>III</th>
                  <th>IV</th>
                  <th>V</th>
                </tr>
                <tr class="sub-th-row">
                  <th>Fatality / Total Loss</th>
                  <th>Disability / Layup</th>
                  <th>LTI / Seaworthiness</th>
                  <th>MTC / Minor Spill</th>
                  <th>First Aid / NLTI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="td-row-head"><strong>A</strong> - Repeated (&ge;1/month)</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-mod">MODERATE</td>
                </tr>
                <tr>
                  <td class="td-row-head"><strong>B</strong> - Isolated (&ge;1/quarter)</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-mod">MODERATE</td>
                </tr>
                <tr>
                  <td class="td-row-head"><strong>C</strong> - Sometime (&ge;1/year)</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-low">LOW</td>
                </tr>
                <tr>
                  <td class="td-row-head"><strong>D</strong> - Not likely (&lt;1 in 5 yrs)</td>
                  <td class="cell-high">HIGH</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-low">LOW</td>
                  <td class="cell-low">LOW</td>
                </tr>
                <tr>
                  <td class="td-row-head"><strong>E</strong> - Very Remote (&lt;1 in 10 yrs)</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-mod">MODERATE</td>
                  <td class="cell-low">LOW</td>
                  <td class="cell-low">LOW</td>
                  <td class="cell-low">LOW</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="table-responsive">
          <table class="hseq-table table-hazard-steps">
            <thead>
              <tr>
                <th class="th-step">Step</th>
                <th class="th-hazards">Job Sequence & Hazards</th>
                <th class="th-risk">Initial Risk (Section 1)</th>
                <th class="th-controls">Established Controls & PTW Interlock</th>
                <th class="th-additional">Additional Controls (Section 2)</th>
                <th class="th-risk">Residual Risk</th>
                <th class="th-alarp">ALARP</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let step of ra.steps">
                <td class="font-bold text-center">{{ step.stepNumber }}</td>
                <td>
                  <strong class="text-sm block">{{ step.stepDescription }}</strong>
                  <span *ngIf="step.hazardCategory" class="cat-pill mt-1">{{ step.hazardCategory }}</span>
                  <div class="hazard-desc block mt-1">
                    <strong>Identified Hazards:</strong> {{ step.hazards }}
                  </div>
                  <span *ngIf="step.affectedEntities" class="text-xs text-muted block mt-1">
                    Affects: {{ step.affectedEntities }}
                  </span>
                </td>
                <td>
                  <div class="matrix-calc-badge" [ngClass]="getRiskFactorBadgeClass(step.riskFactor || 'Moderate')">
                    <span class="calc-formula">
                      {{ step.likelihoodLetter || 'C' }} &times; {{ step.severityLevel || 'III' }}
                    </span>
                    <span class="rating-name">{{ step.riskFactor || 'Moderate' }}</span>
                  </div>
                </td>
                <td>
                  <div class="controls-box">
                    <span class="hierarchy-pill">{{ step.hierarchy }} Control</span>
                    <div class="control-text mt-1">
                      {{ step.existingControls }}
                    </div>
                    <div *ngIf="step.documentReference" class="doc-ref-text mt-1">
                      <mat-icon class="icon-inline">description</mat-icon>
                      <span>{{ step.documentReference }}</span>
                    </div>
                    <div *ngIf="step.ptwRequired" class="ptw-tag mt-1">
                      <mat-icon class="icon-inline">vpn_key</mat-icon>
                      <span>PTW Required: <strong>{{ step.ptwType || 'Mandatory PTW' }}</strong></span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="controls-box">
                    <div class="control-text font-semibold text-primary">
                      {{ step.additionalControls }}
                    </div>
                    <div *ngIf="step.remedialAction" class="remedial-box mt-1">
                      <span class="remedial-lbl">Remedial Action:</span>
                      <span>{{ step.remedialAction }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="matrix-calc-badge badge-low">
                    <span class="calc-formula">
                      {{ step.residualLikelihoodLetter || 'E' }} &times; {{ step.residualSeverityLevel || 'IV' }}
                    </span>
                    <span class="rating-name">{{ step.residualRiskFactor || 'Low' }}</span>
                  </div>
                </td>
                <td class="text-center">
                  <span class="alarp-flag">
                    <mat-icon class="check-sm">check_circle</mat-icon> ALARP
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Linked Documents & PTW Interlock Cards -->
      <div class="grid-2col mb-4">
        <div class="hseq-card p-3">
          <div class="d-flex align-items-center gap-2 mb-2">
            <mat-icon class="text-primary">menu_book</mat-icon>
            <h4 class="font-bold m-0">Linked Fleet Operating Procedures (SMS / DMS)</h4>
          </div>
          <p class="text-xs text-muted mb-2">Maritime procedures and standing orders linked to this assessment</p>
          <div *ngFor="let proc of ra.linkedProcedures" class="doc-link-pill">
            <mat-icon class="doc-icon">description</mat-icon>
            <span>{{ proc }}</span>
          </div>
        </div>

        <div class="hseq-card p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <mat-icon class="text-primary">vpn_key</mat-icon>
              <h4 class="font-bold m-0">Permit to Work (PTW) Interlock</h4>
            </div>
            <span class="ptw-count-badge">{{ ra.linkedPermits.length }} Permits Linked</span>
          </div>
          <p class="text-xs text-muted mb-2">Approved Risk Assessment serves as mandatory pre-requisite for PTW creation</p>

          <ng-container *ngIf="ra.linkedPermits.length > 0; else noPermitsYet">
            <div *ngFor="let p of ra.linkedPermits" class="permit-interlock-pill mb-2">
              <mat-icon class="ptw-icon">vpn_key</mat-icon>
              <div class="permit-pill-body">
                <strong>{{ p }}</strong>
                <span class="block text-xs">Originating Risk Assessment: {{ ra.referenceNo }}</span>
              </div>
              <button mat-button color="primary" [routerLink]="['/permits']">View PTW</button>
            </div>
          </ng-container>

          <ng-template #noPermitsYet>
            <div class="no-ptw-box">
              <mat-icon class="no-ptw-icon">info_outline</mat-icon>
              <div class="no-ptw-text">
                <strong>No Permit Generated Yet</strong>
                <span class="block text-xs">When ready, click "Create PTW From Risk Assessment" to begin operations.</span>
              </div>
              <button 
                *ngIf="ra.status === 'Approved'"
                mat-flat-button 
                color="primary" 
                class="btn-sm" 
                (click)="createPtwFromRa()">
                <mat-icon>add</mat-icon> Create PTW
              </button>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- ==========================================================
           REJECTION REASON MODAL
           ========================================================== -->
      <app-modal
        [isOpen]="isRejectModalOpen"
        title="Reject Risk Assessment"
        subtitle="Specify identified hazards, missing hierarchy controls, or required operational modifications"
        icon="cancel"
        maxWidth="580px"
        (close)="isRejectModalOpen = false">
        <div modal-body *ngIf="ra">
          <div class="modal-form">
            <div class="form-row mb-2">
              <div class="form-col">
                <label class="form-label">Reviewing Authority</label>
                <input type="text" [value]="state.currentUserInfo().name + ' (' + (ra.requiredApproverRole || 'Designated Approver') + ')'" class="custom-input bg-readonly font-bold" readonly />
              </div>
              <div class="form-col" *ngIf="ra.escalationRequired">
                <label class="form-label">Shore Escalation</label>
                <input type="text" [value]="ra.escalationRole || 'HSEQ Manager'" class="custom-input bg-readonly text-red font-bold" readonly />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Reason for Rejection / Required Modifications <span class="required">*</span></label>
              <textarea 
                [(ngModel)]="rejectionReasonInput" 
                rows="4" 
                placeholder="State specific deficiencies (e.g. Inadequate hot work spark containment; safety watch frequency insufficient; gas testing interval must be 2 hours)..." 
                class="custom-textarea"></textarea>
              <span class="field-hint">This rationale is logged into the official audit trail and immediately returned to the assessor.</span>
            </div>
          </div>
        </div>
        <div modal-footer>
          <button mat-stroked-button (click)="isRejectModalOpen = false">Cancel</button>
          <button mat-flat-button color="warn" class="btn-reject-modal" (click)="confirmReject()">
            <mat-icon>cancel</mat-icon> Confirm Rejection
          </button>
        </div>
      </app-modal>

      <!-- ==========================================================
           RESUBMIT / REVISE MODAL
           ========================================================== -->
      <app-modal
        [isOpen]="isResubmitModalOpen"
        title="Resubmit Risk Assessment"
        subtitle="Return corrected assessment to reviewing authority"
        icon="send"
        maxWidth="560px"
        (close)="isResubmitModalOpen = false">
        <div modal-body *ngIf="ra">
          <div class="modal-form">
            <div class="form-group mb-2" *ngIf="ra.rejectionReason">
              <label class="form-label">Previous Rejection Notes</label>
              <div class="prev-reason-box font-mono text-xs">{{ ra.rejectionReason }}</div>
            </div>

            <div class="form-group">
              <label class="form-label">Revision Summary / Corrective Actions Taken</label>
              <textarea 
                [(ngModel)]="resubmissionNotesInput" 
                rows="3" 
                placeholder="Explain what was updated (e.g. Added fire main pressurization verification, added second safety watch)..." 
                class="custom-textarea"></textarea>
            </div>
          </div>
        </div>
        <div modal-footer>
          <button mat-stroked-button (click)="isResubmitModalOpen = false">Cancel</button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="confirmResubmit()">
            <mat-icon>send</mat-icon> Resubmit for Review
          </button>
        </div>
      </app-modal>

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
    .btn-cancel, .btn-export, .btn-edit { 
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px !important;
      font-weight: 600;
      color: var(--foreground);
      border-color: var(--border);
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
    }
    .btn-approve { 
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-size: 12px !important;
      font-weight: 700 !important; 
      background: #d97706 !important; 
      color: #ffffff !important; 
    }
    .btn-create-ptw { 
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-size: 12px !important;
      font-weight: 700 !important; 
    }
    .btn-reject-header {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #dc2626 !important;
      border-color: #fca5a5 !important;
    }
    .btn-reject-modal {
      background: #dc2626 !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
    }
    .prev-reason-box {
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 4px;
      padding: 8px 10px;
      color: #b91c1c;
      line-height: 1.4;
    }
    
    .workflow-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 8px;
      flex-wrap: wrap;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .banner-pending {
      background: #fffbeb !important;
      border: 1px solid #fde68a !important;
      border-left: 5px solid #d97706 !important;
    }
    .banner-pending .banner-icon {
      color: #d97706 !important;
    }
    .banner-pending .banner-heading {
      color: #92400e !important;
      font-size: 14.5px !important;
      font-weight: 800 !important;
    }
    .banner-pending .banner-text {
      color: #78350f !important;
      font-size: 12.5px !important;
      line-height: 1.5 !important;
    }

    .banner-approved {
      background: #f0fdf4 !important;
      border: 1px solid #bbf7d0 !important;
      border-left: 5px solid #16a34a !important;
    }
    .banner-approved .banner-icon {
      color: #16a34a !important;
    }
    .banner-approved .banner-heading {
      color: #14532d !important;
      font-size: 14.5px !important;
      font-weight: 800 !important;
    }
    .banner-approved .banner-text {
      color: #166534 !important;
      font-size: 12.5px !important;
      line-height: 1.5 !important;
    }

    .banner-rejected {
      background: #fef2f2 !important;
      border: 1px solid #fecaca !important;
      border-left: 5px solid #dc2626 !important;
    }
    .banner-rejected .banner-icon {
      color: #dc2626 !important;
    }
    .banner-rejected .banner-heading {
      color: #991b1b !important;
      font-size: 14.5px !important;
      font-weight: 800 !important;
    }
    .banner-rejected .banner-text {
      color: #7f1d1d !important;
      font-size: 12.5px !important;
      line-height: 1.5 !important;
    }

    .banner-draft {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-left: 5px solid #64748b !important;
    }
    .banner-draft .banner-icon {
      color: #64748b !important;
    }
    .banner-draft .banner-heading {
      color: #1e293b !important;
      font-size: 14.5px !important;
      font-weight: 800 !important;
    }
    .banner-draft .banner-text {
      color: #475569 !important;
      font-size: 12.5px !important;
      line-height: 1.5 !important;
    }

    .btn-reject-banner {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      border: 1px solid #f87171 !important;
      color: #dc2626 !important;
      background: #ffffff !important;
    }
    .btn-reject-banner:hover {
      background: #fee2e2 !important;
    }
    .btn-approve-banner {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      background: #d97706 !important;
      color: #ffffff !important;
    }
    .btn-approve-banner:hover {
      background: #b45309 !important;
    }

    .text-amber { color: #d97706 !important; }
    .text-green { color: #16a34a !important; }
    .text-red { color: #dc2626 !important; }
    .text-blue { color: #2563eb !important; }

    .banner-icon { font-size: 32px; width: 32px; height: 32px; flex-shrink: 0; }
    .banner-body { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 250px; }
    .banner-heading { font-size: 14px; font-weight: 800; }
    .banner-text { font-size: 12px; color: var(--foreground); line-height: 1.45; }
    .btn-banner-action { font-weight: 700 !important; white-space: nowrap; height: 34px !important; border-radius: var(--radius-sm) !important; font-size: 12px !important; }
    .btn-banner-action-stroke { font-weight: 700 !important; white-space: nowrap; border-color: #d97706 !important; color: #b45309 !important; height: 34px !important; border-radius: var(--radius-sm) !important; font-size: 12px !important; }

    .ra-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      padding: 18px 20px;
    }
    .meta-item { display: flex; flex-direction: column; gap: 4px; }
    .meta-lbl { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .meta-val { font-size: 13.5px; font-weight: 700; color: var(--foreground); }
    .arrow-tiny { font-size: 14px; width: 14px; height: 14px; color: var(--muted-foreground); }

    .team-count-badge, .ptw-count-badge {
      font-size: 11px;
      font-weight: 700;
      background: var(--muted);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 9999px;
      color: var(--muted-foreground);
    }
    .rank-pill {
      font-size: 11px;
      font-weight: 700;
      background: var(--accent);
      color: var(--primary);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .briefed-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #166534;
      font-weight: 600;
    }
    .check-tiny { font-size: 15px; width: 15px; height: 15px; color: #16a34a; }

    .title-wrap { display: flex; align-items: center; gap: 12px; }
    .card-icon { font-size: 26px; width: 26px; height: 26px; }
    .card-heading { font-size: 15.5px; font-weight: 700; color: var(--foreground); margin: 0; }
    .card-subheading { font-size: 11.5px; color: var(--muted-foreground); }

    .hazard-desc { font-size: 12px; color: #b91c1c; background: #fef2f2; border: 1px solid #fee2e2; padding: 6px 8px; border-radius: 4px; line-height: 1.4; }
    .cat-pill {
      font-size: 10.5px;
      font-weight: 700;
      background: var(--muted);
      border: 1px solid var(--border);
      color: var(--muted-foreground);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .matrix-calc-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
    }
    .calc-formula { font-size: 11px; opacity: 0.85; }
    .rating-name { font-size: 11px; text-transform: uppercase; font-weight: 800; margin-top: 2px; }
    .badge-crit { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-warn { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .badge-low { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

    .risk-badge {
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .controls-box { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
    .hierarchy-pill {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--primary);
      background: var(--accent);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      display: inline-block;
      width: fit-content;
    }
    .control-text { line-height: 1.45; color: var(--foreground); }
    .doc-ref-text {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      color: var(--muted-foreground);
    }
    .ptw-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      color: var(--primary);
      background: var(--accent);
      padding: 3px 6px;
      border-radius: 4px;
      border: 1px solid var(--border);
      width: fit-content;
    }
    .remedial-box {
      font-size: 11px;
      background: var(--muted);
      padding: 4px 6px;
      border-radius: 4px;
      border-left: 3px solid var(--primary);
    }
    .remedial-lbl { font-weight: 700; color: var(--muted-foreground); margin-right: 4px; }
    .icon-inline { font-size: 14px; width: 14px; height: 14px; }

    .alarp-flag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 700;
      color: #166534;
    }
    .check-sm { font-size: 16px; width: 16px; height: 16px; }

    .matrix-poster-box {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px 18px;
      max-width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
    }
    .poster-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .matrix-grid-table-wrap { overflow-x: auto; max-width: 100%; }
    .matrix-grid-table {
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      font-size: 11px;
      text-align: center;
    }
    .matrix-grid-table th, .matrix-grid-table td {
      border: 1px solid var(--border);
      padding: 6px 8px;
    }
    .th-corner { background: #e2e8f0; font-weight: 800; }
    .sub-th-row th { font-size: 10px; font-weight: 600; color: #475569; }
    .td-row-head { text-align: left; background: #f8fafc; font-weight: 600; white-space: nowrap; }
    .cell-high { background: #fee2e2; color: #dc2626; font-weight: 800; }
    .cell-mod { background: #fef3c7; color: #d97706; font-weight: 800; }
    .cell-low { background: #dcfce7; color: #166534; font-weight: 800; }

    /* Responsive Hazard Table (Zero Horizontal Scroll on Desktop) */
    .table-responsive {
      overflow-x: auto;
      max-width: 100%;
      width: 100%;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
    }

    .table-hazard-steps {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }

    .table-hazard-steps th, .table-hazard-steps td {
      word-break: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      vertical-align: top;
      padding: 10px 12px;
    }

    .th-step { width: 50px; text-align: center; }
    .th-hazards { width: 24%; }
    .th-risk { width: 110px; text-align: center; }
    .th-controls { width: 24%; }
    .th-additional { width: 23%; }
    .th-alarp { width: 85px; text-align: center; }

    .hseq-table.table-compact {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    .hseq-table.table-compact th, .hseq-table.table-compact td {
      word-break: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      vertical-align: middle;
      padding: 8px 12px;
    }
    .hseq-table.table-compact th:nth-child(1), .hseq-table.table-compact td:nth-child(1) { width: 24%; }
    .hseq-table.table-compact th:nth-child(2), .hseq-table.table-compact td:nth-child(2) { width: 24%; }
    .hseq-table.table-compact th:nth-child(3), .hseq-table.table-compact td:nth-child(3) { width: 26%; }
    .hseq-table.table-compact th:nth-child(4), .hseq-table.table-compact td:nth-child(4) { width: 26%; }

    .grid-2col { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .p-3 { padding: 18px; }
    .doc-link-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--foreground);
    }
    .doc-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .permit-interlock-pill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .permit-pill-body { flex: 1; }
    .ptw-icon { color: var(--primary); font-size: 24px; width: 24px; height: 24px; }

    .no-ptw-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: var(--muted);
      border: 1px dashed var(--border);
      border-radius: 6px;
    }
    .no-ptw-icon { color: var(--muted-foreground); font-size: 24px; width: 24px; height: 24px; }
    .no-ptw-text { flex: 1; font-size: 12px; color: var(--muted-foreground); }
    .btn-sm { font-size: 12px !important; height: 32px !important; }
  `]
})
export class RiskAssessmentDetailComponent implements OnInit {
  public state = inject(HseqStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  ra?: RiskAssessmentRecord;
  showMatrixLegend = false;

  // Rejection & Resubmission Workflow States
  isRejectModalOpen = false;
  rejectionReasonInput = '';
  isResubmitModalOpen = false;
  resubmissionNotesInput = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.ra = this.state.getRiskAssessment(id) || this.state.riskAssessments()[0];
    } else {
      this.ra = this.state.riskAssessments()[0];
    }
  }

  toggleMatrixLegend() {
    this.showMatrixLegend = !this.showMatrixLegend;
  }

  openRejectModal() {
    this.rejectionReasonInput = '';
    this.isRejectModalOpen = true;
  }

  confirmReject() {
    if (!this.ra) return;
    if (!this.rejectionReasonInput.trim()) {
      this.notify.showWarning('Reason Required', 'Please provide a clear reason or corrective instructions for the rejection.');
      return;
    }
    const reviewerName = this.state.currentUserInfo().name;
    const reviewerRole = this.ra.requiredApproverRole || 'Designated Approver';
    this.state.rejectRiskAssessment(this.ra.id, this.rejectionReasonInput.trim(), reviewerName, reviewerRole);
    this.ra = this.state.getRiskAssessment(this.ra.id);
    this.isRejectModalOpen = false;
    this.notify.showSuccess('Risk Assessment Rejected', `Assessment ${this.ra?.referenceNo} returned to assessor with mandatory revision notes.`);
    this.cdr.markForCheck();
  }

  openResubmitModal() {
    this.resubmissionNotesInput = '';
    this.isResubmitModalOpen = true;
  }

  confirmResubmit() {
    if (!this.ra) return;
    const userName = this.state.currentUserInfo().name;
    this.state.resubmitRiskAssessment(this.ra.id, userName, this.resubmissionNotesInput.trim());
    this.ra = this.state.getRiskAssessment(this.ra.id);
    this.isResubmitModalOpen = false;
    this.notify.showSuccess('Risk Assessment Resubmitted', `Assessment ${this.ra?.referenceNo} routed to ${this.ra?.requiredApproverRole || 'Approver'} for review.`);
    this.cdr.markForCheck();
  }

  submitDraftForReview() {
    if (!this.ra) return;
    const userName = this.state.currentUserInfo().name;
    this.state.resubmitRiskAssessment(this.ra.id, userName, 'Initial submission for review');
    this.ra = this.state.getRiskAssessment(this.ra.id);
    this.notify.showSuccess('Submitted for Review', `Assessment ${this.ra?.referenceNo} queued for ${this.ra?.requiredApproverRole || 'Approver'} sign-off.`);
    this.cdr.markForCheck();
  }

  approveAssessment() {
    if (!this.ra) return;
    const approverName = this.state.currentUserInfo().name;
    const role = this.ra.requiredApproverRole || 'Designated Approver';
    this.state.approveRiskAssessment(this.ra.id, approverName, role);
    
    // Refresh local record
    this.ra = this.state.getRiskAssessment(this.ra.id);
    this.notify.showSuccess(
      'Risk Assessment Formally Approved',
      `${role} authorization recorded for ${this.ra?.referenceNo}. PTW creation is unlocked!`
    );
    this.cdr.markForCheck();
  }

  createPtwFromRa() {
    if (!this.ra) return;
    if (this.ra.status !== 'Approved') {
      this.notify.showWarning(
        'Approval Required',
        'This Risk Assessment must be approved before a Permit To Work can be created.'
      );
      return;
    }

    // TARGET WORKFLOW: Navigate to PTW creation with originating RA reference
    this.router.navigate(['/permits/create'], {
      queryParams: { fromRa: this.ra.referenceNo }
    });
  }

  simulatePrint() {
    this.notify.showInfo(
      'Official Report Exported',
      `Risk Assessment Report exported to PDF with electronic audit hash.`
    );
  }

  getRiskFactorBadgeClass(factor: MarineRiskFactor | string | undefined): string {
    if (factor === 'High') return 'badge-crit';
    if (factor === 'Moderate' || factor === 'Medium') return 'badge-warn';
    return 'badge-low';
  }
}
