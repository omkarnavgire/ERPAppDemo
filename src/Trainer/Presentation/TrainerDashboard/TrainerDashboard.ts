
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrainerManagement } from '../../Application/TrainerManagement';
import { TrainerBatch } from '../../Domain/Entities/TrainerBatch';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-trainer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './TrainerDashboard.html',
  styleUrl: './TrainerDashboard.css'
})
export class TrainerDashboardComponent implements OnInit {

  private readonly trainer = inject(TrainerManagement);
  private readonly cdr = inject(ChangeDetectorRef);

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

    this.trainer.getMyBatches()
        .pipe(
            finalize(() => {
                this.loading = false;

                // Notify Angular to refresh the Trainer Dashboard.
                this.cdr.markForCheck();
            })
        )
        .subscribe({

            next: (batches: TrainerBatch[]) => {

                this.batches = Array.isArray(batches)
                    ? batches
                    : [];

            },

            error: error => {

                console.error(
                    'Unable to load assigned batches:',
                    error
                );

                this.batches = [];

                this.errorMessage =
                    'Unable to load your assigned batches. Please try again.';

            }

        });
}
}
