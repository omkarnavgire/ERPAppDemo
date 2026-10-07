import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ForgotPassword } from '../../../Application/Account/Forgetpassword';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './ForgotPassword.html',
  styleUrl: './ForgotPassword.css'
})
export class ForgotPasswordClass {
  private fb = inject(FormBuilder);
  private forgotPasswordUsecase = inject(ForgotPassword);

  errormessage = '';
  successmessage = '';

  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  sendResetLink(): void {
    console.log('Forgot Password: button clicked');

    this.errormessage = '';
    this.successmessage = '';

    if (this.emailForm.invalid) {
      console.log('Forgot Password: form invalid');
      this.emailForm.markAllAsTouched();
      return;
    }

    const email = this.emailForm.getRawValue().email;

    console.log('Forgot Password: sending request for', email);

    this.forgotPasswordUsecase.execute({
      emailAddress: email
    }).subscribe({
      next: (response) => {
        console.log('Forgot Password API success:', response);

        this.successmessage =
          'Password reset link has been sent to your email address.';
      },
      error: (error) => {
        console.error('Forgot Password API error:', error);

        this.errormessage =
          error?.error?.message ||
          'Unable to send password reset link. Please try again.';
      }
    });
  }
}