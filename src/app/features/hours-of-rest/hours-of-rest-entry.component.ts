import { Component, OnInit, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../core/services/notification.service';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { 
  HoursOfRestStore, 
  calculatePeriodDuration, 
  evaluateDailyCompliance 
} from '../../core/stores/hours-of-rest.store';
import { 
  VesselCrewMember, 
  HoRPeriodEntry, 
  DailyCrewRestRecord, 
  HoRActivityType 
} from '../../core/models/hseq.models';

@Component({
  selector: 'app-hours-of-rest-entry',
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
    <div class="module-container" *ngIf="crew() as c">
      <!-- Page Navigation Header -->
      <app-page-header
        [title]="isViewMode() ? 'View Hours of Rest Record' : 'Enter Hours of Rest'"
        [subtitle]="c.name + ' • ' + c.rank + ' • ' + c.vesselName + ' • ' + formattedDate()"
        icon="schedule"
        [breadcrumbs]="[
          { label: 'Overview', link: '/dashboard' },
          { label: 'Hours of Rest Register', link: '/hours-of-rest' },
          { label: isViewMode() ? 'View Record' : 'Enter Hours' }
        ]">
        <div actions class="d-flex align-items-center gap-2">
          <button mat-stroked-button class="btn-back" routerLink="/hours-of-rest">
            <mat-icon>arrow_back</mat-icon> Back to Register
          </button>

          @if (isViewMode()) {
            <button mat-flat-button color="primary" class="btn-primary-action" (click)="switchToEdit()">
              <mat-icon>edit</mat-icon> Edit Hours
            </button>
          } @else {
            <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveRecord()">
              <mat-icon>save</mat-icon> Save Record
            </button>
          }
        </div>
      </app-page-header>

      <!-- 1. CREW DETAILS CARD -->
      <div class="hseq-card">
        <div class="card-header-bar">
          <div class="header-title-group">
            <mat-icon class="header-icon">badge</mat-icon>
            <div>
              <h3 class="header-title">Crew Member & Date Details</h3>
              <p class="header-sub">Statutory seafarer rest hours profile and compliance monitoring</p>
            </div>
          </div>
          <span class="mode-badge" [class.mode-view]="isViewMode()" [class.mode-edit]="!isViewMode()">
            {{ isViewMode() ? 'Read-Only Mode' : 'Editing Mode' }}
          </span>
        </div>

        <div class="crew-details-grid">
          <div class="detail-box">
            <span class="detail-label">Crew Name</span>
            <span class="detail-val font-semibold">{{ c.name }}</span>
          </div>

          <div class="detail-box">
            <span class="detail-label">Rank</span>
            <span class="detail-val">{{ c.rank }}</span>
          </div>

          <div class="detail-box">
            <span class="detail-label">Vessel</span>
            <span class="detail-val font-semibold">
              <mat-icon class="inline-boat">directions_boat</mat-icon>
              {{ c.vesselName }}
            </span>
          </div>

          <div class="detail-box">
            <span class="detail-label">Department</span>
            <span class="detail-val">{{ c.department }}</span>
          </div>

          <div class="detail-box">
            <span class="detail-label">Selected Date</span>
            <span class="detail-val font-mono font-bold">{{ formattedDate() }}</span>
          </div>

          <div class="detail-box">
            <span class="detail-label">Seafarer Book #</span>
            <span class="detail-val font-mono text-muted">{{ c.seafarerId || 'SB-88201' }}</span>
          </div>
        </div>
      </div>

      <!-- 2. AUTO CALCULATIONS & COMPLIANCE SUMMARY CARD -->
      <div class="hseq-card calculations-card">
        <div class="calc-row">
          <!-- Total Work Hours -->
          <div class="calc-metric-box">
            <span class="metric-label">Total Work Hours</span>
            <span class="metric-value font-mono text-primary">{{ calculations().totalWorkHours }} hrs</span>
            <span class="metric-sub">Max permitted: 14.0 hrs</span>
          </div>

          <!-- Total Rest Hours -->
          <div class="calc-metric-box">
            <span class="metric-label">Total Rest Hours</span>
            <span 
              class="metric-value font-mono" 
              [class.text-green]="calculations().totalRestHours >= 10.0" 
              [class.text-red]="calculations().totalRestHours < 10.0">
              {{ calculations().totalRestHours }} hrs
            </span>
            <span class="metric-sub">Min required: 10.0 hrs</span>
          </div>

          <!-- Compliance Status -->
          <div class="calc-status-box" [class.box-compliant]="calculations().complianceStatus === 'Compliant'" [class.box-non-compliant]="calculations().complianceStatus === 'Non-Compliant'">
            <div class="status-icon-wrap">
              <mat-icon>
                {{ calculations().complianceStatus === 'Compliant' ? 'verified' : 'report_problem' }}
              </mat-icon>
            </div>
            <div class="status-content">
              <span class="status-title">
                {{ calculations().complianceStatus === 'Compliant' ? 'Compliant' : 'Non-Compliant' }}
              </span>
              <span class="status-desc">
                @if (calculations().complianceStatus === 'Compliant') {
                  Satisfies STCW 2010 Section A-VIII/1 requirement (&ge; 10h rest in 24h period)
                } @else {
                  {{ calculations().violationMessage || 'Working hours breach minimum STCW 10 hours rest mandate' }}
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. WORK & REST PERIODS ENTRY TABLE -->
      <div class="hseq-card">
        <div class="card-header-bar">
          <div class="header-title-group">
            <mat-icon class="header-icon">more_time</mat-icon>
            <div>
              <h3 class="header-title">
                {{ isViewMode() ? 'Recorded Work & Rest Periods' : 'Enter Work & Rest Periods' }}
              </h3>
              <p class="header-sub">
                Enter watch and rest times for {{ formattedDate() }}. Work and rest hours calculate automatically.
              </p>
            </div>
          </div>

          <!-- Quick Presets (Only in Edit Mode) -->
          @if (!isViewMode()) {
            <div class="presets-group">
              <span class="preset-label">Quick Patterns:</span>
              <button type="button" class="btn-preset" (click)="applyExamplePreset()">
                Example: 06:00-12:00 Work / 12:00-14:00 Rest...
              </button>
              <button type="button" class="btn-preset" (click)="applyStandardDayPreset()">
                Standard 8h Day
              </button>
              <button type="button" class="btn-preset" (click)="applyFullRestPreset()">
                Full Rest Day
              </button>
            </div>
          }
        </div>

        <div class="card-body">
          <div class="table-responsive">
            <table class="hseq-table periods-table">
              <thead>
                <tr>
                  <th style="width: 70px;">#</th>
                  <th style="width: 220px;">Start Time</th>
                  <th style="width: 220px;">End Time</th>
                  <th style="width: 160px;">Duration</th>
                  <th style="width: 240px;">Activity Type</th>
                  @if (!isViewMode()) {
                    <th class="col-actions" style="width: 100px;">Action</th>
                  }
                </tr>
              </thead>
              <tbody>
                @if (periods().length > 0) {
                  @for (period of periods(); track period.id; let idx = $index) {
                    <tr>
                      <!-- Row # -->
                      <td class="font-mono font-bold text-muted">
                        {{ idx + 1 }}
                      </td>

                      <!-- Start Time -->
                      <td>
                        @if (!isViewMode()) {
                          <input 
                            type="time" 
                            [(ngModel)]="period.startTime" 
                            (ngModelChange)="onPeriodTimeChange(period)"
                            class="time-input" 
                            step="1800" />
                        } @else {
                          <span class="font-mono font-bold font-md">{{ period.startTime }}</span>
                        }
                      </td>

                      <!-- End Time -->
                      <td>
                        @if (!isViewMode()) {
                          <input 
                            type="time" 
                            [(ngModel)]="period.endTime" 
                            (ngModelChange)="onPeriodTimeChange(period)"
                            class="time-input" 
                            step="1800" />
                        } @else {
                          <span class="font-mono font-bold font-md">{{ period.endTime }}</span>
                        }
                      </td>

                      <!-- Duration (Auto calculated) -->
                      <td>
                        <span class="duration-pill font-mono font-bold">
                          {{ period.durationHours }} hrs
                        </span>
                      </td>

                      <!-- Activity Type (Work / Rest) -->
                      <td>
                        @if (!isViewMode()) {
                          <select 
                            [(ngModel)]="period.activityType" 
                            (ngModelChange)="onActivityTypeChange()"
                            class="activity-select"
                            [class.select-work]="period.activityType === 'Work'"
                            [class.select-rest]="period.activityType === 'Rest'">
                            <option value="Work">Work</option>
                            <option value="Rest">Rest</option>
                          </select>
                        } @else {
                          <span 
                            class="activity-pill font-semibold"
                            [class.pill-work]="period.activityType === 'Work'"
                            [class.pill-rest]="period.activityType === 'Rest'">
                            <mat-icon class="act-icon">
                              {{ period.activityType === 'Work' ? 'engineering' : 'hotel' }}
                            </mat-icon>
                            {{ period.activityType }}
                          </span>
                        }
                      </td>

                      <!-- Action (Delete in Edit mode) -->
                      @if (!isViewMode()) {
                        <td class="col-actions">
                          <button 
                            type="button" 
                            class="btn-del-row" 
                            (click)="removePeriod(idx)" 
                            title="Remove row">
                            <mat-icon>delete_outline</mat-icon>
                          </button>
                        </td>
                      }
                    </tr>
                  }
                } @else {
                  <tr>
                    <td [attr.colspan]="isViewMode() ? 5 : 6" class="text-center py-4 text-muted">
                      No periods entered yet. Click "+ Add Period" to define duty and rest times.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Add Period Button (Edit Mode Only) -->
          @if (!isViewMode()) {
            <div class="table-footer-actions">
              <button type="button" class="btn-add-period" (click)="addPeriod()">
                <mat-icon>add_circle_outline</mat-icon>
                <span>Add Period</span>
              </button>
              <div class="footer-tip-wrap">
                <mat-icon class="tip-icon">info_outline</mat-icon>
                <span>Enter duty watches as "Work" and break/sleep intervals as "Rest".</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- 4. REMARKS & JUSTIFICATION CARD -->
      <div class="hseq-card">
        <div class="card-header-bar">
          <div class="header-title-group">
            <mat-icon class="header-icon">notes</mat-icon>
            <div>
              <h3 class="header-title">Remarks & Operational Notes</h3>
              <p class="header-sub">Document reasons for non-routine watchkeeping, overtime, or emergency drills</p>
            </div>
          </div>
        </div>

        <div class="card-body">
          @if (!isViewMode()) {
            <textarea 
              [(ngModel)]="remarks" 
              rows="3" 
              placeholder="Enter operational remarks, reason for overtime or emergency duties..."
              class="form-textarea">
            </textarea>
          } @else {
            <p class="remarks-view-text font-sm">
              {{ remarks || 'No remarks recorded for this date.' }}
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-container {
      padding: 24px;
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: var(--font-sans);
    }

    /* Cards */
    .hseq-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-2xs);
      overflow: hidden;
    }

    .card-header-bar {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: var(--muted-background, rgba(0, 0, 0, 0.015));
      flex-wrap: wrap;
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--primary);
    }

    .header-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .header-sub {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 2px 0 0;
    }

    .card-body {
      padding: 20px;
    }

    /* Mode Badge */
    .mode-badge {
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mode-edit {
      background: rgba(220, 80, 20, 0.1);
      color: var(--primary);
      border: 1px solid rgba(220, 80, 20, 0.3);
    }

    .mode-view {
      background: rgba(2, 132, 199, 0.1);
      color: #0284c7;
      border: 1px solid rgba(2, 132, 199, 0.3);
    }

    /* Crew Details Grid */
    .crew-details-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      padding: 18px 20px;
      background: #fafafa;
    }

    .detail-box {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .detail-val {
      font-size: 13.5px;
      color: var(--foreground);
    }

    .inline-boat {
      font-size: 15px;
      width: 15px;
      height: 15px;
      vertical-align: -2px;
      color: var(--muted-foreground);
    }

    /* Calculations Card */
    .calculations-card {
      background: #ffffff;
    }

    .calc-row {
      display: grid;
      grid-template-columns: 200px 200px 1fr;
      gap: 18px;
      padding: 20px;
      align-items: stretch;
    }

    .calc-metric-box {
      background: var(--muted-background, #f8fafc);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .metric-label {
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--muted-foreground);
      letter-spacing: 0.4px;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 800;
      margin: 4px 0 2px;
    }

    .metric-sub {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .text-primary { color: var(--primary) !important; }
    .text-green { color: #16a34a !important; }
    .text-red { color: #dc2626 !important; }

    /* Compliance Banner */
    .calc-status-box {
      border-radius: var(--radius-sm);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid transparent;
    }

    .box-compliant {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    .box-non-compliant {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .status-icon-wrap mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .status-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.2px;
    }

    .status-desc {
      font-size: 12.5px;
      line-height: 1.35;
      color: inherit;
      opacity: 0.9;
    }

    /* Quick Presets */
    .presets-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .preset-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--muted-foreground);
    }

    .btn-preset {
      font-size: 11.5px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--foreground);
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .btn-preset:hover {
      background: var(--sidebar-accent);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Periods Table */
    .periods-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;
    }

    .periods-table th {
      padding: 10px 14px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted-foreground);
      background: var(--muted-background, #f8fafc);
      border-bottom: 1px solid var(--border);
    }

    .periods-table td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .time-input {
      height: 38px;
      padding: 0 10px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: #ffffff;
      font-family: var(--font-mono);
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      outline: none;
      width: 160px;
    }

    .time-input:focus {
      border-color: var(--primary);
    }

    .duration-pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--muted);
      color: var(--foreground);
      font-size: 12.5px;
    }

    .activity-select {
      height: 38px;
      padding: 0 32px 0 12px;
      border-radius: 4px;
      border: 1px solid var(--border);
      background-color: #ffffff;
      font-size: 13.5px;
      font-weight: 600;
      outline: none;
      width: 180px;
      cursor: pointer;
      appearance: none !important;
      -webkit-appearance: none !important;
    }

    .select-work {
      color: #b91c1c;
      border-color: #fca5a5;
    }

    .select-rest {
      color: #15803d;
      border-color: #86efac;
    }

    .activity-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
    }

    .pill-work {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .pill-rest {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .act-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .btn-del-row {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
    }

    .btn-del-row:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .table-footer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .btn-add-period {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 16px;
      height: 36px;
      width: auto !important;
      border-radius: var(--radius-sm);
      border: 1px solid var(--primary);
      background: rgba(234, 88, 12, 0.06);
      color: var(--primary);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .btn-add-period:hover {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .btn-add-period mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .footer-tip-wrap {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--muted-foreground);
      font-size: 12px;
    }

    .tip-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    /* Remarks Textarea */
    .form-textarea {
      width: 100%;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-family: var(--font-sans);
      font-size: 13.5px;
      outline: none;
      resize: vertical;
    }

    .form-textarea:focus {
      border-color: var(--primary);
    }

    .remarks-view-text {
      color: var(--foreground);
      line-height: 1.5;
      margin: 0;
    }

    /* Footer Bar */
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-top: 8px;
    }

    .btn-back, .btn-cancel {
      height: 40px !important;
      padding: 0 16px !important;
      font-size: 13.5px !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      color: var(--foreground) !important;
      font-weight: 600 !important;
      border-radius: var(--radius-sm) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      box-shadow: var(--shadow-2xs) !important;
      transition: all 0.15s ease !important;
    }

    .btn-back:hover, .btn-cancel:hover {
      background: var(--accent) !important;
      border-color: var(--border) !important;
      color: var(--foreground) !important;
    }

    .btn-primary-action {
      height: 40px !important;
      padding: 0 16px !important;
      font-size: 13.5px !important;
      font-weight: 600 !important;
      background: var(--primary) !important;
      color: #ffffff !important;
      border-radius: var(--radius-sm) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      border: none !important;
      box-shadow: var(--shadow-sm) !important;
      transition: all 0.15s ease !important;
    }

    .btn-primary-action:hover {
      opacity: 0.92 !important;
      transform: translateY(-1px) !important;
    }

    .btn-back mat-icon,
    .btn-cancel mat-icon,
    .btn-primary-action mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    @media (max-width: 900px) {
      .crew-details-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .calc-row {
        grid-template-columns: 1fr 1fr;
      }
      .calc-status-box {
        grid-column: span 2;
      }
    }
  `]
})
export class HoursOfRestEntryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly store = inject(HoursOfRestStore);
  readonly state = inject(HseqStateService);
  private notify = inject(NotificationService);

  readonly crewId = signal<string>('');
  readonly selectedDate = signal<string>('2026-10-05');
  readonly isViewMode = signal<boolean>(false);

  // Local state for period editing
  readonly periods = signal<HoRPeriodEntry[]>([]);
  remarks: string = '';

  // Active crew entity
  readonly crew = computed<VesselCrewMember | undefined>(() => {
    return this.state.crewMembers().find(c => c.id === this.crewId());
  });

  // Formatted date string (e.g. "05-Oct-2026")
  readonly formattedDate = computed(() => {
    const raw = this.selectedDate();
    if (!raw) return '';
    const [y, m, d] = raw.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d}-${monthName}-${y}`;
  });

  // Real-time calculations
  readonly calculations = computed(() => {
    return evaluateDailyCompliance(this.periods());
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const cId = params.get('crewId');
      if (cId) {
        this.crewId.set(cId);
      } else {
        // Fallback to first available crew
        const first = this.state.crewMembers()[0];
        if (first) this.crewId.set(first.id);
      }
    });

    this.route.queryParamMap.subscribe(queryParams => {
      const qDate = queryParams.get('date');
      const qMode = queryParams.get('mode');

      if (qDate) {
        this.selectedDate.set(qDate);
      } else {
        this.selectedDate.set(this.store.selectedDate());
      }

      this.isViewMode.set(qMode === 'view');

      this.loadExistingRecord();
    });
  }

  private loadExistingRecord() {
    const cId = this.crewId();
    const d = this.selectedDate();
    const existing = this.store.getRecord(cId, d);

    if (existing) {
      this.periods.set(existing.periods.map(p => ({ ...p })));
      this.remarks = existing.remarks || '';
    } else {
      // Default initial periods (using prompt's exact example: 06:00-12:00 Work, 12:00-14:00 Rest, 14:00-18:00 Work, 18:00-24:00 Rest)
      this.applyExamplePreset();
      this.remarks = '';
    }
  }

  onPeriodTimeChange(period: HoRPeriodEntry) {
    period.durationHours = calculatePeriodDuration(period.startTime, period.endTime);
    this.periods.update(list => [...list]);
  }

  onActivityTypeChange() {
    this.periods.update(list => [...list]);
  }

  addPeriod() {
    const cur = this.periods();
    let start = '08:00';
    let end = '12:00';

    if (cur.length > 0) {
      const last = cur[cur.length - 1];
      start = last.endTime === '24:00' ? '00:00' : last.endTime;
      end = start === '12:00' ? '14:00' : '18:00';
    }

    const newPeriod: HoRPeriodEntry = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      startTime: start,
      endTime: end,
      activityType: 'Work',
      durationHours: calculatePeriodDuration(start, end)
    };

    this.periods.update(list => [...list, newPeriod]);
  }

  removePeriod(index: number) {
    this.periods.update(list => list.filter((_, i) => i !== index));
  }

  applyExamplePreset() {
    // Exact example from user prompt:
    // 06:00 - 12:00 Work
    // 12:00 - 14:00 Rest
    // 14:00 - 18:00 Work
    // 18:00 - 24:00 Rest
    this.periods.set([
      { id: 'p1', startTime: '06:00', endTime: '12:00', activityType: 'Work', durationHours: 6.0 },
      { id: 'p2', startTime: '12:00', endTime: '14:00', activityType: 'Rest', durationHours: 2.0 },
      { id: 'p3', startTime: '14:00', endTime: '18:00', activityType: 'Work', durationHours: 4.0 },
      { id: 'p4', startTime: '18:00', endTime: '24:00', activityType: 'Rest', durationHours: 6.0 }
    ]);
  }

  applyStandardDayPreset() {
    this.periods.set([
      { id: 'p1', startTime: '08:00', endTime: '12:00', activityType: 'Work', durationHours: 4.0 },
      { id: 'p2', startTime: '12:00', endTime: '13:00', activityType: 'Rest', durationHours: 1.0 },
      { id: 'p3', startTime: '13:00', endTime: '17:00', activityType: 'Work', durationHours: 4.0 },
      { id: 'p4', startTime: '17:00', endTime: '24:00', activityType: 'Rest', durationHours: 7.0 },
      { id: 'p5', startTime: '00:00', endTime: '08:00', activityType: 'Rest', durationHours: 8.0 }
    ]);
  }

  applyFullRestPreset() {
    this.periods.set([
      { id: 'p1', startTime: '00:00', endTime: '24:00', activityType: 'Rest', durationHours: 24.0 }
    ]);
  }

  resetToDefaults() {
    this.applyExamplePreset();
    this.remarks = '';
  }

  switchToEdit() {
    this.isViewMode.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit' },
      queryParamsHandling: 'merge'
    });
  }

  saveRecord() {
    const c = this.crew();
    if (!c) return;

    const calc = this.calculations();
    const record: DailyCrewRestRecord = {
      id: `HOR-${c.id}-${this.selectedDate()}`,
      crewId: c.id,
      crewName: c.name,
      rank: c.rank,
      department: c.department,
      vesselId: c.vesselId,
      vesselName: c.vesselName,
      date: this.selectedDate(),
      periods: this.periods(),
      totalWorkHours: calc.totalWorkHours,
      totalRestHours: calc.totalRestHours,
      complianceStatus: calc.complianceStatus,
      recordStatus: 'Entered',
      remarks: this.remarks
    };

    this.store.saveRecord(record);
    this.notify.showSuccess(
      'Hours of Rest Saved', 
      `Record for ${c.name} on ${this.formattedDate()} successfully saved (${calc.complianceStatus}).`
    );

    // Switch to view mode
    this.isViewMode.set(true);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'view' },
      queryParamsHandling: 'merge'
    });
  }
}
