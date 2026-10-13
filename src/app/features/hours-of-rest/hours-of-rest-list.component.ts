import { Component, computed, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NotificationService } from '../../core/services/notification.service';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { HoursOfRestStore } from '../../core/stores/hours-of-rest.store';
import { VesselCrewMember, DailyCrewRestRecord } from '../../core/models/hseq.models';

interface CrewRowViewModel {
  crew: VesselCrewMember;
  record?: DailyCrewRestRecord;
  hasRecord: boolean;
  totalWorkHours: number;
  totalRestHours: number;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Pending';
}

@Component({
  selector: 'app-hours-of-rest-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    MatButtonModule, 
    MatIconModule, 
    MatTooltipModule, 
    PageHeaderComponent, 
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Hours of Rest (HoR) Register"
        subtitle="Daily Maritime Working & Rest Hours Monitoring — STCW 2010 Section A-VIII/1 & MLC 2006"
        icon="schedule"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Hours of Rest Register'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportDailySummary()">
            <mat-icon>file_download</mat-icon> Export Daily Sheet
          </button>
        </div>
      </app-page-header>

      <!-- KPI Summary Cards (Matching PTW & Risk Assessment styling) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.04 230 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.12 230)">groups</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Total Crew Assigned</div>
            <div class="kpi-value">{{ kpis().totalCrew }}</div>
            <div class="kpi-sub">{{ store.selectedVessel() }} complement</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.93 0.05 145 / 0.5)">
            <mat-icon style="color: oklch(0.42 0.15 145)">verified</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Compliant Records</div>
            <div class="kpi-value text-green">{{ kpis().compliantCount }}</div>
            <div class="kpi-sub">&ge; 10h rest in 24h satisfied</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.92 0.06 25 / 0.5)">
            <mat-icon style="color: oklch(0.52 0.18 25)">report_problem</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Non-Compliant Records</div>
            <div class="kpi-value text-red">{{ kpis().nonCompliantCount }}</div>
            <div class="kpi-sub">Rest shortfall or excess duty</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background: oklch(0.94 0.05 85 / 0.5)">
            <mat-icon style="color: oklch(0.48 0.14 75)">pending_actions</mat-icon>
          </div>
          <div class="kpi-content">
            <div class="kpi-label">Pending Entries</div>
            <div class="kpi-value text-amber">{{ kpis().pendingCount }}</div>
            <div class="kpi-sub">Awaiting watch times entry</div>
          </div>
        </div>
      </div>

      <!-- PRIMARY SELECTION BAR (VESSEL, DATE, OPTIONAL DEPARTMENT) -->
      <div class="selection-card">
        <div class="selection-header">
          <div class="selection-title-group">
            <h3 class="selection-title">Select Monitoring Parameters</h3>
            <span class="selection-subtitle">Select vessel, date, and optional department to review crew rest records</span>
          </div>
        </div>

        <div class="filter-controls-row">
          <!-- 1. Vessel Selector -->
          <div class="filter-group flex-2">
            <label class="filter-label">
              <mat-icon class="label-ic">directions_boat</mat-icon> Vessel
            </label>
            <select 
              [ngModel]="store.selectedVessel()" 
              (ngModelChange)="store.selectedVessel.set($event)" 
              class="form-select">
              @for (v of state.vessels(); track v.id) {
                <option [value]="v.name">{{ v.name }} ({{ v.vesselType }})</option>
              }
            </select>
          </div>

          <!-- 2. Date Selector (Example: 05-Oct-2026) -->
          <div class="filter-group flex-2">
            <label class="filter-label">
              <mat-icon class="label-ic">calendar_today</mat-icon> Date: {{ formattedSelectedDate() }}
            </label>
            <div class="date-input-wrap">
              <button type="button" class="btn-date-nav" (click)="stepDay(-1)" title="Previous Day">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <input 
                type="date" 
                [ngModel]="store.selectedDate()" 
                (ngModelChange)="store.selectedDate.set($event)" 
                class="form-input date-input" />
              <button type="button" class="btn-date-nav" (click)="stepDay(1)" title="Next Day">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>

          <!-- 3. Department (Optional) -->
          <div class="filter-group flex-1">
            <label class="filter-label">
              <mat-icon class="label-ic">business</mat-icon> Department (Optional)
            </label>
            <select 
              [ngModel]="store.selectedDepartment()" 
              (ngModelChange)="store.selectedDepartment.set($event)" 
              class="form-select">
              <option value="ALL">All Departments</option>
              @for (d of state.departments(); track d.id) {
                <option [value]="d.name">{{ d.name }}</option>
              }
            </select>
          </div>

          <!-- Quick Search -->
          <div class="filter-group flex-1">
            <label class="filter-label">
              <mat-icon class="label-ic">search</mat-icon> Search Crew
            </label>
            <input 
              type="text" 
              [ngModel]="store.searchQuery()" 
              (ngModelChange)="store.searchQuery.set($event)" 
              placeholder="Search by name or rank..."
              class="form-input" />
          </div>
        </div>
      </div>

      <!-- CREW MEMBERS REGISTER TABLE (STRICTLY FOR SELECTED VESSEL & DATE) -->
      <div class="hseq-card">
        <div class="table-header-bar">
          <div class="header-left">
            <div class="table-title-group">
              <h3 class="table-title">Crew Members Assigned to {{ store.selectedVessel() }}</h3>
              <span class="table-badge">{{ crewRows().length }} Personnel</span>
              <span class="active-date-badge font-mono">{{ formattedSelectedDate() }}</span>
            </div>
          </div>
          <div class="header-right">
            <span class="compliance-note">
              <mat-icon class="note-icon">verified_user</mat-icon>
              STCW 2010 A-VIII/1: Min 10h Rest in 24h
            </span>
          </div>
        </div>

        @if (crewRows().length > 0) {
          <div class="table-responsive">
            <table class="hseq-table">
              <thead>
                <tr>
                  <th style="min-width: 240px;">Crew Name</th>
                  <th style="min-width: 170px;">Rank</th>
                  <th style="min-width: 180px;">Department</th>
                  <th style="min-width: 170px;">Record Status</th>
                  <th class="col-actions" style="min-width: 220px;">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of crewRows(); track item.crew.id) {
                  <tr class="crew-table-row">
                    <!-- Crew Name -->
                    <td>
                      <div class="crew-cell">
                        <div class="crew-avatar">{{ getInitials(item.crew.name) }}</div>
                        <div class="crew-info">
                          <strong class="crew-name">{{ item.crew.name }}</strong>
                          <span class="crew-seafarer-id text-xs text-muted font-mono">
                            {{ item.crew.seafarerId || 'ID: ' + item.crew.id }}
                          </span>
                        </div>
                      </div>
                    </td>

                    <!-- Rank -->
                    <td>
                      <span class="rank-badge">{{ item.crew.rank }}</span>
                    </td>

                    <!-- Department -->
                    <td>
                      <span class="dept-text">{{ item.crew.department }}</span>
                    </td>

                    <!-- Record Status -->
                    <td>
                      @if (item.hasRecord) {
                        @if (item.complianceStatus === 'Compliant') {
                          <span class="status-badge badge-compliant">
                            <mat-icon class="badge-icon">check_circle</mat-icon>
                            <span>Compliant ({{ item.totalRestHours }}h Rest)</span>
                          </span>
                        } @else {
                          <span class="status-badge badge-non-compliant" [matTooltip]="item.record?.remarks || 'Rest hours below STCW 10h threshold'">
                            <mat-icon class="badge-icon">warning</mat-icon>
                            <span>Non-Compliant ({{ item.totalRestHours }}h Rest)</span>
                          </span>
                        }
                      } @else {
                        <span class="status-badge badge-pending">
                          <mat-icon class="badge-icon">schedule</mat-icon>
                          <span>Pending / Not Logged</span>
                        </span>
                      }
                    </td>

                    <!-- Action Buttons: Enter Hours & View Record -->
                    <td class="col-actions">
                      <div class="action-btn-group">
                        <button 
                          type="button" 
                          class="btn-action-primary" 
                          (click)="onEnterHours(item.crew)"
                          title="Enter or edit working and rest periods for this date">
                          <mat-icon>edit_calendar</mat-icon>
                          <span>Enter Hours</span>
                        </button>

                        <button 
                          type="button" 
                          class="btn-action-secondary" 
                          [disabled]="!item.hasRecord"
                          (click)="onViewRecord(item.crew)"
                          [matTooltip]="item.hasRecord ? 'View read-only record details' : 'No record logged yet for this date'">
                          <mat-icon>visibility</mat-icon>
                          <span>View Record</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty-state
            icon="groups"
            title="No Crew Members Found"
            message="No crew members found matching the selected vessel and department filters."
            actionLabel="Reset Department Filter"
            (action)="store.selectedDepartment.set('ALL')">
          </app-empty-state>
        }
      </div>
    </div>
  `,
  styles: [`
    .module-container {
      padding: 24px;
      max-width: 1500px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: var(--font-sans);
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-2xs);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .kpi-icon-wrap {
      width: 46px;
      height: 46px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon-wrap mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .kpi-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--foreground);
      line-height: 1.2;
      font-family: var(--font-mono);
    }

    .kpi-sub {
      font-size: 11px;
      color: var(--muted-foreground);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-green { color: #16a34a !important; }
    .text-red { color: #dc2626 !important; }
    .text-amber { color: #d97706 !important; }

    /* Selection Card (Step 1) */
    .selection-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 22px;
      box-shadow: var(--shadow-2xs);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .selection-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .selection-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .selection-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .selection-subtitle {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .filter-controls-row {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group.flex-2 { flex: 2; min-width: 240px; }
    .filter-group.flex-1 { flex: 1.5; min-width: 180px; }

    .filter-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--foreground);
      display: flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .label-ic {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--muted-foreground);
    }

    .form-select, .form-input {
      height: 40px;
      padding: 0 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background-color: var(--card);
      color: var(--foreground);
      font-size: 13.5px;
      font-family: var(--font-sans);
      outline: none;
      transition: border-color 0.15s ease;
    }

    .form-select {
      padding-right: 32px !important;
      appearance: none !important;
      -webkit-appearance: none !important;
      cursor: pointer;
    }

    .form-select:focus, .form-input:focus {
      border-color: var(--primary);
    }

    .date-input-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .date-input {
      font-family: var(--font-mono);
      font-weight: 600;
      flex: 1;
    }

    .btn-date-nav {
      height: 40px;
      width: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
      background: var(--card);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--muted-foreground);
      transition: all 0.12s ease;
    }

    .btn-date-nav:hover {
      color: var(--primary);
      border-color: var(--primary);
      background: var(--sidebar-accent);
    }

    .btn-date-nav mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Table Card */
    .hseq-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-2xs);
      overflow: hidden;
    }

    .table-header-bar {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: var(--muted-background, rgba(0, 0, 0, 0.015));
      flex-wrap: wrap;
    }

    .table-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .table-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .table-badge {
      font-size: 11.5px;
      font-weight: 600;
      background: var(--muted);
      color: var(--muted-foreground);
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .active-date-badge {
      font-size: 12px;
      font-weight: 700;
      background: rgba(220, 80, 20, 0.1);
      color: var(--primary);
      padding: 2px 10px;
      border-radius: 4px;
      border: 1px solid rgba(220, 80, 20, 0.25);
    }

    .compliance-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #166534;
      font-weight: 600;
      background: #dcfce7;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #bbf7d0;
    }

    .note-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #16a34a;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .hseq-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }

    .hseq-table th {
      padding: 12px 16px;
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted-foreground);
      border-bottom: 1px solid var(--border);
      background: var(--muted-background, rgba(0, 0, 0, 0.02));
    }

    .hseq-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      color: var(--foreground);
      vertical-align: middle;
    }

    .crew-table-row:hover {
      background-color: var(--sidebar-accent, rgba(0, 0, 0, 0.02));
    }

    .crew-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .crew-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .crew-info {
      display: flex;
      flex-direction: column;
    }

    .crew-name {
      font-weight: 600;
      color: var(--foreground);
    }

    .rank-badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--muted);
      color: var(--foreground);
      border: 1px solid var(--border);
    }

    .dept-text {
      color: var(--muted-foreground);
      font-size: 13px;
    }

    /* Status Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .badge-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    .badge-compliant {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .badge-non-compliant {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }

    .badge-pending {
      background: var(--muted);
      color: var(--muted-foreground);
      border: 1px solid var(--border);
    }

    /* Actions */
    .col-actions {
      text-align: right;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-action-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
      font-weight: 600;
      background: var(--primary);
      color: #ffffff;
      border: 1px solid var(--primary);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-action-primary:hover {
      background: #c2410c;
      border-color: #c2410c;
    }

    .btn-action-primary mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .btn-action-secondary {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 12.5px;
      font-weight: 600;
      background: var(--card);
      color: var(--foreground);
      border: 1px solid var(--border);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-action-secondary:hover:not(:disabled) {
      background: var(--sidebar-accent);
      color: var(--primary);
      border-color: var(--primary);
    }

    .btn-action-secondary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .btn-action-secondary mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .btn-export {
      border: 1px solid var(--border);
      font-weight: 600;
      font-size: 13px;
    }

    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .filter-controls-row {
        flex-direction: column;
        align-items: stretch;
      }
    }

    @media (max-width: 640px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HoursOfRestListComponent {
  readonly state = inject(HseqStateService);
  readonly store = inject(HoursOfRestStore);
  private router = inject(Router);
  private notify = inject(NotificationService);

  // Formatted date string for display (e.g. "05-Oct-2026")
  readonly formattedSelectedDate = computed(() => {
    const raw = this.store.selectedDate();
    if (!raw) return '';
    const [y, m, d] = raw.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d}-${monthName}-${y}`;
  });

  // Strict list of crew assigned to the selected vessel & filtered by optional department / search
  readonly crewRows = computed<CrewRowViewModel[]>(() => {
    const vesselName = this.store.selectedVessel();
    const dept = this.store.selectedDepartment();
    const query = this.store.searchQuery().toLowerCase().trim();
    const date = this.store.selectedDate();

    // 1. Get crew strictly assigned to this vessel
    let list = this.state.getCrewByVessel(vesselName);

    // 2. Department filter
    if (dept && dept !== 'ALL') {
      list = list.filter(c => c.department.toLowerCase() === dept.toLowerCase());
    }

    // 3. Search query
    if (query) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.rank.toLowerCase().includes(query)
      );
    }

    // 4. Map to view model with daily record
    return list.map(crew => {
      const record = this.store.getRecord(crew.id, date);
      return {
        crew,
        record,
        hasRecord: !!record,
        totalWorkHours: record ? record.totalWorkHours : 0,
        totalRestHours: record ? record.totalRestHours : 0,
        complianceStatus: record ? record.complianceStatus : 'Pending'
      };
    });
  });

  // KPI calculations for current selection
  readonly kpis = computed(() => {
    const rows = this.crewRows();
    const totalCrew = rows.length;
    const compliantCount = rows.filter(r => r.hasRecord && r.complianceStatus === 'Compliant').length;
    const nonCompliantCount = rows.filter(r => r.hasRecord && r.complianceStatus === 'Non-Compliant').length;
    const pendingCount = rows.filter(r => !r.hasRecord).length;

    return {
      totalCrew,
      compliantCount,
      nonCompliantCount,
      pendingCount
    };
  });

  stepDay(delta: number) {
    const cur = new Date(this.store.selectedDate());
    if (isNaN(cur.getTime())) return;
    cur.setDate(cur.getDate() + delta);
    const y = cur.getFullYear();
    const m = (cur.getMonth() + 1).toString().padStart(2, '0');
    const d = cur.getDate().toString().padStart(2, '0');
    this.store.selectedDate.set(`${y}-${m}-${d}`);
  }

  getInitials(name: string): string {
    if (!name) return 'CR';
    const clean = name.replace(/^(Capt\.|Chief Officer|Chief Engineer|Bosun|AB|Fitter)\s+/i, '');
    const parts = clean.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  }

  onEnterHours(crew: VesselCrewMember) {
    this.router.navigate(['/hours-of-rest/entry', crew.id], {
      queryParams: { 
        date: this.store.selectedDate(),
        mode: 'edit'
      }
    });
  }

  onViewRecord(crew: VesselCrewMember) {
    this.router.navigate(['/hours-of-rest/entry', crew.id], {
      queryParams: { 
        date: this.store.selectedDate(),
        mode: 'view'
      }
    });
  }

  exportDailySummary() {
    this.notify.showSuccess(
      'Export Daily Summary', 
      `Generating daily Hours of Rest report for ${this.store.selectedVessel()} on ${this.formattedSelectedDate()}...`
    );
  }
}
