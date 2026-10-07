import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ChartWrapperComponent, ChartDataPoint } from '../../shared/components/chart-wrapper/chart-wrapper.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
    StatCardComponent,
    ChartWrapperComponent
  ],
  template: `
    <div class="reports-container">
      <app-page-header
        title="Fleet HSEQ Intelligence & Executive Reports"
        subtitle="Consolidated audit trends, incident frequencies, statutory certifications, and fleet safety KPIs for executive review"
        icon="analytics"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Executive Reports'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button class="btn-export" (click)="exportReport('PDF')">
            <mat-icon>picture_as_pdf</mat-icon> Executive Pack (PDF)
          </button>
          <button mat-stroked-button class="btn-export" (click)="exportReport('Excel')">
            <mat-icon>table_view</mat-icon> Raw Analytics (Excel)
          </button>
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="generateStatutorySummary()">
            <mat-icon>verified</mat-icon> Statutory Summary
          </button>
        </div>
      </app-page-header>

      <!-- Executive Filter Ribbon -->
      <div class="hseq-card filter-ribbon mb-4">
        <div class="filter-ribbon-grid">
          <div class="filter-control-box">
            <label class="filter-lbl">Reporting Period</label>
            <select [(ngModel)]="dateRange" (ngModelChange)="onFilterChange()" class="custom-select">
              <option value="30d">Last 30 Days (Current Month)</option>
              <option value="90d">Last 90 Days (Quarter to Date)</option>
              <option value="ytd">Year to Date 2026 (YTD)</option>
              <option value="12m">Trailing 12 Months</option>
            </select>
          </div>

          <div class="filter-control-box">
            <label class="filter-lbl">Vessel / Asset Filter</label>
            <select [(ngModel)]="selectedVessel" (ngModelChange)="onFilterChange()" class="custom-select">
              <option value="ALL">All Vessels (Full Fleet)</option>
              <option *ngFor="let v of state.vessels()" [value]="v.id">
                {{ v.name }} ({{ v.vesselType }})
              </option>
            </select>
          </div>

          <div class="filter-control-box">
            <label class="filter-lbl">HSEQ Module Focus</label>
            <select [(ngModel)]="selectedModule" (ngModelChange)="onFilterChange()" class="custom-select">
              <option value="ALL">All 8 Integrated Modules</option>
              <option value="Incidents">Safety Incidents & Near Misses</option>
              <option value="Inspections">Inspections & Audits</option>
              <option value="CAPA">Universal CAPA Tracker</option>
              <option value="Permits">High-Risk Permits & JSA</option>
              <option value="Certificates">Statutory Certificates</option>
            </select>
          </div>

          <div class="filter-reset-box">
            <button mat-button class="btn-reset" (click)="resetFilters()">
              <mat-icon>restart_alt</mat-icon> Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Executive Scorecard Top Metrics -->
      <div class="kpi-grid mb-4">
        <app-stat-card
          label="Lost Time Injury Frequency (LTIF)"
          value="0.00"
          icon="personal_injury"
          iconBgColor="#ecfdf5"
          iconColor="#059669"
          trendText="Zero LTIs"
          [trendPositive]="true"
          subtext="Industry benchmark: < 0.20">
        </app-stat-card>

        <app-stat-card
          label="Total Recordable Case Freq (TRCF)"
          value="0.78"
          icon="health_and_safety"
          iconBgColor="#ffedd5"
          iconColor="oklch(0.6420 0.1691 38.5815)"
          trendText="-12% vs last yr"
          [trendPositive]="true"
          subtext="Per million man-hours">
        </app-stat-card>

        <app-stat-card
          label="Proactive Reporting Ratio"
          value="6.0 : 1"
          icon="equalizer"
          iconBgColor="#fef3c7"
          iconColor="#d97706"
          trendText="High Hazard Awareness"
          [trendPositive]="true"
          subtext="Proactive cards vs incidents">
        </app-stat-card>

        <app-stat-card
          label="CAPA On-Time Closure"
          value="92%"
          icon="task_alt"
          iconBgColor="#f3e8ff"
          iconColor="#7e22ce"
          trendText="Target: 90%+"
          [trendPositive]="true"
          subtext="Average resolution: 14 days">
        </app-stat-card>
      </div>

      <!-- Charts Row 1: Safety Event Trends & CAPA Breakdown -->
      <div class="grid-2col mb-4">
        <!-- Safety Event Frequency (Bar Chart) -->
        <app-chart-wrapper
          title="Monthly Safety Event Frequency & Proactive Hazard Hunt"
          subtitle="Near Miss vs High/Major Incidents across recent operational months"
          icon="show_chart"
          type="bar"
          [data]="monthlyEventTrends()"
          primaryColor="oklch(0.6420 0.1691 38.5815)"
          [legendLabels]="[
            { label: 'Near Miss / Hazard Hunt', color: 'oklch(0.6420 0.1691 38.5815)' },
            { label: 'Target Ceiling', color: 'oklch(0.8452 0 0)' }
          ]"
          secondaryLegendLabel="Baseline Target">
        </app-chart-wrapper>

        <!-- CAPA Allocation & Status (Donut Chart) -->
        <app-chart-wrapper
          title="Universal CAPA Status & Ageing Profile"
          subtitle="Current distribution of corrective and preventive actions"
          icon="pie_chart"
          type="donut"
          [data]="capaStatusBreakdown()"
          centerMetric="100%"
          centerLabel="Monitored">
        </app-chart-wrapper>
      </div>

      <!-- Charts Row 2: Regulatory Compliance by Framework & Root Causes -->
      <div class="grid-2col mb-4">
        <!-- Regulatory Statutory Frameworks (Horizontal Bars) -->
        <app-chart-wrapper
          title="Regulatory & Statutory Framework Audit Compliance"
          subtitle="Scored adherence across international maritime standards"
          icon="verified"
          type="horizontal"
          [data]="regulatoryComplianceScores()"
          primaryColor="#059669">
        </app-chart-wrapper>

        <!-- Root Cause Categorization (Donut Chart) -->
        <app-chart-wrapper
          title="Incident & Defect Root Cause Categorization"
          subtitle="Contributing causal factors identified in 5-Why and SIRE audits"
          icon="psychology"
          type="donut"
          [data]="rootCauseData()"
          centerMetric="5-Why"
          centerLabel="Analysis">
        </app-chart-wrapper>
      </div>

      <!-- Fleet Vessel Safety Scorecard Table -->
      <div class="hseq-card mb-4">
        <div class="hseq-card-header">
          <div class="card-title-group">
            <mat-icon class="card-icon text-blue">directions_boat</mat-icon>
            <div>
              <h3 class="card-heading">Vessel Fleet Safety Performance Scorecard</h3>
              <span class="card-subheading">Aggregated safety ranking, audit findings, and risk clearance by vessel asset</span>
            </div>
          </div>
          <span class="status-badge badge-success">4/4 Vessels Meeting ISM Minimums</span>
        </div>

        <div class="hseq-card-body p-0">
          <div class="table-responsive">
            <table class="hseq-table">
              <thead>
                <tr>
                  <th>Vessel Asset</th>
                  <th>Type & Flag</th>
                  <th>Audit Vetting Score</th>
                  <th>Open Findings</th>
                  <th>Near Misses</th>
                  <th>Major Incidents</th>
                  <th>Live Permits</th>
                  <th>CAPA Closure %</th>
                  <th>Safety Grade</th>
                  <th class="text-right">Audit Dossier</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of filteredVesselTable()" class="clickable-row">
                  <td>
                    <strong class="text-sm font-bold block">{{ row.name }}</strong>
                    <span class="font-mono text-xs text-muted">IMO: {{ row.imoNumber }}</span>
                  </td>
                  <td>
                    <span class="vessel-type-tag">{{ row.vesselType }}</span>
                    <span class="text-xs text-muted block mt-1">{{ row.flag }}</span>
                  </td>
                  <td>
                    <div class="score-pill" [class.score-high]="row.auditScore >= 90">
                      {{ row.auditScore }}%
                    </div>
                  </td>
                  <td>
                    <span class="finding-badge" [class.finding-zero]="row.openFindings === 0">
                      {{ row.openFindings }} Open
                    </span>
                  </td>
                  <td>
                    <span class="font-bold text-xs">{{ row.nearMissCount }} logged</span>
                  </td>
                  <td>
                    <span *ngIf="row.incidentsCount === 0" class="text-green font-bold text-xs">0 (Target Zero)</span>
                    <span *ngIf="row.incidentsCount > 0" class="text-red font-bold text-xs">{{ row.incidentsCount }} Incident</span>
                  </td>
                  <td>
                    <span class="permit-tag">{{ row.activePermits }} Active</span>
                  </td>
                  <td>
                    <div class="capa-progress-wrap">
                      <span class="capa-pct-text">{{ row.capaClosureRate }}%</span>
                      <div class="mini-bar-track">
                        <div class="mini-bar-fill" [style.width.%]="row.capaClosureRate"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="grade-pill" [ngClass]="getGradeClass(row.safetyGrade)">
                      {{ row.safetyGrade }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button 
                      mat-stroked-button 
                      color="primary" 
                      class="btn-sm" 
                      (click)="viewVesselReport(row.name)">
                      Full Report
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filter-ribbon {
      padding: 16px 20px;
    }

    .filter-ribbon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) auto;
      gap: 16px;
      align-items: flex-end;
    }

    .filter-control-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-lbl {
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-reset-box {
      display: flex;
      align-items: center;
    }

    .btn-reset {
      color: #64748b !important;
      font-weight: 600 !important;
      font-size: 13px !important;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .card-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .text-blue { color: var(--primary); }
    .text-green { color: var(--primary); }
    .text-red { color: var(--destructive); }

    .card-heading {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .card-subheading {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }

    .vessel-type-tag {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary);
      background: var(--accent);
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }

    .score-pill {
      font-size: 13px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
      background: #f1f5f9;
      color: #334155;
    }

    .score-high {
      background: #ecfdf5;
      color: #059669;
    }

    .finding-badge {
      font-size: 11.5px;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .finding-zero {
      background: #d1fae5;
      color: #065f46;
    }

    .permit-tag {
      font-size: 11px;
      font-weight: 700;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .capa-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100px;
    }

    .capa-pct-text {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    .mini-bar-track {
      height: 6px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }

    .mini-bar-fill {
      height: 100%;
      background: #10b981;
      border-radius: 9999px;
    }

    .grade-pill {
      font-size: 12px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-block;
    }

    .grade-a-plus { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .grade-a { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .grade-b { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); border: 1px solid oklch(0.88 0.06 78); }

    .btn-sm {
      height: 32px !important;
      font-size: 12px !important;
      font-weight: 600 !important;
    }

    .btn-export {
      height: 40px !important;
      border-color: #cbd5e1 !important;
      color: #334155 !important;
      font-weight: 600 !important;
    }

    .mt-1 { margin-top: 2px; }
    .mb-4 { margin-bottom: 16px; }

    @media (max-width: 1024px) {
      .grid-2col {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportsComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  dateRange: string = 'ytd';
  selectedVessel: string = 'ALL';
  selectedModule: string = 'ALL';

  onFilterChange() {
    this.notify.showInfo('Filters Applied', `Updated analytics view for: ${this.getVesselName(this.selectedVessel)} (${this.dateRange.toUpperCase()})`);
  }

  resetFilters() {
    this.dateRange = 'ytd';
    this.selectedVessel = 'ALL';
    this.selectedModule = 'ALL';
    this.notify.showSuccess('Filters Reset', 'Displaying full fleet consolidated Year-to-Date intelligence.');
  }

  getVesselName(id: string): string {
    if (id === 'ALL') return 'Entire Fleet';
    const v = this.state.vessels().find(item => item.id === id);
    return v ? v.name : 'Vessel';
  }

  // Monthly Safety Trends
  readonly monthlyEventTrends = computed<ChartDataPoint[]>(() => {
    return [
      { label: 'May', value: 4, secondaryValue: 6, subtext: '4 Near Misses' },
      { label: 'Jun', value: 3, secondaryValue: 6, subtext: '3 Near Misses' },
      { label: 'Jul', value: 5, secondaryValue: 6, subtext: '5 Near Misses' },
      { label: 'Aug', value: 2, secondaryValue: 6, subtext: '2 Near Misses' },
      { label: 'Sep', value: 6, secondaryValue: 6, subtext: '6 Near Misses' },
      { label: 'Oct (Current)', value: 4, secondaryValue: 6, color: 'oklch(0.6420 0.1691 38.5815)', subtext: 'Target met' }
    ];
  });

  // CAPA Status Breakdown
  readonly capaStatusBreakdown = computed<ChartDataPoint[]>(() => {
    return [
      { label: 'Closed & Verified', value: 18, color: 'oklch(0.6420 0.1691 38.5815)' },
      { label: 'In Progress', value: 4, color: 'oklch(0.4138 0.0846 259.8759)' },
      { label: 'Verification Pending', value: 2, color: 'oklch(0.7859 0.1342 83.6986)' },
      { label: 'Open / Due Soon', value: 1, color: 'oklch(0.6368 0.2078 25.3313)' }
    ];
  });

  // Statutory Compliance Frameworks
  readonly regulatoryComplianceScores = computed<ChartDataPoint[]>(() => {
    return [
      { label: 'ISM Code Safety Management', value: 94, subtext: 'Audit Pass' },
      { label: 'ISPS Maritime Security Standard', value: 98, subtext: 'Audit Pass' },
      { label: 'MLC 2006 Seafarers Rights', value: 96, subtext: 'High Compliance' },
      { label: 'MARPOL Environmental Directives', value: 100, subtext: 'Zero Violations' },
      { label: 'OCIMF SIRE 2.0 Vetting Readiness', value: 92, subtext: 'Vetting Ready' }
    ];
  });

  // Root Cause Breakdown
  readonly rootCauseData = computed<ChartDataPoint[]>(() => {
    return [
      { label: 'Mechanical Wear & Tear', value: 38, color: 'oklch(0.6420 0.1691 38.5815)' },
      { label: 'PMS Interval Synchronization', value: 26, color: 'oklch(0.5430 0.0898 188.8802)' },
      { label: 'Worksite Ergonomics / Slips', value: 20, color: 'oklch(0.7425 0.1187 78.6641)' },
      { label: 'Crew Briefing Gap (Toolbox)', value: 16, color: 'oklch(0.6635 0.1069 76.8814)' }
    ];
  });

  // Vessel Table Data
  readonly filteredVesselTable = computed(() => {
    const list = this.state.vessels();
    const vFilter = this.selectedVessel;

    return list
      .filter(v => vFilter === 'ALL' || v.id === vFilter)
      .map(v => {
        let score = 91;
        let grade = 'A';
        let openFnd = 1;
        let nmCount = 2;
        let incCount = 0;
        let activePtw = 1;
        let capaRate = 92;

        if (v.id === 'VES-01') {
          score = 94;
          grade = 'A+';
          openFnd = 1;
          nmCount = 2;
          incCount = 0;
          activePtw = 1;
          capaRate = 94;
        } else if (v.id === 'VES-02') {
          score = 88;
          grade = 'A';
          openFnd = 1;
          nmCount = 1;
          incCount = 1;
          activePtw = 1;
          capaRate = 89;
        } else if (v.id === 'VES-03') {
          score = 92;
          grade = 'A+';
          openFnd = 0;
          nmCount = 1;
          incCount = 0;
          activePtw = 0;
          capaRate = 95;
        } else {
          score = 86;
          grade = 'B+';
          openFnd = 1;
          nmCount = 0;
          incCount = 0;
          activePtw = 0;
          capaRate = 85;
        }

        return {
          ...v,
          auditScore: score,
          safetyGrade: grade,
          openFindings: openFnd,
          nearMissCount: nmCount,
          incidentsCount: incCount,
          activePermits: activePtw,
          capaClosureRate: capaRate
        };
      });
  });

  getGradeClass(grade: string): string {
    if (grade === 'A+') return 'grade-a-plus';
    if (grade === 'A') return 'grade-a';
    return 'grade-b';
  }

  exportReport(format: 'PDF' | 'Excel') {
    const docName = `NAVIS_Fleet_HSEQ_Report_${this.dateRange.toUpperCase()}.${format === 'PDF' ? 'pdf' : 'xlsx'}`;
    this.notify.showSuccess(`Executive Report Generated (${format})`, `Downloading verified compliance report: ${docName}`);
  }

  generateStatutorySummary() {
    this.notify.showInfo('Statutory Registry Generated', '90-Day Survey Forecast & ISM Compliance certificate ledger prepared.');
  }

  viewVesselReport(vesselName: string) {
    this.notify.showInfo(`Vessel Dossier: ${vesselName}`, 'Full comprehensive vetting history and audit log loaded into preview.');
  }
}
