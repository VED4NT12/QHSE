import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RiskLevel } from '../../../core/models/hseq.models';

export interface RiskMatrixResult {
  likelihood: number;
  consequence: number;
  rating: number;
  level: RiskLevel;
}

@Component({
  selector: 'app-risk-matrix-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="matrix-dialog-container">
      <div class="matrix-dialog-header">
        <div class="title-wrap">
          <mat-icon class="header-icon">grid_on</mat-icon>
          <div>
            <h2 mat-dialog-title>HSEQ 5x5 Standard Risk Matrix</h2>
            <p class="subtitle">Click on any cell to select Likelihood vs Consequence/Severity</p>
          </div>
        </div>
        <button mat-icon-button (click)="closeDialog()"><mat-icon>close</mat-icon></button>
      </div>

      <div mat-dialog-content class="matrix-body">
        <div class="matrix-layout">
          <!-- Y-Axis Label -->
          <div class="y-axis-label">
            <span>LIKELIHOOD / PROBABILITY</span>
          </div>

          <div class="matrix-grid-area">
            <!-- 5 Rows (5 to 1) -->
            <div *ngFor="let l of [5, 4, 3, 2, 1]" class="matrix-row">
              <div class="row-label">{{ getLikelihoodLabel(l) }} ({{l}})</div>
              <div 
                *ngFor="let c of [1, 2, 3, 4, 5]" 
                class="matrix-cell"
                [ngClass]="getCellClass(l, c)"
                [class.selected]="selectedL === l && selectedC === c"
                (click)="selectCell(l, c)">
                <span class="cell-rating">{{ l * c }}</span>
                <span class="cell-tag">{{ getLevel(l * c) }}</span>
              </div>
            </div>

            <!-- X-Axis Labels (1 to 5) -->
            <div class="matrix-row header-row">
              <div class="row-label"></div>
              <div *ngFor="let c of [1, 2, 3, 4, 5]" class="col-label">
                {{ getConsequenceLabel(c) }} ({{c}})
              </div>
            </div>
            <div class="x-axis-label">CONSEQUENCE / SEVERITY</div>
          </div>
        </div>

        <!-- Result Box -->
        <div class="matrix-result-box" *ngIf="selectedL && selectedC">
          <div class="result-details">
            <span class="calc-formula">Selected: Likelihood {{ selectedL }} &times; Consequence {{ selectedC }} = <strong>{{ selectedL * selectedC }}</strong></span>
            <div class="result-badge" [ngClass]="getResultBadgeClass()">
              Risk Rating: {{ selectedL * selectedC }} &bull; {{ getLevel(selectedL * selectedC) }} Risk
            </div>
          </div>
          <button mat-flat-button color="primary" (click)="confirmSelection()" class="btn-confirm">
            Apply to Record
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .matrix-dialog-container {
      padding: 10px;
      max-width: 680px;
    }
    .matrix-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--primary);
    }
    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--foreground);
    }
    .subtitle {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 2px 0 0 0;
    }
    .matrix-layout {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
    .y-axis-label {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 4px;
    }
    .matrix-grid-area {
      flex: 1;
    }
    .matrix-row {
      display: grid;
      grid-template-columns: 140px repeat(5, 1fr);
      gap: 6px;
      margin-bottom: 6px;
      align-items: center;
    }
    .row-label {
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      text-align: right;
      padding-right: 8px;
      white-space: nowrap;
    }
    .col-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      text-align: center;
      line-height: 1.2;
    }
    .x-axis-label {
      text-align: center;
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      letter-spacing: 1px;
      margin-top: 8px;
      padding-left: 140px;
    }
    .matrix-cell {
      height: 52px;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.15s ease;
      user-select: none;
    }
    .matrix-cell:hover {
      filter: brightness(0.92);
      transform: scale(1.04);
    }
    .matrix-cell.selected {
      border: 3px solid #0f172a !important;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    }
    .cell-low { background-color: #a7f3d0; color: #065f46; }
    .cell-med { background-color: #fde68a; color: #92400e; }
    .cell-high { background-color: #fdba74; color: #9a3412; }
    .cell-critical { background-color: #fca5a5; color: #991b1b; }

    .cell-rating {
      font-size: 15px;
      font-weight: 800;
    }
    .cell-tag {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .matrix-result-box {
      margin-top: 20px;
      padding: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .calc-formula {
      font-size: 13.5px;
      color: #334155;
    }
    .result-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 700;
    }
    .badge-res-low { background: #d1fae5; color: #065f46; }
    .badge-res-med { background: #fef3c7; color: #92400e; }
    .badge-res-high { background: #ffedd5; color: #9a3412; }
    .badge-res-critical { background: #fee2e2; color: #991b1b; }
  `]
})
export class RiskMatrixDialogComponent {
  selectedL: number = 3;
  selectedC: number = 3;

  constructor(
    public dialogRef: MatDialogRef<RiskMatrixDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { initialL?: number; initialC?: number }
  ) {
    if (data?.initialL) this.selectedL = data.initialL;
    if (data?.initialC) this.selectedC = data.initialC;
  }

  getLikelihoodLabel(l: number): string {
    switch (l) {
      case 5: return 'Almost Certain';
      case 4: return 'Likely';
      case 3: return 'Possible';
      case 2: return 'Unlikely';
      case 1: return 'Rare';
      default: return '';
    }
  }

  getConsequenceLabel(c: number): string {
    switch (c) {
      case 1: return 'Insignificant';
      case 2: return 'Minor';
      case 3: return 'Moderate';
      case 4: return 'Major';
      case 5: return 'Catastrophic';
      default: return '';
    }
  }

  getLevel(score: number): RiskLevel {
    if (score <= 4) return 'Low';
    if (score <= 9) return 'Medium';
    if (score <= 16) return 'High';
    return 'Critical';
  }

  getCellClass(l: number, c: number): string {
    const score = l * c;
    if (score <= 4) return 'cell-low';
    if (score <= 9) return 'cell-med';
    if (score <= 16) return 'cell-high';
    return 'cell-critical';
  }

  getResultBadgeClass(): string {
    const score = this.selectedL * this.selectedC;
    if (score <= 4) return 'badge-res-low';
    if (score <= 9) return 'badge-res-med';
    if (score <= 16) return 'badge-res-high';
    return 'badge-res-critical';
  }

  selectCell(l: number, c: number) {
    this.selectedL = l;
    this.selectedC = c;
  }

  confirmSelection() {
    const rating = this.selectedL * this.selectedC;
    const res: RiskMatrixResult = {
      likelihood: this.selectedL,
      consequence: this.selectedC,
      rating,
      level: this.getLevel(rating)
    };
    this.dialogRef.close(res);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
