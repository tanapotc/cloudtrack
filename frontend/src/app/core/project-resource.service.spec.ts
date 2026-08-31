import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProjectsApi } from '../api/services/projects-api';
import { ProjectResourceService } from './project-resource.service';

describe('ProjectResourceService', () => {
  const projectsApi = {
    projectsList: vi.fn(),
    projectsGet: vi.fn(),
    projectsCreate: vi.fn(),
    projectsUpdate: vi.fn(),
    projectsDelete: vi.fn(),
    projectsCreateTask: vi.fn(),
    projectsUpdateTask: vi.fn(),
    projectsDeleteTask: vi.fn(),
  };

  beforeEach(() => {
    Object.values(projectsApi).forEach((operation) => operation.mockReset());
    TestBed.configureTestingModule({
      providers: [{ provide: ProjectsApi, useValue: projectsApi }],
    });
  });

  it('centralizes project list defaults before calling the generated client', () => {
    projectsApi.projectsList.mockReturnValue(
      of({ items: [], page: 1, pageSize: 20, totalCount: 0 }),
    );
    const service = TestBed.inject(ProjectResourceService);

    service.select({ search: 'portal' }).subscribe();

    expect(projectsApi.projectsList).toHaveBeenCalledWith({
      search: 'portal',
      status: undefined,
      sort: 'updatedAt',
      descending: true,
      page: 1,
      pageSize: 20,
    });
  });

  it('keeps nested task route keys and update payload in one typed call', () => {
    projectsApi.projectsUpdateTask.mockReturnValue(of({ id: 'task-9' }));
    const service = TestBed.inject(ProjectResourceService);
    const command = {
      title: 'Update documentation',
      description: 'Publish the deployment guide',
      status: 2 as const,
      priority: 1 as const,
      dueDate: null,
      assigneeId: null,
      version: 4,
    };

    service.editTask('project-2', 'task-9', command).subscribe();

    expect(projectsApi.projectsUpdateTask).toHaveBeenCalledWith({
      projectId: 'project-2',
      taskId: 'task-9',
      body: command,
    });
  });
});
