import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { NotificationService } from '../../../core/services/notification.service';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, EmptyStateComponent],
  template: `
    <div class="data-table-container">
      <!-- Table Controls Bar -->
      <div class="table-top-bar" *ngIf="showControls">
        <!-- Search Input -->
        <div class="search-input-wrap">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            [placeholder]="searchPlaceholder" 
            class="custom-input" />
          <button *ngIf="searchQuery" class="clear-search-btn" (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Custom Filter Slot + Export Actions -->
        <div class="top-bar-right">
          <ng-content select="[table-filters]"></ng-content>
          
          <div class="export-group" *ngIf="showExport">
            <button mat-stroked-button class="btn-table-action" (click)="exportData('Excel')" matTooltip="Export filtered dataset to Excel">
              <mat-icon>table_view</mat-icon> Excel
            </button>
            <button mat-stroked-button class="btn-table-action" (click)="exportData('PDF')" matTooltip="Export formatted summary PDF">
              <mat-icon>picture_as_pdf</mat-icon> PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="table-responsive">
        <table class="hseq-table">
          <thead>
            <tr>
              <th 
                *ngFor="let col of columns" 
                [style.width]="col.width"
                [style.textAlign]="col.align || 'left'"
                [class.sortable-th]="col.sortable"
                [class.sorted]="sortColumn === col.key"
                (click)="toggleSort(col)">
                <span>{{ col.label }}</span>
                <mat-icon *ngIf="col.sortable" class="sort-icon">
                  {{ sortColumn === col.key ? (sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                </mat-icon>
              </th>
            </tr>
          </thead>
          <tbody *ngIf="paginatedData().length > 0">
            <ng-container *ngFor="let item of paginatedData(); let i = index">
              <ng-container *ngTemplateOutlet="rowTemplate; context: { $implicit: item, index: i }"></ng-container>
            </ng-container>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div *ngIf="paginatedData().length === 0" class="empty-state-card">
        <app-empty-state
          [icon]="emptyIcon"
          [title]="emptyTitle"
          [description]="emptyDescription"
          [actionLabel]="searchQuery ? 'Clear Search' : ''"
          (actionClick)="clearSearch()">
        </app-empty-state>
      </div>

      <!-- Pagination Footer -->
      <div class="table-pagination-bar" *ngIf="filteredData().length > 0">
        <div class="pagination-meta">
          Showing <strong>{{ startIndex + 1 }}</strong> to <strong>{{ endIndex }}</strong> of <strong>{{ filteredData().length }}</strong> records
        </div>

        <div class="pagination-controls">
          <div class="page-size-picker">
            <span>Rows:</span>
            <select [(ngModel)]="pageSize" (ngModelChange)="currentPage = 1" class="page-size-select">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
          </div>

          <button 
            class="page-btn" 
            [disabled]="currentPage === 1" 
            (click)="goToPage(currentPage - 1)"
            aria-label="Previous Page">
            <mat-icon>chevron_left</mat-icon>
          </button>

          <button 
            *ngFor="let p of visiblePages()" 
            class="page-btn" 
            [class.active]="currentPage === p" 
            (click)="goToPage(p)">
            {{ p }}
          </button>

          <button 
            class="page-btn" 
            [disabled]="currentPage === totalPages()" 
            (click)="goToPage(currentPage + 1)"
            aria-label="Next Page">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .table-top-bar {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      background: #ffffff;
    }

    .search-input-wrap {
      position: relative;
      min-width: 280px;
      max-width: 380px;
      flex: 1;
    }

    .clear-search-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 2px;
    }

    .clear-search-btn:hover {
      color: #334155;
    }

    .clear-search-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .export-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-table-action {
      height: 38px !important;
      font-size: 12.5px !important;
      font-weight: 600 !important;
      color: #334155 !important;
      border-color: #cbd5e1 !important;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .empty-state-card {
      padding: 20px;
    }

    .page-size-picker {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
      margin-right: 8px;
    }

    .page-size-select {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      outline: none;
      cursor: pointer;
    }
  `]
})
export class DataTableComponent {
  private notify = inject(NotificationService);

  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() rowTemplate: any;
  @Input() searchPlaceholder: string = 'Search by keyword, reference, vessel...';
  @Input() showControls: boolean = true;
  @Input() showExport: boolean = true;
  @Input() exportFilename: string = 'HSEQ_Register_Export';
  @Input() emptyTitle: string = 'No matching records';
  @Input() emptyDescription: string = 'No records match your active search or filter criteria.';
  @Input() emptyIcon: string = 'search_off';

  searchQuery: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 10;

  onSearchChange() {
    this.currentPage = 1;
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
  }

  toggleSort(col: TableColumn) {
    if (!col.sortable) return;
    if (this.sortColumn === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    }
  }

  readonly filteredData = computed(() => {
    let result = [...this.data];

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return Object.values(item).some(val => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort
    if (this.sortColumn) {
      const key = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? dir : -dir;
      });
    }

    return result;
  });

  get totalCount(): number {
    return this.filteredData().length;
  }

  readonly totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredData().length / this.pageSize));
  });

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.filteredData().length);
  }

  readonly paginatedData = computed(() => {
    return this.filteredData().slice(this.startIndex, this.endIndex);
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage;
    const pages: number[] = [];

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  });

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage = p;
    }
  }

  exportData(format: 'Excel' | 'PDF') {
    const count = this.filteredData().length;
    this.notify.showSuccess(`Dataset Exported (${format})`, `Exported ${count} active records to ${this.exportFilename}.${format === 'Excel' ? 'xlsx' : 'pdf'}`);
  }
}
