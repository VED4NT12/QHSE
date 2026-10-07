import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="hseq-app-wrapper">
      <app-header (toggleSidebar)="sidebarCollapsed = !sidebarCollapsed"></app-header>
      <div class="hseq-app-body">
        <app-sidebar [collapsed]="sidebarCollapsed"></app-sidebar>
        <main class="hseq-main-viewport">
          <div class="viewport-inner">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .hseq-app-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      background: var(--background);
    }
    .hseq-app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    .hseq-main-viewport {
      flex: 1;
      overflow-y: auto;
      background-color: var(--background);
    }
    .viewport-inner {
      padding: 24px 28px;
      max-width: 1540px;
      margin: 0 auto;
    }
    @media (max-width: 768px) {
      .viewport-inner {
        padding: 16px;
      }
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed: boolean = false;
}
