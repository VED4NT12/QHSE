import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NearMissRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-near-miss-form',
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
        [title]="isEditMode ? 'Edit Near Miss Report' : 'Report Near Miss Incident'"
        [subtitle]="isEditMode ? 'Update maritime hazard details, corrective actions, and Aramco MOMs compliance' : 'Log high-potential event or safety observation into fleet register'"
        icon="warning"
        [breadcrumbs]="[
          {label: 'Overview', link: '/near-miss'},
          {label: 'Near Miss Tracker', link: '/near-miss'},
          {label: isEditMode ? 'Edit Report' : 'New Report'}
        ]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button routerLink="/near-miss" class="btn-cancel">
            <mat-icon>arrow_back</mat-icon> Back to Register
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveRecord()">
            <mat-icon>save</mat-icon> {{ isEditMode ? 'Save Changes' : 'Submit Near Miss' }}
          </button>
        </div>
      </app-page-header>

      @if (hasAttemptedSubmit() && errorList().length > 0) {
        <div class="form-error-alert">
          <mat-icon class="alert-icon">error</mat-icon>
          <div class="alert-content">
            <strong>Validation Error: Please fill in all required fields marked with * below.</strong>
            <ul>
              @for (err of errorList(); track err) {
                <li>{{ err }}</li>
              }
            </ul>
          </div>
        </div>
      }

      <!-- Main Form Layout -->
      <div class="form-layout">
        <div class="form-main">

          <!-- Section 1: Vessel & Occurrence Information -->
          <div class="hseq-card form-section-card">
            <div class="section-header">
              <div class="section-icon-badge">
                <mat-icon>directions_boat</mat-icon>
              </div>
              <div class="section-title-wrap">
                <h3 class="section-title">1. Vessel & Occurrence Information</h3>
                <p class="section-desc">Select the vessel asset, occurrence date, and reporting officer</p>
              </div>
            </div>

            <div class="form-grid-2">
              <!-- Vessel Name (Required) -->
              <div class="form-field-group" [class.has-error]="fieldErrors()['vesselName']">
                <label class="field-label" for="vesselName">
                  Vessel Name <span class="required-star">*</span>
                </label>
                <select 
                  id="vesselName"
                  [(ngModel)]="formModel.vesselName" 
                  (ngModelChange)="clearFieldError('vesselName')"
                  class="custom-select"
                  [class.input-error]="fieldErrors()['vesselName']">
                  <option value="">-- Select Vessel Asset --</option>
                  @for (v of state.vessels(); track v.id) {
                    <option [value]="v.name">{{ v.name }} ({{ v.vesselType }})</option>
                  }
                </select>
                @if (fieldErrors()['vesselName']) {
                  <div class="field-error-msg">
                    <mat-icon class="error-icon">error_outline</mat-icon>
                    <span>{{ fieldErrors()['vesselName'] }}</span>
                  </div>
                }
              </div>

              <!-- Incident Date (Datepicker with calendar popup & keyboard support) -->
              <div class="form-field-group" [class.has-error]="fieldErrors()['date']">
                <label class="field-label" for="incidentDate">
                  Incident Date <span class="required-star">*</span>
                </label>
                <div class="date-input-wrapper">
                  <input 
                    id="incidentDate"
                    type="date" 
                    [(ngModel)]="datePickerValue" 
                    (ngModelChange)="onDateChange($event)"
                    class="custom-input date-picker-input"
                    [class.input-error]="fieldErrors()['date']" />
                  <span class="date-format-hint">Displayed: <strong>{{ formModel.date || 'Not set' }}</strong></span>
                </div>
                @if (fieldErrors()['date']) {
                  <div class="field-error-msg">
                    <mat-icon class="error-icon">error_outline</mat-icon>
                    <span>{{ fieldErrors()['date'] }}</span>
                  </div>
                }
              </div>

              <!-- Occurrence Location (Required) -->
              <div class="form-field-group" [class.has-error]="fieldErrors()['location']">
                <label class="field-label" for="location">
                  Occurrence Location <span class="required-star">*</span>
                </label>
                <input 
                  id="location"
                  type="text" 
                  list="portLocationsList"
                  [(ngModel)]="formModel.location" 
                  (ngModelChange)="clearFieldError('location')"
                  placeholder="e.g. AUX Room STBD, SAFANIYAH PIER, West Pier - Ras Tanura" 
                  class="custom-input"
                  [class.input-error]="fieldErrors()['location']" />
                <datalist id="portLocationsList">
                  @for (p of state.ports(); track p.id) {
                    <option [value]="p.name">{{ p.name }} ({{ p.country }})</option>
                  }
                </datalist>
                @if (fieldErrors()['location']) {
                  <div class="field-error-msg">
                    <mat-icon class="error-icon">error_outline</mat-icon>
                    <span>{{ fieldErrors()['location'] }}</span>
                  </div>
                }
              </div>

              <!-- Reported By -->
              <div class="form-field-group">
                <label class="field-label" for="reportedBy">Reported By</label>
                <input 
                  id="reportedBy"
                  type="text" 
                  [(ngModel)]="formModel.reportedBy" 
                  placeholder="e.g. Master Laurent Bonelli, Chief Officer" 
                  class="custom-input" />
                <span class="field-hint">Officer or personnel submitting the initial report</span>
              </div>
            </div>
          </div>

          <!-- Section 2: Near Miss Description & Immediate Corrective Action -->
          <div class="hseq-card form-section-card">
            <div class="section-header">
              <div class="section-icon-badge warning-badge">
                <mat-icon>report_problem</mat-icon>
              </div>
              <div class="section-title-wrap">
                <h3 class="section-title">2. Incident Description & Immediate Actions</h3>
                <p class="section-desc">Record exact details of what occurred and immediate control measures</p>
              </div>
            </div>

            <!-- Description (Required) -->
            <div class="form-field-group mb-4" [class.has-error]="fieldErrors()['nearMissDescription']">
              <label class="field-label" for="nearMissDescription">
                Near Miss Description <span class="required-star">*</span>
              </label>
              <textarea 
                id="nearMissDescription"
                [(ngModel)]="formModel.nearMissDescription" 
                (ngModelChange)="clearFieldError('nearMissDescription')"
                rows="4" 
                placeholder="Describe what occurred, hazards identified, equipment tags, and potential consequences..." 
                class="custom-input textarea-box"
                [class.input-error]="fieldErrors()['nearMissDescription']"></textarea>
              @if (fieldErrors()['nearMissDescription']) {
                <div class="field-error-msg">
                  <mat-icon class="error-icon">error_outline</mat-icon>
                  <span>{{ fieldErrors()['nearMissDescription'] }}</span>
                </div>
              } @else {
                <span class="field-hint">Provide full technical details, equipment condition, and human factors.</span>
              }
            </div>

            <!-- Corrective Action -->
            <div class="form-field-group">
              <label class="field-label" for="correctiveAction">Immediate Corrective Action</label>
              <textarea 
                id="correctiveAction"
                [(ngModel)]="formModel.correctiveAction" 
                rows="3" 
                placeholder="Detail the immediate corrective actions taken on board to isolate the hazard..." 
                class="custom-input textarea-box"></textarea>
              <span class="field-hint">e.g. Stop calorifier, replace defective EEBD, cease work, adjust mooring lines.</span>
            </div>
          </div>

          <!-- Section 3: Recommendations & Action Taken by Vessel -->
          <div class="hseq-card form-section-card">
            <div class="section-header">
              <div class="section-icon-badge info-badge">
                <mat-icon>lightbulb</mat-icon>
              </div>
              <div class="section-title-wrap">
                <h3 class="section-title">3. Recommendations & Action Taken By Vessel</h3>
                <p class="section-desc">Preventative measures, fleet procedure revisions, and warranty / office follow-up</p>
              </div>
            </div>

            <div class="form-field-group mb-4">
              <label class="field-label" for="recommendation">Recommendations (Safety Committee & Fleet)</label>
              <textarea 
                id="recommendation"
                [(ngModel)]="formModel.recommendation" 
                rows="3" 
                placeholder="e.g. Contact manufacturer, conduct regular mooring drills, update inspection procedures..." 
                class="custom-input textarea-box"></textarea>
            </div>

            <div class="form-field-group">
              <label class="field-label" for="actionTakenByVessel">Action Taken By Vessel (Follow-up)</label>
              <textarea 
                id="actionTakenByVessel"
                [(ngModel)]="formModel.actionTakenByVessel" 
                rows="3" 
                placeholder="e.g. Retighten all valve setups, verify PPE matrix, warranty claim raised by office..." 
                class="custom-input textarea-box"></textarea>
            </div>
          </div>

        </div>

        <!-- Sidebar: Status, Close Out Date & Aramco MOMs -->
        <div class="form-sidebar">
          <div class="hseq-card form-section-card sticky-sidebar">
            <div class="section-header">
              <div class="section-icon-badge compliance-badge">
                <mat-icon>verified</mat-icon>
              </div>
              <div class="section-title-wrap">
                <h3 class="section-title">4. Closure & Compliance</h3>
                <p class="section-desc">Status and Aramco tracking</p>
              </div>
            </div>

            <!-- Status (Required) -->
            <div class="form-field-group mb-4" [class.has-error]="fieldErrors()['status']">
              <label class="field-label" for="status">
                Incident Status <span class="required-star">*</span>
              </label>
              <select 
                id="status"
                [(ngModel)]="formModel.status" 
                class="custom-select" 
                (ngModelChange)="onStatusChange($event)">
                <option value="Open">Open (Action Pending)</option>
                <option value="Closed">Closed (Actions Verified)</option>
              </select>
              @if (fieldErrors()['status']) {
                <div class="field-error-msg">
                  <mat-icon class="error-icon">error_outline</mat-icon>
                  <span>{{ fieldErrors()['status'] }}</span>
                </div>
              }
            </div>

            <!-- Close Out Date (Datepicker with calendar popup & keyboard support) -->
            <div class="form-field-group mb-4" [class.has-error]="fieldErrors()['closeOutDate']">
              <label class="field-label" for="closeOutDate">
                Close Out Date
                @if (formModel.status === 'Closed') {
                  <span class="required-star">*</span>
                }
              </label>
              <div class="date-input-wrapper">
                <input 
                  id="closeOutDate"
                  type="date" 
                  [(ngModel)]="closeOutDatePickerValue" 
                  (ngModelChange)="onCloseOutDateChange($event)"
                  class="custom-input date-picker-input"
                  [disabled]="formModel.status !== 'Closed'"
                  [class.input-error]="fieldErrors()['closeOutDate']" />
                <span class="date-format-hint">
                  @if (formModel.status === 'Closed') {
                    Displayed: <strong>{{ formModel.closeOutDate || 'Not set' }}</strong>
                  } @else {
                    <span class="text-muted">Enabled when Status is Closed</span>
                  }
                </span>
              </div>
              @if (fieldErrors()['closeOutDate']) {
                <div class="field-error-msg">
                  <mat-icon class="error-icon">error_outline</mat-icon>
                  <span>{{ fieldErrors()['closeOutDate'] }}</span>
                </div>
              }
            </div>

            <!-- Aramco MOMs Submission ID -->
            <div class="form-field-group mb-4">
              <label class="field-label" for="aramcoMoms">Aramco MOMs Submission ID</label>
              <input 
                id="aramcoMoms"
                type="text" 
                [(ngModel)]="formModel.aramcoMomsSubmission" 
                placeholder="e.g. 12046738, 12351578" 
                class="custom-input font-mono" />
              <span class="field-hint">Saudi Aramco MOMs portal tracking reference number</span>
            </div>

            <!-- Actions -->
            <div class="form-actions-box mt-4">
              <button 
                mat-flat-button 
                color="primary" 
                class="w-100 btn-submit" 
                (click)="saveRecord()">
                <mat-icon>check</mat-icon> {{ isEditMode ? 'Save Changes' : 'Save Near Miss' }}
              </button>
              <button 
                mat-stroked-button 
                class="w-100 btn-cancel mt-2" 
                routerLink="/near-miss">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
      font-family: var(--font-sans);
    }

    .form-error-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      margin-bottom: 8px;
      color: #991b1b;
      font-size: 13px;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.08);
    }
    .form-error-alert .alert-icon {
      color: #dc2626;
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .form-error-alert .alert-content strong {
      display: block;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .form-error-alert ul {
      margin: 0;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .form-error-alert li {
      font-size: 12.5px;
    }

    .btn-cancel {
      height: 40px !important;
      border-color: var(--border) !important;
      color: var(--foreground) !important;
      font-weight: 600 !important;
    }

    .form-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
    }

    .form-main {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-section-card {
      padding: 22px 24px;
    }

    .sticky-sidebar {
      position: sticky;
      top: 80px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }

    .section-icon-badge {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      background: oklch(0.92 0.03 240);
      color: oklch(0.40 0.12 250);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .warning-badge {
      background: oklch(0.95 0.08 70);
      color: oklch(0.55 0.18 65);
    }

    .info-badge {
      background: oklch(0.93 0.05 40);
      color: var(--primary);
    }

    .compliance-badge {
      background: oklch(0.92 0.07 145);
      color: oklch(0.45 0.15 145);
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .section-desc {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 2px 0 0;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .form-field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
    }

    .required-star {
      color: #dc2626;
      font-weight: 800;
      margin-left: 2px;
    }

    .textarea-box {
      resize: vertical;
      line-height: 1.5;
    }

    .field-hint {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .date-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .date-picker-input {
      font-family: inherit;
      color: var(--foreground);
      cursor: pointer;
    }

    .date-format-hint {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .font-mono {
      font-family: monospace;
    }

    /* Validation UX Styles */
    .has-error .field-label {
      color: #dc2626;
    }

    .input-error {
      border: 1.5px solid #dc2626 !important;
      background-color: #fef2f2 !important;
    }

    .input-error:focus {
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15) !important;
      outline: none !important;
    }

    .field-error-msg {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 600;
      color: #dc2626;
      margin-top: 2px;
    }

    .error-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .btn-submit {
      height: 42px !important;
      font-weight: 700 !important;
    }

    .w-100 { width: 100%; }
    .mb-4 { margin-bottom: 16px; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
  `]
})
export class NearMissFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  isEditMode: boolean = false;
  existingId: string = '';

  // Validation errors signal
  readonly hasAttemptedSubmit = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});

  errorList(): string[] {
    return Object.values(this.fieldErrors());
  }

  // Date picker backing model values in YYYY-MM-DD
  datePickerValue: string = '';
  closeOutDatePickerValue: string = '';

  formModel: Partial<NearMissRecord> = {
    vesselName: '',
    date: '',
    nearMissDescription: '',
    correctiveAction: '',
    location: '',
    closeOutDate: '',
    status: 'Open',
    reportedBy: '',
    recommendation: '',
    actionTakenByVessel: '',
    aramcoMomsSubmission: ''
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.existingId = id;
      const existing = this.state.getNearMissById(id);
      if (existing) {
        this.formModel = { ...existing };
        this.datePickerValue = this.maritimeToIsoDate(existing.date);
        this.closeOutDatePickerValue = this.maritimeToIsoDate(existing.closeOutDate);
      } else {
        this.notify.showWarning('Record Not Found', `Near Miss ID ${id} was not found.`);
        this.router.navigate(['/near-miss']);
      }
    } else {
      // Default to today
      const now = new Date();
      this.datePickerValue = now.toISOString().substring(0, 10);
      this.formModel.date = this.isoToMaritimeDate(this.datePickerValue);
      this.formModel.vesselName = 'MV Pacific Voyager';
      this.formModel.reportedBy = this.state.currentUserInfo().name;
    }
  }

  // Convert "26-Dec-25" -> "2025-12-26" for HTML5 Datepicker
  private maritimeToIsoDate(val?: string): string {
    if (!val || !val.trim()) return '';
    const parts = val.trim().split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const monthNames: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
        'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const month = monthNames[parts[1]] || '01';
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      return `${year}-${month}-${day}`;
    }
    return val;
  }

  // Convert "2025-12-26" -> "26-Dec-25"
  private isoToMaritimeDate(isoVal?: string): string {
    if (!isoVal || !isoVal.trim()) return '';
    const parts = isoVal.trim().split('-');
    if (parts.length === 3) {
      const yr = parts[0].substring(2);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const mon = months[mIdx] || 'Jan';
      const day = parseInt(parts[2], 10).toString();
      return `${day}-${mon}-${yr}`;
    }
    return isoVal;
  }

  onDateChange(isoDate: string) {
    this.formModel.date = this.isoToMaritimeDate(isoDate);
    this.clearFieldError('date');
  }

  onCloseOutDateChange(isoDate: string) {
    this.formModel.closeOutDate = this.isoToMaritimeDate(isoDate);
    this.clearFieldError('closeOutDate');
  }

  onStatusChange(newStatus: 'Open' | 'Closed') {
    this.clearFieldError('status');
    if (newStatus === 'Closed' && !this.formModel.closeOutDate) {
      const todayIso = new Date().toISOString().substring(0, 10);
      this.closeOutDatePickerValue = todayIso;
      this.formModel.closeOutDate = this.isoToMaritimeDate(todayIso);
    } else if (newStatus === 'Open') {
      this.closeOutDatePickerValue = '';
      this.formModel.closeOutDate = '';
      this.clearFieldError('closeOutDate');
    }
  }

  clearFieldError(fieldName: string) {
    this.fieldErrors.update(errs => {
      if (!errs[fieldName]) return errs;
      const copy = { ...errs };
      delete copy[fieldName];
      return copy;
    });
  }

  validate(): boolean {
    const errors: Record<string, string> = {};

    if (!this.formModel.vesselName?.trim()) {
      errors['vesselName'] = 'Vessel Name is required';
    }
    if (!this.formModel.date?.trim()) {
      errors['date'] = 'Incident Date is required';
    }
    if (!this.formModel.location?.trim()) {
      errors['location'] = 'Occurrence Location is required';
    }
    if (!this.formModel.nearMissDescription?.trim()) {
      errors['nearMissDescription'] = 'Near Miss Description is required';
    }
    if (!this.formModel.status) {
      errors['status'] = 'Status is required';
    } else if (this.formModel.status === 'Closed' && !this.formModel.closeOutDate?.trim()) {
      errors['closeOutDate'] = 'Close Out Date is required when status is Closed';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  saveRecord() {
    this.hasAttemptedSubmit.set(true);
    if (!this.validate()) {
      this.notify.showError('Validation Failed', 'Please fix the highlighted fields before saving.');
      return;
    }

    if (this.isEditMode) {
      this.state.updateNearMiss(this.existingId, this.formModel);
      this.notify.showSuccess('Report Updated', `Near Miss for ${this.formModel.vesselName} successfully updated.`);
    } else {
      const created = this.state.addNearMiss(this.formModel);
      this.notify.showSuccess('Near Miss Registered', `Report logged with ID ${created.id} (${created.vesselName}).`);
    }

    this.router.navigate(['/near-miss']);
  }
}
