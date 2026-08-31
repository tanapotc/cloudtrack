import { Injectable, signal } from '@angular/core';
import type { WorkItemPriority } from '../api/models/work-item-priority';

export interface WorkspacePreferences {
  compactTaskCards: boolean;
  defaultTaskPriority: WorkItemPriority;
}

const storageKey = 'cloudtrack.workspace-preferences';
const defaults: WorkspacePreferences = { compactTaskCards: false, defaultTaskPriority: 1 };

@Injectable({ providedIn: 'root' })
export class WorkspacePreferencesService {
  readonly preferences = signal<WorkspacePreferences>(this.read());

  save(preferences: WorkspacePreferences): void {
    this.preferences.set(preferences);
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  }

  private read(): WorkspacePreferences {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      ) as Partial<WorkspacePreferences> | null;
      if (saved && [0, 1, 2, 3].includes(saved.defaultTaskPriority ?? -1)) {
        return {
          compactTaskCards: saved.compactTaskCards === true,
          defaultTaskPriority: saved.defaultTaskPriority as WorkItemPriority,
        };
      }
    } catch {
      // An invalid browser preference should never prevent the workspace from opening.
    }
    return defaults;
  }
}
