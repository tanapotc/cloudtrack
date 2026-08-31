import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface TaskDialogResult {
  title: string;
  description: string;
  priority: number;
  dueDate: string | null;
}

@Component({
  selector: 'app-task-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.scss',
})
export class TaskDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TaskDialog, TaskDialogResult>);
  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    description: ['', [Validators.maxLength(2000)]],
    priority: [1],
    dueDate: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.dialogRef.close({ ...value, dueDate: value.dueDate || null });
  }
}
