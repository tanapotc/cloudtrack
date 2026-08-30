import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../core/api.service';
import { ProjectDetails, WorkItemSummary } from '../../core/models';

@Component({
  selector: 'app-project-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatMenuModule,
  ],
  templateUrl: './project-detail-page.html',
  styleUrl: './project-detail-page.scss',
})
export class ProjectDetailPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly project = signal<ProjectDetails | null>(null);
  readonly loading = signal(true);
  readonly showTaskForm = signal(false);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    priority: [1],
  });
  readonly columns = [
    { status: 0, label: 'Backlog', tone: '' },
    { status: 1, label: 'In progress', tone: 'blue' },
    { status: 2, label: 'Review', tone: 'violet' },
    { status: 3, label: 'Done', tone: 'green' },
  ];
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
  createTask(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.api
      .createTask(this.id, value.title, value.description, value.priority, null)
      .subscribe(() => {
        this.form.reset({ title: '', description: '', priority: 1 });
        this.showTaskForm.set(false);
        this.load();
      });
  }
  tasksFor(status: number): WorkItemSummary[] {
    return this.project()?.workItems.filter((task) => task.status === status) ?? [];
  }
  moveTask(task: WorkItemSummary, status: number): void {
    if (task.status === status) return;
    this.api.updateTask(this.id, task, status).subscribe((updated) =>
      this.project.update((p) =>
        p
          ? {
              ...p,
              workItems: p.workItems.map((item) => (item.id === updated.id ? updated : item)),
            }
          : p,
      ),
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
