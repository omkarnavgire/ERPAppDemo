
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin } from 'rxjs';

interface BatchOption {
  batch_id: number;
  batch_name: string;
}

interface ScheduleOption {
  batch_schedule_id: number;
  batch_id: number;
  content_name?: string;
  expected_date?: string;
  expected_day?: string;
  status?: string;
}

interface AttendanceStudent {
  registration_id: number;
  student_name: string;
  mobile_number?: string;
  email_address?: string;
  isPresent: boolean;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './Attendance.html',
  styleUrls: ['./Attendance.css']
})
export class AttendanceComponent implements OnInit {

  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    'https://batchmanagement.ciitstudent.com/api';

  // Dropdown data
  batches: BatchOption[] = [];
  schedules: ScheduleOption[] = [];
  students: AttendanceStudent[] = [];

  // Selected values
  selectedBatchId: number | null = null;
  selectedScheduleId: number | null = null;
  attendanceDate = new Date().toISOString().substring(0, 10);

  // Loading flags
  loadingBatches = false;
  loadingSchedules = false;
  loadingStudents = false;
  savingAttendance = false;

  // Messages
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadBatches();
  }

  // Convert API response into an array
  private getRows(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    const possibleArrays = [
      response?.data,
      response?.result,
      response?.items,
      response?.batches,
      response?.schedules,
      response?.students,
      response?.registrations,
      response?.data?.$values,
      response?.result?.$values
    ];

    return possibleArrays.find(item => Array.isArray(item)) ?? [];
  }

  // Get data from API response
  private getResponseData(response: any): any {
    return response?.data ?? response?.result ?? response;
  }

  // Load all batches
  loadBatches(): void {
    this.loadingBatches = true;
    this.errorMessage = '';

    this.http.get<any>(`${this.baseUrl}/Batch/get-all`)
      .subscribe({
        next: response => {
          const rows = this.getRows(response);

          this.batches = rows.map(row => ({
            batch_id: Number(row.batch_id ?? row.batchId),
            batch_name: row.batch_name ?? row.batchName ?? ''
          }));

          this.loadingBatches = false;
        },
        error: error => {
          console.error('Batch loading error:', error);
          this.errorMessage = 'Unable to load batches.';
          this.loadingBatches = false;
        }
      });
  }

  // When batch is selected
  onBatchChange(): void {
    this.selectedScheduleId = null;
    this.schedules = [];
    this.students = [];
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.selectedBatchId) {
      return;
    }

    this.loadSchedules();
    this.loadStudents();
  }

  // Load schedules for selected batch
  loadSchedules(): void {
    if (!this.selectedBatchId) {
      return;
    }

    this.loadingSchedules = true;

    this.http.get<any>(
      `${this.baseUrl}/BatchSchedule/batch/${this.selectedBatchId}`
    ).subscribe({
      next: response => {
        const rows = this.getRows(response);

        this.schedules = rows.map(row => ({
          batch_schedule_id: Number(
            row.batch_schedule_id ?? row.batchScheduleId
          ),
          batch_id: Number(row.batch_id ?? row.batchId),
          content_name: row.content_name ?? row.contentName ?? '',
          expected_date: row.expected_date ?? row.expectedDate ?? '',
          expected_day: row.expected_day ?? row.expectedDay ?? '',
          status: row.status ?? ''
        }));

        this.loadingSchedules = false;
      },
      error: error => {
        console.error('Schedule loading error:', error);
        this.errorMessage = 'Unable to load batch schedules.';
        this.loadingSchedules = false;
      }
    });
  }

  // Load students assigned to selected batch
  loadStudents(): void {
    if (!this.selectedBatchId) {
      return;
    }

    this.loadingStudents = true;

    this.http.get<any>(
      `${this.baseUrl}/BatchStudent/batch/${this.selectedBatchId}`
    ).subscribe({
      next: response => {
        const rows = this.getRows(response);

        this.students = rows
          .map(row => {
            const registrationId = Number(
              row.registration_id ??
              row.registrationId ??
              row.registration?.registration_id ??
              row.registration?.registrationId
            );

            const firstName =
              row.student_name ??
              row.studentName ??
              row.registration?.student_name ??
              row.registration?.studentName ??
              '';

            const lastName =
              row.last_name ??
              row.lastName ??
              row.registration?.last_name ??
              row.registration?.lastName ??
              '';

            return {
              registration_id: registrationId,
              student_name: `${firstName} ${lastName}`.trim(),
              mobile_number:
                row.mobile_number ??
                row.mobileNumber ??
                row.registration?.mobile_number ??
                '',
              email_address:
                row.email_address ??
                row.emailAddress ??
                row.registration?.email_address ??
                '',
              isPresent: true
            } as AttendanceStudent;
          })
          .filter(student => student.registration_id > 0);

        this.loadingStudents = false;
      },
      error: error => {
        console.error('Student loading error:', error);
        this.errorMessage = 'Unable to load students for this batch.';
        this.loadingStudents = false;
      }
    });
  }

  // Mark all students Present
  markAllPresent(): void {
    this.students.forEach(student => {
      student.isPresent = true;
    });
  }

  // Mark all students Absent
  markAllAbsent(): void {
    this.students.forEach(student => {
      student.isPresent = false;
    });
  }

  // Present count
  get presentCount(): number {
    return this.students.filter(student => student.isPresent).length;
  }

  // Absent count
  get absentCount(): number {
    return this.students.filter(student => !student.isPresent).length;
  }

  // Extract attendance session ID from API response
  private getSessionId(response: any): number {
    const data = this.getResponseData(response);

    const id = Number(
      data?.schedule_attendance_id ??
      data?.batch_schedule_attendance_id ??
      data?.attendance_id ??
      data?.id
    );

    return Number.isFinite(id) && id > 0 ? id : 0;
  }

  // Create attendance session
  private async createAttendanceSession(): Promise<number> {

    if (!this.selectedScheduleId) {
      throw new Error('Please select a schedule.');
    }

    const requestBody = {
      batch_schedule_id: this.selectedScheduleId,
      attendance_date: new Date(
        `${this.attendanceDate}T00:00:00`
      ).toISOString()
    };

    const response = await firstValueFrom(
      this.http.post<any>(
        `${this.baseUrl}/BatchScheduleAttendance/create`,
        requestBody
      )
    );

    let sessionId = this.getSessionId(response);

    // If create response does not contain ID, check get-all API
    if (!sessionId) {
      const allResponse = await firstValueFrom(
        this.http.get<any>(
          `${this.baseUrl}/BatchScheduleAttendance/get-all`
        )
      );

      const rows = this.getRows(allResponse);

      const matchingSession = rows.find(row => {
        const scheduleId = Number(
          row.batch_schedule_id ?? row.batchScheduleId
        );

        const sessionDate = String(
          row.attendance_date ?? row.attendanceDate ?? ''
        ).substring(0, 10);

        return scheduleId === this.selectedScheduleId &&
          sessionDate === this.attendanceDate;
      });

      sessionId = Number(
        matchingSession?.schedule_attendance_id ??
        matchingSession?.batch_schedule_attendance_id ??
        matchingSession?.attendance_id ??
        matchingSession?.id ??
        0
      );
    }

    if (!sessionId) {
      throw new Error(
        'Attendance session ID was not returned by the API. Please check the BatchScheduleAttendance API response.'
      );
    }

    return sessionId;
  }

  // Save Present / Absent attendance
  async saveAttendance(): Promise<void> {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedBatchId) {
      this.errorMessage = 'Please select a batch.';
      return;
    }

    if (!this.selectedScheduleId) {
      this.errorMessage = 'Please select a schedule.';
      return;
    }

    if (!this.attendanceDate) {
      this.errorMessage = 'Please select attendance date.';
      return;
    }

    if (this.students.length === 0) {
      this.errorMessage = 'No students found for this batch.';
      return;
    }

    this.savingAttendance = true;

    try {

      // Step 1: Create attendance session
      const sessionId = await this.createAttendanceSession();

      // Step 2: Prepare individual student attendance requests
      const requests = this.students.map(student => {

        const requestBody = {
          schedule_attendance_id: sessionId,
          registration_id: student.registration_id,
          is_present: student.isPresent ? 1 : 0
        };

        return this.http.post(
          `${this.baseUrl}/ScheduleAttendance/create`,
          requestBody
        );
      });

      // Step 3: Save all student attendance records
      await firstValueFrom(forkJoin(requests));

      this.successMessage =
        `Attendance saved successfully. Present: ${this.presentCount}, Absent: ${this.absentCount}.`;

    } catch (error: any) {

      console.error('Attendance saving error:', error);

      this.errorMessage =
        error?.error?.message ??
        error?.message ??
        'Unable to save attendance. Please check the API response.';

    } finally {
      this.savingAttendance = false;
    }
  }

  // Reset attendance form
  resetAttendance(): void {
    this.selectedBatchId = null;
    this.selectedScheduleId = null;
    this.attendanceDate = new Date().toISOString().substring(0, 10);
    this.schedules = [];
    this.students = [];
    this.errorMessage = '';
    this.successMessage = '';
  }
}
