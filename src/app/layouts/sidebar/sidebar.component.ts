import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NearMissStore } from '../../core/stores/near-miss.store';
import { ObservationStore } from '../../core/stores/observation.store';
import { OnHireStore } from '../../core/stores/on-hire.store';
import { InspectionStore } from '../../core/stores/inspection.store';
import { CertificateStore } from '../../core/stores/certificate.store';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
  badgeClass?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  template: `
    <aside class="sidebar-container" [class.collapsed]="collapsed">
      <div class="sidebar-scrollable">
        @for (section of navSections(); track section.title) {
          <div class="nav-section">
            @if (!collapsed) {
              <div class="section-title">{{ section.title }}</div>
            } @else {
              <div class="section-divider"></div>
            }

            @for (item of section.items; track item.route) {
              <a 
                [routerLink]="item.route" 
                routerLinkActive="active" 
                class="nav-item"
                [matTooltip]="collapsed ? item.label : ''"
                matTooltipPosition="right">
                <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                @if (!collapsed) {
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="nav-badge" [ngClass]="item.badgeClass">
                      {{ item.badge }}
                    </span>
                  }
                }
              </a>
            }
          </div>
        }
      </div>

      <!-- Quick System Info Footer in Sidebar -->
      @if (!collapsed) {
        <div class="sidebar-footer">
          <div class="compliance-pill">
            <mat-icon class="pill-icon">shield</mat-icon>
            <div class="pill-text">
              <span class="pill-title">ISM / ISPS Compliant</span>
              <span class="pill-sub">Vessel Safety Standard v2.4</span>
            </div>
          </div>
        </div>
      }
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 260px;
      height: calc(100vh - 64px);
      background-color: var(--sidebar);
      color: var(--sidebar-foreground);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      border-right: 1px solid var(--sidebar-border);
      position: sticky;
      top: 64px;
      overflow: hidden;
      font-family: var(--font-sans);
    }
    .sidebar-container.collapsed {
      width: 68px;
    }
    .sidebar-scrollable {
      flex: 1;
      overflow-y: auto;
      padding: 16px 10px;
    }
    .nav-section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--muted-foreground);
      padding: 6px 12px;
      margin-bottom: 4px;
    }
    .section-divider {
      height: 1px;
      background: var(--sidebar-border);
      margin: 10px 6px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--sidebar-foreground);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: all 0.15s ease;
      margin-bottom: 2px;
      cursor: pointer;
    }
    .nav-item:hover {
      background-color: var(--sidebar-accent);
      color: var(--primary);
    }
    .nav-item:hover .nav-icon {
      color: var(--primary);
    }
    .nav-item.active {
      background-color: var(--primary);
      color: var(--primary-foreground);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(220, 80, 20, 0.25);
    }
    .nav-item.active .nav-icon {
      color: var(--primary-foreground);
    }
    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .nav-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 9999px;
      line-height: 1.2;
    }
    .badge-alert {
      background: oklch(0.93 0.05 25);
      color: oklch(0.45 0.15 25);
    }
    .badge-warn {
      background: oklch(0.94 0.06 85);
      color: oklch(0.42 0.12 70);
    }
    .badge-muted {
      background: var(--muted);
      color: var(--muted-foreground);
    }
    .sidebar-footer {
      padding: 12px;
      background: var(--sidebar);
      border-top: 1px solid var(--sidebar-border);
    }
    .compliance-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--card);
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--sidebar-border);
      box-shadow: var(--shadow-2xs);
    }
    .pill-icon {
      color: var(--primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .pill-text {
      display: flex;
      flex-direction: column;
    }
    .pill-title {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .pill-sub {
      font-size: 10px;
      color: var(--muted-foreground);
    }
  `]
})
export class SidebarComponent {
  @Input() collapsed: boolean = false;
  public state = inject(HseqStateService);
  private nearMissStore = inject(NearMissStore);
  private observationStore = inject(ObservationStore);
  private onHireStore = inject(OnHireStore);
  private inspectionStore = inject(InspectionStore);
  private certificateStore = inject(CertificateStore);

  // Dynamic Data-driven Navigation Sections & Badge Counts
  readonly navSections = computed<NavSection[]>(() => {
    // 1. Near Miss Counts
    const nmRecords = this.nearMissStore.records();
    const nmOpen = nmRecords.filter(n => n.status === 'Open').length;
    const nmTotal = nmRecords.length;

    // 2. Safe Observations
    const obsTotal = this.observationStore.records().length;

    // 3. On Hire Inspections
    const onHireTotal = this.onHireStore.records().length;

    // 4. Fleet Inspection Tracker
    const inspTotal = this.inspectionStore.records().length;

    // 5. Certificate Tracker
    const certRecords = this.certificateStore.records();
    const certDue = certRecords.filter(c => (c.status as string) === 'In Window' || c.status === 'Expiring Soon' || c.status === 'Expired' || (c.remainingDays !== undefined && c.remainingDays <= 60)).length;
    const certTotal = certRecords.length;

    // 6. Master Data Vessels
    const vesselCount = this.state.vessels().length;

    return [
      {
        title: 'Overview',
        items: [
          { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
        ]
      },
      {
        title: 'Safety & Observations',
        items: [
          { 
            label: 'Near Miss Tracker', 
            icon: 'warning', 
            route: '/near-miss', 
            badge: nmOpen > 0 ? `${nmOpen} Open` : `${nmTotal}`, 
            badgeClass: nmOpen > 0 ? 'badge-alert' : 'badge-warn' 
          },
          {
            label: 'Safe Observation Cards',
            icon: 'assignment_turned_in',
            route: '/safe-observations',
            badge: `${obsTotal}`,
            badgeClass: 'badge-muted'
          }
        ]
      },
      {
        title: 'Inspections & Audits',
        items: [
          {
            label: 'On Hire Inspection',
            icon: 'fact_check',
            route: '/on-hire-inspection',
            badge: `${onHireTotal}`,
            badgeClass: 'badge-muted'
          },
          {
            label: 'Inspection Tracker',
            icon: 'checklist',
            route: '/inspection-tracker',
            badge: `${inspTotal}`,
            badgeClass: 'badge-muted'
          }
        ]
      },
      {
        title: 'Compliance & Verification',
        items: [
          {
            label: 'Certificate Tracker',
            icon: 'verified',
            route: '/certificate-tracker',
            badge: certDue > 0 ? `${certDue} Due` : `${certTotal}`,
            badgeClass: certDue > 0 ? 'badge-warn' : 'badge-muted'
          }
        ]
      },
      {
        title: 'Administration',
        items: [
          {
            label: 'Master Data',
            icon: 'storage',
            route: '/admin/master-data',
            badge: `${vesselCount} Ships`,
            badgeClass: 'badge-muted'
          }
        ]
      }
    ];
  });
}
