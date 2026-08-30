import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/auth.service';

@Component({selector:'app-profile-page',imports:[ReactiveFormsModule,MatButtonModule,MatFormFieldModule,MatIconModule,MatInputModule],templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss'})
export class ProfilePage{readonly auth=inject(AuthService);private readonly fb=inject(FormBuilder);readonly message=signal('');readonly form=this.fb.nonNullable.group({currentPassword:['',Validators.required],newPassword:['',[Validators.required,Validators.minLength(8)]]});submit():void{if(this.form.invalid)return;const value=this.form.getRawValue();this.auth.changePassword(value.currentPassword,value.newPassword).subscribe({next:()=>{this.message.set('Password updated. Sign in again to continue.');this.form.reset();},error:()=>this.message.set('Password could not be changed. Check the current password.')});}initials():string{return this.auth.currentUser()?.displayName.split(' ').slice(0,2).map(part=>part[0]).join('').toUpperCase()??'CT';}}

