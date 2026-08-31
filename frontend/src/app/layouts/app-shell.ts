import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
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
    return (
      this.auth
        .currentUser()
        ?.displayName.split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() ?? 'CT'
    );
  }
}
