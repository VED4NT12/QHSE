import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';
import { ObservationStore } from '../../core/stores/observation.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

@Component({
  selector: 'app-safe-observation-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="isEdit() ? 'Edit Observation Card' : 'New Observation Card'"
        subtitle="Record safety observation — Unsafe Act, Unsafe Condition, or Safe behavior"
        icon="assignment_turned_in"
        [breadcrumbs]="[{label: 'Safe Observations', link: '/safe-observations'}, {label: isEdit() ? 'Edit' : 'Create'}]">
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
        <!-- Section: Observation Overview -->
        <div class="form-section-title">1. Observation Overview</div>
        <div class="form-grid">
          <!-- Vessel Name -->
          <div class="form-field" [class.has-error]="fieldErrors()['vesselName']">
            <label>Vessel Name <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.vesselName" 
              (ngModelChange)="clearError('vesselName')"
              class="field-input"
              [class.input-error]="fieldErrors()['vesselName']">
              <option value="">-- Select Vessel Asset --</option>
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

          <!-- Date -->
          <div class="form-field" [class.has-error]="fieldErrors()['date']">
            <label>Date <span class="required-star">*</span></label>
            <input 
              type="date" 
              [(ngModel)]="form.date" 
              (ngModelChange)="clearError('date')"
              class="field-input"
              [class.input-error]="fieldErrors()['date']">
            @if (fieldErrors()['date']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['date'] }}</span>
              </div>
            }
          </div>

          <!-- Time -->
          <div class="form-field" [class.has-error]="fieldErrors()['time']">
            <label>Time <span class="required-star">*</span></label>
            <input 
              type="time" 
              [(ngModel)]="form.time" 
              (ngModelChange)="clearError('time')"
              class="field-input"
              [class.input-error]="fieldErrors()['time']">
            @if (fieldErrors()['time']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['time'] }}</span>
              </div>
            }
          </div>

          <!-- Card Type -->
          <div class="form-field" [class.has-error]="fieldErrors()['cardType']">
            <label>Card Type <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.cardType" 
              (ngModelChange)="clearError('cardType')"
              class="field-input"
              [class.input-error]="fieldErrors()['cardType']">
              <option value="Unsafe Act">Unsafe Act</option>
              <option value="Unsafe Condition">Unsafe Condition</option>
              <option value="Safe Act">Safe Act</option>
              <option value="Safe Condition">Safe Condition</option>
            </select>
            @if (fieldErrors()['cardType']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['cardType'] }}</span>
              </div>
            }
          </div>

          <!-- What Was Observed -->
          <div class="form-field" [class.has-error]="fieldErrors()['whatWasObserved']">
            <label>What Was Observed <span class="required-star">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="form.whatWasObserved" 
              (ngModelChange)="clearError('whatWasObserved')"
              placeholder="e.g. Electrical Hazard, Slip/Trip/Fall, Housekeeping" 
              class="field-input"
              [class.input-error]="fieldErrors()['whatWasObserved']">
            @if (fieldErrors()['whatWasObserved']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['whatWasObserved'] }}</span>
              </div>
            }
          </div>

          <!-- Hazard Hunt Category -->
          <div class="form-field">
            <label>Hazard Hunt Category</label>
            <input type="text" list="categoryDatalist" [(ngModel)]="form.hazardHuntCategory" placeholder="e.g. Slip & Fall, Dropped Objects" class="field-input">
            <datalist id="categoryDatalist">
              @for (cat of state.categories(); track cat.id) {
                <option [value]="cat.name">{{ cat.name }} ({{ cat.code }})</option>
              }
            </datalist>
          </div>

          <!-- Detailed Description -->
          <div class="form-field form-field-full" [class.has-error]="fieldErrors()['detailedDescription']">
            <label>Detailed Description of Observation <span class="required-star">*</span></label>
            <textarea 
              rows="3" 
              [(ngModel)]="form.detailedDescription" 
              (ngModelChange)="clearError('detailedDescription')"
              placeholder="Provide accurate, detailed description of what happened or was observed..." 
              class="field-input"
              [class.input-error]="fieldErrors()['detailedDescription']"></textarea>
            @if (fieldErrors()['detailedDescription']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['detailedDescription'] }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Section: Action & Response -->
        <div class="form-section-title">2. Immediate Action & Response</div>
        <div class="form-grid">
          <div class="form-field">
            <label>Work Stopped?</label>
            <select [(ngModel)]="form.stoppedWork" class="field-input">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
          <div class="form-field">
            <label>Situation Discussed?</label>
            <select [(ngModel)]="form.situationDiscussed" class="field-input">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
          <div class="form-field">
            <label>Work Continued Safely?</label>
            <select [(ngModel)]="form.workContinuedSafely" class="field-input">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
          <div class="form-field">
            <label>Attitude of Persons</label>
            <select [(ngModel)]="form.attitudeOfPersons" class="field-input">
              <option value="Receptive">Receptive</option>
              <option value="Dismissive">Dismissive</option>
              <option value="Aggressive">Aggressive</option>
              <option value="N/A">N/A</option>
            </select>
          </div>
        </div>

        <!-- Section: Root Cause Classification -->
        <div class="form-section-title">3. Root Cause Classification</div>
        <div class="form-grid">
          <div class="form-field">
            <label>Procedures & Communications</label>
            <input type="text" [(ngModel)]="form.proceduresCommunications" placeholder="e.g. Inadequate training, Procedures not followed" class="field-input">
          </div>
          <div class="form-field">
            <label>Engineering & Design</label>
            <input type="text" [(ngModel)]="form.engineering" placeholder="e.g. Moving parts not guarded, Electrical" class="field-input">
          </div>
          <div class="form-field">
            <label>Environment & Workspace</label>
            <input type="text" [(ngModel)]="form.environment" placeholder="e.g. Housekeeping, Weather, Poor lighting" class="field-input">
          </div>
          <div class="form-field">
            <label>People / Behavior</label>
            <input type="text" [(ngModel)]="form.people" placeholder="e.g. Unsafe Behaviour, Unsafe Position" class="field-input">
          </div>
          <div class="form-field">
            <label>PPE Issues</label>
            <input type="text" [(ngModel)]="form.ppeNotUsed" placeholder="e.g. PFD not fastened, No eye protection" class="field-input">
          </div>
          <div class="form-field">
            <label>Tools & Equipment</label>
            <input type="text" [(ngModel)]="form.toolsAndEquipment" placeholder="e.g. In unsafe condition, Wrong for job" class="field-input">
          </div>
        </div>

        <!-- Section: Corrective Action -->
        <div class="form-section-title">4. Corrective Action & Closure</div>
        <div class="form-grid">
          <div class="form-field">
            <label>Corrective Action Taken?</label>
            <select [(ngModel)]="form.correctiveActionTaken" class="field-input">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div class="form-field form-field-full" [class.has-error]="fieldErrors()['actionsTaken']">
            <label>Actions Taken / Follow-up Instructions <span class="required-star">*</span></label>
            <textarea 
              rows="3" 
              [(ngModel)]="form.actionsTaken" 
              (ngModelChange)="clearError('actionsTaken')"
              placeholder="Details of immediate and preventive corrective actions implemented..." 
              class="field-input"
              [class.input-error]="fieldErrors()['actionsTaken']"></textarea>
            @if (fieldErrors()['actionsTaken']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['actionsTaken'] }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/safe-observations">
            <mat-icon>arrow_back</mat-icon>
            <span>Cancel</span>
          </button>
          <button type="button" class="btn-submit" (click)="save()">
            <mat-icon>save</mat-icon>
            <span>{{ isEdit() ? 'Update' : 'Submit' }} Observation</span>
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
    .form-section-title { font-size: 13.5px; font-weight: 700; color: var(--foreground); margin: 20px 0 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border); font-family: inherit; }
    .form-section-title:first-child { margin-top: 0; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 8px; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field-full { grid-column: 1 / -1; }
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
export class SafeObservationFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private obsStore = inject(ObservationStore);
  public state = inject(HseqStateService);

  readonly isEdit = signal(false);
  readonly hasAttemptedSubmit = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  recordId: string = '';

  get vessels(): string[] {
    return this.state.vesselNames();
  }

  form: any = {
    vesselName: 'MV Pacific Voyager',
    date: '',
    time: '12:00',
    cardType: 'Unsafe Act',
    department: '',
    hazardHuntCategory: '',
    whatWasObserved: '',
    detailedDescription: '',
    stoppedWork: 'Yes',
    situationDiscussed: 'Yes',
    workContinuedSafely: 'Yes',
    attitudeOfPersons: 'Receptive',
    proceduresCommunications: '',
    engineering: '',
    environment: '',
    people: '',
    ppeNotUsed: '',
    toolsAndEquipment: '',
    correctiveActionTaken: 'Yes',
    actionsTaken: ''
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isEditMode = this.route.snapshot.url.some(s => s.path === 'edit') || !!id;
    this.isEdit.set(isEditMode);

    if (isEditMode && id) {
      this.recordId = id;
      const existing = this.obsStore.getById(id);
      if (existing) {
        this.form = { ...existing };
      }
    } else {
      this.form.date = new Date().toISOString().substring(0, 10);
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
    if (!this.form.date?.trim()) {
      errors['date'] = 'Observation Date is required';
    }
    if (!this.form.time?.trim()) {
      errors['time'] = 'Observation Time is required';
    }
    if (!this.form.cardType?.trim()) {
      errors['cardType'] = 'Card Type is required';
    }
    if (!this.form.whatWasObserved?.trim()) {
      errors['whatWasObserved'] = 'What Was Observed is required';
    }
    if (!this.form.detailedDescription?.trim()) {
      errors['detailedDescription'] = 'Detailed Description is required';
    }
    if (!this.form.actionsTaken?.trim()) {
      errors['actionsTaken'] = 'Actions Taken / Follow-up is required';
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
      this.obsStore.update(this.recordId, this.form);
      this.notify.showSuccess(
        'Observation Updated',
        `Observation card for ${this.form.vesselName} (${this.form.cardType}) was successfully updated.`
      );
    } else {
      const created = this.obsStore.create(this.form);
      this.notify.showSuccess(
        'Observation Submitted',
        `Observation card for ${this.form.vesselName} (${created.id}) was successfully saved.`
      );
    }

    this.router.navigate(['/safe-observations']);
  }
}
