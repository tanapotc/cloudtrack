import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="workspace" [class.nav-open]="navOpen()">
      <aside>
        <a routerLink="/dashboard" class="brand"><span class="brand-mark"><mat-icon>cloud_queue</mat-icon></span><span>CloudTrack</span></a>
        <nav aria-label="Primary navigation">
          <p>WORKSPACE</p>
          @for (item of primaryNav; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active" (click)="navOpen.set(false)"><mat-icon>{{ item.icon }}</mat-icon><span>{{ item.label }}</span></a>
          }
          <p>MANAGE</p>
          @for (item of manageNav; track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active" (click)="navOpen.set(false)"><mat-icon>{{ item.icon }}</mat-icon><span>{{ item.label }}</span></a>
          }
        </nav>
        <div class="learning-card"><mat-icon>auto_awesome</mat-icon><strong>Portfolio lab</strong><span>Built to learn Azure with production-minded choices.</span></div>
        <button class="account" [matMenuTriggerFor]="accountMenu">
          <span class="avatar">{{ initials() }}</span><span><strong>{{ auth.currentUser()?.displayName }}</strong><small>{{ auth.currentUser()?.roles?.[0] }}</small></span><mat-icon>unfold_more</mat-icon>
        </button>
        <mat-menu #accountMenu="matMenu"><button mat-menu-item routerLink="/profile"><mat-icon>person</mat-icon>Profile</button><button mat-menu-item routerLink="/settings"><mat-icon>settings</mat-icon>Settings</button><button mat-menu-item (click)="auth.logout()"><mat-icon>logout</mat-icon>Sign out</button></mat-menu>
      </aside>
      <button class="scrim" aria-label="Close navigation" (click)="navOpen.set(false)"></button>
      <section class="content-area">
        <header>
          <button mat-icon-button class="menu-button" aria-label="Open navigation" [attr.aria-expanded]="navOpen()" (click)="navOpen.set(!navOpen())"><mat-icon>menu</mat-icon></button>
          <div class="search"><mat-icon>search</mat-icon><span>Search projects and tasks</span><kbd>⌘ K</kbd></div>
          <div class="header-actions"><button mat-icon-button aria-label="Help"><mat-icon>help_outline</mat-icon></button><button mat-icon-button aria-label="Notifications"><mat-icon>notifications_none</mat-icon><i></i></button><span class="mini-avatar">{{ initials() }}</span></div>
        </header>
        <main><router-outlet /></main>
      </section>
    </div>
  `,
  styles: `
    :host { display:block; min-height:100%; } .workspace { min-height:100vh; display:grid; grid-template-columns:250px 1fr; background:#f5f7fb; }
    aside { position:sticky; top:0; z-index:20; height:100vh; display:flex; flex-direction:column; padding:24px 16px 18px; color:#dbeafe; background:#0d1b3e; box-sizing:border-box; }
    .brand { display:flex; align-items:center; gap:11px; padding:0 10px 27px; color:#fff; text-decoration:none; font-size:20px; font-weight:800; letter-spacing:-.025em; }.brand-mark { display:grid; place-items:center; width:36px; height:36px; border-radius:11px; background:#2563eb; }.brand-mark mat-icon { font-size:22px; width:22px; height:22px; }
    nav p { margin:20px 12px 8px; color:#64748b; font-size:10px; font-weight:800; letter-spacing:.14em; } nav a { display:flex; align-items:center; gap:13px; margin:3px 0; padding:11px 12px; border-radius:10px; color:#9fb0cf; text-decoration:none; font-size:14px; font-weight:600; transition:.15s ease; } nav a:hover { color:#fff; background:#152750; } nav a.active { color:#fff; background:#1d4ed8; box-shadow:0 8px 24px rgba(37,99,235,.24); } nav mat-icon { font-size:20px; width:20px; height:20px; }
    .learning-card { display:grid; gap:7px; margin:auto 4px 14px; padding:15px; border-radius:12px; background:#14264b; font-size:12px; line-height:1.45; color:#91a4c5; }.learning-card mat-icon { color:#60a5fa; }.learning-card strong { color:#fff; font-size:13px; }
    .account { display:grid; grid-template-columns:38px 1fr 20px; gap:10px; align-items:center; width:100%; padding:10px 8px; border:0; border-top:1px solid #20345b; background:transparent; color:#fff; text-align:left; cursor:pointer; }.account strong,.account small { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }.account small { margin-top:2px; color:#7f94b7; font-size:11px; }.avatar,.mini-avatar { display:grid; place-items:center; border-radius:11px; background:linear-gradient(135deg,#60a5fa,#2563eb); color:#fff; font-size:12px; font-weight:800; }.avatar { width:38px; height:38px; }
    .content-area { min-width:0; } header { position:sticky; top:0; z-index:10; height:68px; padding:0 32px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e6eaf1; background:rgba(255,255,255,.92); backdrop-filter:blur(14px); box-sizing:border-box; }.search { width:min(440px,48vw); height:38px; display:flex; align-items:center; gap:10px; padding:0 12px; border:1px solid #e2e8f0; border-radius:10px; color:#94a3b8; background:#f8fafc; font-size:13px; }.search mat-icon { font-size:19px; }.search kbd { margin-left:auto; padding:2px 6px; border:1px solid #dbe1ea; border-radius:5px; background:#fff; font-size:10px; }.header-actions { display:flex; align-items:center; gap:5px; color:#64748b; }.header-actions button { position:relative; }.header-actions i { position:absolute; right:7px; top:6px; width:7px; height:7px; border:2px solid #fff; border-radius:50%; background:#ef4444; }.mini-avatar { width:34px; height:34px; margin-left:8px; } .menu-button { display:none; } main { padding:34px; }
    .scrim { display:none; }
    @media(max-width:900px) { .workspace { grid-template-columns:1fr; } aside { position:fixed; left:0; transform:translateX(-102%); width:250px; transition:transform .2s ease; } .nav-open aside { transform:translateX(0); } .nav-open .scrim { display:block; position:fixed; inset:0; z-index:15; border:0; background:rgba(15,23,42,.42); } .menu-button { display:inline-flex; } header { padding:0 18px; } .search { display:none; } main { padding:24px 18px; } }
  `,
})
export class AppShell {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly navOpen = signal(false);
  readonly primaryNav = [
    { label: 'Overview', icon: 'space_dashboard', route: '/dashboard' },
    { label: 'Projects', icon: 'folder_open', route: '/projects' },
  ];
  readonly manageNav = [
    { label: 'Users', icon: 'group', route: '/users' },
    { label: 'Roles', icon: 'admin_panel_settings', route: '/roles' },
    { label: 'Settings', icon: 'tune', route: '/settings' },
  ];

  initials(): string {
    return this.auth.currentUser()?.displayName.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase() ?? 'CT';
  }
}
