import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/api.service';
import { ProjectSummary } from '../../core/models';

@Component({
  selector: 'app-projects-page',
  imports: [RouterLink, DatePipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage implements OnInit {
  private readonly api = inject(ApiService); private readonly fb = inject(FormBuilder);
  readonly projects = signal<ProjectSummary[]>([]); readonly loading = signal(true); readonly saving = signal(false); readonly showCreate = signal(false); readonly error = signal('');
  readonly searchControl = this.fb.nonNullable.control(''); readonly statusControl = this.fb.nonNullable.control('');
  readonly createForm = this.fb.nonNullable.group({ name:['',[Validators.required,Validators.minLength(3)]], description:[''] });
  ngOnInit(): void { this.load(); this.searchControl.valueChanges.pipe(debounceTime(250),distinctUntilChanged()).subscribe(() => this.load()); this.statusControl.valueChanges.subscribe(() => this.load()); }
  load(): void { this.loading.set(true); this.api.projects(this.searchControl.value,this.statusControl.value).subscribe({ next:r=>{this.projects.set(r.items);this.loading.set(false);}, error:()=>{this.error.set('Check your API connection and try again.');this.loading.set(false);} }); }
  createProject(): void { if(this.createForm.invalid)return; this.saving.set(true); const value=this.createForm.getRawValue(); this.api.createProject(value.name,value.description).subscribe({next:()=>{this.createForm.reset();this.showCreate.set(false);this.saving.set(false);this.load();},error:()=>{this.error.set('The project could not be created.');this.saving.set(false);}}); }
  statusLabel(status:number):string { return ['Planning','Active','On hold','Completed'][status] ?? 'Unknown'; } statusClass(status:number):string { return ['planning','active','hold','completed'][status] ?? ''; }
  progress(project:ProjectSummary):number { return project.taskCount ? Math.round(project.completedTaskCount/project.taskCount*100) : 0; }
}

