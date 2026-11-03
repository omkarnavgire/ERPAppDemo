import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';

import { TrainerManagement } from '../../Application/TrainerManagement';
import {
  PermissionService,
  PERMISSIONS
} from '../../../UserManagement/Core/Services/PermissionService';
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
  private readonly cdr = inject(ChangeDetectorRef);

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

  studentSearch = '';
  attendanceDate = new Date().toISOString().slice(0, 10);

  loading = false;
  attendanceLoading = false;
  savingAttendance = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.batchId = Number(this.route.snapshot.paramMap.get('batchId'));

    if (!Number.isInteger(this.batchId) || this.batchId <= 0) {
      this.errorMessage = 'Invalid batch selected.';
      this.cdr.markForCheck();
      return;
    }

    this.loadBatch();
  }

  // =========================================
  // BATCH DETAILS, STUDENTS AND SCHEDULES
  // =========================================

  loadBatch(): void {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    forkJoin({
      details: this.trainer.getBatchDetails(this.batchId),
      students: this.trainer.getBatchStudents(this.batchId),
      schedules: this.trainer.getBatchSchedules(this.batchId)
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: result => {
          this.batchDetails = result.details ?? {};
          this.students = Array.isArray(result.students) ? result.students : [];
          this.schedules = Array.isArray(result.schedules) ? result.schedules : [];

          console.log('Batch Details:', this.batchDetails);
          console.log('Batch Students:', this.students);
          console.log('Batch Schedules:', this.schedules);

          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Unable to load batch details:', error);

          this.batchDetails = {};
          this.students = [];
          this.schedules = [];

          this.errorMessage =
            'Unable to load batch information. Please refresh and try again.';

          this.cdr.markForCheck();
        }
      });
  }

  // =========================================
  // BATCH SUMMARY HELPERS
  // =========================================

  get filteredStudents(): TrainerStudent[] {
    const query = this.studentSearch.trim().toLowerCase();
    if (!query) return this.students;

    return this.students.filter(student =>
      `${student.studentName} ${student.registrationId} ${student.email ?? ''} ${student.mobileNumber ?? ''}`
        .toLowerCase()
        .includes(query)
    );
  }

  get completedScheduleCount(): number {
    return this.schedules.filter(schedule => this.isScheduleCompleted(schedule)).length;
  }

  get pendingScheduleCount(): number {
    return Math.max(0, this.schedules.length - this.completedScheduleCount);
  }

  isScheduleCompleted(schedule: TrainerSchedule): boolean {
    const status = String(schedule.status ?? '').trim().toLowerCase();
    return Boolean(schedule.actualDate) ||
      ['completed', 'complete', 'conducted', 'done'].includes(status);
  }

  // =========================================
  // ATTENDANCE
  // =========================================

  openAttendance(schedule: TrainerSchedule): void {
    if (!this.canViewAttendance || this.attendanceLoading) return;

    this.selectedSchedule = schedule;
    this.attendanceLoading = true;
    this.attendanceStudents = [];
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.trainer
      .getAttendanceStudents(schedule.batchScheduleId)
      .pipe(
        finalize(() => {
          this.attendanceLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: students => {
          this.attendanceStudents = Array.isArray(students) ? students : [];
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Unable to load attendance students:', error);

          this.attendanceStudents = [];
          this.errorMessage =
            'Unable to load students for this schedule.';

          this.cdr.markForCheck();
        }
      });
  }

  closeAttendance(): void {
    if (this.savingAttendance) return;

    this.selectedSchedule = null;
    this.attendanceStudents = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();

    this.trainer.submitAttendance({
      batchScheduleId: this.selectedSchedule.batchScheduleId,
      attendanceDate: new Date(`${this.attendanceDate}T00:00:00`).toISOString(),
      students: this.attendanceStudents.map(student => ({
        registrationId: student.registrationId,
        isPresent: student.isPresent
      }))
    })
      .pipe(
        finalize(() => {
          this.savingAttendance = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Attendance saved successfully.';
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Unable to save attendance:', error);

          this.errorMessage =
            'Attendance could not be saved. Please check the API response and try again.';

          this.cdr.markForCheck();
        }
      });
  }

  // =========================================
  // DISPLAY HELPERS
  // =========================================

  displayValue(...keys: string[]): string {
    for (const key of keys) {
      const value = this.batchDetails[key];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        return String(value);
      }
    }

    return 'â€”';
  }
}
