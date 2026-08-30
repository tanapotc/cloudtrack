import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardSummary } from '../../core/models';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly data = signal<DashboardSummary | null>(null); readonly loading = signal(true); readonly error = signal('');
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.error.set(''); this.api.dashboard().subscribe({ next: (data) => { this.data.set(data); this.loading.set(false); }, error: () => { this.error.set('Check that the API is running, then try again.'); this.loading.set(false); } }); }
  firstName(): string { return this.auth.currentUser()?.displayName.split(' ')[0] ?? 'there'; }
  greeting(): string { const hour = new Date().getHours(); return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'; }
  completion(stats: DashboardSummary): number { const total = stats.openTaskCount + stats.completedTaskCount; return total ? Math.round((stats.completedTaskCount / total) * 100) : 0; }
  metricCards(stats: DashboardSummary) { return [{ label:'Total projects',value:stats.projectCount,note:`${stats.activeProjectCount} currently active`,icon:'folder_open',tone:'blue' },{ label:'Active projects',value:stats.activeProjectCount,note:'Moving forward',icon:'rocket_launch',tone:'violet' },{ label:'Open tasks',value:stats.openTaskCount,note:`${stats.dueSoonCount} due this week`,icon:'checklist',tone:'amber' },{ label:'Completed',value:stats.completedTaskCount,note:'Across all projects',icon:'task_alt',tone:'green' }]; }
  activityIcon(action: string): string { return action.includes('Created') ? 'add_circle_outline' : action.includes('Deleted') ? 'delete_outline' : action.includes('Logged') ? 'login' : 'edit_note'; }
  humanize(value: string): string { return value.replace(/([a-z])([A-Z])/g, '$1 $2'); }
}

