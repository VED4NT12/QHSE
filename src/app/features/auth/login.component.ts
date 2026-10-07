import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserRole } from '../../core/models/hseq.models';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, ModalComponent
  ],
  template: `
    <div class="login-page">

      <!-- Background Maritime Compass & Grid Decoration (Subtle & Elegant) -->
      <div class="bg-decorations" aria-hidden="true">
        <svg class="bg-compass" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="400" r="380" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="1" stroke-opacity="0.09"/>
          <circle cx="400" cy="400" r="300" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="0.8" stroke-opacity="0.06" stroke-dasharray="6 8"/>
          <circle cx="400" cy="400" r="220" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="0.8" stroke-opacity="0.08"/>
          <circle cx="400" cy="400" r="140" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="0.8" stroke-opacity="0.06"/>
          <circle cx="400" cy="400" r="60" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="0.8" stroke-opacity="0.09"/>
          <!-- Cardinal crosshairs -->
          <line x1="400" y1="20" x2="400" y2="780" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="1" stroke-opacity="0.09"/>
          <line x1="20" y1="400" x2="780" y2="400" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="1" stroke-opacity="0.09"/>
          <line x1="130" y1="130" x2="670" y2="670" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="0.7" stroke-opacity="0.05" stroke-dasharray="4 8"/>
          <line x1="670" y1="130" x2="130" y2="670" stroke="oklch(0.6420 0.1691 38.5815)" stroke-width="0.7" stroke-opacity="0.05" stroke-dasharray="4 8"/>
          <!-- North pointer arrow -->
          <polygon points="400,50 392,110 400,95 408,110" fill="oklch(0.6420 0.1691 38.5815)" fill-opacity="0.25"/>
          <text x="393" y="42" font-size="16" font-weight="700" fill="oklch(0.6420 0.1691 38.5815)" fill-opacity="0.35">N</text>
        </svg>
      </div>

      <!-- ════ CENTRE LOGIN CARD ════ -->
      <div class="card-container">
        <div class="login-card">

          <!-- Brand Header -->
          <div class="card-brand">
            <div class="brand-logo-icon">
              <mat-icon>sailing</mat-icon>
            </div>
            <div class="brand-text">
              <h1 class="brand-title">HSEQ</h1>
              <p class="brand-subtitle">Fleet Safety &amp; Compliance Suite</p>
            </div>
          </div>

          <!-- Card Header & Prompt -->
          <div class="card-header">
            <h2 class="card-title">Sign In</h2>
            <p class="card-desc">Access your vessel operations &amp; safety portal</p>
          </div>

          <!-- Quick Persona Selector for Testing -->
          <div class="persona-selector">
            <div class="persona-header">
              <mat-icon class="persona-icon">bolt</mat-icon>
              <span>Demo Roles:</span>
            </div>
            <div class="persona-chips">
              <button type="button" class="chip-btn" [class.active]="selectedRole === 'HSEQ Officer'"
                (click)="applyPersona('Capt. R. Sterling','r.sterling@navishseq.com','HSEQ Officer')">
                HSEQ Supt.
              </button>
              <button type="button" class="chip-btn" [class.active]="selectedRole === 'Vessel Crew'"
                (click)="applyPersona('Chief Officer K. Hansen','k.hansen@pacificvoyager.com','Vessel Crew')">
                C/O Hansen
              </button>
              <button type="button" class="chip-btn" [class.active]="selectedRole === 'Inspector'"
                (click)="applyPersona('Capt. J. Vance','j.vance@marineaudits.org','Inspector')">
                Auditor
              </button>
              <button type="button" class="chip-btn" [class.active]="selectedRole === 'Management Executive'"
                (click)="applyPersona('Supt. D. Vance','d.vance@navishseq.com','Management Executive')">
                Executive
              </button>
            </div>
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="handleLogin()" class="login-form" novalidate>
            <!-- Email -->
            <div class="form-group">
              <label class="form-label" for="user-email">Email or Personnel ID</label>
              <div class="input-box">
                <mat-icon class="input-icon">person_outline</mat-icon>
                <input id="user-email" name="email" type="text" [(ngModel)]="email"
                  autocomplete="username" placeholder="officer@company.com" class="form-input"/>
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <div class="label-with-action">
                <label class="form-label" for="user-password">Password</label>
                <button type="button" class="link-btn" (click)="showForgotModal = true">Forgot Password?</button>
              </div>
              <div class="input-box">
                <mat-icon class="input-icon">lock_outline</mat-icon>
                <input id="user-password" name="password" [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="password" autocomplete="current-password"
                  placeholder="Enter password" class="form-input"/>
                <button type="button" class="eye-toggle" (click)="showPassword = !showPassword" aria-label="Toggle password visibility">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            <!-- Role Selector -->
            <div class="form-group">
              <label class="form-label" for="user-role">Access Profile</label>
              <div class="input-box">
                <mat-icon class="input-icon">badge</mat-icon>
                <select id="user-role" name="role" [(ngModel)]="selectedRole" class="form-input form-select">
                  <option value="HSEQ Officer">HSEQ Officer / Superintendent</option>
                  <option value="Vessel Crew">Vessel Crew / Master</option>
                  <option value="Inspector">Inspector / Auditor</option>
                  <option value="Department Head">Department Head</option>
                  <option value="Approver">Approving Authority</option>
                  <option value="Management Executive">Management Executive</option>
                  <option value="HSEQ Admin">HSEQ Administrator</option>
                </select>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="remember-row">
              <mat-checkbox [(ngModel)]="rememberMe" name="rememberMe" color="primary">
                Keep me signed in on this vessel/terminal
              </mat-checkbox>
            </div>

            <!-- Submit Button -->
            <button id="btn-submit-login" type="submit" mat-flat-button class="submit-btn" [disabled]="loading">
              <span *ngIf="!loading" class="btn-content">
                <mat-icon>login</mat-icon>
                <span>Sign In to HSEQ</span>
              </span>
              <span *ngIf="loading" class="btn-content">
                <mat-icon class="spin-icon">autorenew</mat-icon>
                <span>Authenticating&hellip;</span>
              </span>
            </button>
          </form>

          <!-- Security Footnote -->
          <div class="card-security-footer">
            <mat-icon class="sec-icon">verified_user</mat-icon>
            <span>Authorised personnel only &bull; IMO SOLAS &bull; TLS 1.3 Encrypted</span>
          </div>

        </div>

        <!-- External Footer under Card -->
        <div class="external-footer">
          <span>&copy; 2026 Maritime Fleet Systems &bull; Target Zero Safety Initiative</span>
        </div>
      </div>

    </div>

    <!-- Credentials Recovery Modal -->
    <app-modal [isOpen]="showForgotModal" title="Credentials Recovery"
      subtitle="Reset password for vessel or shore station access"
      icon="lock_reset" (close)="showForgotModal = false">
      <div modal-body>
        <p style="font-size:13px;color:var(--muted-foreground);margin-bottom:14px;line-height:1.5;">
          Enter your registered fleet email. Your designated HSEQ superintendent will verify and dispatch a secure reset token.
        </p>
        <div style="margin-bottom:14px;">
          <label style="font-size:12px;font-weight:700;color:var(--foreground);display:block;margin-bottom:6px;">Registered Email</label>
          <input type="email" [(ngModel)]="forgotEmail" placeholder="officer@company.com"
            style="width:100%;height:40px;padding:0 12px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--card);font-family:var(--font-sans);font-size:13.5px;outline:none;box-sizing:border-box;color:var(--foreground);" />
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start;background:var(--accent);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--accent-foreground);">
          <mat-icon style="font-size:16px;width:16px;height:16px;flex-shrink:0;">info_outline</mat-icon>
          <span>For urgent satellite bypass, contact Global Maritime Support Desk: +65 6800 2400</span>
        </div>
      </div>
      <div modal-footer style="display:flex;gap:8px;justify-content:flex-end;">
        <button mat-stroked-button (click)="showForgotModal = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="handleForgotSubmit()">Send Reset Link</button>
      </div>
    </app-modal>
  `,
  styles: [`
    /* ════ LOGIN ROOT: LITE ORANGE / WARM AMBIENT BACKGROUND ════ */
    .login-page {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      font-family: var(--font-sans);
      /* Subtle, soothing lite-orange warm ambient background */
      background: radial-gradient(circle at 50% 15%, #fffbf8 0%, #fff2e7 45%, #faeee4 75%, #f4e7dc 100%);
      overflow-x: hidden;
      box-sizing: border-box;
    }

    /* Background Subtle Maritime Navigation Watermark */
    .bg-decorations {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      user-select: none;
      overflow: hidden;
      z-index: 1;
    }

    .bg-compass {
      width: 860px;
      height: 860px;
      opacity: 0.75;
      animation: gentleRotate 120s linear infinite;
    }

    @keyframes gentleRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ════ CARD CONTAINER ════ */
    .card-container {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 460px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    /* ════ CENTRE LOGIN CARD ════ */
    .login-card {
      width: 100%;
      background: #ffffff;
      border-radius: var(--radius-lg, 14px);
      border: 1px solid rgba(220, 80, 20, 0.16);
      box-shadow: 0 16px 40px -10px rgba(180, 60, 10, 0.12), 0 4px 16px -2px rgba(0, 0, 0, 0.04);
      padding: 36px 32px 28px;
      box-sizing: border-box;
    }

    /* Brand Header inside the Card */
    .card-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 22px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
    }

    .brand-logo-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-sm);
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(220, 80, 20, 0.3);
      flex-shrink: 0;
    }

    .brand-logo-icon mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      margin: 0;
      font-size: 19px;
      font-weight: 800;
      color: var(--foreground);
      letter-spacing: -0.3px;
      line-height: 1.2;
    }

    .brand-subtitle {
      margin: 2px 0 0;
      font-size: 11.5px;
      color: var(--muted-foreground);
      font-weight: 500;
    }

    /* Card Header */
    .card-header {
      margin-bottom: 18px;
    }

    .card-title {
      margin: 0;
      font-size: 21px;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.3px;
    }

    .card-desc {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--muted-foreground);
    }

    /* Quick Demo Persona Chips */
    .persona-selector {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      margin-bottom: 20px;
    }

    .persona-header {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .persona-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--primary);
    }

    .persona-chips {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }

    .chip-btn {
      padding: 5px 6px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--card);
      color: var(--foreground);
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all 0.15s ease;
    }

    .chip-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .chip-btn.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--primary-foreground);
      box-shadow: 0 2px 6px rgba(220, 80, 20, 0.25);
    }

    /* Form Layout */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .label-with-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .form-label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--foreground);
    }

    .link-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .link-btn:hover {
      opacity: 0.85;
    }

    /* Input with Icon */
    .input-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--muted-foreground);
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      height: 42px;
      padding: 0 12px 0 38px;
      background: var(--input);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-family: var(--font-sans);
      font-size: 13.5px;
      color: var(--foreground);
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .form-input:focus {
      border-color: var(--ring);
      box-shadow: 0 0 0 3px oklch(0.6420 0.1691 38.5815 / 0.15);
      background: var(--card);
    }

    .form-select {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 32px;
    }

    .eye-toggle {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: color 0.12s ease;
    }

    .eye-toggle:hover {
      color: var(--foreground);
    }

    .eye-toggle mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Remember Row */
    .remember-row {
      margin-top: -2px;
    }

    /* Submit Button */
    .submit-btn {
      width: 100% !important;
      height: 44px !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      font-family: var(--font-sans) !important;
      font-size: 14px !important;
      font-weight: 700 !important;
      border-radius: var(--radius-sm) !important;
      box-shadow: 0 4px 14px rgba(220, 80, 20, 0.35) !important;
      transition: opacity 0.15s ease, transform 0.1s ease !important;
      margin-top: 4px;
    }

    .submit-btn:hover:not(:disabled) {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .submit-btn:disabled {
      opacity: 0.55 !important;
      cursor: not-allowed;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .spin-icon {
      animation: spin 0.9s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    /* Security Note in Card */
    .card-security-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 11px;
      color: var(--muted-foreground);
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      text-align: center;
    }

    .sec-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--primary);
      flex-shrink: 0;
    }

    /* External Footer */
    .external-footer {
      font-size: 12px;
      color: oklch(0.50 0.03 40);
      text-align: center;
      font-weight: 500;
      letter-spacing: 0.2px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .login-card {
        padding: 24px 20px 20px;
      }
      .persona-chips {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class LoginComponent {
  private router = inject(Router);
  private state = inject(HseqStateService);
  private notify = inject(NotificationService);

  email: string = 'r.sterling@navishseq.com';
  password: string = '••••••••••••';
  selectedRole: UserRole = 'HSEQ Officer';
  rememberMe: boolean = true;
  showPassword: boolean = false;
  loading: boolean = false;
  showForgotModal: boolean = false;
  forgotEmail: string = '';

  applyPersona(name: string, email: string, role: UserRole) {
    this.email = email;
    this.password = 'SecurityPass2026!';
    this.selectedRole = role;
    this.notify.showInfo(`Loaded: ${name}`, `Click Sign In to enter as ${role}.`);
  }

  handleLogin() {
    if (!this.email || !this.password) {
      this.notify.showError('Credentials Required', 'Please enter your email and password.');
      return;
    }
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      const name = this.email.includes('hansen') ? 'Chief Officer K. Hansen'
        : this.email.includes('vance') ? 'Capt. J. Vance' : 'Capt. R. Sterling';
      const rank = this.email.includes('hansen') ? 'Chief Officer'
        : this.email.includes('vance') ? 'Lead Auditor' : 'HSEQ Superintendent';
      this.state.login(this.email, this.selectedRole, name, rank);
      this.notify.showSuccess(`Welcome, ${name}`, `Signed in as ${this.selectedRole}.`);
      this.router.navigate(['/dashboard']);
    }, 600);
  }

  handleForgotSubmit() {
    if (!this.forgotEmail) {
      this.notify.showWarning('Email Required', 'Please enter your registered email.');
      return;
    }
    this.showForgotModal = false;
    this.notify.showSuccess('Recovery Link Sent', `Reset token dispatched to ${this.forgotEmail}.`);
    this.forgotEmail = '';
  }
}
