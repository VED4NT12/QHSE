import { Component, input, output, model, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="hseq-card enterprise-toolbar">
      <div class="toolbar-grid">
        <!-- Search Field (Prominent, Flexes to Fill Width, No-Overlap Flexbox) -->
        <div class="toolbar-item search-item">
          <label class="toolbar-label">{{ searchLabel() }}</label>
          <div class="search-control">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="onSearchInput($event)"
              [placeholder]="placeholder()"
              class="search-input" />
            @if (searchQuery()) {
              <button type="button" class="clear-search-btn" (click)="clearSearch()" title="Clear search">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        </div>

        <!-- Projected Dropdown Filters (Equally Distributed Across Remaining Space) -->
        <div class="toolbar-filters">
          <ng-content></ng-content>
        </div>

        <!-- Reset Button -->
        @if (isFiltered()) {
          <div class="toolbar-item reset-item">
            <label class="toolbar-label">&nbsp;</label>
            <button type="button" class="btn-toolbar-reset" (click)="reset.emit()" title="Reset all active filters">
              <mat-icon class="reset-icon">restart_alt</mat-icon>
              <span>Reset</span>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin-bottom: 12px;
      width: 100%;
    }

    .hseq-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-2xs);
    }

    .enterprise-toolbar {
      padding: 10px 16px;
      width: 100%;
      box-sizing: border-box;
    }

    .toolbar-grid {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      width: 100%;
      flex-wrap: wrap;
    }

    .toolbar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toolbar-label {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1;
    }

    /* Search Box: prominent flex width, no overlap */
    .search-item {
      flex: 1.5 1 280px;
      min-width: 240px;
    }

    .search-control {
      display: flex;
      align-items: center;
      height: 38px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0 12px;
      gap: 8px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing: border-box;
      width: 100%;
    }

    .search-control:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px oklch(0.64 0.17 38.5 / 0.15);
    }

    .search-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--muted-foreground);
      flex-shrink: 0;
      margin: 0;
      pointer-events: none;
    }

    .search-input {
      border: none !important;
      outline: none !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 100% !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      color: var(--foreground) !important;
      font-family: inherit !important;
      box-shadow: none !important;
    }

    .search-input::placeholder {
      color: var(--muted-foreground);
      opacity: 0.75;
    }

    .clear-search-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      flex-shrink: 0;
      border-radius: 50%;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .clear-search-btn:hover {
      background: var(--muted);
      color: var(--foreground);
    }

    .clear-search-btn mat-icon {
      font-size: 15px;
      width: 15px;
      height: 15px;
    }

    /* Projected Filters Group - Even distribution across available width */
    .toolbar-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
      flex: 2 1 auto;
    }

    ::ng-deep .toolbar-filters .filter-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1 1 160px;
      min-width: 130px;
    }

    ::ng-deep .toolbar-filters .filter-label {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1;
    }

    ::ng-deep .toolbar-filters .custom-select {
      height: 38px;
      border: 1px solid var(--border);
      background-color: var(--card);
      border-radius: var(--radius-sm);
      padding: 0 32px 0 11px;
      font-size: 13px;
      font-weight: 500;
      color: var(--foreground);
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      width: 100%;
      box-sizing: border-box;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 13px;
    }

    ::ng-deep .toolbar-filters .custom-select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px oklch(0.64 0.17 38.5 / 0.15);
    }

    /* Reset Button */
    .reset-item {
      flex: 0 0 auto;
    }

    .btn-toolbar-reset {
      height: 38px;
      padding: 0 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--card);
      color: var(--muted-foreground);
      font-size: 12.5px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      transition: all 0.15s ease;
      box-sizing: border-box;
    }

    .btn-toolbar-reset:hover {
      background: oklch(0.96 0.03 25 / 0.15);
      border-color: oklch(0.55 0.18 25);
      color: oklch(0.50 0.18 25);
    }

    .reset-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
  `]
})
export class SearchFilterComponent {
  readonly searchLabel = input<string>('Search Register');
  readonly placeholder = input<string>('Search records...');
  readonly searchQuery = model<string>('');
  readonly isFiltered = input<boolean>(false);

  readonly reset = output<void>();

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }
}
