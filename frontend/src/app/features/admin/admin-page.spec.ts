import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../../core/api.service';
import { ManagedUserSummary, PagedResult } from '../../core/models';
import { AdminPage } from './admin-page';

const user: ManagedUserSummary = {
  id: 'user-1',
  displayName: 'Ada Lovelace',
  email: 'ada@example.test',
  isActive: true,
  createdAt: '2026-08-31T00:00:00Z',
  lastLoginAt: null,
  roles: ['Admin'],
};

describe('AdminPage user pagination', () => {
  let component: AdminPage;
  const api = {
    users: vi.fn(),
    roles: vi.fn(),
    updateUserStatus: vi.fn(),
  };

  beforeEach(async () => {
    api.users.mockReset();
    api.users.mockReturnValue(
      of({ items: [], page: 1, pageSize: 30, totalCount: 0, totalPages: 0 }),
    );
    await TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { mode: 'users' } } } },
      ],
    }).compileComponents();
    component = TestBed.createComponent(AdminPage).componentInstance;
  });

  it('loads the selected page and keeps the total available to the paginator', () => {
    const pageTwo: PagedResult<ManagedUserSummary> = {
      items: [user],
      page: 2,
      pageSize: 10,
      totalCount: 21,
      totalPages: 3,
    };
    api.users.mockReturnValue(of(pageTwo));

    component.changeUserPage({ pageIndex: 1, pageSize: 10, length: 21 });

    expect(api.users).toHaveBeenCalledWith('', 2, 10);
    expect(component.users()).toEqual([user]);
    expect(component.totalUsers()).toBe(21);
    expect(component.userPageIndex()).toBe(1);
  });
});
