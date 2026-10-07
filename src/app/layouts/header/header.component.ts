import { Component, Output, EventEmitter, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../core/models/hseq.models';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatBadgeModule,
    MatTooltipModule,
    ModalComponent
  ],
  template: `
    <header class="hseq-top-header">
      <div class="header-left">
        <button mat-icon-button (click)="toggleSidebar.emit()" class="menu-btn" matTooltip="Toggle Navigation">
          <mat-icon>menu</mat-icon>
        </button>
        
        <div class="brand-zone" routerLink="/dashboard">
          <div class="brand-logo-icon">
            <mat-icon>sailing</mat-icon>
          </div>
          <div class="brand-text">
            <span class="brand-name">HSEQ</span>
            <span class="brand-tag">Fleet Safety & Compliance Suite</span>
          </div>
        </div>

        <!-- Vessel Filter Selector -->
        <div class="vessel-selector-wrap">
          <mat-icon class="vessel-icon">directions_boat</mat-icon>
          <select 
            class="header-native-select"
            [ngModel]="state.selectedVesselFilter()"
            (ngModelChange)="onVesselChange($event)">
            <option value="ALL">All Vessels (Full Fleet)</option>
            <option *ngFor="let v of state.vessels()" [value]="v.id">
              {{ v.name }} ({{ v.vesselType }})
            </option>
          </select>
        </div>
      </div>

      <div class="header-right">
        <!-- Quick Action "+ Log New" Button -->
        <button mat-flat-button color="primary" [matMenuTriggerFor]="quickMenu" class="quick-action-btn">
          <mat-icon>add_circle</mat-icon>
          <span>Quick Log</span>
          <mat-icon class="arrow-down">arrow_drop_down</mat-icon>
        </button>
        <mat-menu #quickMenu="matMenu">
          <button mat-menu-item routerLink="/safe-cards/create">
            <mat-icon color="primary">assignment_turned_in</mat-icon>
            <span>Safe Card / Observation</span>
          </button>
          <button mat-menu-item (click)="showQuickNearMissModal = true">
            <mat-icon color="accent">warning</mat-icon>
            <span>Report Near Miss</span>
          </button>
          <button mat-menu-item (click)="showQuickIncidentModal = true">
            <mat-icon color="warn">report_problem</mat-icon>
            <span>Log Incident Report</span>
          </button>
          <button mat-menu-item (click)="showQuickPermitModal = true">
            <mat-icon>vpn_key</mat-icon>
            <span>Request Permit to Work</span>
          </button>
        </mat-menu>

        <!-- Role Simulator Switcher -->
        <div class="role-simulator-badge" [matMenuTriggerFor]="roleMenu" matTooltip="Simulate any persona in this prototype">
          <div class="role-dot"></div>
          <div class="role-labels">
            <span class="role-caption">Role Simulator</span>
            <span class="role-current">{{ state.currentUserRole() }}</span>
          </div>
          <mat-icon class="role-arrow">expand_more</mat-icon>
        </div>
        <mat-menu #roleMenu="matMenu">
          <div class="menu-header-label">Switch Active Persona</div>
          <button *ngFor="let role of availableRoles" mat-menu-item (click)="setRole(role)">
            <mat-icon [color]="state.currentUserRole() === role ? 'primary' : ''">
              {{ state.currentUserRole() === role ? 'check_circle' : 'person_outline' }}
            </mat-icon>
            <span>{{ role }}</span>
          </button>
        </mat-menu>

        <!-- Notification Bell with Custom Overlay Panel -->
        <div class="notif-bell-wrap" (click)="toggleNotifPanel($event)">
          <button
            mat-icon-button
            class="icon-btn-pill"
            [matBadge]="state.unreadNotificationsCount() > 0 ? '' + state.unreadNotificationsCount() : null"
            matBadgeColor="warn"
            matTooltip="Fleet Alerts & Notifications">
            <mat-icon>notifications</mat-icon>
          </button>
        </div>

        <!-- Custom Notification Panel -->
        <div class="notif-panel" *ngIf="showNotifPanel" (click)="$event.stopPropagation()">
          <div class="notif-panel-header">
            <div class="notif-header-title">
              <strong>Fleet Notifications</strong>
              <span class="notif-count-pill">{{ state.unreadNotificationsCount() }} New</span>
            </div>
            <button mat-button class="btn-mark-all" (click)="state.markAllNotificationsRead()">
              Mark all read
            </button>
          </div>

          <div class="notif-panel-body">
            <div
              *ngFor="let n of state.notifications()"
              class="notif-item"
              [class.unread]="!n.read"
              (click)="onNotificationClick(n); showNotifPanel = false">
              <div class="notif-item-icon" [ngClass]="'notif-' + n.category">
                <mat-icon>{{ getNotifIcon(n.category) }}</mat-icon>
              </div>
              <div class="notif-item-content">
                <span class="notif-item-title">{{ n.title }}</span>
                <p class="notif-item-desc">{{ n.message }}</p>
                <span class="notif-item-time">{{ n.timestamp }}</span>
              </div>
              <div *ngIf="!n.read" class="unread-dot"></div>
            </div>
          </div>

          <div class="notif-panel-footer">
            <button mat-button color="primary" routerLink="/reports" class="btn-full-reports"
              (click)="showNotifPanel = false">
              <mat-icon>analytics</mat-icon>
              View Safety Analytics &amp; Reports
            </button>
          </div>
        </div>

        <!-- User Profile Badge -->
        <div class="user-profile-badge" (click)="toggleProfilePanel($event)">
          <div class="avatar-circle">{{ state.currentUserInfo().avatar }}</div>
          <div class="user-details hide-sm">
            <span class="user-name">{{ state.currentUserInfo().name }}</span>
            <span class="user-post">{{ state.currentUserInfo().rank }}</span>
          </div>
          <mat-icon class="profile-arrow" [class.open]="showProfilePanel">expand_more</mat-icon>
        </div>

        <!-- Custom Profile Panel -->
        <div class="profile-panel" *ngIf="showProfilePanel" (click)="$event.stopPropagation()">
          <div class="profile-panel-head">
            <div class="pp-avatar">{{ state.currentUserInfo().avatar }}</div>
            <div class="pp-info">
              <span class="pp-name">{{ state.currentUserInfo().name }}</span>
              <span class="pp-email">{{ state.currentUserInfo().email }}</span>
              <span class="pp-role-badge">{{ state.currentUserRole() }}</span>
            </div>
          </div>
          <div class="profile-panel-section">
            <button class="pp-item" (click)="navigate('/reports')">
              <div class="pp-item-icon accent"><mat-icon>analytics</mat-icon></div>
              <span>Reports &amp; Analytics</span>
              <mat-icon class="pp-chevron">chevron_right</mat-icon>
            </button>
            <button class="pp-item" (click)="navigate('/admin/master-data')">
              <div class="pp-item-icon"><mat-icon>storage</mat-icon></div>
              <span>Master Data</span>
              <mat-icon class="pp-chevron">chevron_right</mat-icon>
            </button>
            <button class="pp-item" (click)="navigate('/admin/risk-matrix')">
              <div class="pp-item-icon"><mat-icon>tune</mat-icon></div>
              <span>Risk Matrix &amp; Workflows</span>
              <mat-icon class="pp-chevron">chevron_right</mat-icon>
            </button>
          </div>
          <div class="profile-panel-footer">
            <button class="pp-signout" (click)="signOut(); showProfilePanel = false">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Quick Log Incident Modal -->
    <app-modal
      [isOpen]="showQuickIncidentModal"
      title="Quick Incident Report"
      subtitle="Log unplanned marine event or machinery failure into investigation register"
      icon="report_problem"
      iconColor="#dc2626"
      (close)="showQuickIncidentModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="quickIncidentVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Incident Classification</label>
          <select [(ngModel)]="quickIncidentClass" class="custom-select">
            <option value="Equipment Breakdown">Equipment Breakdown</option>
            <option value="Pollution / Bunker Leak">Pollution / Bunker Leak</option>
            <option value="Cargo Contamination">Cargo Contamination</option>
            <option value="Navigational Near-Collision">Navigational Near-Collision</option>
            <option value="Machinery Fire">Machinery Fire</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Actual Severity</label>
          <select [(ngModel)]="quickIncidentSeverity" class="custom-select">
            <option value="Low">Low - Minor localized impact</option>
            <option value="Medium">Medium - Operational disruption</option>
            <option value="High">High - Serious potential harm</option>
            <option value="Critical">Critical - Shore escalation mandatory</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Brief Event Description <span class="text-red">*</span></label>
          <textarea 
            [(ngModel)]="quickIncidentDesc" 
            placeholder="Describe what occurred, location, and immediate containment measures taken..." 
            class="custom-input textarea-tall"></textarea>
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showQuickIncidentModal = false">Cancel</button>
        <button mat-flat-button color="warn" (click)="submitQuickIncident()">Submit Incident Report</button>
      </div>
    </app-modal>

    <!-- Quick Request Permit Modal -->
    <app-modal
      [isOpen]="showQuickPermitModal"
      title="Request Permit to Work (PTW)"
      subtitle="Initiate safety authorization for high-risk maritime operational task"
      icon="vpn_key"
      iconColor="oklch(0.6420 0.1691 38.5815)"
      (close)="showQuickPermitModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="quickPermitVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Permit Category <span class="text-red">*</span></label>
          <select [(ngModel)]="quickPermitType" class="custom-select">
            <option value="Hot Work (Enclosed/Open)">Hot Work (Welding, Burning, Grinding)</option>
            <option value="Confined Space Entry">Confined Space Entry (Tanks, Holds)</option>
            <option value="Electrical Isolation Work">Electrical Isolation / High Voltage</option>
            <option value="Working Aloft / Overboard">Working Aloft / Overboard</option>
            <option value="Cold Work">Cold Work / Heavy Rigging</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Worksite Location</label>
          <input type="text" [(ngModel)]="quickPermitLocation" placeholder="e.g. Engine Room 2nd Platform, Cargo Hold No. 3" class="custom-input" />
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Work Description</label>
          <textarea [(ngModel)]="quickPermitDesc" placeholder="State task scope and safety precautions..." class="custom-input textarea-tall"></textarea>
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showQuickPermitModal = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="submitQuickPermit()">Authorize & Issue PTW</button>
      </div>
    </app-modal>

    <!-- Quick Near Miss Modal -->
    <app-modal
      [isOpen]="showQuickNearMissModal"
      title="Report Near Miss Event"
      subtitle="Capture high-potential safety hazard or close call for fleet-wide prevention"
      icon="warning"
      iconColor="#d97706"
      (close)="showQuickNearMissModal = false">
      <div modal-body>
        <div class="form-field-group mb-3">
          <label class="field-label">Vessel Asset <span class="text-red">*</span></label>
          <select [(ngModel)]="quickNearMissVesselId" class="custom-select">
            <option *ngFor="let v of state.vessels()" [value]="v.id">{{ v.name }} ({{ v.vesselType }})</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Hazard Classification</label>
          <select [(ngModel)]="quickNearMissCategory" class="custom-select">
            <option value="Dropped Object">Dropped Object / Overhead Hazard</option>
            <option value="Slip/Trip/Fall Hazard">Slip, Trip or Fall Hazard</option>
            <option value="Line of Fire">Line of Fire / Stored Energy</option>
            <option value="Pinch Point">Pinch Point / Machinery Guarding</option>
            <option value="Chemical Vapour">Chemical Vapour / Gas Leak</option>
            <option value="Mooring Hazard">Mooring Hazard / Snapback Zone</option>
          </select>
        </div>
        <div class="form-field-group mb-3">
          <label class="field-label">Hazard Description & Action Taken</label>
          <textarea [(ngModel)]="quickNearMissDesc" placeholder="Describe the near miss and immediate control implemented..." class="custom-input textarea-tall"></textarea>
        </div>
      </div>
      <div modal-footer class="d-flex gap-2">
        <button mat-stroked-button (click)="showQuickNearMissModal = false">Cancel</button>
        <button mat-flat-button color="primary" (click)="submitQuickNearMiss()">Submit Near Miss</button>
      </div>
    </app-modal>
  `,
  styles: [`
    .hseq-top-header {
      height: 64px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-xs);
      font-family: var(--font-sans);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .menu-btn {
      color: var(--foreground) !important;
      border-radius: var(--radius-sm) !important;
      width: 40px !important;
      height: 40px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background-color 0.15s ease, color 0.15s ease !important;
    }
    .menu-btn:hover {
      background-color: var(--accent) !important;
      color: var(--primary) !important;
    }
    .brand-zone {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
    }
    .brand-logo-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-sm);
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }
    .brand-text {
      display: flex;
      flex-direction: column;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.2px;
      color: var(--foreground);
      line-height: 1.1;
    }
    .brand-tag {
      font-size: 10px;
      font-weight: 600;
      color: var(--muted-foreground);
      letter-spacing: 0.2px;
    }
    .vessel-selector-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 5px 12px;
      margin-left: 12px;
    }
    .vessel-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary);
    }
    .header-native-select {
      background: transparent;
      border: none;
      outline: none;
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      font-family: var(--font-sans);
      cursor: pointer;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .quick-action-btn {
      height: 38px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: var(--primary);
      color: var(--primary-foreground);
      box-shadow: var(--shadow-sm);
    }
    .arrow-down {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-left: -4px;
    }
    .role-simulator-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .role-simulator-badge:hover {
      background: var(--accent);
      border-color: var(--ring);
    }
    .role-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--secondary);
    }
    .role-labels {
      display: flex;
      flex-direction: column;
    }
    .role-caption {
      font-size: 9.5px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .role-current {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      line-height: 1.1;
    }
    .role-arrow {
      font-size: 18px;
      color: var(--muted-foreground);
    }
    .menu-header-label {
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border);
    }
    .icon-btn-pill {
      color: var(--foreground) !important;
      border-radius: var(--radius-sm) !important;
      width: 40px !important;
      height: 40px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: background-color 0.15s ease, color 0.15s ease !important;
    }
    .icon-btn-pill:hover {
      background-color: var(--accent) !important;
      color: var(--primary) !important;
    }
    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 8px;
      border-left: 1px solid var(--border);
      cursor: pointer;
      padding-top: 4px;
      padding-bottom: 4px;
      border-radius: var(--radius-sm);
      transition: background 0.15s ease;
    }
    .user-profile-badge:hover {
      background: var(--muted);
    }
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-foreground);
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-details {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--foreground);
      line-height: 1.1;
    }
    .user-post {
      font-size: 11px;
      color: var(--muted-foreground);
    }
    .profile-arrow {
      font-size: 18px;
      color: var(--muted-foreground);
      margin-left: -4px;
      transition: transform 0.2s ease;
    }
    .user-profile-badge:hover .profile-arrow {
      transform: rotate(180deg);
    }

    /* ── Notification Bell Wrapper ── */
    .notif-bell-wrap {
      position: relative;
      cursor: pointer;
    }

    /* ── Custom Notification Panel ── */
    .notif-panel {
      position: fixed;
      top: 64px;
      right: 90px;
      width: 360px;
      max-height: calc(100vh - 80px);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: menuFadeIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    /* Panel Header — always visible */
    .notif-panel-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      background: var(--card);
    }
    .notif-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--foreground);
    }
    .notif-count-pill {
      font-size: 10.5px;
      font-weight: 700;
      background: oklch(0.94 0.04 25);
      color: var(--destructive);
      padding: 2px 7px;
      border-radius: 9999px;
      border: 1px solid oklch(0.88 0.06 25);
    }
    .btn-mark-all {
      font-size: 11.5px !important;
      padding: 0 8px !important;
      color: var(--primary) !important;
      height: 28px !important;
      line-height: 28px !important;
      font-weight: 600 !important;
    }

    /* Panel Body — scrollable */
    .notif-panel-body {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    /* Notification items */
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 13px 16px;
      border-bottom: 1px solid var(--border);
      cursor: pointer;
      position: relative;
      transition: background 0.15s ease;
    }
    .notif-item:last-child {
      border-bottom: none;
    }
    .notif-item:hover {
      background: var(--muted);
    }
    .notif-item.unread {
      background: var(--accent);
      border-left: 3px solid var(--primary);
      padding-left: 13px;
    }
    .notif-item.unread:hover {
      background: oklch(0.94 0.02 45);
    }
    .notif-item-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .notif-item-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    /* Notification severity colors */
    .notif-warning  { background: oklch(0.94 0.05 78);  color: oklch(0.38 0.10 70); }
    .notif-alert    { background: oklch(0.94 0.05 25);  color: var(--destructive); }
    .notif-info     { background: var(--accent);        color: var(--primary); }
    .notif-success  { background: oklch(0.93 0.04 145); color: oklch(0.35 0.12 145); }

    .notif-item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .notif-item-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--foreground);
      white-space: normal;
    }
    .notif-item-desc {
      font-size: 11.5px;
      color: var(--muted-foreground);
      margin: 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .notif-item-time {
      font-size: 10.5px;
      color: var(--muted-foreground);
      margin-top: 1px;
    }
    .unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--primary);
      position: absolute;
      top: 16px;
      right: 14px;
      flex-shrink: 0;
    }

    /* Panel Footer — always visible, pinned at bottom */
    .notif-panel-footer {
      flex-shrink: 0;
      padding: 8px 12px;
      border-top: 1px solid var(--border);
      text-align: center;
      background: var(--card);
    }
    .btn-full-reports {
      width: 100%;
      font-size: 12.5px !important;
      font-weight: 700 !important;
      color: var(--primary) !important;
      gap: 6px;
    }

    /* ── Profile Arrow ── */
    .profile-arrow.open { transform: rotate(180deg); }

    /* ── Custom Profile Panel ── */
    .profile-panel {
      position: fixed;
      top: 64px;
      right: 16px;
      width: 256px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      overflow: hidden;
      animation: menuFadeIn 0.14s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Identity header */
    .profile-panel-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: var(--muted);
      border-bottom: 1px solid var(--border);
    }
    .pp-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-foreground);
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
    }
    .pp-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }
    .pp-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pp-email {
      font-size: 10.5px;
      color: var(--muted-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pp-role-badge {
      display: inline-block;
      margin-top: 3px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
      background: var(--accent);
      color: var(--primary);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1px 6px;
    }

    /* Action items */
    .profile-panel-section {
      padding: 6px 0;
    }
    .pp-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      background: none;
      border: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 500;
      color: var(--foreground);
      text-align: left;
      transition: background 0.12s ease;
    }
    .pp-item:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }
    .pp-item-icon {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: var(--muted);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--muted-foreground);
    }
    .pp-item-icon mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }
    .pp-item-icon.accent {
      background: var(--accent);
      color: var(--primary);
    }
    .pp-item span {
      flex: 1;
    }
    .pp-chevron {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    /* Sign out footer */
    .profile-panel-footer {
      border-top: 1px solid var(--border);
      padding: 6px 0;
    }
    .pp-signout {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      background: none;
      border: none;
      cursor: pointer;
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 600;
      color: var(--destructive);
      text-align: left;
      transition: background 0.12s ease;
    }
    .pp-signout:hover {
      background: oklch(0.96 0.03 25);
    }
    .pp-signout mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .text-red {
      color: var(--destructive) !important;
      font-weight: 600;
    }
    .textarea-tall {
      min-height: 80px;
      resize: vertical;
    }
    .mb-3 { margin-bottom: 12px; }

    @media (max-width: 900px) {
      .hide-sm { display: none; }
      .vessel-selector-wrap { display: none; }
    }
  `]
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private router = inject(Router);
  public state = inject(HseqStateService);
  private notify = inject(NotificationService);
  private elRef = inject(ElementRef);

  // Notification + Profile panels
  showNotifPanel: boolean = false;
  showProfilePanel: boolean = false;

  toggleNotifPanel(event: Event) {
    event.stopPropagation();
    this.showProfilePanel = false;
    this.showNotifPanel = !this.showNotifPanel;
  }

  toggleProfilePanel(event: Event) {
    event.stopPropagation();
    this.showNotifPanel = false;
    this.showProfilePanel = !this.showProfilePanel;
  }

  navigate(path: string) {
    this.showProfilePanel = false;
    this.router.navigate([path]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showNotifPanel = false;
      this.showProfilePanel = false;
    }
  }

  availableRoles: UserRole[] = [
    'Vessel Crew',
    'Inspector',
    'HSEQ Officer',
    'Department Head',
    'Approver',
    'HSEQ Admin',
    'Management Executive'
  ];

  // Quick modals
  showQuickIncidentModal: boolean = false;
  quickIncidentVesselId: string = 'VES-01';
  quickIncidentClass: any = 'Equipment Breakdown';
  quickIncidentSeverity: any = 'Medium';
  quickIncidentDesc: string = '';

  showQuickPermitModal: boolean = false;
  quickPermitVesselId: string = 'VES-01';
  quickPermitType: any = 'Hot Work (Enclosed/Open)';
  quickPermitLocation: string = 'Engine Room Aux Boiler Flat';
  quickPermitDesc: string = '';

  showQuickNearMissModal: boolean = false;
  quickNearMissVesselId: string = 'VES-01';
  quickNearMissCategory: any = 'Dropped Object';
  quickNearMissDesc: string = '';

  onVesselChange(vesselId: string) {
    this.state.setVesselFilter(vesselId);
    const vesselName = vesselId === 'ALL' ? 'All Vessels' : (this.state.vessels().find(v => v.id === vesselId)?.name || 'Vessel');
    this.notify.showInfo('Vessel Filter Updated', `Now filtering all safety registers for: ${vesselName}`);
  }

  setRole(role: UserRole) {
    this.state.setUserRole(role);
    this.notify.showSuccess('Active Persona Switched', `Now operating under ${role} workflow authority.`);
  }

  getNotifIcon(category: string): string {
    switch (category) {
      case 'alert': return 'warning';
      case 'warning': return 'timer';
      case 'success': return 'check_circle';
      default: return 'info';
    }
  }

  onNotificationClick(n: any) {
    this.state.markNotificationRead(n.id);
    if (n.link) {
      this.router.navigate([n.link]);
    }
  }

  signOut() {
    this.state.logout();
    this.notify.showInfo('Signed Out', 'You have securely logged out of the HSEQ workstation.');
    this.router.navigate(['/login']);
  }

  submitQuickIncident() {
    if (!this.quickIncidentDesc.trim()) {
      this.notify.showWarning('Description Required', 'Please enter a description for the incident report.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.quickIncidentVesselId);
    const newRecord = this.state.addIncident({
      vesselId: this.quickIncidentVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      classification: this.quickIncidentClass,
      actualSeverity: this.quickIncidentSeverity,
      description: this.quickIncidentDesc
    });

    this.showQuickIncidentModal = false;
    this.quickIncidentDesc = '';
    this.notify.showSuccess('Incident Report Logged', `Reference ${newRecord.referenceNo} filed under 5-Why Investigation.`);
    this.router.navigate(['/incidents']);
  }

  submitQuickPermit() {
    if (!this.quickPermitDesc.trim()) {
      this.notify.showWarning('Description Required', 'Please enter work description and task scope.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.quickPermitVesselId);
    const newRecord = this.state.addPermit({
      vesselId: this.quickPermitVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      permitType: this.quickPermitType,
      worksiteLocation: this.quickPermitLocation,
      workDescription: this.quickPermitDesc
    });

    this.showQuickPermitModal = false;
    this.quickPermitDesc = '';
    this.notify.showSuccess('PTW Authorized & Issued', `Permit ${newRecord.referenceNo} is now Active.`);
    this.router.navigate(['/permits']);
  }

  submitQuickNearMiss() {
    if (!this.quickNearMissDesc.trim()) {
      this.notify.showWarning('Description Required', 'Please describe the hazard observed.');
      return;
    }

    const vessel = this.state.vessels().find(v => v.id === this.quickNearMissVesselId);
    const newRecord = this.state.addNearMiss({
      vesselId: this.quickNearMissVesselId,
      vesselName: vessel?.name || 'MV Pacific Voyager',
      category: this.quickNearMissCategory,
      description: this.quickNearMissDesc
    });

    this.showQuickNearMissModal = false;
    this.quickNearMissDesc = '';
    this.notify.showSuccess('Near Miss Reported', `Near Miss ${newRecord.referenceNo} registered in fleet hazard register.`);
    this.router.navigate(['/near-miss']);
  }
}
