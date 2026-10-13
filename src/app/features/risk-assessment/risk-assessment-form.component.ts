import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService, calculateMarineRiskFactor } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  RiskAssessmentRecord, RiskAssessmentStep, RiskAssessmentTeamMember,
  LikelihoodLetter, SeverityLevel, MarineRiskFactor, RiskApprovalRule
} from '../../core/models/hseq.models';

@Component({
  selector: 'app-risk-assessment-form',
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
        [title]="isEditMode ? 'Edit Risk Assessment / JSA' : 'Create Risk Assessment (HIRA / JSA)'"
        [subtitle]="isEditMode ? 'Modify operational hazard identification, 5x5 marine matrix ratings, and control measures' : 'Formal safety risk assessment layer preceding Permit to Work'"
        icon="rule"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Risk Assessments', link: '/risk-assessment'},
          {label: isEditMode ? 'Edit RA' : 'New Risk Assessment'}
        ]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button routerLink="/risk-assessment" class="btn-cancel">
            <mat-icon>arrow_back</mat-icon> Cancel
          </button>
          <button mat-stroked-button color="primary" class="btn-draft" (click)="saveAssessment('Draft')">
            <mat-icon>save</mat-icon> Save as Draft
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveAssessment('Under Review')">
            <mat-icon>send</mat-icon> {{ formData.status === 'Rejected' ? 'Resubmit for Approval' : 'Submit for Approval' }}
          </button>
        </div>
      </app-page-header>

      <!-- Rejection Alert Banner (When revising a rejected RA) -->
      @if (isEditMode && formData.status === 'Rejected') {
        <div class="rejection-alert-banner">
          <mat-icon class="alert-icon text-red">gpp_bad</mat-icon>
          <div class="alert-body">
            <span class="alert-heading text-red">Revision Required: Assessment Previously Rejected</span>
            <span class="alert-desc">
              <strong>Reviewer Reason:</strong> {{ formData.rejectionReason || 'Modifications required by reviewing officer.' }}
              @if (formData.rejectedBy) {
                <span class="text-xs text-muted d-block mt-0-5">Returned by {{ formData.rejectedBy }} on {{ formData.rejectedAt | date:'medium' }}</span>
              }
            </span>
          </div>
        </div>
      }

      <!-- Assessment Compliance Notice Banner -->
      <div class="form-banner">
        <mat-icon class="banner-icon text-primary">verified_user</mat-icon>
        <div class="banner-text">
          <span class="banner-title">Marine Risk Assessment Governance</span>
          <span class="banner-desc">
            Aligned with standard Marine 5×5 Matrix (Likelihood A–E × Severity I–V) and Simplified Job Safety Analysis protocols.
            Once approved by the designated authority, an integrated <strong>Permit To Work (PTW)</strong> can be generated with all hazards and controls prefilled.
          </span>
        </div>
      </div>

      <div class="form-layout">
        <!-- Main Form Column -->
        <div class="main-form-col">
          
          <!-- 1. General Assessment Information (Universal Header) -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge">1</div>
              <div class="section-title-wrap">
                <h3 class="section-title">Assessment Identity & Vessel Context</h3>
                <p class="section-sub">Assessment reference, asset selection, operational activity, and review window</p>
              </div>
            </div>

            <div class="form-grid-3 mb-3">
              <div class="form-group">
                <label class="form-label">Assessment Record No. <span class="required">*</span></label>
                <input type="text" [value]="referenceNo()" class="custom-input bg-readonly font-mono font-bold" readonly />
                <span class="field-hint">Auto-generated client sequence standard</span>
              </div>

              <div class="form-group">
                <label class="form-label">Assessment Methodology <span class="required">*</span></label>
                <select [(ngModel)]="formData.formReference" class="custom-select">
                  <option value="Marine 5x5 Risk Matrix">Risk Assessment (Marine 5×5 Matrix)</option>
                  <option value="Simplified JSA">Simplified Job Safety Analysis (JSA)</option>
                </select>
                <span class="field-hint">Marine safety methodology standard</span>
              </div>

              <div class="form-group">
                <label class="form-label">Assessment Type <span class="required">*</span></label>
                <select [(ngModel)]="formData.assessmentType" class="custom-select">
                  <option *ngFor="let t of state.assessmentTypes()" [value]="t">{{ t }}</option>
                </select>
                <span class="field-hint">Master Data category configured</span>
              </div>
            </div>

            <div class="form-grid-3 mb-3">
              <div class="form-group">
                <label class="form-label">Vessel Asset <span class="required">*</span></label>
                <select [(ngModel)]="formData.vesselId" (change)="onVesselChange()" class="custom-select">
                  <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Responsible Department <span class="required">*</span></label>
                <select [(ngModel)]="formData.department" class="custom-select">
                  <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Location / Work Area <span class="required">*</span></label>
                <select [(ngModel)]="formData.location" class="custom-select">
                  <option value="">-- Select Location / Work Area --</option>
                  @for (p of state.ports(); track p.id) {
                    <option [value]="p.name">{{ p.name }} ({{ p.country }})</option>
                  }
                  <option value="Deck Station 1">Deck Station 1</option>
                  <option value="Engine Room Lower Platform">Engine Room Lower Platform</option>
                  <option value="Main Deck Portside">Main Deck Portside</option>
                  <option value="Workshop Intermediate Level">Workshop Intermediate Level</option>
                  <option value="Confined Space - Tank 3P">Confined Space - Tank 3P</option>
                  <option value="Navigation Bridge">Navigation Bridge</option>
                </select>
              </div>
            </div>

            <div class="form-grid-3 mb-3">
              <div class="form-group">
                <label class="form-label">Charterer / Client <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.charterer" placeholder="e.g. Saudi Aramco MOMs, ADNOC L&S" class="custom-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Date & Time of Assessment <span class="required">*</span></label>
                <div class="d-flex gap-2">
                  <input type="date" [(ngModel)]="formData.assessmentDate" class="custom-input" style="flex: 2;" />
                  <input type="time" [(ngModel)]="formData.assessmentTime" class="custom-input" style="flex: 1;" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Validity Expiry Date <span class="required">*</span></label>
                <input type="date" [(ngModel)]="formData.validityExpiryDate" class="custom-input" />
              </div>
            </div>

            <div class="form-grid-2 mb-3">
              <div class="form-group">
                <label class="form-label">Work Activity Being Assessed <span class="required">*</span></label>
                <textarea 
                  [(ngModel)]="formData.activityTitle" 
                  rows="2" 
                  placeholder="Detail the complete operational task (e.g. MIG welding and structural bracket reinforcement on hatch cover lashing bin support frame)" 
                  class="custom-textarea"></textarea>
                <span class="field-hint">This activity description automatically populates the PTW work scope</span>
              </div>

              <div class="form-group">
                <label class="form-label">Last Assessment on Similar Task</label>
                <div class="form-grid-2" style="gap: 8px; margin-bottom: 4px;">
                  <input type="date" [(ngModel)]="formData.lastAssessmentDate" class="custom-input" aria-label="Previous Assessment Date" />
                  <input type="text" [(ngModel)]="formData.similarTaskReference" placeholder="Ref No (e.g. RA-2026-0012)" class="custom-input" aria-label="Previous Reference Number" />
                </div>
                <span class="field-hint">Traceability cross-reference to previous similar operations</span>
              </div>
            </div>
          </div>

          <!-- 2. Personnel Involved & Briefing (Client Form Table) -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge">2</div>
              <div class="section-title-wrap">
                <h3 class="section-title">Assessment Team & Pre-Job Briefing Confirmation</h3>
                <p class="section-sub">Personnel involved in Risk Assessment and safety briefing prior to job commencement</p>
              </div>
              <button type="button" mat-stroked-button color="primary" class="btn-sm" (click)="addTeamMember()">
                <mat-icon>person_add</mat-icon> Add Team Member
              </button>
            </div>

            <div class="table-responsive">
              <table class="hseq-table table-compact">
                <thead>
                  <tr>
                    <th style="width: 30%;">Name</th>
                    <th style="width: 25%;">Rank / Role</th>
                    <th style="width: 25%;">Briefing Given & Verified</th>
                    <th style="width: 15%;">Signature / Ack</th>
                    <th style="width: 5%;" class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let member of formData.assessmentTeam; let i = index">
                    <td>
                      <select 
                        [(ngModel)]="member.name" 
                        (ngModelChange)="onRaCrewSelected(member)"
                        class="custom-select custom-select-sm">
                        <option value="">-- Select Member --</option>
                        @for (u of state.users(); track u.id) {
                          <option [value]="u.fullName">{{ u.fullName }} ({{ u.roles.join(', ') }} · {{ u.assignedVessels.join(', ') }})</option>
                        }
                        @for (c of state.crewMembers(); track c.id) {
                          <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
                        }
                      </select>
                    </td>
                    <td>
                      <input type="text" [(ngModel)]="member.rank" placeholder="e.g. Chief Officer, Bosun, Fitter" class="custom-input input-sm" />
                    </td>
                    <td>
                      <label class="checkbox-label">
                        <input type="checkbox" [(ngModel)]="member.briefed" />
                        <span class="text-xs">Briefed before commencement</span>
                      </label>
                    </td>
                    <td>
                      <input type="text" [(ngModel)]="member.signature" placeholder="Electronic Ack" class="custom-input input-sm font-mono text-xs" />
                    </td>
                    <td class="text-center">
                      <button 
                        type="button" 
                        class="btn-icon-del" 
                        [disabled]="formData.assessmentTeam.length <= 1"
                        (click)="removeTeamMember(i)" 
                        matTooltip="Remove member">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="form-section-divider">
              <span class="divider-label">Designated Statutory Authorities (Master Data Sourced)</span>
            </div>
            <div class="form-grid-4">
              <div class="form-group">
                <label class="form-label">Lead Assessor Name <span class="required">*</span></label>
                <select [(ngModel)]="formData.leadAssessor" (ngModelChange)="onLeadAssessorChange()" class="custom-select font-bold">
                  <option value="">-- Select Lead Assessor --</option>
                  @for (u of state.getLeadAssessors(); track u.id) {
                    <option [value]="u.fullName">{{ u.fullName }} ({{ u.roles.join(', ') }} · {{ u.assignedVessels.join(', ') }})</option>
                  }
                  @for (c of state.crewMembers(); track c.id) {
                    <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
                  }
                </select>
                <span class="field-hint">Master Data User / Crew</span>
              </div>
              <div class="form-group">
                <label class="form-label">Assessor Rank <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.leadAssessorRank" placeholder="Rank (e.g. Chief Officer)" class="custom-input" />
              </div>
              <div class="form-group">
                <label class="form-label">Designated Approver <span class="required">*</span></label>
                <select [(ngModel)]="formData.approver" (ngModelChange)="onApproverChange()" class="custom-select font-bold">
                  <option value="">-- Select Designated Approver --</option>
                  @for (u of state.getApprovers(); track u.id) {
                    <option [value]="u.fullName">{{ u.fullName }} ({{ u.roles.join(', ') }} · {{ u.assignedVessels.join(', ') }})</option>
                  }
                  @for (c of state.crewMembers(); track c.id) {
                    <option [value]="c.name">{{ c.name }} ({{ c.rank }} · {{ c.vesselName }})</option>
                  }
                </select>
                <span class="field-hint">Master Data User / Crew</span>
              </div>
              <div class="form-group">
                <label class="form-label">Approver Rank <span class="required">*</span></label>
                <input type="text" [(ngModel)]="formData.approverRank" placeholder="Rank (e.g. Master)" class="custom-input" />
              </div>
            </div>
          </div>

          <!-- 3. Section 1 & Section 2: Step-by-Step Hazard Breakdown & 5x5 Matrix -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge">3</div>
              <div class="section-title-wrap">
                <h3 class="section-title">Hazard Analysis & Control Measures Breakdown</h3>
                <p class="section-sub">Section 1 (Initial Risk Factor) & Section 2 (Additional Controls & Residual Risk Factor)</p>
              </div>
              <button type="button" mat-flat-button color="primary" class="btn-sm" (click)="addStep()">
                <mat-icon>add</mat-icon> Add Work Step
              </button>
            </div>

            <!-- Steps Accordion / Card List -->
            <div class="steps-container">
              <div *ngFor="let step of formData.steps; let idx = index" class="step-card mb-3">
                <div class="step-card-header">
                  <div class="d-flex align-items-center gap-2">
                    <span class="step-num-pill">Step {{ step.stepNumber }}</span>
                    <strong class="step-header-title">{{ step.stepDescription || 'Untitled Step' }}</strong>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="risk-badge" [ngClass]="getRiskFactorBadgeClass(step.riskFactor || 'Moderate')">
                      Initial: {{ step.riskFactor || 'Moderate' }} ({{ step.likelihoodLetter }}-{{ step.severityLevel }})
                    </span>
                    <mat-icon class="arrow-sep">arrow_forward</mat-icon>
                    <span class="risk-badge" [ngClass]="getRiskFactorBadgeClass(step.residualRiskFactor || 'Low')">
                      Residual: {{ step.residualRiskFactor || 'Low' }} ({{ step.residualLikelihoodLetter }}-{{ step.residualSeverityLevel }})
                    </span>
                    <button 
                      type="button" 
                      class="btn-icon-del" 
                      [disabled]="formData.steps.length <= 1"
                      (click)="removeStep(idx)" 
                      matTooltip="Remove this step">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="step-card-body">
                  <div class="form-grid-3 mb-2">
                    <div class="form-group" style="grid-column: span 2;">
                      <label class="form-label">Sequence of Basic Job Step / Action <span class="required">*</span></label>
                      <input 
                        type="text" 
                        [(ngModel)]="step.stepDescription" 
                        placeholder="e.g. Area preparation, combustible removal & boundary shielding" 
                        class="custom-input" />
                    </div>

                    <div class="form-group">
                      <label class="form-label">Hazard Category</label>
                      <select [(ngModel)]="step.hazardCategory" class="custom-select">
                        <option *ngFor="let cat of state.getMasterList('Hazard Categories')" [value]="cat.name">{{ cat.name }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-grid-2 mb-3">
                    <div class="form-group">
                      <label class="form-label">Potential Accidents or Identified Hazards <span class="required">*</span></label>
                      <textarea 
                        [(ngModel)]="step.hazards" 
                        rows="2" 
                        placeholder="List specific potential accidents, spark travel, toxic fumes, fall risks..." 
                        class="custom-textarea"></textarea>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Affected Personnel / Entities</label>
                      <input 
                        type="text" 
                        [(ngModel)]="step.affectedEntities" 
                        placeholder="e.g. Welder, fire watch, adjacent spaces crew" 
                        class="custom-input" />
                      <span class="field-hint">Who or what can be harmed by this step</span>
                    </div>
                  </div>

                  <!-- Initial Risk Evaluation Box (Section 1) -->
                  <div class="matrix-calc-box mb-3">
                    <div class="matrix-box-header">
                      <span class="font-bold text-xs uppercase text-muted">Section 1: Initial Risk Evaluation (Marine 5×5 Matrix)</span>
                      <span class="matrix-result-pill" [ngClass]="getRiskFactorBadgeClass(step.riskFactor || 'Moderate')">
                        Risk Factor: <strong>{{ step.riskFactor }}</strong>
                      </span>
                    </div>
                    <div class="form-grid-3">
                      <div class="form-group">
                        <label class="form-label">Likelihood <span class="required">*</span></label>
                        <select 
                          [(ngModel)]="step.likelihoodLetter" 
                          (change)="recalcStepRisk(step)" 
                          class="custom-select">
                          <option value="A">A - Repeated events (>= 1 time/month)</option>
                          <option value="B">B - Isolated incidents (>= 1 time/quarter)</option>
                          <option value="C">C - Occurring sometime (>= 1 time/year)</option>
                          <option value="D">D - Not likely to occur (< 1 in 5 years)</option>
                          <option value="E">E - Very Remote (< 1 in 10 years)</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label class="form-label">Severity of Harm <span class="required">*</span></label>
                        <select 
                          [(ngModel)]="step.severityLevel" 
                          (change)="recalcStepRisk(step)" 
                          class="custom-select">
                          <option value="I">I - Fatality / Total Loss / Spill >100L / Blacklist</option>
                          <option value="II">II - Permanent Disability / Layup / Spill <100L</option>
                          <option value="III">III - Serious Injury / LTI / Seaworthiness affected</option>
                          <option value="IV">IV - Medical Treatment / Spill <1m3 / Minor Off-hire</option>
                          <option value="V">V - First Aid / NLTI / Minor Containment spill</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label class="form-label">Hierarchy of Controls</label>
                        <select [(ngModel)]="step.hierarchy" class="custom-select">
                          <option value="Elimination">Elimination</option>
                          <option value="Substitution">Substitution</option>
                          <option value="Engineering">Engineering Controls</option>
                          <option value="Administrative">Administrative Controls</option>
                          <option value="PPE">PPE</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <!-- Existing Controls & PTW Interlock -->
                  <div class="form-grid-2 mb-3">
                    <div class="form-group">
                      <label class="form-label">Existing or Established Control Measures <span class="required">*</span></label>
                      <textarea 
                        [(ngModel)]="step.existingControls" 
                        rows="2" 
                        placeholder="Detail controls already in place to protect personnel..." 
                        class="custom-textarea"></textarea>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Document Reference & PTW to be Issued <span class="required">*</span></label>
                      <input 
                        type="text" 
                        [(ngModel)]="step.documentReference" 
                        placeholder="e.g. PTW-HOT-01, SMS-SOP-011" 
                        class="custom-input" />
                      
                      <!-- Clean PTW Interlock Control Bar -->
                      <div class="ptw-control-bar" [class.ptw-active]="step.ptwRequired">
                        <label class="checkbox-label ptw-toggle-label">
                          <input type="checkbox" [(ngModel)]="step.ptwRequired" />
                          <span class="ptw-label-text">
                            <mat-icon class="ptw-icon">vpn_key</mat-icon>
                            Permit to Work Required
                          </span>
                        </label>
                        @if (step.ptwRequired) {
                          <div class="ptw-dropdown-wrap">
                            <select [(ngModel)]="step.ptwType" class="custom-select ptw-select">
                              <option *ngFor="let pt of state.getMasterList('Permit Types')" [value]="pt.name">{{ pt.name }}</option>
                            </select>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Section 2: Additional Controls & Residual Risk Evaluation -->
                  <div class="matrix-calc-box residual-box">
                    <div class="matrix-box-header">
                      <span class="font-bold text-xs uppercase text-primary">Section 2: Additional Control Measures & Residual Risk</span>
                      <span class="matrix-result-pill" [ngClass]="getRiskFactorBadgeClass(step.residualRiskFactor || 'Low')">
                        Residual Risk: <strong>{{ step.residualRiskFactor }}</strong> (ALARP Verified)
                      </span>
                    </div>

                    <div class="form-grid-2 mb-2">
                      <div class="form-group">
                        <label class="form-label">Further Risk Control Measures to Reduce Risk <span class="required">*</span></label>
                        <textarea 
                          [(ngModel)]="step.additionalControls" 
                          rows="2" 
                          placeholder="State actions taken to mitigate risk level downwards (mandatory if Initial is Medium or High)..." 
                          class="custom-textarea"></textarea>
                      </div>

                      <div class="form-group">
                        <label class="form-label">Remedial Action & Verification Review</label>
                        <textarea 
                          [(ngModel)]="step.remedialAction" 
                          rows="2" 
                          placeholder="e.g. Inspect fire main pressurized to 7.5 bar prior to work start; test VHF channel 14..." 
                          class="custom-textarea"></textarea>
                      </div>
                    </div>

                    <div class="form-grid-3">
                      <div class="form-group">
                        <label class="form-label">Residual Likelihood <span class="required">*</span></label>
                        <select 
                          [(ngModel)]="step.residualLikelihoodLetter" 
                          (change)="recalcStepResidual(step)" 
                          class="custom-select">
                          <option value="A">A - Repeated events (>= 1 time/month)</option>
                          <option value="B">B - Isolated incidents (>= 1 time/quarter)</option>
                          <option value="C">C - Occurring sometime (>= 1 time/year)</option>
                          <option value="D">D - Not likely to occur (< 1 in 5 years)</option>
                          <option value="E">E - Very Remote (< 1 in 10 years)</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label class="form-label">Residual Severity <span class="required">*</span></label>
                        <select 
                          [(ngModel)]="step.residualSeverityLevel" 
                          (change)="recalcStepResidual(step)" 
                          class="custom-select">
                          <option value="I">I - Fatality / Total Loss</option>
                          <option value="II">II - Permanent Disability / Layup</option>
                          <option value="III">III - Serious Injury / LTI</option>
                          <option value="IV">IV - Medical Treatment / Spill <1m3</option>
                          <option value="V">V - First Aid / NLTI / Minimal delay</option>
                        </select>
                      </div>

                      <div class="form-group">
                        <label class="form-label">ALARP Verification</label>
                        <div class="alarp-control-card" [class.alarp-verified]="step.alarpAchieved">
                          <label class="checkbox-label alarp-toggle-label">
                            <input type="checkbox" [(ngModel)]="step.alarpAchieved" />
                            <span class="alarp-text">
                              <mat-icon class="alarp-icon">{{ step.alarpAchieved ? 'verified' : 'check_circle_outline' }}</mat-icon>
                              ALARP Verified
                            </span>
                          </label>
                          @if (step.alarpAchieved) {
                            <span class="alarp-badge">Compliant</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <button type="button" class="btn-table-add-step" (click)="addStep()">
              <mat-icon>add_circle_outline</mat-icon> Add Another Work Step
            </button>
          </div>

          <!-- 4. Review & Approval Section -->
          <div class="hseq-card form-section-card">
            <div class="form-section-header">
              <div class="section-num-badge">4</div>
              <div class="section-title-wrap">
                <h3 class="section-title">Assessment Review & Close-Out Signatures</h3>
                <p class="section-sub">Review and formal sign-off tracking</p>
              </div>
            </div>

            <div class="form-grid-2 mb-3">
              <div class="form-group">
                <label class="form-label">Assessment Review Date</label>
                <input type="date" [(ngModel)]="formData.reviewDate" class="custom-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Linked Fleet Operating Procedures (SMS / DMS)</label>
                <input 
                  type="text" 
                  [value]="formData.linkedProcedures.join(', ')" 
                  (change)="onProceduresChange($event)"
                  placeholder="e.g. SMS-SOP-011, SMS-SOP-029" 
                  class="custom-input" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Additional Comments / Pre-Work Instructions</label>
              <textarea 
                [(ngModel)]="formData.additionalComments" 
                rows="2" 
                placeholder="State any special boundary watches, SIMOPS conditions, weather limitations..." 
                class="custom-textarea"></textarea>
            </div>
          </div>

        </div>

        <!-- Sticky Sidebar Column -->
        <div class="sidebar-col">
          <div class="hseq-card sticky-sidebar">
            <h4 class="sidebar-title">Risk Assessment Summary</h4>

            <div class="summary-line">
              <span class="line-label">Record No.</span>
              <span class="line-val font-mono font-bold">{{ referenceNo() }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Methodology</span>
              <span class="line-val font-bold text-primary">{{ formData.formReference }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Vessel Asset</span>
              <span class="line-val">{{ selectedVesselName() }}</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Total Steps</span>
              <span class="line-val font-bold">{{ formData.steps.length }} Work Steps</span>
            </div>

            <div class="summary-line">
              <span class="line-label">Assessment Team</span>
              <span class="line-val">{{ formData.assessmentTeam.length }} Personnel</span>
            </div>

            <hr class="sidebar-divider" />

            <h5 class="check-title">Overall Risk Profile</h5>
            <div class="overall-risk-box mb-3">
              <div class="risk-summary-item">
                <span class="text-xs text-muted">Initial Risk Max</span>
                <span class="risk-badge" [ngClass]="getRiskFactorBadgeClass(calculateMaxInitialRisk())">
                  {{ calculateMaxInitialRisk() }}
                </span>
              </div>
              <mat-icon class="arrow-icon">trending_flat</mat-icon>
              <div class="risk-summary-item">
                <span class="text-xs text-muted">Residual Risk Max</span>
                <span class="risk-badge" [ngClass]="getRiskFactorBadgeClass(calculateMaxResidualRisk())">
                  {{ calculateMaxResidualRisk() }}
                </span>
              </div>
            </div>

            <hr class="sidebar-divider" />

            <h5 class="check-title">Client Marine 5×5 Matrix Thresholds</h5>
            <div class="matrix-legend-mini">
              <div class="legend-row">
                <span class="risk-badge badge-crit">High (H)</span>
                <span class="legend-text">Work shall not start without management ashore approval.</span>
              </div>
              <div class="legend-row">
                <span class="risk-badge badge-warn">Moderate (M)</span>
                <span class="legend-text">Reduce risk; heightened monitoring of additional controls.</span>
              </div>
              <div class="legend-row">
                <span class="risk-badge badge-low">Low (L)</span>
                <span class="legend-text">Acceptable; maintain established controls.</span>
              </div>
            </div>

            <hr class="sidebar-divider" />

            <h5 class="check-title">Dynamic Approval Authority (Master Data)</h5>
            <div class="approval-matrix-card mb-3">
              <div class="matrix-info-row">
                <span class="text-xs text-muted">Required Authority:</span>
                <strong class="text-primary font-mono text-sm">{{ getRequiredApproverRule().requiredRole }}</strong>
              </div>
              @if (getRequiredApproverRule().requiresDualSignOff) {
                <div class="matrix-info-row mt-1">
                  <span class="text-xs text-muted">Dual Sign-Off:</span>
                  <span class="badge-warn text-xs font-bold">{{ getRequiredApproverRule().dualSignOffRole }}</span>
                </div>
              }
              @if (getRequiredApproverRule().escalationRequired) {
                <div class="matrix-info-row mt-1">
                  <span class="text-xs text-muted">Shore Escalation:</span>
                  <span class="badge-crit text-xs font-bold">{{ getRequiredApproverRule().escalatedToRole }}</span>
                </div>
              }
              <span class="matrix-note text-xs text-muted d-block mt-1">
                Data-driven routing for {{ calculateMaxResidualRisk() }} Risk per Master Data matrix.
              </span>
            </div>

            <hr class="sidebar-divider" />

            <div class="sidebar-actions">
              <button 
                mat-flat-button 
                color="primary" 
                class="btn-full" 
                (click)="saveAssessment('Under Review')">
                <mat-icon>send</mat-icon> {{ formData.status === 'Rejected' ? 'Resubmit for Approval' : 'Submit for Approval' }}
              </button>
              <button 
                mat-stroked-button 
                class="btn-full" 
                (click)="saveAssessment('Draft')">
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
      gap: 20px; 
      padding: 14px 20px 40px 20px; 
      max-width: 1750px;
      margin: 0 auto;
      min-width: 0;
      box-sizing: border-box;
    }
    .btn-cancel, .btn-draft {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-primary-action {
      height: 34px !important;
      border-radius: var(--radius-sm) !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .rejection-alert-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
    }
    .alert-icon { font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .alert-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .alert-heading { font-size: 13.5px; font-weight: 700; }
    .alert-desc { font-size: 12px; color: var(--foreground); line-height: 1.4; }
    .text-red { color: #dc2626 !important; }
    .mt-0-5 { margin-top: 2px; }

    .approval-matrix-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .matrix-info-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }

    .form-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 20px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .banner-icon { font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .banner-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .banner-title { font-size: 13.5px; font-weight: 700; color: var(--foreground); }
    .banner-desc { font-size: 12px; color: var(--muted-foreground); line-height: 1.4; }
    .form-ref-pill {
      font-size: 11.5px;
      font-weight: 800;
      background: #ffffff;
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border);
      white-space: nowrap;
    }
    .form-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
    .main-form-col { display: flex; flex-direction: column; gap: 20px; }
    .sidebar-col { display: flex; flex-direction: column; gap: 20px; }
    .form-section-card { padding: 24px; }
    .form-section-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .section-num-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      flex-shrink: 0;
    }
    .section-title-wrap { flex: 1; }
    .section-title { font-size: 15.5px; font-weight: 700; margin: 0; color: var(--foreground); }
    .section-sub { font-size: 12px; color: var(--muted-foreground); margin: 2px 0 0 0; }
    
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 700; color: var(--foreground); }
    .required { color: #dc2626; }
    .field-hint { font-size: 11px; color: var(--muted-foreground); }
    
    .custom-input, .custom-select, .custom-textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 13px;
      color: var(--foreground);
      background-color: #ffffff;
      outline: none;
      transition: border-color 0.15s ease;
    }
    .custom-select {
      appearance: none !important;
      -webkit-appearance: none !important;
      padding-right: 32px !important;
      cursor: pointer;
    }
    .custom-input:focus, .custom-select:focus, .custom-textarea:focus { border-color: var(--primary); }
    .input-sm { padding: 6px 10px; font-size: 12px; }
    .bg-readonly { background: var(--muted) !important; color: var(--foreground) !important; cursor: not-allowed; }
    .checkbox-label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
    
    .steps-container { display: flex; flex-direction: column; gap: 16px; }
    .step-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
    }
    .step-card-header {
      background: var(--muted);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
    }
    .step-num-pill {
      font-size: 11px;
      font-weight: 800;
      background: var(--primary);
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .step-header-title { font-size: 13px; color: var(--foreground); }
    .arrow-sep { font-size: 16px; width: 16px; height: 16px; color: var(--muted-foreground); }
    .step-card-body { padding: 16px; }

    .matrix-calc-box {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
    }
    .residual-box {
      background: rgba(37, 99, 235, 0.03);
      border-color: rgba(37, 99, 235, 0.2);
    }
    .matrix-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed var(--border);
      padding-bottom: 6px;
    }
    .matrix-result-pill {
      font-size: 11.5px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 4px;
    }

    .risk-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-crit { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-warn { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
    .badge-low { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .text-green { color: #166534; }

    /* PTW Interlock Control Bar */
    .ptw-control-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 12px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
      min-height: 40px;
      box-sizing: border-box;
      margin-top: 6px;
    }
    .ptw-control-bar.ptw-active {
      background: #eff6ff;
      border-color: #93c5fd;
    }
    .ptw-toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }
    .ptw-toggle-label input[type="checkbox"] {
      width: 15px;
      height: 15px;
      cursor: pointer;
      accent-color: var(--primary);
    }
    .ptw-label-text {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .ptw-control-bar.ptw-active .ptw-label-text {
      color: #1e40af;
    }
    .ptw-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary);
    }
    .ptw-dropdown-wrap {
      flex: 1;
      max-width: 250px;
    }
    .ptw-select {
      height: 32px !important;
      padding: 0 30px 0 10px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-color: #bfdbfe !important;
      background-color: #ffffff !important;
      border-radius: var(--radius-sm) !important;
      color: #1e3a8a !important;
    }

    /* ALARP Verification Card */
    .alarp-control-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 40px;
      padding: 0 12px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
      box-sizing: border-box;
    }
    .alarp-control-card.alarp-verified {
      background: #f0fdf4;
      border-color: #86efac;
    }
    .alarp-toggle-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }
    .alarp-toggle-label input[type="checkbox"] {
      width: 15px;
      height: 15px;
      cursor: pointer;
      accent-color: #16a34a;
    }
    .alarp-text {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .alarp-control-card.alarp-verified .alarp-text {
      color: #15803d;
    }
    .alarp-icon {
      font-size: 17px;
      width: 17px;
      height: 17px;
      color: #16a34a;
    }
    .alarp-badge {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      background: #dcfce7;
      color: #15803d;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid #bbf7d0;
      letter-spacing: 0.3px;
    }

    .btn-table-add-step {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px dashed var(--primary);
      border-radius: 6px;
      color: var(--primary);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 10px;
      transition: background 0.15s ease;
    }
    .btn-table-add-step:hover { background: var(--accent); }

    .sticky-sidebar { position: sticky; top: 24px; padding: 20px; }
    .sidebar-title { font-size: 14px; font-weight: 800; margin: 0 0 14px 0; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
    .summary-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 12.5px; }
    .line-label { color: var(--muted-foreground); font-weight: 600; }
    .line-val { font-weight: 700; color: var(--foreground); text-align: right; }
    .sidebar-divider { border: 0; border-top: 1px solid var(--border); margin: 14px 0; }
    .check-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted-foreground); margin: 0 0 10px 0; }
    
    .overall-risk-box {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 10px;
      background: var(--muted);
      border-radius: 6px;
    }
    .risk-summary-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .arrow-icon { color: var(--muted-foreground); }

    .matrix-legend-mini { display: flex; flex-direction: column; gap: 8px; }
    .legend-row { display: flex; flex-direction: column; gap: 2px; }
    .legend-text { font-size: 10.5px; color: var(--muted-foreground); line-height: 1.3; }

    .sidebar-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-full { width: 100% !important; height: 40px !important; font-weight: 700 !important; }

    .btn-icon-del {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #dc2626;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
    }
    .btn-icon-del:hover { background: #fee2e2; }
    .btn-icon-del:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-sm { font-size: 12px !important; height: 32px !important; }
  `]
})
export class RiskAssessmentFormComponent implements OnInit {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  assessmentId?: string;
  referenceNo = signal<string>('RA-2026-0120');

  formData: Partial<RiskAssessmentRecord> & {
    assessmentTeam: RiskAssessmentTeamMember[];
    steps: RiskAssessmentStep[];
    linkedProcedures: string[];
  } = {
      formReference: 'Marine 5x5 Risk Matrix',
      activityTitle: '',
      vesselId: 'VES-01',
      vesselName: 'MV Pacific Voyager',
      charterer: 'ADNOC Logistics & Services',
      department: 'Deck Department',
      location: 'Deck Area Station 3',
      assessmentType: 'Routine Operation',
      assessmentDate: new Date().toISOString().split('T')[0],
      assessmentTime: new Date().toTimeString().substring(0, 5),
      validityExpiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      lastAssessmentDate: '',
      similarTaskReference: '',
      leadAssessor: 'Chief Officer K. Hansen',
      leadAssessorRank: 'Chief Officer',
      approver: 'Capt. R. Sterling (Master)',
      approverRank: 'Master',
      reviewDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      additionalComments: 'Toolbox talk briefing must be conducted with all participants prior to commencement.',
      linkedProcedures: ['SMS-SOP-001: General Shipboard Safety'],
      assessmentTeam: [
        { name: 'K. Hansen', rank: 'Chief Officer', signature: 'K. Hansen (Signed)', briefed: true },
        { name: 'D. Silva', rank: 'Bosun', signature: 'D. Silva (Signed)', briefed: true }
      ],
      steps: [
        {
          stepNumber: 1,
          stepDescription: 'Worksite inspection and barrier segregation',
          hazardCategory: 'Environments / Housekeeping',
          hazards: 'Slippery deck surfaces, loose gear, unauthorized personnel entry',
          affectedEntities: 'Work crew',
          likelihoodLetter: 'C',
          severityLevel: 'III',
          riskFactor: 'Moderate',
          initialLikelihood: 3,
          initialConsequence: 3,
          initialRating: 9,
          existingControls: 'Area roped off with warning notices; anti-skid boots mandatory',
          documentReference: 'PTW-HOT-01, SMS-SOP-011',
          ptwRequired: true,
          ptwType: 'Hot Work',
          additionalControls: 'Post dedicated safety sentry; clear 15m radius of all combustibles',
          residualLikelihoodLetter: 'E',
          residualSeverityLevel: 'IV',
          residualRiskFactor: 'Low',
          residualLikelihood: 1,
          residualConsequence: 2,
          residualRating: 2,
          remedialAction: 'Check fire main line pressure verified prior to ignition',
          hierarchy: 'Engineering',
          alarpAchieved: true
        }
      ]
    };

  ngOnInit() {
    this.assessmentId = this.route.snapshot.paramMap.get('id') || undefined;
    if (this.assessmentId) {
      this.isEditMode = true;
      const record = this.state.getRiskAssessment(this.assessmentId);
      if (record) {
        this.loadRecordForEdit(record);
      }
    } else {
      const nextSeq = this.state.riskAssessments().length + 1;
      this.referenceNo.set(`RA-2026-0${100 + nextSeq}`);
    }
  }

  loadRecordForEdit(record: RiskAssessmentRecord) {
    this.referenceNo.set(record.referenceNo);
    this.formData = {
      ...record,
      assessmentTeam: record.assessmentTeam ? [...record.assessmentTeam] : [
        { name: record.leadAssessor, rank: record.leadAssessorRank || 'Lead Assessor', signature: 'Signed', briefed: true }
      ],
      steps: JSON.parse(JSON.stringify(record.steps || [])),
      linkedProcedures: record.linkedProcedures ? [...record.linkedProcedures] : []
    };
    this.cdr.markForCheck();
  }

  selectedVesselName(): string {
    const v = this.state.vessels().find(x => x.id === this.formData.vesselId);
    return v?.name || this.formData.vesselName || 'Fleet Vessel';
  }

  onVesselChange() {
    const v = this.state.vessels().find(x => x.id === this.formData.vesselId);
    if (v) {
      this.formData.vesselName = v.name;
    }
    this.cdr.markForCheck();
  }

  onProceduresChange(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.formData.linkedProcedures = input.split(',').map(s => s.trim()).filter(Boolean);
  }

  onRaCrewSelected(member: RiskAssessmentTeamMember): void {
    if (!member.name) return;
    const match = this.state.crewMembers().find(c => c.name.toLowerCase() === member.name.toLowerCase());
    if (match) {
      member.rank = match.rank;
      this.cdr.markForCheck();
    }
  }

  addTeamMember() {
    this.formData.assessmentTeam.push({
      name: '',
      rank: 'Crew Member',
      signature: '',
      briefed: true
    });
    this.cdr.markForCheck();
  }

  removeTeamMember(index: number) {
    if (this.formData.assessmentTeam.length > 1) {
      this.formData.assessmentTeam.splice(index, 1);
      this.cdr.markForCheck();
    }
  }

  addStep() {
    const nextNum = this.formData.steps.length + 1;
    const newStep: RiskAssessmentStep = {
      stepNumber: nextNum,
      stepDescription: '',
      hazardCategory: 'Procedures / Safe Work',
      hazards: '',
      affectedEntities: 'Work crew',
      likelihoodLetter: 'C',
      severityLevel: 'III',
      riskFactor: 'Moderate',
      initialLikelihood: 3,
      initialConsequence: 3,
      initialRating: 9,
      existingControls: 'Standard operating PPE & continuous supervisor attendance',
      documentReference: '',
      ptwRequired: false,
      additionalControls: 'Heightened monitoring and step-by-step verification',
      residualLikelihoodLetter: 'E',
      residualSeverityLevel: 'IV',
      residualRiskFactor: 'Low',
      residualLikelihood: 1,
      residualConsequence: 2,
      residualRating: 2,
      remedialAction: 'Check controls maintained during active operation',
      hierarchy: 'Administrative',
      alarpAchieved: true
    };
    this.formData.steps.push(newStep);
    this.cdr.markForCheck();
  }

  removeStep(index: number) {
    if (this.formData.steps.length > 1) {
      this.formData.steps.splice(index, 1);
      // Re-index
      this.formData.steps.forEach((s, idx) => s.stepNumber = idx + 1);
      this.cdr.markForCheck();
    }
  }

  onLeadAssessorChange(): void {
    const name = this.formData.leadAssessor;
    if (!name) return;
    const user = this.state.users().find(u => (u.fullName || u.name || '').toLowerCase() === name.toLowerCase());
    if (user && user.roles.length > 0) {
      this.formData.leadAssessorRank = user.roles[0];
    } else {
      const crew = this.state.crewMembers().find(c => c.name.toLowerCase() === name.toLowerCase());
      if (crew) this.formData.leadAssessorRank = crew.rank;
    }
    this.cdr.markForCheck();
  }

  onApproverChange(): void {
    const name = this.formData.approver;
    if (!name) return;
    const user = this.state.users().find(u => (u.fullName || u.name || '').toLowerCase() === name.toLowerCase());
    if (user && user.roles.length > 0) {
      this.formData.approverRank = user.roles[0];
    } else {
      const crew = this.state.crewMembers().find(c => c.name.toLowerCase() === name.toLowerCase());
      if (crew) this.formData.approverRank = crew.rank;
    }
    this.cdr.markForCheck();
  }

  recalcStepRisk(step: RiskAssessmentStep) {
    if (step.likelihoodLetter && step.severityLevel) {
      const numL = step.likelihoodLetter === 'A' ? 5 : step.likelihoodLetter === 'B' ? 4 : step.likelihoodLetter === 'C' ? 3 : step.likelihoodLetter === 'D' ? 2 : 1;
      const numS = step.severityLevel === 'I' ? 5 : step.severityLevel === 'II' ? 4 : step.severityLevel === 'III' ? 3 : step.severityLevel === 'IV' ? 2 : 1;
      const evaluated = this.state.calculateRiskLevel(numL, numS);
      step.initialLikelihood = numL;
      step.initialConsequence = numS;
      step.initialRating = evaluated.score;
      step.riskFactor = (evaluated.level === 'Critical' || evaluated.level === 'High') ? 'High' : evaluated.level === 'Medium' ? 'Moderate' : 'Low';
    }
    this.cdr.markForCheck();
  }

  recalcStepResidual(step: RiskAssessmentStep) {
    if (step.residualLikelihoodLetter && step.residualSeverityLevel) {
      const numL = step.residualLikelihoodLetter === 'A' ? 5 : step.residualLikelihoodLetter === 'B' ? 4 : step.residualLikelihoodLetter === 'C' ? 3 : step.residualLikelihoodLetter === 'D' ? 2 : 1;
      const numS = step.residualSeverityLevel === 'I' ? 5 : step.residualSeverityLevel === 'II' ? 4 : step.residualSeverityLevel === 'III' ? 3 : step.residualSeverityLevel === 'IV' ? 2 : 1;
      const evaluated = this.state.calculateRiskLevel(numL, numS);
      step.residualLikelihood = numL;
      step.residualConsequence = numS;
      step.residualRating = evaluated.score;
      step.residualRiskFactor = (evaluated.level === 'Critical' || evaluated.level === 'High') ? 'High' : evaluated.level === 'Medium' ? 'Moderate' : 'Low';
    }
    this.cdr.markForCheck();
  }

  getRiskFactorBadgeClass(factor: MarineRiskFactor | string): string {
    if (factor === 'High') return 'badge-crit';
    if (factor === 'Moderate' || factor === 'Medium') return 'badge-warn';
    return 'badge-low';
  }

  calculateMaxInitialRisk(): MarineRiskFactor {
    const hasHigh = this.formData.steps.some(s => s.riskFactor === 'High');
    if (hasHigh) return 'High';
    const hasMod = this.formData.steps.some(s => s.riskFactor === 'Moderate');
    if (hasMod) return 'Moderate';
    return 'Low';
  }

  calculateMaxResidualRisk(): MarineRiskFactor {
    const hasHigh = this.formData.steps.some(s => s.residualRiskFactor === 'High');
    if (hasHigh) return 'High';
    const hasMod = this.formData.steps.some(s => s.residualRiskFactor === 'Moderate');
    if (hasMod) return 'Moderate';
    return 'Low';
  }

  getRequiredApproverRule(): RiskApprovalRule {
    return this.state.getRequiredApproverForRisk(this.calculateMaxResidualRisk());
  }

  saveAssessment(targetStatus: 'Draft' | 'Under Review') {
    if (!this.formData.activityTitle?.trim()) {
      this.notify.showWarning('Activity Scope Required', 'Please enter the work activity being assessed.');
      return;
    }

    const rule = this.getRequiredApproverRule();

    const payload: Partial<RiskAssessmentRecord> = {
      referenceNo: this.referenceNo(),
      formReference: this.formData.formReference,
      vesselId: this.formData.vesselId,
      vesselName: this.selectedVesselName(),
      charterer: this.formData.charterer,
      department: this.formData.department,
      location: this.formData.location,
      activityTitle: this.formData.activityTitle,
      assessmentType: this.formData.assessmentType,
      assessmentDate: this.formData.assessmentDate,
      assessmentTime: this.formData.assessmentTime,
      validityExpiryDate: this.formData.validityExpiryDate,
      lastAssessmentDate: this.formData.lastAssessmentDate,
      similarTaskReference: this.formData.similarTaskReference,
      leadAssessor: this.formData.leadAssessor,
      leadAssessorRank: this.formData.leadAssessorRank,
      teamMembers: this.formData.assessmentTeam.map(t => t.name).filter(Boolean),
      assessmentTeam: this.formData.assessmentTeam,
      approver: this.formData.approver || rule.requiredRole,
      approverRank: this.formData.approverRank || rule.requiredRole,
      requiredApproverRole: rule.requiredRole,
      escalationRequired: rule.escalationRequired,
      escalationRole: rule.escalatedToRole,
      reviewDate: this.formData.reviewDate,
      additionalComments: this.formData.additionalComments,
      maxInitialRisk: this.calculateMaxInitialRisk(),
      maxResidualRisk: this.calculateMaxResidualRisk(),
      steps: this.formData.steps,
      linkedProcedures: this.formData.linkedProcedures,
      status: targetStatus
    };

    if (this.isEditMode && this.assessmentId) {
      this.state.updateRiskAssessment(this.assessmentId, payload);
      this.notify.showSuccess(
        targetStatus === 'Under Review' ? 'Assessment Resubmitted' : 'Risk Assessment Updated',
        `Assessment ${this.referenceNo()} updated successfully.`
      );
      this.router.navigate(['/risk-assessment', this.assessmentId]);
    } else {
      const created = this.state.addRiskAssessment(payload);
      this.notify.showSuccess(
        targetStatus === 'Under Review' ? 'Assessment Submitted' : 'Draft Saved',
        `Risk Assessment ${created.referenceNo} recorded successfully.`
      );
      this.router.navigate(['/risk-assessment', created.id]);
    }
  }
}
