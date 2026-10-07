// settings.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="card p-4 border-0 shadow-sm">
      <h2 class="text-dark fw-bold mb-3">Account Settings</h2>
      <p class="text-muted">Configure your system preferences, language selections, and updates.</p>
    </div>
  `
})
export class SettingsComponent {}