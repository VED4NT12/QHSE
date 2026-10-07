import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { NearMissRecord } from '../../core/models/hseq.models';

@Component({
  selector: 'app-near-miss-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  template: `
    @if (currentRecord(); as record) {
      <div class="module-container">
        <app-page-header
          [title]="'Near Miss: ' + record.vesselName + ' (' + record.date + ')'"
          [subtitle]="'Location: ' + record.location + ' • Reported by ' + (record.reportedBy || 'Vessel Officer')"
          icon="warning"
          [breadcrumbs]="[
            {label: 'Near Miss Tracker', link: '/near-miss'},
            {label: record.vesselName + ' (' + record.date + ')'}
          ]">
          <div actions class="d-flex gap-2">
            <button mat-stroked-button routerLink="/near-miss" class="btn-back">
              <mat-icon>arrow_back</mat-icon> Back to Register
            </button>
            <button mat-stroked-button (click)="printSummary()" class="btn-print">
              <mat-icon>print</mat-icon> Print Report
            </button>
            <button mat-flat-button color="primary" class="btn-primary-action" [routerLink]="['/near-miss/edit', record.id]">
              <mat-icon>edit</mat-icon> Edit Record
            </button>
          </div>
        </app-page-header>

        <!-- Key Metadata Ribbon -->
        <div class="hseq-card ribbon-card">
          <div class="ribbon-grid">
            <div class="ribbon-item">
              <span class="ribbon-label">Vessel Asset</span>
              <div class="ribbon-value-wrap">
                <mat-icon class="ribbon-icon">directions_boat</mat-icon>
                <span class="ribbon-value font-bold">{{ record.vesselName }}</span>
              </div>
            </div>

            <div class="ribbon-item">
              <span class="ribbon-label">Incident Date</span>
              <div class="ribbon-value-wrap">
                <mat-icon class="ribbon-icon">calendar_today</mat-icon>
                <span class="ribbon-value">{{ record.date }}</span>
              </div>
            </div>

            <div class="ribbon-item">
              <span class="ribbon-label">Location on Board / Port</span>
              <div class="ribbon-value-wrap">
                <mat-icon class="ribbon-icon">place</mat-icon>
                <span class="ribbon-value">{{ record.location }}</span>
              </div>
            </div>

            <div class="ribbon-item">
              <span class="ribbon-label">Current Status</span>
              <div>
                <span class="status-pill" [ngClass]="record.status === 'Closed' ? 'status-closed' : 'status-open'">
                  <span class="status-dot"></span>
                  {{ record.status }}
                </span>
              </div>
            </div>

            <div class="ribbon-item">
              <span class="ribbon-label">Close Out Date</span>
              <div class="ribbon-value-wrap">
                @if (record.closeOutDate) {
                  <span class="ribbon-value">{{ record.closeOutDate }}</span>
                } @else {
                  <span class="text-muted">Action in Progress</span>
                }
              </div>
            </div>

            <div class="ribbon-item">
              <span class="ribbon-label">Aramco MOMs Submission</span>
              @if (record.aramcoMomsSubmission) {
                <div class="moms-badge" (click)="copyMoms(record.aramcoMomsSubmission)" matTooltip="Click to copy MOMs ID">
                  <mat-icon class="moms-icon">verified</mat-icon>
                  <span class="moms-id">{{ record.aramcoMomsSubmission }}</span>
                  <mat-icon class="copy-icon">content_copy</mat-icon>
                </div>
              } @else {
                <span class="moms-pending-pill">Not Submitted</span>
              }
            </div>
          </div>
        </div>

        <!-- Main Detailed Cards -->
        <div class="detail-grid">
          <!-- Left: Incident & Immediate Action -->
          <div class="detail-column">
            <!-- Description Card -->
            <div class="hseq-card content-card">
              <div class="card-header-line">
                <div class="header-icon-box warn-box">
                  <mat-icon>report_problem</mat-icon>
                </div>
                <div>
                  <h3 class="card-title">Near Miss Description</h3>
                  <span class="card-subtitle">Exact occurrence captured from vessel safety log</span>
                </div>
              </div>
              <div class="card-body-content">
                <p class="description-text">{{ record.nearMissDescription }}</p>
              </div>
            </div>

            <!-- Corrective Action Card -->
            <div class="hseq-card content-card">
              <div class="card-header-line">
                <div class="header-icon-box action-box">
                  <mat-icon>build</mat-icon>
                </div>
                <div>
                  <h3 class="card-title">Immediate Corrective Action</h3>
                  <span class="card-subtitle">Action taken at the moment to isolate and safeguard</span>
                </div>
              </div>
              <div class="card-body-content">
                @if (record.correctiveAction) {
                  <p class="corrective-text">{{ record.correctiveAction }}</p>
                } @else {
                  <div class="empty-field-note">
                    <mat-icon>info</mat-icon>
                    <span>No immediate corrective action was entered for this occurrence.</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right: Follow up, Recommendations & Vessel Action -->
          <div class="detail-column">
            <!-- Recommendation Card -->
            <div class="hseq-card content-card">
              <div class="card-header-line">
                <div class="header-icon-box tip-box">
                  <mat-icon>lightbulb</mat-icon>
                </div>
                <div>
                  <h3 class="card-title">Recommendations</h3>
                  <span class="card-subtitle">Safety enhancements and fleet procedures</span>
                </div>
              </div>
              <div class="card-body-content">
                @if (record.recommendation) {
                  <p class="recommendation-text">{{ record.recommendation }}</p>
                } @else {
                  <div class="empty-field-note">
                    <mat-icon>info</mat-icon>
                    <span>No recommendations recorded yet.</span>
                  </div>
                }
              </div>
            </div>

            <!-- Action Taken By Vessel Card -->
            <div class="hseq-card content-card">
              <div class="card-header-line">
                <div class="header-icon-box vessel-act-box">
                  <mat-icon>check_circle</mat-icon>
                </div>
                <div>
                  <h3 class="card-title">Action Taken By Vessel</h3>
                  <span class="card-subtitle">Onboard execution, drills, and maintenance follow-up</span>
                </div>
              </div>
              <div class="card-body-content">
                @if (record.actionTakenByVessel) {
                  <p class="vessel-action-text">{{ record.actionTakenByVessel }}</p>
                } @else {
                  <div class="empty-field-note">
                    <mat-icon>info</mat-icon>
                    <span>No post-incident vessel actions recorded.</span>
                  </div>
                }
              </div>
            </div>

            <!-- Quick Closure Card -->
            <div class="hseq-card quick-action-card">
              <h4 class="quick-title">Quick Status Control</h4>
              <p class="quick-desc">Update report closure status once all preventive recommendations have been confirmed.</p>
              <div class="d-flex gap-2 mt-3">
                @if (record.status === 'Open') {
                  <button 
                    mat-flat-button 
                    color="primary" 
                    class="w-100" 
                    (click)="toggleCloseStatus('Closed')">
                    <mat-icon>check_circle</mat-icon> Mark as Closed Out
                  </button>
                } @else {
                  <button 
                    mat-stroked-button 
                    class="w-100 text-amber" 
                    (click)="toggleCloseStatus('Open')">
                    <mat-icon>pending_actions</mat-icon> Re-Open Near Miss
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="module-container p-5 text-center">
        <h2>Record Not Found</h2>
        <p class="text-muted">The requested Near Miss report could not be found in the fleet register.</p>
        <button mat-flat-button color="primary" routerLink="/near-miss" class="mt-3">
          Return to Near Miss Tracker
        </button>
      </div>
    }
  `,
  styles: [`
    .module-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
      font-family: var(--font-sans);
    }

    .btn-back, .btn-print {
      height: 40px !important;
      border-color: var(--border) !important;
      color: var(--foreground) !important;
      font-weight: 600 !important;
    }

    /* Ribbon Card */
    .ribbon-card {
      padding: 18px 24px;
      background: var(--card);
    }

    .ribbon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 20px;
      align-items: center;
    }

    .ribbon-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ribbon-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .ribbon-value-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ribbon-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary);
    }

    .ribbon-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .font-bold { font-weight: 700; }

    /* Status Pill */
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .status-closed {
      background: oklch(0.93 0.06 145);
      color: oklch(0.38 0.15 145);
      border: 1px solid oklch(0.85 0.09 145);
    }

    .status-closed .status-dot {
      background: oklch(0.45 0.18 145);
    }

    .status-open {
      background: oklch(0.95 0.08 70);
      color: oklch(0.48 0.18 65);
      border: 1px solid oklch(0.88 0.10 70);
    }

    .status-open .status-dot {
      background: oklch(0.60 0.20 65);
    }

    .moms-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: oklch(0.95 0.04 40);
      color: var(--primary);
      border: 1px solid var(--border);
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 700;
      width: fit-content;
    }

    .moms-badge:hover {
      background: var(--accent);
    }

    .moms-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .copy-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      opacity: 0.6;
    }

    .moms-pending-pill {
      font-size: 12px;
      color: var(--muted-foreground);
      background: var(--muted);
      padding: 4px 10px;
      border-radius: 4px;
      border: 1px dashed var(--border);
      display: inline-block;
    }

    /* Detail Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
    }

    .detail-column {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .content-card {
      padding: 22px 24px;
    }

    .card-header-line {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }

    .header-icon-box {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .warn-box {
      background: oklch(0.95 0.08 70);
      color: oklch(0.55 0.18 65);
    }

    .action-box {
      background: oklch(0.92 0.03 240);
      color: oklch(0.40 0.12 250);
    }

    .tip-box {
      background: oklch(0.93 0.05 40);
      color: var(--primary);
    }

    .vessel-act-box {
      background: oklch(0.92 0.07 145);
      color: oklch(0.45 0.15 145);
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .card-subtitle {
      font-size: 11.5px;
      color: var(--muted-foreground);
    }

    .card-body-content {
      line-height: 1.6;
      font-size: 13.5px;
      color: var(--foreground);
    }

    .description-text, .corrective-text, .recommendation-text, .vessel-action-text {
      white-space: pre-line;
      margin: 0;
    }

    .empty-field-note {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted-foreground);
      font-size: 13px;
      background: var(--muted);
      padding: 12px 14px;
      border-radius: var(--radius-sm);
    }

    .empty-field-note mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .quick-action-card {
      padding: 20px;
      background: var(--card);
    }

    .quick-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 4px;
    }

    .quick-desc {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 0;
      line-height: 1.4;
    }

    .text-amber {
      color: oklch(0.55 0.18 65) !important;
    }

    .w-100 { width: 100%; }
    .mt-3 { margin-top: 12px; }
    .p-5 { padding: 40px; }
  `]
})
export class NearMissDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);

  readonly currentRecord = signal<NearMissRecord | undefined>(undefined);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const rec = this.state.getNearMissById(id);
      this.currentRecord.set(rec);
      if (!rec) {
        this.notify.showWarning('Record Not Found', `Near Miss ID ${id} was not found.`);
      }
    }
  }

  copyMoms(id: string) {
    navigator.clipboard?.writeText(id);
    this.notify.showSuccess('Aramco MOMs Copied', `Reference #${id} copied to clipboard.`);
  }

  printSummary() {
    window.print();
  }

  toggleCloseStatus(newStatus: 'Open' | 'Closed') {
    const rec = this.currentRecord();
    if (!rec) return;

    const closeDate = newStatus === 'Closed' 
      ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-')
      : '';

    this.state.updateNearMiss(rec.id, {
      status: newStatus,
      closeOutDate: closeDate
    });

    const updated = this.state.getNearMissById(rec.id);
    this.currentRecord.set(updated);
    this.notify.showSuccess('Status Updated', `Near Miss record marked as ${newStatus}.`);
  }
}
