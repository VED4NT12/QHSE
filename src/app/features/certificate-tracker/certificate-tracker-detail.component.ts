import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CertificateStore, CertificateRecord } from '../../core/stores/certificate.store';

@Component({
  selector: 'app-certificate-tracker-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <div class="module-container">
      <app-page-header
        [title]="cert()?.code + ' — ' + cert()?.description"
        [subtitle]="cert()?.vesselName + ' | ' + cert()?.category + ' Certificate'"
        icon="verified"
        [breadcrumbs]="[{label: 'Certificate Tracker', link: '/certificate-tracker'}, {label: 'Details'}]">
        <div actions class="d-flex gap-2">
          <button mat-stroked-button [routerLink]="['/certificate-tracker/edit', cert()?.id]">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button routerLink="/certificate-tracker">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
        </div>
      </app-page-header>

      @if (cert()) {
        <!-- Status Alert Banner -->
        @if (cert()!.status === 'Expired') {
          <div class="alert-banner alert-expired">
            <mat-icon>error</mat-icon>
            <span>This certificate has <strong>EXPIRED</strong>. Immediate renewal action required.</span>
          </div>
        }
        @if (cert()!.status === 'In Window') {
          <div class="alert-banner alert-window">
            <mat-icon>schedule</mat-icon>
            <span>Certificate is currently in its <strong>renewal window</strong>. Please arrange renewal survey.</span>
          </div>
        }

        <div class="detail-card">
          <div class="card-title"><mat-icon>verified</mat-icon> Certificate Details</div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="lbl">Code</span>
              <span class="code-chip">{{ cert()!.code }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Description</span>
              <span class="val fw">{{ cert()!.description }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Category</span>
              <span class="cat-badge" [class]="'cat-' + cert()!.category.toLowerCase()">{{ cert()!.category }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Vessel</span>
              <span class="val fw">{{ cert()!.vesselName }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Issuing Authority</span>
              <span class="val">{{ cert()!.issuingAuthority }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Frequency (Years)</span>
              <span class="val">{{ cert()!.frequency || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Certificate Type</span>
              <span class="val">{{ cert()!.certificateType }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Issue Date</span>
              <span class="val">{{ cert()!.issueDate | date:'dd-MMM-yyyy' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Last Endorsement</span>
              <span class="val">{{ cert()!.lastEndorsementDate || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Expiry Date</span>
              <span class="val" [class.text-expired]="cert()!.status === 'Expired'">
                {{ cert()!.expiryDate ? (cert()!.expiryDate | date:'dd-MMM-yyyy') : 'Permanent' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="lbl">Renewal Window</span>
              <span class="val">{{ cert()!.window || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Days Remaining</span>
              @if (cert()!.remainingDays !== null) {
                <span class="days-badge" [class]="getDaysClass(cert()!.remainingDays)">
                  {{ cert()!.remainingDays! > 0 ? '+' : '' }}{{ cert()!.remainingDays }}d
                </span>
              } @else {
                <span class="val">—</span>
              }
            </div>
            <div class="detail-item">
              <span class="lbl">Status</span>
              <span class="status-badge" [class]="'status-' + cert()!.status.replace(' ', '-').toLowerCase()">{{ cert()!.status }}</span>
            </div>
            <div class="detail-item">
              <span class="lbl">Date Last Received</span>
              <span class="val">{{ cert()!.dateLastReceived || '—' }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .module-container { padding: 24px; max-width: 900px; margin: 0 auto; }
    .d-flex { display: flex; } .gap-2 { gap: 8px; }
    .alert-banner { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13.5px; margin-bottom: 16px; }
    .alert-expired { background: oklch(0.94 0.05 25 / 0.4); color: oklch(0.38 0.18 25); border: 1px solid oklch(0.80 0.08 25 / 0.4); }
    .alert-window { background: oklch(0.96 0.05 75 / 0.4); color: oklch(0.38 0.15 75); border: 1px solid oklch(0.80 0.08 75 / 0.4); }
    .detail-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow-2xs); }
    .card-title { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: var(--foreground); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
    .card-title mat-icon { color: var(--primary); }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .lbl { font-size: 11px; font-weight: 600; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.3px; }
    .val { font-size: 13.5px; color: var(--foreground); } .fw { font-weight: 700; }
    .text-expired { color: oklch(0.45 0.18 25); font-weight: 700; }
    .code-chip { display: inline-block; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: var(--muted); color: var(--foreground); font-family: monospace; }
    .cat-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
    .cat-statutory { background: oklch(0.92 0.04 265 / 0.5); color: oklch(0.38 0.12 265); }
    .cat-operational { background: oklch(0.92 0.04 230 / 0.5); color: oklch(0.38 0.12 230); }
    .days-badge { display: inline-block; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; }
    .days-negative { background: oklch(0.92 0.06 25 / 0.5); color: oklch(0.42 0.18 25); }
    .days-warning { background: oklch(0.94 0.06 75 / 0.5); color: oklch(0.42 0.15 75); }
    .days-ok { background: oklch(0.9 0.05 145 / 0.4); color: oklch(0.35 0.12 145); }
    .status-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; }
    .status-valid { background: oklch(0.9 0.05 145 / 0.5); color: oklch(0.35 0.12 145); }
    .status-in-window { background: oklch(0.94 0.06 75 / 0.5); color: oklch(0.42 0.15 75); }
    .status-expired { background: oklch(0.92 0.06 25 / 0.5); color: oklch(0.42 0.18 25); }
  `]
})
export class CertificateTrackerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private store = inject(CertificateStore);
  readonly cert = signal<CertificateRecord | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const fromStore = this.store.getById(id);
      if (fromStore) {
        this.cert.set(fromStore);
        return;
      }
    }
    const all = this.store.records();
    if (all.length > 0) {
      this.cert.set(all[0]);
    }
  }

  getDaysClass(days: number | null): string {
    if (days === null) return '';
    if (days < 0) return 'days-negative';
    if (days <= 90) return 'days-warning';
    return 'days-ok';
  }
}
