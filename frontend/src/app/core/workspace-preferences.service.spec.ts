import { TestBed } from '@angular/core/testing';
import { WorkspacePreferencesService } from './workspace-preferences.service';

describe('WorkspacePreferencesService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('uses safe defaults when no preference has been saved', () => {
    const service = TestBed.inject(WorkspacePreferencesService);

    expect(service.preferences()).toEqual({ compactTaskCards: false, defaultTaskPriority: 1 });
  });

  it('persists valid preferences for the next browser session', () => {
    const service = TestBed.inject(WorkspacePreferencesService);
    service.save({ compactTaskCards: true, defaultTaskPriority: 2 });
    const nextSession = new WorkspacePreferencesService();

    expect(nextSession.preferences()).toEqual({ compactTaskCards: true, defaultTaskPriority: 2 });
  });

  it('falls back to safe defaults for a malformed stored value', () => {
    localStorage.setItem('cloudtrack.workspace-preferences', '{not valid json');

    const service = TestBed.inject(WorkspacePreferencesService);

    expect(service.preferences()).toEqual({ compactTaskCards: false, defaultTaskPriority: 1 });
  });
});
