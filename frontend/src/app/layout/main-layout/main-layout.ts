import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="main-layout">
      <app-sidebar />
      <div class="main-content">
        <app-header />
        <div class="page-content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: 100vh;
      background: #f4f5f7;
    }
    .main-content {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .page-content {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }
    @media (max-width: 900px) {
      .main-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class MainLayoutComponent {}
