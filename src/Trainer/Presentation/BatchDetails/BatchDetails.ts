
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';

import { TrainerManagement } from '../../Application/TrainerManagement';
import { PermissionService, PERMISSIONS } from '../../../UserManagement/Core/Services/PermissionService';
import {
  AttendanceStudent,
  TrainerSchedule,
  TrainerStudent
} from '../../Domain/Entities/TrainerBatch';

@Component({
  selector: 'app-trainer-batch-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './BatchDetails.html',
  styleUrl: './BatchDetails.css'
})
export class TrainerBatchDetailsComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);
  private readonly trainer = inject(TrainerManagement);
  private readonly permissions = inject(PermissionService);

  readonly canViewAttendance =
    this.permissions.hasPermission(PERMISSIONS.TRAINER_ATTENDANCE_VIEW);

  readonly canSubmitAttendance =
    this.permissions.hasPermission(PERMISSIONS.TRAINER_ATTENDANCE_SUBMIT);

  batchId = 0;

  batchDetails: Record<string, unknown> = {};

  students: TrainerStudent[] = [];
  schedules: TrainerSchedule[] = [];
  attendanceStudents: AttendanceStudent[] = [];

  selectedSchedule: TrainerSchedule | null = null;

  loading = false;
  attendanceLoading = false;
  savingAttendance = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {

    this.batchId = Number(
      this.route.snapshot.paramMap.get('batchId')
    );

    if (!Number.isInteger(this.batchId) || this.batchId <= 0) {
      this.errorMessage = 'Invalid batch selected.';
      return;
    }

    this.loadBatch();
  }

  loadBatch(): void {

    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin({
      details: this.trainer.getBatchDetails(this.batchId),
      students: this.trainer.getBatchStudents(this.batchId),
      schedules: this.trainer.getBatchSchedules(this.batchId)
    })
    .pipe(
      finalize(() => {
        this.loading = false;
      })
    )
    .subscribe({

      next: result => {

        this.batchDetails = result.details ?? {};
        this.students = result.students ?? [];
        this.schedules = result.schedules ?? [];

        console.log('Batch Details:', this.batchDetails);
        console.log('Batch Students:', this.students);
        console.log('Batch Schedules:', this.schedules);

      },

      error: error => {

        console.error('Unable to load batch details:', error);

        this.batchDetails = {};
        this.students = [];
        this.schedules = [];

        this.errorMessage =
          'Unable to load batch information. Please refresh and try again.';

      }

    });
  }

  openAttendance(schedule: TrainerSchedule): void {

    if (!this.canViewAttendance || this.attendanceLoading) return;

    this.selectedSchedule = schedule;
    this.attendanceLoading = true;
    this.attendanceStudents = [];
    this.successMessage = '';
    this.errorMessage = '';

    this.trainer
      .getAttendanceStudents(schedule.batchScheduleId)
      .pipe(
        finalize(() => {
          this.attendanceLoading = false;
        })
      )
      .subscribe({

        next: students => {
          this.attendanceStudents = students ?? [];
        },

        error: error => {

          console.error('Unable to load attendance students:', error);

          this.attendanceStudents = [];
          this.errorMessage =
            'Unable to load students for this schedule.';

        }

      });
  }

  saveAttendance(): void {

    if (!this.canSubmitAttendance) return;

    if (
      !this.selectedSchedule ||
      this.savingAttendance ||
      this.attendanceStudents.length === 0
    ) {
      return;
    }

    this.savingAttendance = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.trainer.submitAttendance({

      batchScheduleId: this.selectedSchedule.batchScheduleId,

      attendanceDate: new Date().toISOString(),

      students: this.attendanceStudents.map(student => ({
        registrationId: student.registrationId,
        isPresent: student.isPresent
      }))

    })
    .pipe(
      finalize(() => {
        this.savingAttendance = false;
      })
    )
    .subscribe({

      next: () => {

        this.successMessage = 'Attendance saved successfully.';

        if (this.selectedSchedule) {
          this.openAttendance(this.selectedSchedule);
        }

      },

      error: error => {

        console.error('Unable to save attendance:', error);

        this.errorMessage =
          'Attendance could not be saved. Please check the API response and try again.';

      }

    });
  }

  displayValue(...keys: string[]): string {

    for (const key of keys) {

      const value = this.batchDetails[key];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim()
      ) {
        return String(value);
      }

    }

    return '—';
  }
}
