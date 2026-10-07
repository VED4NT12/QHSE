import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';
import { CertificateStore } from '../../core/stores/certificate.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

@Component({
  selector: 'app-certificate-tracker-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="isEdit() ? 'Edit Certificate' : 'Add Certificate'"
        subtitle="Add or update a certificate record"
        icon="verified"
        [breadcrumbs]="[{label: 'Certificate Tracker', link: '/certificate-tracker'}, {label: isEdit() ? 'Edit' : 'Add'}]">
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
        <div class="form-section-title">Certificate Information</div>
        <div class="form-grid">
          <!-- Code -->
          <div class="form-field" [class.has-error]="fieldErrors()['code']">
            <label>Code <span class="required-star">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="form.code" 
              (ngModelChange)="clearError('code')"
              placeholder="e.g. A02" 
              class="field-input"
              [class.input-error]="fieldErrors()['code']">
            @if (fieldErrors()['code']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['code'] }}</span>
              </div>
            }
          </div>

          <!-- Category -->
          <div class="form-field" [class.has-error]="fieldErrors()['category']">
            <label>Category <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.category" 
              (ngModelChange)="clearError('category')"
              class="field-input"
              [class.input-error]="fieldErrors()['category']">
              <option value="Statutory">Statutory</option>
              <option value="Operational">Operational</option>
            </select>
            @if (fieldErrors()['category']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['category'] }}</span>
              </div>
            }
          </div>

          <!-- Certificate Description -->
          <div class="form-field form-field-wide" [class.has-error]="fieldErrors()['description']">
            <label>Certificate Description <span class="required-star">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="form.description" 
              (ngModelChange)="clearError('description')"
              placeholder="Full certificate name" 
              class="field-input"
              [class.input-error]="fieldErrors()['description']">
            @if (fieldErrors()['description']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['description'] }}</span>
              </div>
            }
          </div>

          <!-- Vessel Name -->
          <div class="form-field" [class.has-error]="fieldErrors()['vesselName']">
            <label>Vessel Name <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.vesselName" 
              (ngModelChange)="clearError('vesselName')"
              class="field-input"
              [class.input-error]="fieldErrors()['vesselName']">
              <option value="">-- Select Vessel --</option>
              @for (v of vessels; track v) {
                <option [value]="v">{{ v }}</option>
              }
            </select>
            @if (fieldErrors()['vesselName']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['vesselName'] }}</span>
              </div>
            }
          </div>

          <!-- Issuing Authority -->
          <div class="form-field" [class.has-error]="fieldErrors()['issuingAuthority']">
            <label>Issuing Authority <span class="required-star">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="form.issuingAuthority" 
              (ngModelChange)="clearError('issuingAuthority')"
              placeholder="e.g. TGA, ABS, CSTC" 
              class="field-input"
              [class.input-error]="fieldErrors()['issuingAuthority']">
            @if (fieldErrors()['issuingAuthority']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['issuingAuthority'] }}</span>
              </div>
            }
          </div>

          <!-- Frequency -->
          <div class="form-field" [class.has-error]="fieldErrors()['frequency']">
            <label>Frequency (Years) <span class="required-star">*</span></label>
            <input 
              type="text" 
              inputmode="numeric"
              pattern="[0-9]*"
              [(ngModel)]="form.frequency" 
              (input)="onFrequencyInput($event)"
              (keydown)="onFrequencyKeyDown($event)"
              placeholder="e.g. 1, 2, 5" 
              class="field-input"
              [class.input-error]="fieldErrors()['frequency']">
            @if (fieldErrors()['frequency']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['frequency'] }}</span>
              </div>
            }
          </div>

          <!-- Certificate Type -->
          <div class="form-field">
            <label>Certificate Type</label>
            <select [(ngModel)]="form.certificateType" class="field-input">
              <option value="Full term">Full term</option>
              <option value="Permanent">Permanent</option>
              <option value="Interim">Interim</option>
            </select>
          </div>

          <!-- Issue Date -->
          <div class="form-field">
            <label>Issue Date</label>
            <input type="date" [(ngModel)]="form.issueDate" class="field-input">
          </div>

          <!-- Last Endorsement Date -->
          <div class="form-field">
            <label>Last Endorsement Date</label>
            <input type="date" [(ngModel)]="form.lastEndorsementDate" class="field-input">
          </div>

          <!-- Expiry Date -->
          <div class="form-field" [class.has-error]="fieldErrors()['expiryDate']">
            <label>Expiry Date <span class="required-star">*</span></label>
            <input 
              type="date" 
              [(ngModel)]="form.expiryDate" 
              (ngModelChange)="clearError('expiryDate')"
              class="field-input"
              [class.input-error]="fieldErrors()['expiryDate']">
            @if (fieldErrors()['expiryDate']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['expiryDate'] }}</span>
              </div>
            }
          </div>

          <!-- Renewal Window -->
          <div class="form-field form-field-wide">
            <label>Renewal Window</label>
            <input type="text" [(ngModel)]="form.window" placeholder="e.g. 30-Sep-2026 to 31-Mar-2027" class="field-input">
          </div>

          <!-- Status -->
          <div class="form-field" [class.has-error]="fieldErrors()['status']">
            <label>Status <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.status" 
              (ngModelChange)="clearError('status')"
              class="field-input"
              [class.input-error]="fieldErrors()['status']">
              <option value="Valid">Valid</option>
              <option value="In Window">In Window</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
            </select>
            @if (fieldErrors()['status']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['status'] }}</span>
              </div>
            }
          </div>

          <!-- Date Last Received -->
          <div class="form-field">
            <label>Date Last Received</label>
            <input type="date" [(ngModel)]="form.dateLastReceived" class="field-input">
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/certificate-tracker">
            <mat-icon>arrow_back</mat-icon>
            <span>Cancel</span>
          </button>
          <button type="button" class="btn-submit" (click)="save()">
            <mat-icon>save</mat-icon>
            <span>{{ isEdit() ? 'Update Certificate' : 'Add Certificate' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 1100px; margin: 0 auto; }

    .form-error-alert {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      margin-bottom: 20px;
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

    .form-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-2xs); }
    .form-section-title { font-size: 14px; font-weight: 700; color: var(--foreground); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); font-family: inherit; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field-wide { grid-column: span 2; }
    .form-field label { font-size: 11.5px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.4px; }
    .required-star { color: #dc2626; font-weight: 700; margin-left: 2px; }

    .field-input { 
      border: 1px solid var(--border); 
      border-radius: var(--radius-sm); 
      padding: 9px 12px; 
      font-size: 13.5px; 
      color: var(--foreground); 
      background: var(--background); 
      outline: none; 
      font-family: inherit; 
      width: 100%;
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s; 
    }
    .field-input:focus { 
      border-color: var(--primary); 
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent);
    }
    .input-error {
      border-color: #ef4444 !important;
      background-color: #fffaf0;
    }
    .input-error:focus {
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25) !important;
    }
    .field-error-msg {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #dc2626;
      font-size: 11.5px;
      font-weight: 600;
      margin-top: 2px;
    }
    .field-error-msg .err-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; align-items: center; padding-top: 20px; border-top: 1px solid var(--border); margin-top: 20px; }
    .btn-cancel { 
      height: 40px; padding: 0 16px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--card); color: var(--foreground);
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
export class CertificateTrackerFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private certStore = inject(CertificateStore);
  public state = inject(HseqStateService);

  readonly isEdit = signal(false);
  readonly hasAttemptedSubmit = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  recordId: string = '';

  get vessels(): string[] {
    return this.state.vesselNames();
  }

  form: any = { 
    code: '', 
    description: '', 
    category: 'Statutory', 
    vesselName: 'MV Pacific Voyager', 
    issuingAuthority: '', 
    frequency: '', 
    certificateType: 'Full term', 
    issueDate: '', 
    lastEndorsementDate: '', 
    expiryDate: '', 
    window: '', 
    status: 'Valid', 
    dateLastReceived: '' 
  };

  ngOnInit(): void { 
    const id = this.route.snapshot.paramMap.get('id');
    const isEditing = this.route.snapshot.url.some(s => s.path === 'edit') || !!id;
    this.isEdit.set(isEditing);

    if (isEditing && id) {
      this.recordId = id;
      const existing = this.certStore.getById(id);
      if (existing) {
        this.form = { ...existing };
        if (this.form.frequency && !/^\d+$/.test(String(this.form.frequency).trim())) {
          const match = String(this.form.frequency).match(/\d+/);
          this.form.frequency = match ? match[0] : '1';
        }
      }
    } else {
      this.form.issueDate = new Date().toISOString().substring(0, 10);
      this.form.frequency = '1';
    }
  }

  onFrequencyKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onFrequencyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9]/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
    }
    this.form.frequency = sanitized;
    this.clearError('frequency');
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

    if (!this.form.code?.trim()) {
      errors['code'] = 'Certificate Code is required (e.g. A02)';
    }
    if (!this.form.category?.trim()) {
      errors['category'] = 'Category is required';
    }
    if (!this.form.description?.trim()) {
      errors['description'] = 'Certificate Description is required';
    }
    if (!this.form.vesselName?.trim()) {
      errors['vesselName'] = 'Vessel Name is required';
    }
    if (!this.form.issuingAuthority?.trim()) {
      errors['issuingAuthority'] = 'Issuing Authority is required';
    }
    
    // Frequency (Years) validation: Must be a numeric value (e.g. 1, 2, 5, 12)
    const freqVal = (this.form.frequency !== undefined && this.form.frequency !== null)
      ? String(this.form.frequency).trim()
      : '';
    if (!freqVal) {
      errors['frequency'] = 'Frequency (Years) is required and must be a numeric value.';
    } else if (!/^\d+$/.test(freqVal)) {
      errors['frequency'] = 'Frequency (Years) must be a numeric value.';
    }

    if (!this.form.expiryDate?.trim()) {
      errors['expiryDate'] = 'Expiry Date is required';
    }
    if (!this.form.status?.trim()) {
      errors['status'] = 'Status is required';
    }

    this.fieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  save(): void { 
    this.hasAttemptedSubmit.set(true);
    if (!this.validate()) {
      this.notify.showError('Validation Failed', 'Please complete all required fields marked with * before saving.');
      return;
    }

    if (this.isEdit()) {
      this.certStore.update(this.recordId, this.form);
      this.notify.showSuccess(
        'Certificate Updated',
        `Certificate ${this.form.code} (${this.form.description}) was successfully updated.`
      );
    } else {
      const created = this.certStore.create(this.form);
      this.notify.showSuccess(
        'Certificate Created',
        `Certificate ${created.code} (${this.form.description}) was successfully created.`
      );
    }

    this.router.navigate(['/certificate-tracker']); 
  }
}
