import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RiskMatrixDialogComponent } from '../../shared/components/risk-matrix-dialog/risk-matrix-dialog.component';
import { RiskLevel } from '../../core/models/hseq.models';

@Component({
  selector: 'app-safe-card-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDialogModule,
    PageHeaderComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Log Safety Observation / Safe Card"
        subtitle="Report proactive observations, unsafe conditions, or exercise Stop Work Authority (SWA)"
        icon="assignment_turned_in"
        [breadcrumbs]="[
          {label: 'Overview', link: '/dashboard'},
          {label: 'Safe Cards', link: '/safe-cards'},
          {label: 'New Observation'}
        ]">
      </app-page-header>

      <div class="hseq-card form-card">
        <form (ngSubmit)="submitObservation()">
          <!-- Observation Type Bar -->
          <div class="form-section mb-4">
            <label class="form-section-title">1. Select Observation Type</label>
            <div class="type-picker-grid">
              <div 
                *ngFor="let t of availableTypes" 
                class="type-choice-box" 
                [class.selected]="selectedType === t"
                (click)="selectedType = t">
                <mat-icon class="choice-icon">{{ getTypeIcon(t) }}</mat-icon>
                <span class="choice-label">{{ t }}</span>
              </div>
            </div>
          </div>

          <!-- Vessel & Location -->
          <div class="form-section mb-4">
            <label class="form-section-title">2. Occurrence Details & Location</label>
            <div class="form-grid-3">
              <div class="form-field-group">
                <label class="field-label">Vessel <span class="required">*</span></label>
                <select [(ngModel)]="vesselId" name="vessel" class="form-native-select" required>
                  <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }}</option>
                </select>
              </div>

              <div class="form-field-group">
                <label class="field-label">Department <span class="required">*</span></label>
                <select [(ngModel)]="department" name="dept" class="form-native-select">
                  <option *ngFor="let d of state.departments()" [value]="d.name">{{ d.name }}</option>
                </select>
              </div>

              <div class="form-field-group">
                <label class="field-label">Worksite / Exact Location <span class="required">*</span></label>
                <input type="text" [(ngModel)]="location" name="location" placeholder="e.g. Engine Room 2nd Deck, Galley..." class="form-native-input" required />
              </div>
            </div>
          </div>

          <!-- Anonymity Toggle & Reporter Details -->
          <div class="form-section mb-4">
            <div class="anon-toggle-bar">
              <div>
                <strong>Anonymous Reporting Mode</strong>
                <p class="text-xs text-muted mb-0">Enable if you wish to withhold personal identification details under the Company Fair Blame Culture Policy.</p>
              </div>
              <mat-slide-toggle [(ngModel)]="isAnonymous" name="anonToggle" color="primary"></mat-slide-toggle>
            </div>

            <div class="form-grid-2 mt-3" *ngIf="!isAnonymous">
              <div class="form-field-group">
                <label class="field-label">Reporter Name</label>
                <input type="text" [(ngModel)]="reporterName" name="repName" class="form-native-input" />
              </div>
              <div class="form-field-group">
                <label class="field-label">Rank / Designation</label>
                <input type="text" [(ngModel)]="reporterRank" name="repRank" placeholder="e.g. AB Seaman, 3rd Engineer..." class="form-native-input" />
              </div>
            </div>
          </div>

          <!-- Category, Risk Matrix & Description -->
          <div class="form-section mb-4">
            <label class="form-section-title">3. Observation Description & Risk Severity</label>
            <div class="form-grid-2 mb-3">
              <div class="form-field-group">
                <label class="field-label">Safety Category <span class="required">*</span></label>
                <select [(ngModel)]="category" name="cat" class="form-native-select">
                  <option value="PPE Use">PPE Use & Compliance</option>
                  <option value="Housekeeping">Housekeeping & Clear Walkways</option>
                  <option value="Electrical Safety">Electrical Safety</option>
                  <option value="Working Aloft">Working Aloft / Fall Protection</option>
                  <option value="Tools & Machinery">Tools, Guards & Machinery</option>
                  <option value="Situational Awareness">Situational Awareness</option>
                </select>
              </div>

              <div class="form-field-group">
                <label class="field-label">Calculated Risk Level</label>
                <div class="risk-selector-field" (click)="openRiskMatrixModal()">
                  <span class="risk-tag" [ngClass]="'tag-' + riskLevel.toLowerCase()">{{ riskLevel }} Risk</span>
                  <span class="click-hint"><mat-icon class="xs-icon">grid_on</mat-icon> Open 5x5 Matrix</span>
                </div>
              </div>
            </div>

            <div class="form-field-group mb-3">
              <label class="field-label">Detailed Observation Description <span class="required">*</span></label>
              <textarea 
                [(ngModel)]="description" 
                name="desc" 
                rows="3" 
                placeholder="Describe what you observed, what was done well, or what hazard was identified..." 
                class="form-native-textarea" 
                required>
              </textarea>
            </div>

            <div class="form-field-group mb-3">
              <label class="field-label">Immediate Control or Action Taken</label>
              <input 
                type="text" 
                [(ngModel)]="immediateAction" 
                name="action" 
                placeholder="e.g. Stopped work, barricaded area, reminded crew, notified Duty Officer..." 
                class="form-native-input" />
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-footer">
            <button type="button" mat-button routerLink="/safe-cards">Cancel</button>
            <button type="submit" mat-flat-button color="primary" class="btn-primary-action">
              <mat-icon>send</mat-icon> Submit Observation
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .form-card { padding: 26px 30px; max-width: 900px; margin: 0 auto; width: 100%; }
    .form-section-title { font-size: 13.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: block; }
    .type-picker-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }
    .type-choice-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
      transition: all 0.15s ease;
    }
    .type-choice-box:hover { background: var(--accent); border-color: var(--primary); }
    .type-choice-box.selected { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
    .choice-icon { font-size: 24px; width: 24px; height: 24px; }
    .choice-label { font-size: 11.5px; font-weight: 700; line-height: 1.2; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .form-field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 12px; font-weight: 700; color: #475569; }
    .required { color: #dc2626; }
    .form-native-select, .form-native-input, .form-native-textarea {
      height: 40px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0 12px;
      font-size: 13.5px;
      outline: none;
      background: #ffffff;
    }
    .form-native-textarea { height: auto; padding: 10px 12px; }
    .anon-toggle-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .risk-selector-field {
      height: 40px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      cursor: pointer;
    }
    .risk-tag { font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
    .tag-low { background: #d1fae5; color: #065f46; }
    .tag-medium { background: #fef3c7; color: #92400e; }
    .tag-high { background: #ffedd5; color: #9a3412; }
    .tag-critical { background: #fee2e2; color: #991b1b; }
    .click-hint { font-size: 11px; color: var(--primary); font-weight: 600; display: flex; align-items: center; gap: 4px; }
    .xs-icon { font-size: 16px; width: 16px; height: 16px; }
    .form-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    .mb-4 { margin-bottom: 20px; }
    .mb-3 { margin-bottom: 12px; }
    .mt-3 { margin-top: 12px; }
    .mb-0 { margin-bottom: 0; }
  `]
})
export class SafeCardCreateComponent {
  availableTypes = [
    'Safe Act',
    'Unsafe Condition',
    'Stop Work Authority (SWA)',
    'Hazard Hunt',
    'Positive Observation'
  ] as const;

  selectedType: typeof this.availableTypes[number] = 'Safe Act';
  vesselId: string = 'VES-01';
  department: string = 'Deck Department';
  location: string = '';
  isAnonymous: boolean = false;
  reporterName: string = 'Bosun D. Silva';
  reporterRank: string = 'Bosun';
  category: string = 'PPE Use';
  riskLevel: RiskLevel = 'Low';
  description: string = '';
  immediateAction: string = '';

  constructor(
    public state: HseqStateService,
    private router: Router,
    private dialog: MatDialog,
    private notify: NotificationService
  ) {}

  getTypeIcon(t: string): string {
    if (t.includes('Safe') || t.includes('Positive')) return 'thumb_up';
    if (t.includes('Unsafe')) return 'warning';
    if (t.includes('Stop Work') || t.includes('SWA')) return 'pan_tool';
    return 'search';
  }

  openRiskMatrixModal() {
    const dialogRef = this.dialog.open(RiskMatrixDialogComponent, {
      width: '640px'
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res?.level) {
        this.riskLevel = res.level;
      }
    });
  }

  submitObservation() {
    const vessel = this.state.vessels().find(v => v.id === this.vesselId);
    this.state.addSafeCard({
      vesselId: this.vesselId,
      vesselName: vessel ? vessel.name : 'MV Pacific Voyager',
      department: this.department,
      location: this.location || 'Forward Deck',
      dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: this.selectedType as any,
      isAnonymous: this.isAnonymous,
      reporterName: this.isAnonymous ? 'Anonymous' : this.reporterName,
      category: this.category as any,
      description: this.description || 'Routine observation logged during walk-around',
      riskLevel: this.riskLevel,
      immediateActionTaken: this.immediateAction || 'Noted for toolbox discussion',
      positiveRecognitionFlag: this.selectedType === 'Positive Observation' || this.selectedType === 'Safe Act',
      status: 'Logged',
      attachments: []
    });

    this.notify.showSuccess('Observation Submitted', 'Safety observation successfully logged into fleet register.');
    this.router.navigate(['/safe-cards']);
  }
}
