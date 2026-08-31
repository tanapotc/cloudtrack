import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { WorkspacePreferencesService } from '../../core/workspace-preferences.service';

@Component({
  selector: 'app-settings-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly fb = inject(FormBuilder);
  private readonly workspacePreferences = inject(WorkspacePreferencesService);
  readonly saved = signal(false);
  readonly form = this.fb.nonNullable.group({
    compactTaskCards: [this.workspacePreferences.preferences().compactTaskCards],
    defaultTaskPriority: [this.workspacePreferences.preferences().defaultTaskPriority],
  });

  save(): void {
    this.workspacePreferences.save(this.form.getRawValue());
    this.saved.set(true);
  }
}
