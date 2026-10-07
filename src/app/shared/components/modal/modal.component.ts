import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div *ngIf="isOpen" class="hseq-modal-backdrop" (click)="onBackdropClick($event)">
      <div class="hseq-modal-dialog" [style.maxWidth]="maxWidth">
        <!-- Header -->
        <div class="hseq-modal-header">
          <div class="modal-header-title">
            <mat-icon *ngIf="icon" class="modal-icon" [style.color]="iconColor">{{ icon }}</mat-icon>
            <div>
              <h3>{{ title }}</h3>
              <p *ngIf="subtitle">{{ subtitle }}</p>
            </div>
          </div>
          <button mat-icon-button (click)="close.emit()" aria-label="Close modal">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="hseq-modal-body">
          <ng-content select="[modal-body]"></ng-content>
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div class="hseq-modal-footer" *ngIf="showFooter">
          <ng-content select="[modal-footer],[modal-actions]"></ng-content>
          <button *ngIf="showDefaultClose" mat-stroked-button (click)="close.emit()">
            {{ closeButtonText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() iconColor: string = 'oklch(0.6420 0.1691 38.5815)';
  @Input() maxWidth: string = '640px';
  @Input() showFooter: boolean = true;
  @Input() showDefaultClose: boolean = false;
  @Input() closeButtonText: string = 'Close';
  @Input() closeOnBackdrop: boolean = true;
  
  @Output() close = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
