import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ProjectResourceService } from '../../core/project-resource.service';
import { ProjectDetails, WorkItemSummary } from '../../core/models';
import { ProjectDetailPage } from './project-detail-page';

const task = (id: string, status: 0 | 1 | 2 | 3): WorkItemSummary => ({
  id,
  title: `Task ${id}`,
  description: '',
  priority: 1,
  status,
  version: 1,
  commentCount: 0,
});

const project = (workItems: WorkItemSummary[]): ProjectDetails => ({
  id: 'project-1',
  name: 'Test project',
  description: '',
  status: 0,
  version: 1,
  ownerId: 'user-1',
  createdAt: '2026-08-31T00:00:00Z',
  updatedAt: '2026-08-31T00:00:00Z',
  members: [],
  workItems,
});

describe('ProjectDetailPage', () => {
  let component: ProjectDetailPage;
  const projectsResource = {
    selectById: vi.fn(() => of(project([]))),
    editTask: vi.fn(),
  };

  beforeEach(async () => {
    projectsResource.selectById.mockReturnValue(of(project([])));
    projectsResource.editTask.mockReset();
    await TestBed.configureTestingModule({
      imports: [ProjectDetailPage, NoopAnimationsModule],
      providers: [
        { provide: ProjectResourceService, useValue: projectsResource },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'project-1']]) } },
        },
      ],
    }).compileComponents();
    component = TestBed.createComponent(ProjectDetailPage).componentInstance;
  });

  it('groups tasks by their board status', () => {
    component.project.set(project([task('backlog', 0), task('review', 2)]));

    expect(component.tasksFor(0).map(({ id }) => id)).toEqual(['backlog']);
    expect(component.tasksFor(2).map(({ id }) => id)).toEqual(['review']);
  });

  it('updates the card status after a successful drop', () => {
    const workItem = task('work-item', 0);
    component.project.set(project([workItem]));
    projectsResource.editTask.mockReturnValue(of({ ...workItem, status: 2 }));

    component.dropTask({ item: { data: workItem } } as CdkDragDrop<WorkItemSummary[]>, 2);

    expect(projectsResource.editTask).toHaveBeenCalledWith('project-1', 'work-item', {
      title: workItem.title,
      description: workItem.description,
      status: 2,
      priority: workItem.priority,
      dueDate: workItem.dueDate,
      assigneeId: workItem.assigneeId,
      version: workItem.version,
    });
    expect(component.tasksFor(2)).toEqual([{ ...workItem, status: 2 }]);
  });

  it('restores the card to its previous column when the status update fails', () => {
    const workItem = task('work-item', 1);
    component.project.set(project([workItem]));
    projectsResource.editTask.mockReturnValue(throwError(() => new Error('Network failed')));

    component.moveTask(workItem, 3);

    expect(component.tasksFor(1)).toEqual([workItem]);
    expect(component.tasksFor(3)).toEqual([]);
  });
});
