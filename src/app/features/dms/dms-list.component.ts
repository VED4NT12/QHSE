import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HseqStateService } from '../../core/services/hseq-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { DmsDocument } from '../../core/models/hseq.models';

@Component({
  selector: 'app-dms-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    StatusBadgeComponent,
    PageHeaderComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="module-container">
      <app-page-header
        title="Document Management System (DMS)"
        subtitle="Controlled safety management system (SMS), operating procedures, manuals, checklists, and crew read-and-acknowledge compliance"
        icon="folder_shared"
        [breadcrumbs]="[{label: 'Overview', link: '/dashboard'}, {label: 'Document Repository'}]">
        <div actions class="d-flex gap-2">
          <button mat-flat-button color="primary" class="btn-primary-action" (click)="openUploadModal()">
            <mat-icon>upload_file</mat-icon> Upload Controlled Document
          </button>
        </div>
      </app-page-header>

      <!-- DMS Summary Cards -->
      <div class="dms-stats-grid mb-4">
        <div class="dms-card">
          <span class="dms-lbl">Total Controlled SMS Docs</span>
          <span class="dms-val text-blue">{{ state.dmsDocuments().length }}</span>
          <span class="dms-sub">Active fleet procedures</span>
        </div>
        <div class="dms-card">
          <span class="dms-lbl">Mandatory Read & Sign</span>
          <span class="dms-val text-amber">{{ getMandatoryCount() }} Docs</span>
          <span class="dms-sub">Requires crew acknowledgement</span>
        </div>
        <div class="dms-card">
          <span class="dms-lbl">Fleet Compliance Rate</span>
          <span class="dms-val text-green">94.2%</span>
          <span class="dms-sub">Audited against ISM Code §11</span>
        </div>
        <div class="dms-card">
          <span class="dms-lbl">Revisions Under Review</span>
          <span class="dms-val text-indigo">1 Doc</span>
          <span class="dms-sub">Annual revision cycle</span>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="hseq-card filter-card mb-4">
        <div class="filter-row">
          <div class="search-input-wrap">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search by document number, title, category..." 
              class="custom-input" />
          </div>

          <div class="filter-controls">
            <select [(ngModel)]="categoryFilter" class="custom-select">
              <option value="ALL">All Categories</option>
              <option value="Safety Management Manual">Safety Management Manual</option>
              <option value="Emergency Procedure">Emergency Procedure</option>
              <option value="Engineering Procedure">Engineering Procedure</option>
              <option value="Navigation Checklist">Navigation Checklist</option>
            </select>

            <select [(ngModel)]="confFilter" class="custom-select">
              <option value="ALL">All Confidentiality</option>
              <option value="Public">Public</option>
              <option value="Restricted">Restricted</option>
              <option value="Confidential">Confidential</option>
            </select>

            <button *ngIf="searchQuery || categoryFilter !== 'ALL' || confFilter !== 'ALL'" 
                    mat-stroked-button (click)="resetFilters()" class="btn-reset">
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- DMS Table -->
      <div class="hseq-card">
        <div class="table-responsive" *ngIf="paginatedDocs().length > 0">
          <table class="hseq-table">
            <thead>
              <tr>
                <th (click)="toggleSort('documentNumber')" class="sortable-th">
                  Document No.
                  <mat-icon class="sort-icon">{{ getSortIcon('documentNumber') }}</mat-icon>
                </th>
                <th (click)="toggleSort('title')" class="sortable-th">
                  Title & Category
                  <mat-icon class="sort-icon">{{ getSortIcon('title') }}</mat-icon>
                </th>
                <th>Revision</th>
                <th>Confidentiality</th>
                <th>Effective Date</th>
                <th>Next Review</th>
                <th>Read & Acknowledge %</th>
                <th>Status</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doc of paginatedDocs()">
                <td class="mono-ref font-bold">{{ doc.documentNumber }}</td>
                <td>
                  <strong class="text-sm block">{{ doc.title }}</strong>
                  <span class="dms-cat-tag">{{ doc.category }}</span>
                </td>
                <td><span class="rev-badge">{{ doc.revision }}</span></td>
                <td>
                  <span class="conf-pill" [ngClass]="'conf-' + doc.confidentiality.toLowerCase()">
                    {{ doc.confidentiality }}
                  </span>
                </td>
                <td>{{ doc.effectiveDate }}</td>
                <td>{{ doc.nextReviewDate }}</td>
                <td>
                  <div class="ack-progress-box" *ngIf="doc.readAndAcknowledgeRequired">
                    <div class="ack-numbers">
                      <span>{{ doc.acknowledgedCount }} / {{ doc.totalRequiredCrew }} Crew</span>
                      <strong class="ack-pct">{{ Math.round((doc.acknowledgedCount / doc.totalRequiredCrew) * 100) }}%</strong>
                    </div>
                    <mat-progress-bar mode="determinate" [value]="(doc.acknowledgedCount / doc.totalRequiredCrew) * 100"></mat-progress-bar>
                  </div>
                  <span *ngIf="!doc.readAndAcknowledgeRequired" class="text-muted text-xs">Informational</span>
                </td>
                <td><app-status-badge [status]="doc.status"></app-status-badge></td>
                <td class="text-right">
                  <button mat-stroked-button color="primary" class="btn-sm" (click)="acknowledgeDoc(doc)">
                    <mat-icon class="xs-icon">thumb_up</mat-icon> Acknowledge
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Bar -->
          <div class="table-pagination-bar">
            <span>Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ getEndIndex() }} of {{ filteredDocs().length }} documents</span>
            <div class="pagination-controls">
              <button class="page-btn" [disabled]="currentPage === 1" (click)="currentPage = currentPage - 1">
                Previous
              </button>
              <button *ngFor="let page of getPages()" 
                      class="page-btn" 
                      [class.active]="currentPage === page" 
                      (click)="currentPage = page">
                {{ page }}
              </button>
              <button class="page-btn" [disabled]="currentPage === totalPages()" (click)="currentPage = currentPage + 1">
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <app-empty-state 
          *ngIf="paginatedDocs().length === 0"
          icon="folder_shared"
          title="No Documents Found"
          message="No controlled documents match your search criteria. Try modifying your query or upload a new SMS procedure."
          actionText="Upload Document"
          (action)="openUploadModal()">
        </app-empty-state>
      </div>
    </div>

    <!-- Upload Controlled Document Modal -->
    <app-modal
      [isOpen]="isUploadModalOpen"
      title="Upload Controlled Safety Document (SMS)"
      subtitle="Publish an approved marine safety management procedure, manual revision, or checklist"
      icon="folder_shared"
      maxWidth="680px"
      (close)="isUploadModalOpen = false">
      <div class="modal-form">
        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Document Title *</label>
            <input type="text" [(ngModel)]="newDoc.title" placeholder="e.g. Enclosed Space Entry & Gas Testing Procedure" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Category *</label>
            <select [(ngModel)]="newDoc.category" class="custom-select">
              <option value="Safety Management Manual">Safety Management Manual (SMS)</option>
              <option value="Emergency Procedure">Emergency Procedure</option>
              <option value="Engineering Procedure">Engineering Procedure</option>
              <option value="Navigation Checklist">Navigation Checklist</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Document Number *</label>
            <input type="text" [(ngModel)]="newDoc.documentNumber" placeholder="e.g. SMS-OP-40" class="custom-input" />
          </div>
          <div class="form-col">
            <label class="form-label">Revision No. *</label>
            <input type="text" [(ngModel)]="newDoc.revision" placeholder="e.g. Rev 4.0" class="custom-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-col">
            <label class="form-label">Confidentiality *</label>
            <select [(ngModel)]="newDoc.confidentiality" class="custom-select">
              <option value="Restricted">Restricted (Fleet Crew & Shore)</option>
              <option value="Confidential">Confidential (Senior Officers Only)</option>
              <option value="Public">Public (Unrestricted)</option>
            </select>
          </div>
          <div class="form-col">
            <label class="form-label">Mandatory Read & Acknowledge?</label>
            <select [(ngModel)]="newDoc.readAndAcknowledgeRequired" class="custom-select">
              <option [ngValue]="true">Yes - Mandatory for all vessel crew</option>
              <option [ngValue]="false">No - Informational only</option>
            </select>
          </div>
        </div>
      </div>

      <div modal-actions>
        <button mat-stroked-button (click)="isUploadModalOpen = false">Cancel</button>
        <button mat-flat-button color="primary" class="btn-primary-action" (click)="saveDoc()">
          <mat-icon>check</mat-icon> Publish Controlled Doc
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .module-container { display: flex; flex-direction: column; gap: 16px; }
    .dms-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .dms-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow-sm); }
    .dms-lbl { font-size: 11px; font-weight: 700; color: var(--muted-foreground); text-transform: uppercase; }
    .dms-val { font-size: 24px; font-weight: 800; color: var(--foreground); }
    .dms-sub { font-size: 11.5px; color: var(--muted-foreground); }
    .text-blue { color: var(--primary); }
    .text-amber { color: var(--secondary-foreground); }
    .text-green { color: var(--primary); }
    .text-indigo { color: var(--primary); }
    .filter-card { padding: 14px 20px; }
    .filter-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
    .search-input-wrap { position: relative; flex: 1; min-width: 280px; }
    .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 20px; color: var(--muted-foreground); }
    .search-input-wrap .custom-input { padding-left: 38px; }
    .filter-controls { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .btn-reset { height: 38px !important; color: var(--muted-foreground) !important; }
    .dms-cat-tag { font-size: 11px; color: var(--muted-foreground); background: var(--muted); padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; }
    .rev-badge { font-family: var(--font-mono); font-size: 11.5px; font-weight: 700; background: var(--accent); color: var(--primary); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); }
    .conf-pill { font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
    .conf-restricted { background: oklch(0.95 0.04 78); color: oklch(0.40 0.10 76); border: 1px solid oklch(0.88 0.06 78); }
    .conf-confidential { background: oklch(0.95 0.04 25); color: var(--destructive); border: 1px solid oklch(0.88 0.08 25); }
    .conf-public { background: var(--accent); color: var(--primary); border: 1px solid var(--border); }
    .ack-progress-box { width: 150px; display: flex; flex-direction: column; gap: 4px; }
    .ack-numbers { display: flex; justify-content: space-between; font-size: 11px; }
    .ack-pct { color: var(--primary); }
    .text-right { text-align: right; }
    .btn-sm { height: 32px !important; font-size: 11.5px !important; }
    .xs-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 3px; }
    .sortable-th { cursor: pointer; user-select: none; }
    .sort-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-left: 4px; color: #94a3b8; }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .form-col { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; font-weight: 700; color: #475569; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class DmsListComponent {
  Math = Math;
  searchQuery: string = '';
  categoryFilter: string = 'ALL';
  confFilter: string = 'ALL';

  sortColumn: keyof DmsDocument = 'documentNumber';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage: number = 1;
  pageSize: number = 6;

  isUploadModalOpen: boolean = false;

  newDoc = {
    title: '',
    category: 'Safety Management Manual',
    documentNumber: '',
    revision: 'Rev 1.0',
    confidentiality: 'Restricted',
    readAndAcknowledgeRequired: true
  };

  constructor(
    public state: HseqStateService,
    private notify: NotificationService
  ) {}

  filteredDocs = computed(() => {
    const list = this.state.dmsDocuments();
    const filtered = list.filter(doc => {
      const matchCat = this.categoryFilter === 'ALL' || doc.category === this.categoryFilter;
      const matchConf = this.confFilter === 'ALL' || doc.confidentiality === this.confFilter;
      const q = this.searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        doc.documentNumber.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q);

      return matchCat && matchConf && matchSearch;
    });

    return filtered.sort((a, b) => {
      const valA = (a[this.sortColumn] || '').toString();
      const valB = (b[this.sortColumn] || '').toString();
      return this.sortDirection === 'asc' 
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  });

  paginatedDocs = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDocs().slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredDocs().length / this.pageSize) || 1);

  getPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredDocs().length);
  }

  getMandatoryCount(): number {
    return this.state.dmsDocuments().filter(d => d.readAndAcknowledgeRequired).length;
  }

  toggleSort(col: keyof DmsDocument) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(col: keyof DmsDocument): string {
    if (this.sortColumn !== col) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  resetFilters() {
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
    this.confFilter = 'ALL';
    this.currentPage = 1;
  }

  acknowledgeDoc(doc: DmsDocument) {
    this.state.acknowledgeDms(doc.id);
    this.notify.showSuccess(
      'Document Acknowledged',
      `Electronic Read & Acknowledge recorded for ${doc.documentNumber} (${this.state.currentUserInfo().name} - ${this.state.currentUserInfo().role}).`
    );
  }

  openUploadModal() {
    this.isUploadModalOpen = true;
  }

  saveDoc() {
    if (!this.newDoc.title || !this.newDoc.documentNumber) {
      this.notify.showError('Required Fields', 'Please specify Document Title and Document Number.');
      return;
    }

    const today = new Date().toISOString().substring(0, 10);
    const nextReview = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    this.state.addDmsDocument({
      documentNumber: this.newDoc.documentNumber,
      title: this.newDoc.title,
      category: this.newDoc.category as any,
      revision: this.newDoc.revision,
      effectiveDate: today,
      nextReviewDate: nextReview,
      status: 'Approved & Issued',
      readAndAcknowledgeRequired: this.newDoc.readAndAcknowledgeRequired,
      acknowledgedCount: 1,
      totalRequiredCrew: 22,
      confidentiality: this.newDoc.confidentiality as any
    });

    this.isUploadModalOpen = false;
    this.notify.showSuccess('Document Published', `${this.newDoc.documentNumber} uploaded and published to fleet.`);
    this.newDoc.title = '';
    this.newDoc.documentNumber = '';
  }
}
