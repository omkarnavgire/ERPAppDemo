import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ResetPassword.html',
  styleUrl: './ResetPassword.css'
})
export class ResetPasswordClass {
  private route = inject(ActivatedRoute);

  email = '';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.email = params.get('email') || '';
    });
  }
}