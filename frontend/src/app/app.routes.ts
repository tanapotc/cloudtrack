import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./layouts/public-layout').then((module) => module.PublicLayout),
    children: [
      { path: 'login', data: { mode: 'login' }, loadComponent: () => import('./features/auth/auth-page').then((module) => module.AuthPage) },
      { path: 'register', data: { mode: 'register' }, loadComponent: () => import('./features/auth/auth-page').then((module) => module.AuthPage) },
      { path: 'forgot-password', data: { mode: 'forgot' }, loadComponent: () => import('./features/auth/auth-page').then((module) => module.AuthPage) },
      { path: 'reset-password', data: { mode: 'reset' }, loadComponent: () => import('./features/auth/auth-page').then((module) => module.AuthPage) },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-shell').then((module) => module.AppShell),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard-page').then((module) => module.DashboardPage) },
      { path: 'projects', loadComponent: () => import('./features/projects/projects-page').then((module) => module.ProjectsPage) },
      { path: 'projects/:id', loadComponent: () => import('./features/projects/project-detail-page').then((module) => module.ProjectDetailPage) },
      { path: 'users', data: { title: 'User management', description: 'Invite users and manage account access.' }, loadComponent: () => import('./features/shared/coming-soon-page').then((module) => module.ComingSoonPage) },
      { path: 'roles', data: { title: 'Role management', description: 'Review Admin, Manager, and User permissions.' }, loadComponent: () => import('./features/shared/coming-soon-page').then((module) => module.ComingSoonPage) },
      { path: 'profile', data: { title: 'Profile', description: 'Keep your CloudTrack identity up to date.' }, loadComponent: () => import('./features/shared/coming-soon-page').then((module) => module.ComingSoonPage) },
      { path: 'settings', data: { title: 'Settings', description: 'Configure workspace defaults and notifications.' }, loadComponent: () => import('./features/shared/coming-soon-page').then((module) => module.ComingSoonPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
