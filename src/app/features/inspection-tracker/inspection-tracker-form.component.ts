import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';
import { InspectionStore } from '../../core/stores/inspection.store';
import { HseqStateService } from '../../core/services/hseq-state.service';

@Component({
  selector: 'app-inspection-tracker-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="isEdit() ? 'Edit Inspection Record' : 'Register Inspection'"
        [subtitle]="'Fleet Technical & Operational Audit Log — Internal Audits, Class Surveys & Vetting'"
        icon="fact_check"
        [breadcrumbs]="[{label: 'Inspection Tracker', link: '/inspection-tracker'}, {label: isEdit() ? 'Edit' : 'Create'}]">
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
        <!-- SECTION 1: ASSET & BASIC PARTICULARS -->
        <div class="form-section-title">
          <mat-icon class="sec-icon">directions_boat</mat-icon>
          <span>Vessel Asset & Timing Particulars</span>
        </div>
        <div class="form-grid">
          <!-- Vessel Name (Span 4) -->
          <div class="form-field span-4" [class.has-error]="fieldErrors()['vesselName']">
            <label>Vessel Asset <span class="required-star">*</span></label>
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

          <!-- Vessel Type (Span 3) -->
          <div class="form-field span-3">
            <label>Vessel Type</label>
            <select [(ngModel)]="form.vesselType" class="field-input">
              <option value="">-- Select Vessel Type --</option>
              @for (vt of state.vesselTypeNames(); track vt) {
                <option [value]="vt">{{ vt }}</option>
              }
            </select>
          </div>

          <!-- Takeover Date (Span 2) -->
          <div class="form-field span-2">
            <label>Takeover Date</label>
            <input type="date" [(ngModel)]="form.takeoverDate" class="field-input">
          </div>

          <!-- Audit Status (Span 3) -->
          <div class="form-field span-3" [class.has-error]="fieldErrors()['status']">
            <label>Inspection Status <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.status" 
              (ngModelChange)="clearError('status')"
              class="field-input"
              [class.input-error]="fieldErrors()['status']">
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
            </select>
            @if (fieldErrors()['status']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['status'] }}</span>
              </div>
            }
          </div>
        </div>

        <!-- SECTION 2: AUDIT PROGRAM & TIMING -->
        <div class="form-section-title mt-18">
          <mat-icon class="sec-icon">verified</mat-icon>
          <span>Inspection Program & Schedule Period</span>
        </div>
        <div class="form-grid">
          <!-- Inspection Category (Span 3) -->
          <div class="form-field span-3" [class.has-error]="fieldErrors()['inspectionCategory']">
            <label>Audit Type <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.inspectionCategory" 
              (ngModelChange)="clearError('inspectionCategory')"
              class="field-input"
              [class.input-error]="fieldErrors()['inspectionCategory']">
              <option value="Internal">Internal Audit</option>
              <option value="External">External Inspection</option>
            </select>
            @if (fieldErrors()['inspectionCategory']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['inspectionCategory'] }}</span>
              </div>
            }
          </div>

          <!-- Inspection Type / Program Name (Span 3) -->
          <div class="form-field span-3" [class.has-error]="fieldErrors()['inspectionType']">
            <label>Inspection Program <span class="required-star">*</span></label>
            <select 
              [(ngModel)]="form.inspectionType" 
              (ngModelChange)="clearError('inspectionType')"
              class="field-input"
              [class.input-error]="fieldErrors()['inspectionType']">
              <option value="">-- Select Program --</option>
              <option value="Annual Class Survey">Annual Class Survey</option>
              <option value="SIRE 2.0 Vetting Inspection">SIRE 2.0 Vetting Inspection</option>
              <option value="Port State Control (PSC MOU)">Port State Control (PSC)</option>
              <option value="ISM Safety Management Audit">ISM Safety Management Audit</option>
              <option value="ISPS Security Verification Audit">ISPS Security Audit</option>
              <option value="MLC 2006 Maritime Labour Inspection">MLC 2006 Inspection</option>
              <option value="NAVIGATIONAL AUDIT">Navigational Audit</option>
              <option value="CONDITION ASSESSMENT">Condition Assessment</option>
              <option value="CEHA">CEHA Technical Review</option>
              <option value="QSI">QSI Quality Survey</option>
              <option value="DRILL">Drill & Emergency Exercise</option>
            </select>
            @if (fieldErrors()['inspectionType']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['inspectionType'] }}</span>
              </div>
            }
          </div>

          <!-- Period (Span 3) -->
          <div class="form-field span-3" [class.has-error]="fieldErrors()['period']">
            <label>Audit Period <span class="required-star">*</span></label>
            <input 
              type="text" 
              [(ngModel)]="form.period" 
              (ngModelChange)="clearError('period')"
              placeholder="e.g. Q3 2026 (Jul–Sep)" 
              class="field-input"
              [class.input-error]="fieldErrors()['period']">
            @if (fieldErrors()['period']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['period'] }}</span>
              </div>
            }
          </div>

          <!-- Date of Inspection (Span 3) -->
          <div class="form-field span-3" [class.has-error]="fieldErrors()['dateOfInspection']">
            <label>Inspection Date <span class="required-star">*</span></label>
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
        </div>

        <!-- SECTION 3: AUDITOR / INSPECTOR PARTICULARS -->
        <div class="form-section-title mt-18">
          <mat-icon class="sec-icon">badge</mat-icon>
          <span>Auditor / Inspector Details & Score</span>
        </div>
        <div class="form-grid">
          <!-- PIC / Inspector Name (Span 4) -->
          <div class="form-field span-4" [class.has-error]="fieldErrors()['picName']">
            <label>Inspector Name(s) <span class="required-star">*</span></label>
            <input 
              type="text" 
              list="inspectorDatalist"
              [(ngModel)]="form.picName" 
              (ngModelChange)="onInspectorChange($event)"
              placeholder="e.g. Capt. J. Vance / Surveyor Vance" 
              class="field-input"
              [class.input-error]="fieldErrors()['picName']">
            <datalist id="inspectorDatalist">
              @for (ins of state.inspectors(); track ins.id) {
                <option [value]="ins.name">{{ ins.name }} ({{ ins.role }} - {{ ins.organization }})</option>
              }
            </datalist>
            @if (fieldErrors()['picName']) {
              <div class="field-error-msg">
                <mat-icon class="err-icon">error_outline</mat-icon>
                <span>{{ fieldErrors()['picName'] }}</span>
              </div>
            }
          </div>

          <!-- Inspector Type / Role (Span 3) -->
          <div class="form-field span-3">
            <label>Inspector Organization / Role</label>
            <select [(ngModel)]="form.picRole" class="field-input">
              <option>Classification Society</option>
              <option>Oil Major Vetting Inspector</option>
              <option>Port State Control (PSC Officer)</option>
              <option>HSEQ Lead Auditor</option>
              <option>Marine Superintendent</option>
              <option>Technical Superintendent</option>
              <option>External Independent Auditor</option>
            </select>
          </div>

          <!-- Score (%) (Span 2) -->
          <div class="form-field span-2">
            <label>Compliance (%)</label>
            <input type="number" [(ngModel)]="form.score" placeholder="95" class="field-input num" min="0" max="100">
          </div>

          <!-- Interval Days (Span 3) -->
          <div class="form-field span-3">
            <label>Interval (Days)</label>
            <input type="number" [(ngModel)]="form.intervalDays" placeholder="365" class="field-input num" min="1">
          </div>
        </div>

        <!-- SECTION 4: NEXT INSPECTION CYCLE -->
        <div class="form-section-title mt-18">
          <mat-icon class="sec-icon">event_repeat</mat-icon>
          <span>Next Inspection Cycle & Due Windows</span>
        </div>
        <div class="form-grid">
          <!-- Next Expected Due Date (Span 3) -->
          <div class="form-field span-3">
            <label>Next Due Date</label>
            <input type="date" [(ngModel)]="form.nextInspectionDate" class="field-input">
          </div>

          <!-- Due Window (Span 3) -->
          <div class="form-field span-3">
            <label>Due Window</label>
            <input type="text" [(ngModel)]="form.dueWindow" placeholder="e.g. Q3 2027 (Jul–Sep)" class="field-input">
          </div>

          <!-- Window Opening (Span 3) -->
          <div class="form-field span-3">
            <label>Window Opening Date</label>
            <input type="date" [(ngModel)]="form.windowOpening" class="field-input">
          </div>

          <!-- Status of Next Inspection (Span 3) -->
          <div class="form-field span-3">
            <label>Next Cycle Status</label>
            <select [(ngModel)]="form.statusNextInspection" class="field-input">
              <option value="Planned">Planned</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Window Open">Window Open</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        <!-- SECTION 5: FINDINGS COUNT BREAKDOWN -->
        <div class="form-section-title mt-18">
          <mat-icon class="sec-icon">analytics</mat-icon>
          <span>Findings & Closure Breakdown (Excel Synchronized)</span>
        </div>
        <div class="findings-compact-grid">
          <!-- Total Findings Card -->
          <div class="fc-card">
            <div class="fc-card-head">
              <span class="fc-title">Deficiencies Identified</span>
              <span class="fc-total-badge">
                Total: <strong>{{ calcFindingsTotal() }}</strong>
              </span>
            </div>
            <div class="fc-chips-row">
              <span class="fc-chip tag-high">High: <strong>{{ form.findingsHigh || 0 }}</strong></span>
              <span class="fc-chip tag-med">Medium: <strong>{{ form.findingsMedium || 0 }}</strong></span>
              <span class="fc-chip tag-low">Low: <strong>{{ form.findingsLow || 0 }}</strong></span>
            </div>
          </div>

          <!-- Closed Findings Card -->
          <div class="fc-card">
            <div class="fc-card-head">
              <span class="fc-title">Deficiencies Closed / Resolved</span>
              <span class="fc-total-badge success">
                Closed: <strong>{{ calcClosedTotal() }}</strong>
              </span>
            </div>
            <div class="fc-chips-row">
              <span class="fc-chip tag-chigh">High Closed: <strong>{{ form.closedHigh || 0 }}</strong></span>
              <span class="fc-chip tag-cmed">Med Closed: <strong>{{ form.closedMedium || 0 }}</strong></span>
              <span class="fc-chip tag-clow">Low Closed: <strong>{{ form.closedLow || 0 }}</strong></span>
            </div>
          </div>
        </div>

        <div class="fs-info-notice">
          <mat-icon>info</mat-icon>
          <span>Findings are managed inside the <strong>Child Findings Grid</strong>. Counts are automatically calculated from individual finding records and cannot be typed manually.</span>
        </div>

        <!-- FORM ACTIONS FOOTER -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" routerLink="/inspection-tracker">
            <mat-icon>arrow_back</mat-icon>
            <span>Cancel</span>
          </button>
          <button type="button" class="btn-submit" (click)="save()">
            <mat-icon>save</mat-icon>
            <span>{{ isEdit() ? 'Update Inspection' : 'Create Inspection' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container { padding: 16px 20px; max-width: 1080px; margin: 0 auto; }
    
    .form-error-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      margin-bottom: 14px;
      color: #991b1b;
      font-size: 12.5px;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.08);
    }
    .form-error-alert .alert-icon {
      color: #dc2626;
      font-size: 18px;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .form-error-alert .alert-content strong {
      display: block;
      margin-bottom: 4px;
      font-weight: 700;
    }
    .form-error-alert ul {
      margin: 0;
      padding-left: 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .form-error-alert li {
      font-size: 12px;
    }

    .form-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 18px 22px;
      box-shadow: var(--shadow-2xs);
    }
    .form-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .sec-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary);
    }
    .mt-18 { margin-top: 16px; }

    /* Responsive 12-Column Grid Layout */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 10px 12px;
      margin-bottom: 4px;
    }
    .span-12 { grid-column: span 12; }
    .span-6 { grid-column: span 6; }
    .span-5 { grid-column: span 5; }
    .span-4 { grid-column: span 4; }
    .span-3 { grid-column: span 3; }
    .span-2 { grid-column: span 2; }

    @media (max-width: 900px) {
      .form-grid {
        grid-template-columns: repeat(6, 1fr);
      }
      .span-5, .span-4, .span-3, .span-2 {
        grid-column: span 3;
      }
    }
    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .span-5, .span-4, .span-3, .span-2, .span-6 {
        grid-column: span 1;
      }
    }

    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; }
    .required-star { color: #dc2626; font-weight: 700; margin-left: 2px; }

    .field-input { 
      border: 1px solid var(--border); 
      border-radius: var(--radius-sm); 
      padding: 5px 9px; 
      font-size: 12.5px; 
      color: var(--foreground); 
      background: var(--background); 
      outline: none; 
      font-family: inherit;
      width: 100%;
      height: 33px;
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
    .field-error-msg {
      display: flex;
      align-items: center;
      gap: 3px;
      color: #dc2626;
      font-size: 11px;
      font-weight: 600;
      margin-top: 1px;
    }
    .field-error-msg .err-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
    }
    .num { text-align: center; }

    /* Findings Compact Side-by-Side Cards */
    .findings-compact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 6px;
    }
    @media (max-width: 680px) {
      .findings-compact-grid {
        grid-template-columns: 1fr;
      }
    }
    .fc-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
    }
    .fc-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .fc-title {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--foreground);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .fc-total-badge {
      font-size: 11px;
      background: var(--card);
      border: 1px solid var(--border);
      padding: 2px 7px;
      border-radius: 9999px;
      color: var(--muted-foreground);
    }
    .fc-total-badge strong {
      color: var(--foreground);
    }
    .fc-total-badge.success strong {
      color: oklch(0.38 0.15 145);
    }
    .fc-chips-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .fc-chip {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
    .tag-high { background: oklch(0.93 0.08 25 / 0.8); color: oklch(0.48 0.18 25); }
    .tag-med { background: oklch(0.94 0.07 70 / 0.8); color: oklch(0.48 0.16 65); }
    .tag-low { background: oklch(0.93 0.05 240 / 0.8); color: oklch(0.40 0.12 240); }
    .tag-chigh, .tag-cmed, .tag-clow { background: oklch(0.93 0.06 145 / 0.8); color: oklch(0.38 0.15 145); }

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
      margin-top: 10px;
      margin-bottom: 20px;
    }
    .fs-info-notice mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--primary); flex-shrink: 0; }

    /* Form Actions Bar with 12px Button Spacing */
    .form-actions { 
      display: flex; 
      gap: 12px; 
      justify-content: flex-end; 
      align-items: center; 
      padding-top: 16px; 
      border-top: 1px solid var(--border); 
      margin-top: 18px; 
    }
    .btn-cancel { 
      height: 34px;
      padding: 0 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-cancel:hover {
      background: var(--accent);
      border-color: var(--primary);
      color: var(--primary);
    }
    .btn-cancel mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .btn-submit { 
      height: 34px;
      padding: 0 16px;
      border-radius: var(--radius-sm);
      border: none;
      background: var(--primary);
      color: var(--primary-foreground);
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: var(--shadow-xs);
      transition: filter 0.15s ease;
    }
    .btn-submit:hover {
      filter: brightness(1.08);
    }
    .btn-submit mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `]
})
export class InspectionTrackerFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private inspectionStore = inject(InspectionStore);
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

  onInspectorChange(name: string): void {
    this.form.picName = name;
    this.clearError('picName');
    const matched = this.state.inspectors().find(i => i.name.toLowerCase() === name.toLowerCase());
    if (matched) {
      this.form.picRole = matched.role || matched.organization;
    }
  }

  form: any = { 
    vesselName: 'MV Pacific Voyager', 
    vesselType: 'Container Vessel', 
    inspectionCategory: 'External', 
    inspectionType: 'Annual Class Survey', 
    period: 'Q3 2026 (Jul–Sep)', 
    dateOfInspection: '', 
    nextInspectionDate: '', 
    takeoverDate: '10-Jan-2025', 
    picName: '', 
    picRole: 'Classification Society', 
    status: 'Open', 
    score: 95, 
    findingsHigh: 0, 
    findingsMedium: 0, 
    findingsLow: 0, 
    closedHigh: 0, 
    closedMedium: 0, 
    closedLow: 0,
    intervalDays: 365,
    dueWindow: 'Q3 2027 (Jul–Sep)',
    windowOpening: '',
    statusNextInspection: 'Planned'
  };

  calcFindingsTotal(): number {
    return (Number(this.form.findingsHigh) || 0) + (Number(this.form.findingsMedium) || 0) + (Number(this.form.findingsLow) || 0);
  }

  calcClosedTotal(): number {
    return (Number(this.form.closedHigh) || 0) + (Number(this.form.closedMedium) || 0) + (Number(this.form.closedLow) || 0);
  }

  ngOnInit(): void { 
    const id = this.route.snapshot.paramMap.get('id');
    const isEditing = this.route.snapshot.url.some(s => s.path === 'edit') || !!id;
    this.isEdit.set(isEditing);

    if (isEditing && id) {
      this.recordId = id;
      const existing = this.inspectionStore.getById(id);
      if (existing) {
        this.form = {
          ...existing,
          inspectionCategory: existing.typeOfInspection || existing.inspectionCategory || 'Internal',
          inspectionType: existing.categoryOfInspection || existing.inspectionType || 'Annual Class Survey',
          picName: existing.nameOfInspectors || existing.inspectorName || existing.picName || '',
          picRole: existing.typeOfInspectors || existing.inspectorType || existing.picRole || 'Classification Society',
          nextInspectionDate: existing.dueDate || existing.nextDue || existing.nextInspectionDate || '',
          intervalDays: existing.intervalDays || 365,
          dueWindow: existing.dueWindow || existing.windowPeriod || '',
          windowOpening: existing.windowOpening || '',
          statusNextInspection: existing.statusNextInspection || existing.statusNext || 'Planned'
        };
      }
    } else {
      this.form.dateOfInspection = new Date().toISOString().substring(0, 10);
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
      errors['vesselName'] = 'Vessel Asset is required';
    }
    if (!this.form.inspectionCategory?.trim()) {
      errors['inspectionCategory'] = 'Audit Type is required';
    }
    if (!this.form.inspectionType?.trim()) {
      errors['inspectionType'] = 'Inspection Program is required';
    }
    if (!this.form.period?.trim()) {
      errors['period'] = 'Period is required';
    }
    if (!this.form.dateOfInspection?.trim()) {
      errors['dateOfInspection'] = 'Inspection Date is required';
    }
    if (!this.form.picName?.trim()) {
      errors['picName'] = 'Inspector Name is required';
    }
    if (!this.form.status?.trim()) {
      errors['status'] = 'Inspection Status is required';
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

    // Synchronize aliases with Excel column names
    this.form.nameOfInspectors = this.form.picName;
    this.form.typeOfInspectors = this.form.picRole;
    this.form.typeOfInspection = this.form.inspectionCategory;
    this.form.categoryOfInspection = this.form.inspectionType;
    this.form.dueDate = this.form.nextInspectionDate;
    this.form.nextDue = this.form.nextInspectionDate;
    this.form.findingsTotal = this.calcFindingsTotal();
    this.form.closedTotal = this.calcClosedTotal();

    if (this.isEdit()) {
      this.inspectionStore.update(this.recordId, this.form);
      this.notify.showSuccess(
        'Inspection Updated',
        `Inspection record for ${this.form.vesselName} (${this.form.categoryOfInspection}) was successfully updated.`
      );
    } else {
      const created = this.inspectionStore.create(this.form);
      this.notify.showSuccess(
        'Inspection Created',
        `Inspection record for ${this.form.vesselName} (${created.id}) was successfully registered.`
      );
    }

    this.router.navigate(['/inspection-tracker']); 
  }
}
