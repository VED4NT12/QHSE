import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface WorkflowActionData {
  title: string;
  actionName: string;
  recordRef: string;
  currentStatus: string;
  targetStatus: string;
  requiresJustification?: boolean;
}

@Component({
  selector: 'app-workflow-action-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="workflow-modal-container">
      <div class="modal-header">
        <div class="header-left">
          <mat-icon class="action-icon">verified_user</mat-icon>
          <div>
            <h2 mat-dialog-title>{{ data.title }}</h2>
            <p class="subtitle">Record: <strong>{{ data.recordRef }}</strong> (Current: {{ data.currentStatus }})</p>
          </div>
        </div>
        <button mat-icon-button (click)="closeDialog()"><mat-icon>close</mat-icon></button>
      </div>

      <div mat-dialog-content class="modal-content">
        <div class="transition-banner">
          <span class="status-from">{{ data.currentStatus }}</span>
          <mat-icon class="arrow">arrow_forward</mat-icon>
          <span class="status-to">{{ data.targetStatus }}</span>
        </div>

        <mat-form-field appearance="outline" class="w-100 mt-3">
          <mat-label>Verification & Reviewer Comments</mat-label>
          <textarea matInput [(ngModel)]="comments" rows="3" placeholder="Enter notes, verification remarks, or instructions..."></textarea>
        </mat-form-field>

        <p class="audit-note">
          <mat-icon class="audit-icon">info</mat-icon>
          Your electronic sign-off with username and timestamp will be permanently appended to the non-editable audit trail.
        </p>
      </div>

      <div mat-dialog-actions align="end" class="modal-footer">
        <button mat-button (click)="closeDialog()">Cancel</button>
        <button mat-flat-button color="primary" (click)="confirmAction()" [disabled]="data.requiresJustification && !comments.trim()">
          Confirm {{ data.actionName }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .workflow-modal-container {
      padding: 12px;
      min-width: 440px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .action-icon {
      color: var(--primary);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: var(--foreground);
    }
    .subtitle {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 2px 0 0 0;
    }
    .transition-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: var(--accent);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-top: 14px;
      font-size: 13px;
      font-weight: 700;
    }
    .status-from { color: var(--muted-foreground); }
    .status-to { color: var(--primary); }
    .arrow { font-size: 18px; width: 18px; height: 18px; color: var(--primary); }
    .w-100 { width: 100%; }
    .mt-3 { margin-top: 16px; }
    .audit-note {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: var(--muted-foreground);
      margin-top: 6px;
    }
    .audit-icon { font-size: 16px; width: 16px; height: 16px; color: var(--muted-foreground); }
    .modal-footer {
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
  `]
})
export class WorkflowActionDialogComponent {
  comments: string = '';

  constructor(
    public dialogRef: MatDialogRef<WorkflowActionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WorkflowActionData
  ) {}

  confirmAction() {
    this.dialogRef.close({ confirmed: true, comments: this.comments });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
