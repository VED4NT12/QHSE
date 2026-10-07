import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  subtext?: string;
}

@Component({
  selector: 'app-chart-wrapper',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="chart-container">
      <div class="chart-header" *ngIf="title">
        <div class="chart-title-group">
          <mat-icon *ngIf="icon" class="chart-icon" [style.color]="iconColor">{{ icon }}</mat-icon>
          <div>
            <h4 class="chart-title">{{ title }}</h4>
            <span *ngIf="subtitle" class="chart-subtitle">{{ subtitle }}</span>
          </div>
        </div>
        <div class="chart-legend" *ngIf="legendLabels && legendLabels.length > 0">
          <div *ngFor="let item of legendLabels" class="legend-item">
            <span class="legend-dot" [style.backgroundColor]="item.color"></span>
            <span class="legend-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- Type 1: Bar Chart -->
      <div *ngIf="type === 'bar'" class="bar-chart-body">
        <div class="bars-wrapper">
          <div *ngFor="let d of data" class="bar-column">
            <div class="bar-track">
              <!-- Secondary Bar if comparative -->
              <div 
                *ngIf="d.secondaryValue !== undefined"
                class="bar-fill secondary-fill" 
                [style.height.%]="getPercentage(d.secondaryValue)"
                [matTooltip]="(secondaryLegendLabel || 'Target') + ': ' + d.secondaryValue">
              </div>
              <!-- Primary Bar -->
              <div 
                class="bar-fill primary-fill" 
                [style.height.%]="getPercentage(d.value)"
                [style.backgroundColor]="d.color || primaryColor"
                [matTooltip]="d.label + ': ' + d.value + (d.subtext ? ' (' + d.subtext + ')' : '')">
                <span class="bar-value-label" *ngIf="showValues">{{ d.value }}</span>
              </div>
            </div>
            <span class="bar-axis-label">{{ d.label }}</span>
          </div>
        </div>
      </div>

      <!-- Type 2: Gauge / Donut Chart -->
      <div *ngIf="type === 'donut'" class="donut-chart-body">
        <div class="donut-visual-wrap">
          <svg viewBox="0 0 120 120" class="donut-svg">
            <!-- Background circle -->
            <circle cx="60" cy="60" r="48" class="donut-bg" />
            <!-- Segments -->
            <circle 
              *ngFor="let seg of donutSegments; let i = index"
              cx="60" 
              cy="60" 
              r="48" 
              class="donut-segment"
              [style.stroke]="seg.color"
              [style.strokeDasharray]="seg.dashArray"
              [style.strokeDashoffset]="seg.dashOffset"
              [matTooltip]="seg.label + ': ' + seg.value + ' (' + seg.percent + '%)'" />
          </svg>
          <div class="donut-center-info">
            <span class="center-value">{{ centerMetric }}</span>
            <span class="center-label">{{ centerLabel }}</span>
          </div>
        </div>

        <div class="donut-breakdown">
          <div *ngFor="let d of data" class="breakdown-row">
            <div class="breakdown-left">
              <span class="breakdown-bullet" [style.backgroundColor]="d.color"></span>
              <span class="breakdown-name">{{ d.label }}</span>
            </div>
            <span class="breakdown-val"><strong>{{ d.value }}</strong> ({{ getSegmentPercent(d.value) }}%)</span>
          </div>
        </div>
      </div>

      <!-- Type 3: Horizontal Progress Bars -->
      <div *ngIf="type === 'horizontal'" class="horizontal-bars-body">
        <div *ngFor="let d of data" class="hbar-item">
          <div class="hbar-meta">
            <span class="hbar-name">{{ d.label }}</span>
            <span class="hbar-val"><strong>{{ d.value }}</strong>{{ d.subtext ? ' ' + d.subtext : '' }}</span>
          </div>
          <div class="hbar-track">
            <div 
              class="hbar-fill" 
              [style.width.%]="getPercentage(d.value)"
              [style.backgroundColor]="d.color || primaryColor">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .chart-container {
      font-family: var(--font-sans);
    }
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }

    .chart-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chart-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .chart-title {
      font-size: 14.5px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .chart-subtitle {
      font-size: 11.5px;
      color: var(--muted-foreground);
      margin: 0;
    }

    .chart-legend {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: var(--muted-foreground);
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    /* Bar chart */
    .bars-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 180px;
      padding-top: 20px;
    }

    .bar-column {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar-track {
      flex: 1;
      width: 100%;
      max-width: 38px;
      background: var(--muted);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .bar-fill {
      width: 100%;
      border-radius: 4px 4px 0 0;
      transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .primary-fill {
      z-index: 2;
    }

    .secondary-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: oklch(0.7425 0.1187 78.6641);
      opacity: 0.55;
      z-index: 1;
    }

    .bar-value-label {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }

    .bar-axis-label {
      font-size: 11.5px;
      font-weight: 600;
      color: #64748b;
      text-align: center;
      white-space: nowrap;
    }

    /* Donut chart */
    .donut-chart-body {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 20px;
      padding: 10px 0;
      flex-wrap: wrap;
    }

    .donut-visual-wrap {
      position: relative;
      width: 140px;
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .donut-bg {
      fill: none;
      stroke: #f1f5f9;
      stroke-width: 14;
    }

    .donut-segment {
      fill: none;
      stroke-width: 14;
      stroke-linecap: round;
      transition: stroke-dasharray 0.4s ease;
    }

    .donut-center-info {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .center-value {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }

    .center-label {
      font-size: 10.5px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 3px;
    }

    .donut-breakdown {
      flex: 1;
      min-width: 180px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .breakdown-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
      border-bottom: 1px dashed #f1f5f9;
    }

    .breakdown-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breakdown-bullet {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }

    .breakdown-name {
      color: #334155;
    }

    .breakdown-val {
      color: #64748b;
    }

    /* Horizontal bars */
    .horizontal-bars-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .hbar-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .hbar-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12.5px;
    }

    .hbar-name {
      font-weight: 600;
      color: #1e293b;
    }

    .hbar-val {
      color: #64748b;
      font-size: 12px;
    }

    .hbar-track {
      height: 8px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }

    .hbar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }
  `]
})
export class ChartWrapperComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() iconColor: string = 'oklch(0.6420 0.1691 38.5815)';
  @Input() type: 'bar' | 'donut' | 'horizontal' = 'bar';
  @Input() data: ChartDataPoint[] = [];
  @Input() primaryColor: string = 'oklch(0.6420 0.1691 38.5815)';
  @Input() showValues: boolean = false;
  @Input() maxValue?: number;
  @Input() legendLabels?: { label: string; color: string }[];
  @Input() secondaryLegendLabel?: string;
  @Input() centerMetric?: string;
  @Input() centerLabel?: string;

  get totalValue(): number {
    return this.data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  }

  get calculatedMax(): number {
    if (this.maxValue) return this.maxValue;
    const maxVal = Math.max(...this.data.map(d => Math.max(d.value, d.secondaryValue || 0)), 1);
    return Math.ceil(maxVal * 1.15);
  }

  getPercentage(val: number): number {
    return Math.min(100, Math.round((val / this.calculatedMax) * 100));
  }

  getSegmentPercent(val: number): number {
    return Math.round((val / this.totalValue) * 100);
  }

  get donutSegments(): Array<{ label: string; value: number; color: string; percent: number; dashArray: string; dashOffset: string }> {
    const circumference = 2 * Math.PI * 48; // ~301.59
    let accumulated = 0;

    return this.data.map(d => {
      const pct = (d.value || 0) / this.totalValue;
      const length = pct * circumference;
      const dashArray = `${length} ${circumference - length}`;
      const dashOffset = `-${accumulated}`;
      accumulated += length;

      return {
        label: d.label,
        value: d.value,
        color: d.color || this.primaryColor,
        percent: Math.round(pct * 100),
        dashArray,
        dashOffset
      };
    });
  }
}
