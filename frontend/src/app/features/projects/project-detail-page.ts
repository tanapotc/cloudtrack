import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/api.service';
import { ProjectDetails, WorkItemSummary } from '../../core/models';
import { WorkItemStatus } from '../../api/models/work-item-status';
import { TaskDialog, TaskDialogResult } from './task-dialog';
import { WorkspacePreferencesService } from '../../core/workspace-preferences.service';

@Component({
  selector: 'app-project-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDialogModule,
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
  ],
  templateUrl: './project-detail-page.html',
  styleUrl: './project-detail-page.scss',
})
export class ProjectDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  readonly workspacePreferences = inject(WorkspacePreferencesService);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly project = signal<ProjectDetails | null>(null);
  readonly loading = signal(true);
  readonly columns = [
    { status: 0, label: 'Backlog', tone: '' },
    { status: 1, label: 'In progress', tone: 'blue' },
    { status: 2, label: 'Review', tone: 'violet' },
    { status: 3, label: 'Done', tone: 'green' },
  ] satisfies ReadonlyArray<{ status: WorkItemStatus; label: string; tone: string }>;
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.api.project(this.id).subscribe({
      next: (p) => {
        this.project.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.project.set(null);
        this.loading.set(false);
      },
    });
  }
  openTaskDialog(): void {
    const dialogRef = this.dialog.open<TaskDialog, undefined, TaskDialogResult>(TaskDialog, {
      width: 'min(560px, calc(100vw - 32px))',
      autoFocus: 'dialog',
    });
    dialogRef.afterClosed().subscribe((value) => {
      if (!value) return;
      this.api
        .createTask(this.id, value.title, value.description, value.priority, value.dueDate)
        .subscribe(() => this.load());
    });
  }
  tasksFor(status: WorkItemStatus): WorkItemSummary[] {
    return this.project()?.workItems.filter((task) => task.status === status) ?? [];
  }
  moveTask(task: WorkItemSummary, status: WorkItemStatus): void {
    if (task.status === status) return;
    const previousStatus = task.status;
    this.replaceTask({ ...task, status });
    this.api.updateTask(this.id, task, status).subscribe({
      next: (updated) => this.replaceTask(updated),
      error: () => this.replaceTask({ ...task, status: previousStatus }),
    });
  }
  dropTask(event: CdkDragDrop<WorkItemSummary[]>, status: WorkItemStatus): void {
    const task = event.item.data as WorkItemSummary;
    this.moveTask(task, status);
  }
  private replaceTask(task: WorkItemSummary): void {
    this.project.update((project) =>
      project
        ? {
            ...project,
            workItems: project.workItems.map((item) => (item.id === task.id ? task : item)),
          }
        : project,
    );
  }
  statusLabel(status: number): string {
    return ['Planning', 'Active', 'On hold', 'Completed'][status] ?? 'Unknown';
  }
  priorityLabel(priority: number): string {
    return ['Low', 'Medium', 'High', 'Critical'][priority] ?? 'Unknown';
  }
  priorityClass(priority: number): string {
    return ['low', 'medium', 'high', 'critical'][priority] ?? '';
  }
}
