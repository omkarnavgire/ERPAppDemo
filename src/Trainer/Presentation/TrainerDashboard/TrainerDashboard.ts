
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrainerManagement } from '../../Application/TrainerManagement';
import { TrainerBatch } from '../../Domain/Entities/TrainerBatch';

@Component({
  selector: 'app-trainer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './TrainerDashboard.html',
  styleUrl: './TrainerDashboard.css'
})
export class TrainerDashboardComponent implements OnInit {

  private readonly trainer = inject(TrainerManagement);

  batches: TrainerBatch[] = [];

  loading = false;
  errorMessage = '';

  get hasNoBatches(): boolean {
    return !this.loading &&
           !this.errorMessage &&
           this.batches.length === 0;
  }

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {

    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    this.trainer.getMyBatches().subscribe({

      next: (batches: TrainerBatch[]) => {

        this.batches = Array.isArray(batches) ? batches : [];

        this.loading = false;

      },

      error: error => {

        console.error('Unable to load assigned batches:', error);

        this.batches = [];

        this.errorMessage =
          'Unable to load your assigned batches. Please try again.';

        this.loading = false;

      }

    });
  }
}
