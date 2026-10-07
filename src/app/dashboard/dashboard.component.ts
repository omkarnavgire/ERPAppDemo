// dashboard.component.ts
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
   imports: [RouterOutlet, RouterLink, RouterLinkActive],
})
export class DashboardComponent {
  constructor(private router: Router) {}

  logout(): void {
    this.router.navigate(['/login']);
  }
}