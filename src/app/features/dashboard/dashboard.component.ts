import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ChartWrapperComponent, ChartDataPoint } from '../../shared/components/chart-wrapper/chart-wrapper.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    StatCardComponent,
    StatusBadgeComponent,
    ChartWrapperComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- Welcome & Context Banner -->
      <div class="welcome-banner">
        <div class="welcome-content">
          <div class="safety-motto">
            <mat-icon class="motto-icon">health_and_safety</mat-icon>
            <span>TARGET ZERO ACCIDENTS &bull; FLEET SAFETY MANAGEMENT SYSTEM</span>
          </div>
          <h1 class="welcome-title">Fleet Operations & HSEQ Executive Dashboard</h1>
          <p class="welcome-desc">
            Displaying real-time safety metrics, statutory certificates, active high-risk permits, and consolidated CAPAs across all active vessels.
          </p>
        </div>
        <div class="banner-quick-actions">
          <button mat-flat-button color="primary" class="btn-quick-log" routerLink="/near-miss">
            <mat-icon>warning</mat-icon>
            <span>Near Miss Tracker</span>
          </button>
          <button mat-stroked-button class="btn-view-capa" routerLink="/near-miss/create">
            <mat-icon>add</mat-icon>
            <span>Report Near Miss</span>
          </button>
        </div>
      </div>

      <!-- Critical Alerts Bar (if any high-priority or expiring items) -->
      <div class="alert-strip" *ngIf="kpis().certificatesExpiring30Days > 0 || kpis().criticalFindingsCount > 0">
        <div class="alert-left">
          <mat-icon class="alert-icon">notification_important</mat-icon>
          <div class="alert-texts">
            <strong>Fleet Compliance Attention Required:</strong>
            <span>{{ kpis().certificatesExpiring30Days }} Statutory Certificates expiring within 30-45 days &bull; {{ kpis().criticalFindingsCount }} High/Critical Audit Findings pending closure</span>
          </div>
        </div>
        <div class="alert-buttons">
          <button mat-button class="btn-alert-link" routerLink="/certificates">View Certificates</button>
          <button mat-button class="btn-alert-link" routerLink="/capa">View CAPAs</button>
        </div>
      </div>

      <!-- Section: Executive KPI Grid (Covering all 8 mandatory domains) -->
      <div class="section-heading-row">
        <h2 class="section-title">Fleet Key Performance Indicators</h2>
        <span class="section-subtitle">Real-time status across statutory compliance, audits & operational risk</span>
      </div>

      <div class="kpi-grid">
        <!-- 1. Open Incidents -->
        <app-stat-card
          label="Open Incidents"
          [value]="kpis().incidentsCount"
          icon="report_problem"
          iconBgColor="#fee2e2"
          iconColor="#dc2626"
          trendText="1 Under 5-Why"
          [trendPositive]="false"
          [isAlert]="kpis().incidentsCount > 0"
          subtext="MT Nordic Titan (Boiler)">
        </app-stat-card>

        <!-- 2. Open CAPAs -->
        <app-stat-card
          label="Open CAPA Tracker"
          [value]="kpis().openCapas"
          icon="task_alt"
          iconBgColor="#fef3c7"
          iconColor="#d97706"
          trendText="92% On-time"
          [trendPositive]="true"
          subtext="Universal consolidated action pool">
        </app-stat-card>

        <!-- 3. Active High-Risk Permits (PTW) -->
        <app-stat-card
          label="Active Permits (PTW)"
          [value]="kpis().activePermitsCount"
          icon="vpn_key"
          iconBgColor="#ffedd5"
          iconColor="oklch(0.6420 0.1691 38.5815)"
          trendText="Hot Work & Entry"
          [trendPositive]="true"
          subtext="Authorized by Master / Chief Eng">
        </app-stat-card>

        <!-- 4. Risk Assessments (JSA) -->
        <app-stat-card
          label="Risk Assessments (JSA)"
          [value]="state.riskAssessments().length"
          icon="rule"
          iconBgColor="#f1f5f9"
          iconColor="#334155"
          trendText="100% ALARP"
          [trendPositive]="true"
          subtext="Task-based hazard clearance">
        </app-stat-card>

        <!-- 5. Inspection Status -->
        <app-stat-card
          label="Inspection Compliance"
          [value]="kpis().inspectionComplianceRate + '%'"
          icon="fact_check"
          iconBgColor="#fef3c7"
          iconColor="#b45309"
          trendText="Target: 90%+"
          [trendPositive]="true"
          subtext="18 audits completed YTD">
        </app-stat-card>

        <!-- 6. Vessel Statistics -->
        <app-stat-card
          label="Fleet Vessels / Crew"
          [value]="state.vessels().length + ' Vessels'"
          icon="directions_boat"
          iconBgColor="#f3e8ff"
          iconColor="#7e22ce"
          trendText="100 Active Crew"
          [trendPositive]="true"
          subtext="3 Active &bull; 1 Drydock Maint.">
        </app-stat-card>

        <!-- 7. Statutory Compliance Percentage -->
        <app-stat-card
          label="Statutory Certificates"
          [value]="kpis().certificatesValidPercentage + '% Valid'"
          icon="verified"
          iconBgColor="#ecfdf5"
          iconColor="#059669"
          [trendText]="kpis().certificatesExpiring30Days + ' Due Soon'"
          [trendPositive]="false"
          [isAlert]="kpis().certificatesExpired > 0"
          subtext="Class & Flag surveys current">
        </app-stat-card>

        <!-- 8. Safety Trends (Leading vs Lagging) -->
        <app-stat-card
          label="Proactive Safety Ratio"
          [value]="'6.0 : 1'"
          icon="equalizer"
          iconBgColor="#fef3c7"
          iconColor="#d97706"
          trendText="Zero LTIs (0.00)"
          [trendPositive]="true"
          subtext="Proactive cards vs incidents">
        </app-stat-card>
      </div>

      <!-- Fleet Asset Operational Status Card -->
      <div class="hseq-card mt-4">
        <div class="hseq-card-header">
          <div class="card-title-group">
            <mat-icon class="card-icon text-blue">directions_boat</mat-icon>
            <div>
              <h3 class="card-heading">Vessel Fleet Operational & Safety Status</h3>
              <span class="card-subheading">Live operational readiness, class flags, open findings, and active high-risk permits</span>
            </div>
          </div>
          <button mat-button class="view-all-link" routerLink="/admin/master-data">Vessel Register &rarr;</button>
        </div>
        <div class="hseq-card-body p-0">
          <div class="table-responsive">
            <table class="hseq-table">
              <thead>
                <tr>
                  <th>Vessel Asset</th>
                  <th>IMO Number</th>
                  <th>Flag State</th>
                  <th>Vessel Type</th>
                  <th>Crew Onboard</th>
                  <th>Operational Status</th>
                  <th>Next Scheduled Audit</th>
                  <th>Open Findings</th>
                  <th>Active Permits</th>
                  <th>Safety Score</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of vesselStatusRows()" class="clickable-row">
                  <td><strong>{{ v.name }}</strong></td>
                  <td class="mono-ref">{{ v.imoNumber }}</td>
                  <td>{{ v.flag }}</td>
                  <td><span class="type-pill">{{ v.vesselType }}</span></td>
                  <td>{{ v.crewCount }} Seafarers</td>
                  <td><app-status-badge [status]="v.status"></app-status-badge></td>
                  <td>{{ v.nextAudit }}</td>
                  <td>
                    <span class="finding-badge" [class.finding-zero]="v.openFindings === 0">
                      {{ v.openFindings }} Open
                    </span>
                  </td>
                  <td>
                    <span class="permit-tag">{{ v.activePermits }} Live</span>
                  </td>
                  <td>
                    <div class="score-pill" [class.score-high]="v.safetyScore >= 90">
                      {{ v.safetyScore }}%
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Middle Split: Safety Pyramid & Active High-Risk Operations -->
      <div class="grid-2col mt-4">
        <!-- Safety Pyramid & Culture Analysis -->
        <div class="hseq-card">
          <div class="hseq-card-header">
            <div class="card-title-group">
              <mat-icon class="card-icon text-blue">equalizer</mat-icon>
              <div>
                <h3 class="card-heading">Heinrich Safety Pyramid Ratio</h3>
                <span class="card-subheading">Fleet proactive vs reactive safety event frequency</span>
              </div>
            </div>
            <span class="status-badge badge-success">Leading Indicators Strong</span>
          </div>
          <div class="hseq-card-body">
            <div class="pyramid-container">
              <div class="pyramid-tier tier-incident">
                <span class="tier-count">{{ kpis().incidentsCount }}</span>
                <span class="tier-label">Major / High Incidents</span>
              </div>
              <div class="pyramid-tier tier-nearmiss">
                <span class="tier-count">{{ kpis().nearMissCount }}</span>
                <span class="tier-label">Near Miss Occurrences</span>
              </div>
              <div class="pyramid-tier tier-safecard">
                <span class="tier-count">{{ kpis().safeCardsCount }}</span>
                <span class="tier-label">Safe Cards & Observations ({{ kpis().safeActsRatio }}% Safe Acts)</span>
              </div>
            </div>
            <div class="culture-footer">
              <p class="culture-note">
                <mat-icon class="info-icon">lightbulb</mat-icon>
                <strong>Proactive Ratio:</strong> For every incident reported, <strong>{{ kpis().safeCardsCount + kpis().nearMissCount }}</strong> proactive safety observations and hazard hunts were logged.
              </p>
            </div>
          </div>
        </div>

        <!-- High-Risk Operations & Active PTW -->
        <div class="hseq-card">
          <div class="hseq-card-header">
            <div class="card-title-group">
              <mat-icon class="card-icon text-amber">vpn_key</mat-icon>
              <div>
                <h3 class="card-heading">Live High-Risk Permits to Work</h3>
                <span class="card-subheading">Active authorizations requiring safety oversight</span>
              </div>
            </div>
            <button mat-button class="view-all-link" routerLink="/permits">View All ({{ state.permits().length }})</button>
          </div>
          <div class="hseq-card-body p-0">
            <div *ngFor="let p of state.permits()" class="permit-strip" [routerLink]="['/permits', p.id]">
              <div class="permit-main">
                <div class="permit-type-badge">{{ p.permitType }}</div>
                <div class="permit-info">
                  <span class="permit-ref">{{ p.referenceNo }} &bull; {{ p.vesselName }}</span>
                  <span class="permit-loc">{{ p.worksiteLocation }}</span>
                </div>
              </div>
              <div class="permit-status-wrap">
                <app-status-badge [status]="p.status"></app-status-badge>
                <span class="permit-auth">Auth: {{ p.approvingAuthority }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row: Monthly Event Trends & CAPA Allocation -->
      <div class="grid-2col mt-4">
        <app-chart-wrapper
          title="Monthly Safety Event Trends (Proactive Hazard Hunt)"
          subtitle="Observed near misses vs regulatory target threshold"
          icon="show_chart"
          type="bar"
          [data]="monthlyEventTrends()"
          primaryColor="oklch(0.6420 0.1691 38.5815)"
          [legendLabels]="[
            { label: 'Logged Near Misses', color: 'oklch(0.6420 0.1691 38.5815)' },
            { label: 'Safety Ceiling', color: 'oklch(0.8452 0 0)' }
          ]">
        </app-chart-wrapper>

        <app-chart-wrapper
          title="Universal CAPA Resolution Allocation"
          subtitle="Corrective action progress breakdown across fleet"
          icon="pie_chart"
          type="donut"
          [data]="capaBreakdown()"
          centerMetric="92%"
          centerLabel="On-Time">
        </app-chart-wrapper>
      </div>

      <!-- Bottom Split: Consolidated CAPAs & Certificate Status -->
      <div class="grid-2col mt-4">
        <!-- Universal CAPA Summary -->
        <div class="hseq-card">
          <div class="hseq-card-header">
            <div class="card-title-group">
              <mat-icon class="card-icon text-red">task_alt</mat-icon>
              <div>
                <h3 class="card-heading">Universal CAPA Tracker Summary</h3>
                <span class="card-subheading">Actions originating across Inspections, Incidents & Visits</span>
              </div>
            </div>
            <button mat-flat-button color="primary" class="btn-sm" routerLink="/capa">Open CAPA Register</button>
          </div>
          <div class="hseq-card-body p-0">
            <table class="hseq-table">
              <thead>
                <tr>
                  <th>CAPA ID</th>
                  <th>Source</th>
                  <th>Action Description</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of state.capas()" class="clickable-row" routerLink="/capa">
                  <td class="mono-ref">{{ c.referenceNo }}</td>
                  <td>
                    <span class="source-tag">{{ c.sourceModule }}</span>
                    <span class="text-xs text-muted block">{{ c.sourceReferenceNo }}</span>
                  </td>
                  <td class="desc-cell">{{ c.actionDescription }}</td>
                  <td>{{ c.targetDate }}</td>
                  <td><app-status-badge [status]="c.status"></app-status-badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Statutory Certificates & Expiry Timeline -->
        <div class="hseq-card">
          <div class="hseq-card-header">
            <div class="card-title-group">
              <mat-icon class="card-icon text-purple">verified</mat-icon>
              <div>
                <h3 class="card-heading">Certificates Due for Renewal</h3>
                <span class="card-subheading">Upcoming statutory, flag and class surveys</span>
              </div>
            </div>
            <button mat-button class="view-all-link" routerLink="/certificates">Open Register</button>
          </div>
          <div class="hseq-card-body p-0">
            <table class="hseq-table">
              <thead>
                <tr>
                  <th>Certificate</th>
                  <th>Vessel</th>
                  <th>Authority</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cert of state.certificates()" class="clickable-row" routerLink="/certificates">
                  <td class="font-medium">{{ cert.certificateName }}</td>
                  <td>{{ cert.vesselName }}</td>
                  <td><span class="authority-badge">{{ cert.issuingAuthority }}</span></td>
                  <td>
                    <span class="countdown-tag" [class.alert-due]="cert.daysToExpiry <= 45">
                      {{ cert.daysToExpiry }} days
                    </span>
                  </td>
                  <td><app-status-badge [status]="cert.status"></app-status-badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-heading-row {
      margin-top: 4px;
      margin-bottom: 2px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
      margin: 0;
    }

    .section-subtitle {
      font-size: 11.5px;
      color: #64748b;
    }

    .welcome-banner {
      background: linear-gradient(135deg, #1c1917 0%, #292524 50%, #3a2215 100%);
      border-radius: var(--radius-sm);
      padding: 14px 20px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-sm);
      border: 1px solid oklch(0.6420 0.1691 38.5815 / 0.25);
      position: relative;
      overflow: hidden;
    }

    .welcome-content {
      max-width: 650px;
      position: relative;
      z-index: 2;
    }

    .safety-motto {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--primary);
      background: oklch(0.6420 0.1691 38.5815 / 0.18);
      border: 1px solid oklch(0.6420 0.1691 38.5815 / 0.4);
      padding: 3px 8px;
      border-radius: 9999px;
      margin-bottom: 6px;
    }

    .motto-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .welcome-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.4px;
      margin-bottom: 4px;
      line-height: 1.2;
      font-family: var(--font-sans);
    }

    .welcome-desc {
      font-size: 12.5px;
      color: #d6d3d1;
      line-height: 1.45;
      margin: 0;
    }

    .banner-quick-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
    }

    .btn-quick-log {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      font-weight: 700 !important;
      height: 40px !important;
      border-radius: var(--radius-sm) !important;
      box-shadow: 0 2px 8px rgba(220, 80, 20, 0.35) !important;
    }

    .btn-view-capa {
      background: rgba(255, 255, 255, 0.12) !important;
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
      font-weight: 600 !important;
      height: 40px !important;
      border-radius: var(--radius-sm) !important;
    }

    .btn-view-reports {
      background: rgba(255, 255, 255, 0.12) !important;
      color: #ffffff !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
      font-weight: 600 !important;
      height: 40px !important;
      border-radius: var(--radius-sm) !important;
    }

    .alert-strip {
      background: var(--accent);
      border: 1px solid var(--border);
      border-left: 4px solid var(--secondary);
      border-radius: var(--radius-sm);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .alert-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .alert-icon {
      color: var(--secondary);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .alert-texts {
      font-size: 13px;
      color: var(--foreground);
    }

    .alert-texts strong {
      font-weight: 700;
      margin-right: 4px;
    }

    .alert-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-alert-link {
      font-size: 12.5px !important;
      font-weight: 700 !important;
      color: var(--primary) !important;
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

    .mt-4 { margin-top: 16px; }

    .card-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .text-blue { color: var(--primary); }
    .text-amber { color: var(--secondary); }
    .text-red { color: var(--destructive); }
    .text-purple { color: var(--chart-4); }

    .card-heading {
      font-size: 14.5px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
      font-family: var(--font-sans);
    }

    .card-subheading {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }

    .view-all-link {
      font-size: 12px !important;
      font-weight: 600 !important;
      color: var(--primary) !important;
    }

    /* Vessel Operational Table */
    .type-pill {
      font-size: 11px;
      font-weight: 600;
      color: var(--primary);
      background: var(--accent);
      padding: 2px 7px;
      border-radius: 4px;
    }

    .finding-badge {
      font-size: 11px;
      font-weight: 700;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 7px;
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

    .score-pill {
      font-size: 12px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #334155;
      display: inline-block;
    }

    .score-high {
      background: #ecfdf5;
      color: #059669;
    }

    /* Safety Pyramid Styles */
    .pyramid-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .pyramid-tier {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      border-radius: 8px;
      padding: 10px 16px;
      font-weight: 700;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: transform 0.15s ease;
    }

    .pyramid-tier:hover {
      transform: scale(1.02);
    }

    .tier-incident {
      width: 48%;
      background: oklch(0.95 0.04 25);
      color: var(--destructive);
      border: 1px solid oklch(0.88 0.08 25);
    }

    .tier-nearmiss {
      width: 72%;
      background: oklch(0.95 0.04 78);
      color: oklch(0.40 0.10 76);
      border: 1px solid oklch(0.88 0.06 78);
    }

    .tier-safecard {
      width: 96%;
      background: var(--accent);
      color: var(--primary);
      border: 1px solid var(--border);
    }

    .tier-count {
      font-size: 18px;
      font-weight: 800;
    }

    .tier-label {
      font-size: 12.5px;
    }

    .culture-footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 12px;
    }

    .culture-note {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12.5px;
      color: #475569;
      margin: 0;
      line-height: 1.4;
    }

    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #d97706;
      flex-shrink: 0;
    }

    /* Permit list in dashboard */
    .permit-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .permit-strip:hover {
      background: #f8fafc;
    }

    .permit-strip:last-child {
      border-bottom: none;
    }

    .permit-main {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .permit-type-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      background: var(--accent);
      color: var(--primary);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }

    .permit-info {
      display: flex;
      flex-direction: column;
    }

    .permit-ref {
      font-size: 13px;
      font-weight: 700;
      color: var(--foreground);
    }

    .permit-loc {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .permit-status-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .permit-auth {
      font-size: 11px;
      color: var(--muted-foreground);
    }

    .source-tag {
      font-size: 11px;
      font-weight: 700;
      color: var(--primary);
      background: var(--accent);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .desc-cell {
      max-width: 240px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-xs { font-size: 11px; }
    .text-muted { color: #64748b; }
    .block { display: block; }
    .btn-sm {
      height: 34px !important;
      font-size: 12.5px !important;
    }

    .authority-badge {
      font-size: 11.5px;
      font-weight: 600;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #334155;
    }

    .countdown-tag {
      font-size: 11.5px;
      font-weight: 700;
      color: #059669;
    }

    .alert-due {
      color: #dc2626;
      background: #fee2e2;
      padding: 2px 6px;
      border-radius: 4px;
    }

    @media (max-width: 1024px) {
      .grid-2col {
        grid-template-columns: 1fr;
      }
      .welcome-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .banner-quick-actions {
        flex-direction: row;
        width: 100%;
      }
    }
  `]
})
export class DashboardComponent {
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  kpis = this.state.dashboardKpis;

  // Monthly trends
  readonly monthlyEventTrends = computed<ChartDataPoint[]>(() => {
    return [
      { label: 'May', value: 4, secondaryValue: 6 },
      { label: 'Jun', value: 3, secondaryValue: 6 },
      { label: 'Jul', value: 5, secondaryValue: 6 },
      { label: 'Aug', value: 2, secondaryValue: 6 },
      { label: 'Sep', value: 6, secondaryValue: 6 },
      { label: 'Oct (Current)', value: 4, secondaryValue: 6, color: 'oklch(0.6420 0.1691 38.5815)' }
    ];
  });

  // CAPA Breakdown
  readonly capaBreakdown = computed<ChartDataPoint[]>(() => {
    return [
      { label: 'Closed Actions', value: 18, color: 'oklch(0.6420 0.1691 38.5815)' },
      { label: 'In Progress', value: 4, color: 'oklch(0.4138 0.0846 259.8759)' },
      { label: 'Verification Pending', value: 2, color: 'oklch(0.7859 0.1342 83.6986)' },
      { label: 'Open Due Soon', value: 1, color: 'oklch(0.6368 0.2078 25.3313)' }
    ];
  });

  // Fleet Vessels status rows
  readonly vesselStatusRows = computed(() => {
    return [
      {
        name: 'MV Pacific Voyager',
        imoNumber: '9482103',
        flag: 'Marshall Islands',
        vesselType: 'Container Vessel',
        crewCount: 24,
        status: 'Active',
        nextAudit: '2026-11-20',
        openFindings: 1,
        activePermits: 1,
        safetyScore: 94
      },
      {
        name: 'MT Nordic Titan',
        imoNumber: '9624519',
        flag: 'Panama',
        vesselType: 'Crude Oil Tanker',
        crewCount: 26,
        status: 'Active',
        nextAudit: '2026-10-28',
        openFindings: 1,
        activePermits: 1,
        safetyScore: 88
      },
      {
        name: 'MV Atlantic Pioneer',
        imoNumber: '9310842',
        flag: 'Singapore',
        vesselType: 'Bulk Carrier',
        crewCount: 22,
        status: 'Active',
        nextAudit: '2026-12-15',
        openFindings: 0,
        activePermits: 0,
        safetyScore: 92
      },
      {
        name: 'MV Arctic Aurora',
        imoNumber: '9841209',
        flag: 'Norway',
        vesselType: 'LNG Carrier',
        crewCount: 28,
        status: 'Under Maintenance',
        nextAudit: '2026-11-05',
        openFindings: 1,
        activePermits: 0,
        safetyScore: 86
      }
    ];
  });
}
