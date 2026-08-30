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
  template: `
    <div class="page-heading"><div><span class="eyebrow">OVERVIEW</span><h1>Good {{ greeting() }}, {{ firstName() }}.</h1><p>Here’s what’s moving across your workspace today.</p></div><a mat-flat-button routerLink="/projects"><mat-icon>add</mat-icon>New project</a></div>
    @if (loading()) { <div class="state"><mat-spinner diameter="34" /><p>Preparing your workspace…</p></div> }
    @else if (error()) { <div class="state error"><mat-icon>cloud_off</mat-icon><h2>Dashboard unavailable</h2><p>{{ error() }}</p><button mat-stroked-button (click)="load()">Try again</button></div> }
    @else if (data(); as stats) {
      <section class="metrics">
        @for (card of metricCards(stats); track card.label) { <article><div class="metric-icon" [class]="card.tone"><mat-icon>{{ card.icon }}</mat-icon></div><div><span>{{ card.label }}</span><strong>{{ card.value }}</strong><small>{{ card.note }}</small></div></article> }
      </section>
      <section class="dashboard-grid">
        <article class="panel progress-panel"><div class="panel-head"><div><h2>Workload pulse</h2><p>Open versus completed tasks</p></div><span class="health"><i></i>{{ stats.apiStatus }}</span></div>
          <div class="chart"><div class="donut" [style.--done]="completion(stats) + '%'"><div><strong>{{ completion(stats) }}%</strong><span>complete</span></div></div><div class="legend"><span><i class="open"></i>Open tasks <strong>{{ stats.openTaskCount }}</strong></span><span><i class="done"></i>Completed <strong>{{ stats.completedTaskCount }}</strong></span><span><i class="due"></i>Due this week <strong>{{ stats.dueSoonCount }}</strong></span></div></div>
        </article>
        <article class="panel activity"><div class="panel-head"><div><h2>Recent activity</h2><p>Your latest workspace changes</p></div></div>
          @if (stats.recentActivity.length) { <div class="activity-list">@for (item of stats.recentActivity; track item.occurredAt) { <div><span class="activity-icon"><mat-icon>{{ activityIcon(item.action) }}</mat-icon></span><p><strong>{{ humanize(item.action) }}</strong><small>{{ item.entityType }} · {{ item.occurredAt | date:'MMM d, h:mm a' }}</small></p></div> }</div> }
          @else { <div class="empty"><mat-icon>history</mat-icon><p>Your recent actions will appear here.</p></div> }
        </article>
      </section>
    }
  `,
  styles: `
    .page-heading { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; margin-bottom:28px; }.eyebrow { color:#2563eb; font-size:11px; font-weight:800; letter-spacing:.15em; }h1 { margin:7px 0 6px; color:#0f172a; font-size:30px; letter-spacing:-.035em; }.page-heading p,.panel-head p { margin:0; color:#64748b; }.page-heading a { height:42px; border-radius:10px; }
    .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px; }.metrics article { display:flex; align-items:center; gap:14px; padding:20px; border:1px solid #e7eaf0; border-radius:14px; background:#fff; box-shadow:0 3px 14px rgba(15,23,42,.03); }.metrics span,.metrics small,.metrics strong { display:block; }.metrics span { color:#64748b; font-size:12px; font-weight:650; }.metrics strong { margin:3px 0 2px; color:#0f172a; font-size:28px; line-height:1; }.metrics small { color:#94a3b8; font-size:11px; }.metric-icon { width:43px; height:43px; flex:0 0 auto; display:grid; place-items:center; border-radius:12px; }.metric-icon.blue { color:#2563eb; background:#eff6ff; }.metric-icon.violet { color:#7c3aed; background:#f5f3ff; }.metric-icon.amber { color:#d97706; background:#fffbeb; }.metric-icon.green { color:#059669; background:#ecfdf5; }
    .dashboard-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(320px,.75fr); gap:20px; }.panel { min-height:310px; padding:24px; border:1px solid #e7eaf0; border-radius:16px; background:#fff; box-shadow:0 3px 14px rgba(15,23,42,.03); }.panel-head { display:flex; justify-content:space-between; gap:16px; }.panel h2 { margin:0 0 4px; color:#172033; font-size:17px; }.panel-head p { font-size:12px; }.health { display:flex; align-items:center; gap:7px; align-self:flex-start; color:#047857; padding:5px 9px; border-radius:20px; background:#ecfdf5; font-size:11px; font-weight:700; }.health i { width:7px; height:7px; border-radius:50%; background:#10b981; }
    .chart { display:flex; align-items:center; justify-content:center; gap:48px; min-height:245px; }.donut { --done:0%; width:150px; height:150px; display:grid; place-items:center; border-radius:50%; background:conic-gradient(#2563eb var(--done),#e8edf5 0); position:relative; }.donut::after { content:''; position:absolute; inset:18px; border-radius:50%; background:#fff; }.donut div { position:relative; z-index:1; text-align:center; }.donut strong,.donut span { display:block; }.donut strong { color:#0f172a; font-size:28px; }.donut span { color:#94a3b8; font-size:10px; text-transform:uppercase; }.legend { display:grid; gap:16px; min-width:160px; }.legend span { display:grid; grid-template-columns:10px 1fr auto; gap:8px; align-items:center; color:#64748b; font-size:12px; }.legend i { width:8px; height:8px; border-radius:50%; }.legend .open { background:#60a5fa; }.legend .done { background:#2563eb; }.legend .due { background:#f59e0b; }.legend strong { color:#0f172a; }
    .activity-list { display:grid; margin-top:18px; }.activity-list>div { display:flex; gap:12px; padding:12px 0; border-bottom:1px solid #f0f2f6; }.activity-icon { width:34px; height:34px; flex:0 0 auto; display:grid; place-items:center; border-radius:10px; color:#2563eb; background:#eff6ff; }.activity-icon mat-icon { font-size:17px; width:17px; height:17px; }.activity p { margin:0; }.activity strong,.activity small { display:block; }.activity strong { color:#334155; font-size:12px; }.activity small { margin-top:3px; color:#94a3b8; font-size:10px; }
    .state,.empty { min-height:330px; display:grid; place-content:center; justify-items:center; text-align:center; color:#64748b; }.state mat-icon,.empty mat-icon { width:44px; height:44px; font-size:44px; color:#94a3b8; }.state.error h2 { margin-bottom:0; color:#334155; }
    @media(max-width:1150px) { .metrics { grid-template-columns:repeat(2,1fr); }.dashboard-grid { grid-template-columns:1fr; } } @media(max-width:620px) { .metrics { grid-template-columns:1fr; }.page-heading { display:block; }.page-heading a { margin-top:18px; }.chart { gap:24px; }.donut { width:130px; height:130px; } }
  `,
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

