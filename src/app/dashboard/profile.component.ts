// profile.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="card p-4 border-0 shadow-sm">
      <h2 class="text-dark fw-bold mb-3">User Profile</h2>
      <p class="text-muted">Manage your personal information and contact settings here.</p>
    </div>
  `
})
export class ProfileComponent {}