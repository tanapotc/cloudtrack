import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/api.service';
import { ManagedUserSummary, PagedResult, RoleSummary } from '../../core/models';

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
    MatSlideToggleModule,
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly mode = (this.route.snapshot.data['mode'] as 'users' | 'roles') ?? 'users';
  readonly users = signal<ManagedUserSummary[]>([]);
  readonly userPageIndex = signal(0);
  readonly userPageSize = signal(30);
  readonly totalUsers = signal(0);
  readonly roles = signal<RoleSummary[]>([]);
  readonly loading = signal(true);
  readonly forbidden = signal(false);
  readonly error = signal('');
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
    const request: Observable<PagedResult<ManagedUserSummary> | RoleSummary[]> =
      this.mode === 'users'
        ? this.api.users(this.search.value, this.userPageIndex() + 1, this.userPageSize())
        : this.api.roles();
    request.subscribe({
      next: (data: PagedResult<ManagedUserSummary> | RoleSummary[]) => {
        if (this.mode === 'users') {
          const result = data as PagedResult<ManagedUserSummary>;
          this.users.set(result.items);
          this.totalUsers.set(result.totalCount);
          this.userPageIndex.set(Math.max(result.page - 1, 0));
          this.userPageSize.set(result.pageSize);
        } else this.roles.set(data as RoleSummary[]);
        this.loading.set(false);
      },
      error: (response: HttpErrorResponse) => {
        this.forbidden.set(response.status === 403);
        this.error.set('Check the API connection and try again.');
        this.loading.set(false);
      },
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
