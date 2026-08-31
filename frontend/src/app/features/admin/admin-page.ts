import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ManagedUserSummary, PermissionSummary, PagedResult, RoleSummary } from '../../core/models';

@Component({
  selector: 'app-admin-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly mode = (this.route.snapshot.data['mode'] as 'users' | 'roles') ?? 'users';
  readonly users = signal<ManagedUserSummary[]>([]);
  readonly userPageIndex = signal(0);
  readonly userPageSize = signal(30);
  readonly totalUsers = signal(0);
  readonly roles = signal<RoleSummary[]>([]);
  readonly roleOptions = signal<RoleSummary[]>([]);
  readonly permissions = signal<PermissionSummary[]>([]);
  readonly loading = signal(true);
  readonly forbidden = signal(false);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly savingUserId = signal<string | null>(null);
  readonly savingRoleId = signal<string | null>(null);
  readonly canManageUsers = computed(
    () => this.auth.currentUser()?.permissions.includes('users.manage') ?? false,
  );
  readonly canManageRoles = computed(
    () => this.auth.currentUser()?.permissions.includes('roles.manage') ?? false,
  );
  readonly search = this.fb.nonNullable.control('');
  ngOnInit(): void {
    this.load();
    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe(() => {
      if (this.mode === 'users') {
        this.userPageIndex.set(0);
        this.load();
      }
    });
  }
  load(): void {
    this.loading.set(true);
    this.forbidden.set(false);
    this.error.set('');
    if (this.mode === 'users') {
      forkJoin({
        users: this.api.users(this.search.value, this.userPageIndex() + 1, this.userPageSize()),
        roles: this.api.roles(),
      }).subscribe({
        next: ({ users, roles }) => {
          const result = users as PagedResult<ManagedUserSummary>;
          this.users.set(result.items);
          this.totalUsers.set(result.totalCount);
          this.userPageIndex.set(Math.max(result.page - 1, 0));
          this.userPageSize.set(result.pageSize);
          this.roleOptions.set(roles);
          this.loading.set(false);
        },
        error: (response: HttpErrorResponse) => this.handleLoadError(response),
      });
      return;
    }

    forkJoin({ roles: this.api.roles(), permissions: this.api.permissions() }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles.set(roles);
        this.permissions.set(permissions);
        this.loading.set(false);
      },
      error: (response: HttpErrorResponse) => this.handleLoadError(response),
    });
  }
  toggle(user: ManagedUserSummary, isActive: boolean): void {
    this.api.updateUserStatus(user.id, isActive).subscribe({
      next: (updated) =>
        this.users.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        ),
      error: () => this.load(),
    });
  }
  changeUserPage(event: PageEvent): void {
    this.userPageIndex.set(event.pageIndex);
    this.userPageSize.set(event.pageSize);
    this.load();
  }

  updateRoles(user: ManagedUserSummary, roles: string[] | null): void {
    if (!roles?.length || this.savingUserId()) return;
    this.actionError.set('');
    this.savingUserId.set(user.id);
    this.api
      .updateUserRoles(user.id, roles)
      .pipe(finalize(() => this.savingUserId.set(null)))
      .subscribe({
        next: (updated) =>
          this.users.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          ),
        error: () => this.actionError.set('Roles could not be updated. Please try again.'),
      });
  }

  updatePermissions(role: RoleSummary, permissions: string[] | null): void {
    if (!permissions?.length || this.savingRoleId()) return;
    this.actionError.set('');
    this.savingRoleId.set(role.id);
    this.api
      .updateRolePermissions(role.id, permissions)
      .pipe(finalize(() => this.savingRoleId.set(null)))
      .subscribe({
        next: (updated) =>
          this.roles.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          ),
        error: () => this.actionError.set('Permissions could not be updated. Please try again.'),
      });
  }

  private handleLoadError(response: HttpErrorResponse): void {
    this.forbidden.set(response.status === 403);
    this.error.set('Check the API connection and try again.');
    this.loading.set(false);
  }
  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  roleIcon(name: string): string {
    return name === 'Admin'
      ? 'admin_panel_settings'
      : name === 'Manager'
        ? 'supervisor_account'
        : 'person';
  }
}
