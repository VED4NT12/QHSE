import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';
import { OnHireStore } from '../../core/stores/on-hire.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

@Component({
  selector: 'app-on-hire-inspection-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="isEdit() ? 'Edit On-Hire Inspection' : 'New On-Hire Inspection'"
        subtitle="Record on-hire vessel acceptance and findings count"
        icon="fact_check"
        [breadcrumbs]="[{label: 'On Hire Inspection', link: '/on-hire-inspection'}, {label: isEdit() ? 'Edit' : 'Create'}]">
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

      <div class="form-card">
        <div class="form-section-title">Vessel & Inspection Information</div>
        <div class="form-grid">
          <!-- Vessel Name -->
          <div class="form-field" [class.has-error]="fieldErrors()['vesselName']">
            <label>Vessel Name <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.vesselName" 
              (ngModelChange)="onVesselChange($event)"
              class="field-input"
              [class.input-error]="fieldErrors()['vesselName']">
              <option value="">-- Select Vessel Asset --</option>
              @for (v of state.vessels(); track v.id) {
                <option [value]="v.name">{{ v.name }} ({{ v.vesselType }})</option>
              }
            </select>
            @if (fieldErrors()['vesselName']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['vesselName'] }}</span>
              </div>
            }
          </div>

          <!-- Vessel Type -->
          <div class="form-field">
            <label>Vessel Type</label>
            <select [(ngModel)]="form.vesselType" class="field-input">
              <option value="">-- Select Vessel Type --</option>
              @for (vt of state.vesselTypeNames(); track vt) {
                <option [value]="vt">{{ vt }}</option>
              }
            </select>
          </div>

          <!-- Takeover Date -->
          <div class="form-field" [class.has-error]="fieldErrors()['takeoverDate']">
            <label>Takeover Date <span class="required-star">*</span></label>
            <input 
              type="date" 
              [(ngModel)]="form.takeoverDate" 
              (ngModelChange)="clearError('takeoverDate')"
              class="field-input"
              [class.input-error]="fieldErrors()['takeoverDate']">
            @if (fieldErrors()['takeoverDate']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['takeoverDate'] }}</span>
              </div>
            }
          </div>

          <!-- Date of Inspection -->
          <div class="form-field" [class.has-error]="fieldErrors()['dateOfInspection']">
            <label>Date of Inspection <span class="required-star">*</span></label>
            <input 
              type="date" 
              [(ngModel)]="form.dateOfInspection" 
              (ngModelChange)="clearError('dateOfInspection')"
              class="field-input"
              [class.input-error]="fieldErrors()['dateOfInspection']">
            @if (fieldErrors()['dateOfInspection']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['dateOfInspection'] }}</span>
              </div>
            }
          </div>

          <!-- Category -->
          <div class="form-field">
            <label>Category of Inspection</label>
            <select [(ngModel)]="form.categoryOfInspection" class="field-input">
              <option value="On-Hire">On-Hire</option>
              <option value="Pre-Hire">Pre-Hire</option>
              <option value="Off-Hire">Off-Hire</option>
            </select>
          </div>

          <!-- Status -->
          <div class="form-field" [class.has-error]="fieldErrors()['status']">
            <label>Status <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.status" 
              (ngModelChange)="clearError('status')"
              class="field-input"
              [class.input-error]="fieldErrors()['status']">
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
            @if (fieldErrors()['status']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['status'] }}</span>
              </div>
            }
          </div>

          <!-- Inspectors -->
          <div class="form-field form-field-full" [class.has-error]="fieldErrors()['inspectors']">
            <label>Inspectors / Surveyors <span class="required-star">*</span></label>
            <input 
              type="text" 
              list="onHireInspectorList"
              [(ngModel)]="form.inspectors" 
              (ngModelChange)="clearError('inspectors')"
              placeholder="e.g. Capt. J. Vance, PETER McPARLIN" 
              class="field-input"
              [class.input-error]="fieldErrors()['inspectors']">
            <datalist id="onHireInspectorList">
              @for (ins of state.inspectors(); track ins.id) {
                <option [value]="ins.name">{{ ins.name }} ({{ ins.role }} - {{ ins.organization }})</option>
              }
            </datalist>
            @if (fieldErrors()['inspectors']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['inspectors'] }}</span>
              </div>
            }
          </div>
        </div>

        <div class="form-section-title mt-20">
          <mat-icon class="sec-icon" style="vertical-align: middle; font-size: 18px; width: 18px; height: 18px; margin-right: 6px;">analytics</mat-icon>
          <span>Findings Summary (Auto-Calculated from Child Findings)</span>
        </div>
        
        <div class="findings-summary-box">
          <div class="fs-card">
            <div class="fs-card-head">
              <span class="fs-card-title">Deficiencies Identified</span>
              <span class="fs-total-pill">{{ calcFindingsTotal() }} Total</span>
            </div>
            <div class="fs-badges-row">
              <span class="fs-badge tag-high">High: <strong>{{ form.findingsHigh || 0 }}</strong></span>
              <span class="fs-badge tag-med">Medium: <strong>{{ form.findingsMedium || 0 }}</strong></span>
              <span class="fs-badge tag-low">Low: <strong>{{ form.findingsLow || 0 }}</strong></span>
            </div>
          </div>

          <div class="fs-card">
            <div class="fs-card-head">
              <span class="fs-card-title">Deficiencies Closed</span>
              <span class="fs-total-pill success">{{ calcClosedTotal() }} Closed</span>
            </div>
            <div class="fs-badges-row">
              <span class="fs-badge tag-chigh">High Closed: <strong>{{ form.closedHigh || 0 }}</strong></span>
              <span class="fs-badge tag-cmed">Med Closed: <strong>{{ form.closedMedium || 0 }}</strong></span>
              <span class="fs-badge tag-clow">Low Closed: <strong>{{ form.closedLow || 0 }}</strong></span>
            </div>
          </div>
        </div>

        <div class="fs-info-notice">
          <mat-icon>info</mat-icon>
          <span>Findings are managed inside the <strong>Child Findings Grid</strong>. Counts are automatically calculated from individual child records and cannot be typed manually.</span>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/on-hire-inspection">
            <mat-icon>arrow_back</mat-icon> Cancel
          </button>
          <button type="button" class="btn-submit" (click)="save()">
            <mat-icon>save</mat-icon> {{ isEdit() ? 'Update Inspection' : 'Create Inspection' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .form-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-2xs); }
    .form-section-title { font-size: 14px; font-weight: 700; color: var(--foreground); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); font-family: inherit; }
    .mt-20 { margin-top: 24px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 8px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field-full { grid-column: 1 / -1; }
    .form-field label { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.4px; }
    .required-star { color: #dc2626; font-weight: 700; margin-left: 2px; }
    
    .field-input { border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 13.5px; color: var(--foreground); background: var(--background); outline: none; font-family: inherit; width: 100%; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; }
    .field-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px oklch(0.55 0.18 250 / 0.15); }
    .num { text-align: center; }

    /* Validation Errors */
    .has-error label { color: #dc2626 !important; }
    .input-error { border-color: #dc2626 !important; background-color: #fef2f2 !important; }
    .input-error:focus { box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2) !important; }
    .field-error-msg { display: flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: #dc2626; margin-top: 2px; }
    .err-icon { font-size: 14px; width: 14px; height: 14px; }

    .form-error-alert {
      display: flex; gap: 12px; align-items: flex-start;
      background: #fef2f2; border: 1px solid #fecaca;
      border-left: 4px solid #dc2626; border-radius: var(--radius-sm);
      padding: 14px 16px; margin-bottom: 20px; color: #991b1b;
    }
    .form-error-alert .alert-icon { font-size: 22px; width: 22px; height: 22px; color: #dc2626; flex-shrink: 0; }
    .form-error-alert ul { margin: 6px 0 0 18px; padding: 0; font-size: 12.5px; }

    /* Findings Summary Box */
    .findings-summary-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 14px; margin-bottom: 12px; }
    .fs-card { background: var(--muted) / 0.5; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px 16px; }
    .fs-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .fs-card-title { font-size: 12px; font-weight: 700; color: var(--foreground); text-transform: uppercase; letter-spacing: 0.4px; }
    .fs-total-pill { font-size: 12px; font-weight: 700; background: oklch(0.92 0.05 240 / 0.5); color: oklch(0.40 0.14 240); padding: 2px 8px; border-radius: var(--radius-sm); }
    .fs-total-pill.success { background: oklch(0.92 0.06 145 / 0.5); color: oklch(0.38 0.15 145); }
    .fs-badges-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .fs-badge { font-size: 11.5px; padding: 4px 8px; border-radius: var(--radius-sm); font-weight: 600; }
    .fs-badge.tag-high { background: oklch(0.93 0.08 25 / 0.8); color: oklch(0.48 0.18 25); }
    .fs-badge.tag-med { background: oklch(0.94 0.07 70 / 0.8); color: oklch(0.48 0.16 65); }
    .fs-badge.tag-low { background: oklch(0.93 0.05 240 / 0.8); color: oklch(0.40 0.12 240); }
    .fs-badge.tag-chigh { background: oklch(0.93 0.06 145 / 0.8); color: oklch(0.38 0.15 145); }
    .fs-badge.tag-cmed { background: oklch(0.93 0.06 145 / 0.8); color: oklch(0.38 0.15 145); }
    .fs-badge.tag-clow { background: oklch(0.93 0.06 145 / 0.8); color: oklch(0.38 0.15 145); }

    .fs-info-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: oklch(0.96 0.02 230 / 0.5);
      border: 1px solid oklch(0.88 0.04 230 / 0.6);
      border-radius: var(--radius-sm);
      font-size: 12px;
      color: var(--muted-foreground);
      margin-bottom: 20px;
    }
    .fs-info-notice mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); flex-shrink: 0; }

    /* Action Buttons */
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; align-items: center; padding-top: 20px; border-top: 1px solid var(--border); margin-top: 20px; }
    .btn-cancel { 
      height: 40px; padding: 0 16px; border-radius: var(--radius-sm);
      border: 1.5px solid var(--border); background: var(--card); color: var(--foreground);
      font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s ease;
    }
    .btn-cancel:hover { background: var(--accent); border-color: var(--primary); color: var(--primary); }
    .btn-cancel mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-submit { 
      height: 40px; padding: 0 20px; border-radius: var(--radius-sm); border: none;
      background: var(--primary); color: var(--primary-foreground);
      font-family: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer;
      display: inline-flex; align-items: center; gap: 8px; box-shadow: var(--shadow-xs);
      transition: filter 0.15s ease;
    }
    .btn-submit:hover { filter: brightness(1.08); }
    .btn-submit mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class OnHireInspectionFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private onHireStore = inject(OnHireStore);
  public state = inject(HseqStateService);

  readonly isEdit = signal(false);
  readonly hasAttemptedSubmit = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  recordId: string = '';

  get vessels(): string[] {
    return this.state.vesselNames();
  }

  onVesselChange(name: string): void {
    this.form.vesselName = name;
    this.clearError('vesselName');
    const matched = this.state.vessels().find(v => v.name === name);
    if (matched) {
      this.form.vesselType = matched.vesselType;
    }
  }

  form: any = {
    vesselName: '',
    vesselType: 'Crew Boat',
    takeoverDate: '',
    dateOfInspection: '',
    categoryOfInspection: 'On-Hire',
    status: 'Open',
    inspectors: '',
    findingsLow: 0, findingsMedium: 0, findingsHigh: 0,
    closedLow: 0, closedMedium: 0, closedHigh: 0
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isEditing = this.route.snapshot.url.some(s => s.path === 'edit') || !!id;
    this.isEdit.set(isEditing);

    if (isEditing && id) {
      this.recordId = id;
      const existing = this.onHireStore.getById(id);
      if (existing) {
        this.form = { ...existing };
      }
    } else {
      // Default dates
      const today = new Date().toISOString().substring(0, 10);
      this.form.dateOfInspection = today;
      this.form.takeoverDate = today;
      this.form.vesselName = 'MV Pacific Voyager';
    }
  }

  clearError(field: string): void {
    const errs = { ...this.fieldErrors() };
    delete errs[field];
    this.fieldErrors.set(errs);
  }

  errorList(): string[] {
    return Object.values(this.fieldErrors());
  }

  validate(): boolean {
    const errors: Record<string, string> = {};

    if (!this.form.vesselName?.trim()) {
      errors['vesselName'] = 'Vessel Name is required';
    }
    if (!this.form.dateOfInspection?.trim()) {
      errors['dateOfInspection'] = 'Date of Inspection is required';
    }
    if (!this.form.takeoverDate?.trim()) {
      errors['takeoverDate'] = 'Takeover Date is required';
    }
    if (!this.form.inspectors?.trim()) {
      errors['inspectors'] = 'Inspector Name / Surveyors is required';
    }
    if (!this.form.status) {
      errors['status'] = 'Status is required';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  calcFindingsTotal(): number {
    return (Number(this.form.findingsHigh) || 0) + (Number(this.form.findingsMedium) || 0) + (Number(this.form.findingsLow) || 0);
  }

  calcClosedTotal(): number {
    return (Number(this.form.closedHigh) || 0) + (Number(this.form.closedMedium) || 0) + (Number(this.form.closedLow) || 0);
  }

  save(): void {
    this.hasAttemptedSubmit.set(true);
    if (!this.validate()) {
      this.notify.showError('Validation Failed', 'Please complete all required fields marked with * before saving.');
      return;
    }

    const payload = {
      ...this.form,
      findingsHigh: Number(this.form.findingsHigh || 0),
      findingsMedium: Number(this.form.findingsMedium || 0),
      findingsLow: Number(this.form.findingsLow || 0),
      findingsTotal: this.calcFindingsTotal(),
      closedHigh: Number(this.form.closedHigh || 0),
      closedMedium: Number(this.form.closedMedium || 0),
      closedLow: Number(this.form.closedLow || 0),
      closedTotal: this.calcClosedTotal()
    };

    if (this.isEdit()) {
      this.onHireStore.update(this.recordId, payload);
      this.notify.showSuccess(
        'Inspection Updated',
        `On-Hire Inspection for ${this.form.vesselName} was successfully updated.`
      );
    } else {
      const created = this.onHireStore.create(payload);
      this.notify.showSuccess(
        'Inspection Created',
        `On-Hire Inspection for ${this.form.vesselName} (${created.id}) was successfully created.`
      );
    }

    this.router.navigate(['/on-hire-inspection']);
  }
}
