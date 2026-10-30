
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BatchManagement } from 'src/Group-Leader/Application/BatchManagement';
import { BranchApi } from 'src/UserManagement/Infrastructure/Api/BranchApi';
import { Batch } from 'src/Group-Leader/Application/Batch';
import { CreateBatchRequest } from 'src/Group-Leader/Domain/DTOs/CreateBatchRequest';

interface EmployeeOption {
  employee_id: number;
  employee_name: string;
}

interface BranchOption {
  branch_id: number;
  branch_name: string;
}

interface AttendanceScheduleOption {
  batch_schedule_id: number;
  batch_id?: number;
  batch_name?: string;
  content_name?: string;
  expected_date?: string;
  expected_day?: string;
}

interface StudentOption {
  registrationId: number;
  studentId: number;
  batchStudentId: number;
  studentName: string;
  lastName: string;
  registrationCode: string;
  courseName: string;
  emailAddress: string;
  mobileNumber: string;
  selected?: boolean;
  isPresent?: boolean;
}

interface ScheduleRow {
  batch_schedule_id: number;
  batch_id: number;
  batch_name?: string;
  topic_id?: number;
  content_id?: number;
  content_name?: string;
  expected_date?: string;
  expected_day?: string;
  actual_date?: string | null;
  actual_day?: string | null;
  status?: string;
}

@Component({
  selector: 'app-batch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './BatchComponent.html',
  styleUrls: ['./BatchComponent.css']
})
export class BatchComponent implements OnInit {

  private readonly api = inject(BatchManagement);
  private readonly http = inject(HttpClient);
  private readonly branchApi = inject(BranchApi);

  private readonly batchApiBase =
    'https://batchmanagement.ciitstudent.com/api';

  loading = false;
  savingBatch = false;
  loadingEmployees = false;
  loadingStudents = false;
  savingStudents = false;
  loadingSchedules = false;
  generatingSchedule = false;

  errorMessage = '';
  successMessage = '';
  studentSearch = '';

  showCreateBatch = false;
  showAddStudents = false;
  showAttendance = false;

  activeTab: 'active' | 'deleted' = 'active';

  batches: Batch[] = [];
  employees: EmployeeOption[] = [];
  branches: BranchOption[] = [];

  attendanceScheduleOptions: AttendanceScheduleOption[] = [];
  selectedAttendanceScheduleId = 0;

  attendanceDate = new Date().toISOString().slice(0, 10);

  loadingBranches = false;
  loadingAttendanceOptions = false;
  savingAttendance = false;

  students: StudentOption[] = [];
  selectedBatch: Batch | null = null;

  attendanceStudents: StudentOption[] = [];
  schedules: ScheduleRow[] = [];

  detailStudents: StudentOption[] = [];
  loadingDetailStudents = false;

  studentCounts: Record<number, number> = {};

  // Cached data loaded automatically when the Batch page opens.
  private batchStudentRows: any[] = [];
  private allScheduleRows: ScheduleRow[] = [];
  private batchDataLoaded = false;
  private batchListRequestInProgress = false;
  private readonly batchListCacheKey = 'ciit_group_leader_batch_list_v1';

  batchForm: CreateBatchRequest = this.emptyBatchForm();

  // Separate time picker values
  startTime = '09:00';
  endTime = '11:00';

  ngOnInit(): void {
    this.loadEmployees();
    this.loadBranches();
    this.loadBatches();
  }

  private emptyBatchForm(): CreateBatchRequest {
    return {
      batch_name: '',
      topic_id: 0,
      employee_id: 0,
      start_date: '',
      end_date: '',
      batch_time: '',
      branch_id: 0,
      playlist_title: '',
      playlist_key: ''
    };
  }

  private rows(response: any): any[] {
    if (Array.isArray(response)) return response;

    const candidates = [
      response?.data,
      response?.result,
      response?.items,
      response?.employees,
      response?.registrations,
      response?.batches,
      response?.schedules,
      response?.$values,
      response?.data?.$values,
      response?.result?.$values,
      response?.data?.result,
      response?.batchStudents,
      response?.batch_students,
      response?.students
    ];

    return candidates.find(Array.isArray) ?? [];
  }

  private unwrapEmployee(row: any): EmployeeOption {
    return {
      employee_id: Number(
        row?.employee_id ??
        row?.employeeId ??
        row?.employeeID ??
        row?.id ?? 0
      ),
      employee_name: String(
        row?.employee_name ??
        row?.employeeName ??
        row?.name ??
        row?.fullName ?? ''
      )
    };
  }

  // =========================================
  // EMPLOYEE DROPDOWN
  // =========================================

  loadEmployees(): void {
    this.loadingEmployees = true;

    this.api.getEmployees()
      .pipe(finalize(() => this.loadingEmployees = false))
      .subscribe({
        next: response => {
          this.employees = this.rows(response)
            .map(row => this.unwrapEmployee(row))
            .filter(item =>
              item.employee_id > 0 &&
              item.employee_name.trim().length > 0
            );
        },
        error: error => {
          console.error('Unable to load employees:', error);
          this.errorMessage = this.getApiError(
            error,
            'Unable to load trainer list from Employee dropdown API.'
          );
        }
      });
  }

  // =========================================
  // BRANCH DROPDOWN
  // =========================================

  loadBranches(): void {
    this.loadingBranches = true;

    this.branchApi.getAllBranches()
      .pipe(finalize(() => this.loadingBranches = false))
      .subscribe({
        next: (response: any) => {
          const branchRows = this.rows(response);

          this.branches = branchRows.map((row: any) => ({
            branch_id: Number(
              row?.branch_id ??
              row?.branchId ??
              row?.id ?? 0
            ),
            branch_name: String(
              row?.branch_name ??
              row?.branchName ??
              row?.name ?? ''
            )
          })).filter(branch =>
            branch.branch_id > 0 &&
            branch.branch_name.trim().length > 0
          );
        },
        error: error => {
          console.error('Unable to load branches:', error);
          this.errorMessage = this.getApiError(
            error,
            'Unable to load branch dropdown.'
          );
        }
      });
  }

  // =========================================
  // BATCH FILTERS
  // =========================================

  get activeBatches(): Batch[] {
    return this.batches.filter((b: any) =>
      !(b as any).is_deleted &&
      !(b as any).isDeleted &&
      !(b as any).deleted &&
      (b as any).is_active !== false
    );
  }

  get deletedBatches(): Batch[] {
    return this.batches.filter((b: any) =>
      Boolean(
        (b as any).is_deleted ||
        (b as any).isDeleted ||
        (b as any).deleted ||
        (b as any).is_active === false
      )
    );
  }

  get displayedBatches(): Batch[] {
    return this.activeTab === 'active'
      ? this.activeBatches
      : this.deletedBatches;
  }

  // =========================================
  // FAST BATCH LOADING
  // =========================================

  loadBatches(): void {
    // Show the last successful Batch List immediately while the API refreshes.
    // This avoids showing a blank/loading panel every time the user returns here.
    if (this.batchListRequestInProgress) return;

    let hasCachedBatches = false;

    try {
      const cachedValue = sessionStorage.getItem(this.batchListCacheKey);
      if (cachedValue) {
        const cachedBatches = JSON.parse(cachedValue);
        if (Array.isArray(cachedBatches)) {
          this.batches = cachedBatches as Batch[];
          hasCachedBatches = true;
        }
      }
    } catch (cacheError) {
      console.warn('Unable to read cached Batch List:', cacheError);
    }

    this.batchListRequestInProgress = true;
    // Only show the full-page loader when there is no previously loaded list.
    this.loading = !hasCachedBatches;
    this.errorMessage = '';

    this.batchDataLoaded = false;
    this.batchStudentRows = [];
    this.allScheduleRows = [];

    // Batch List is independent. It does not wait for student/schedule APIs.
    this.api.getAll()
      .pipe(finalize(() => {
        this.loading = false;
        this.batchListRequestInProgress = false;
      }))
      .subscribe({
        next: response => {
          const freshBatches = Array.isArray(response) ? response : [];
          this.batches = freshBatches;

          try {
            sessionStorage.setItem(
              this.batchListCacheKey,
              JSON.stringify(freshBatches)
            );
          } catch (cacheError) {
            console.warn('Unable to cache Batch List:', cacheError);
          }
        },
        error: error => {
          console.error('Unable to load batches:', error);

          // Keep the last successful list visible if refresh fails.
          if (!hasCachedBatches) {
            this.batches = [];
            this.studentCounts = {};
          }

          this.errorMessage = hasCachedBatches
            ? 'Could not refresh the Batch List. Showing the last loaded data.'
            : this.getApiError(
                error,
                'Unable to load batches. Check the Batch API and try again.'
              );
        }
      });

    // Supporting data loads in the background and never blocks the Batch List.
    forkJoin({
      batchStudents: this.http.get<any>(
        `${this.batchApiBase}/BatchStudent/get-all`
      ).pipe(
        catchError(error => {
          console.warn('Unable to load batch students:', error);
          return of(null);
        })
      ),
      schedules: this.api.getAllBatchSchedules().pipe(
        catchError(error => {
          console.warn('Unable to load all batch schedules:', error);
          return of(null);
        })
      )
    }).subscribe({
      next: result => {
        this.batchStudentRows = this.rows(result.batchStudents);
        this.allScheduleRows = this.rows(result.schedules) as ScheduleRow[];

        const counts: Record<number, number> = {};
        this.batchStudentRows.forEach((row: any) => {
          const batchId = Number(
            row?.batch_id ??
            row?.batchId ??
            row?.batch?.batch_id ??
            row?.batch?.batchId ??
            0
          );

          if (batchId > 0) {
            counts[batchId] = (counts[batchId] ?? 0) + 1;
          }
        });

        this.studentCounts = counts;
        this.batchDataLoaded = true;

        if (this.selectedBatch) {
          this.applyCachedBatchDetails(Number(this.selectedBatch.batch_id));
        }
      },
      error: error => {
        console.error('Unable to load Batch supporting data:', error);
        this.batchStudentRows = [];
        this.allScheduleRows = [];
        this.studentCounts = {};
        this.batchDataLoaded = true;

        if (this.selectedBatch) {
          this.applyCachedBatchDetails(Number(this.selectedBatch.batch_id));
        }
      }
    });
  }

  private applyCachedBatchDetails(batchId: number): void {
    const studentRows = this.batchStudentRows.filter((row: any) =>
      Number(row?.batch_id ?? row?.batchId ?? row?.batch?.batch_id ?? 0) === batchId
    );

    this.detailStudents = studentRows
      .map((row: any) => this.normalizeStudent(row))
      .filter(student => student.registrationId > 0);

    this.schedules = this.allScheduleRows.filter((row: any) =>
      Number(row?.batch_id ?? row?.batchId ?? 0) === batchId
    );

    this.loadingDetailStudents = false;
    this.loadingSchedules = false;
  }

  refreshBatches(): void {
    if (!this.loading) {
      this.loadBatches();
    }
  }

  // =========================================
  // CREATE BATCH
  // =========================================

  openCreateBatch(): void {

    this.errorMessage = '';
    this.successMessage = '';

    this.batchForm = this.emptyBatchForm();

    this.startTime = '09:00';
    this.endTime = '11:00';

    if (!this.employees.length && !this.loadingEmployees) {
      this.loadEmployees();
    }

    if (!this.branches.length && !this.loadingBranches) {
      this.loadBranches();
    }

    this.showCreateBatch = true;
  }

  closeCreateBatch(): void {
    if (!this.savingBatch) {
      this.showCreateBatch = false;
    }
  }

  createBatch(form: NgForm): void {

    if (form.invalid || this.savingBatch) {
      form.control.markAllAsTouched();
      return;
    }

    if (!this.employees.some(
      e => e.employee_id === Number(this.batchForm.employee_id)
    )) {
      this.errorMessage =
        'Please select a trainer from the Employee dropdown.';
      return;
    }

    const startDate = this.batchForm.start_date;
    const endDate = this.batchForm.end_date;

    if (
      !startDate ||
      !endDate ||
      !this.startTime ||
      !this.endTime
    ) {
      this.errorMessage =
        'Please select start date, end date and both batch times.';
      return;
    }

    const start = this.localDateAtMidnight(startDate);
    const end = this.localDateAtMidnight(endDate);

    const startMinutes = this.timeToMinutes(this.startTime);
    const endMinutes = this.timeToMinutes(this.endTime);

    if (
      !start ||
      !end ||
      end < start ||
      (
        end.getTime() === start.getTime() &&
        endMinutes <= startMinutes
      )
    ) {
      this.errorMessage =
        'End date/time must be later than start date/time.';
      return;
    }

    const request: CreateBatchRequest = {
      ...this.batchForm,

      batch_name: this.batchForm.batch_name.trim(),
      topic_id: Number(this.batchForm.topic_id),
      employee_id: Number(this.batchForm.employee_id),
      branch_id: Number(this.batchForm.branch_id),

      // Swagger expects ISO DateTime values.
      start_date: start.toISOString(),
      end_date: end.toISOString(),

      // Generated automatically from time pickers.
      batch_time:
        `${this.formatTime12Hour(this.startTime)} - ${this.formatTime12Hour(this.endTime)}`,

      playlist_title: this.batchForm.playlist_title.trim(),
      playlist_key: this.batchForm.playlist_key.trim()
    };

    this.savingBatch = true;
    this.errorMessage = '';

    this.api.create(request)
      .pipe(finalize(() => this.savingBatch = false))
      .subscribe({

        next: () => {
          this.showCreateBatch = false;

          this.successMessage =
            'Batch created successfully.';

          this.activeTab = 'active';

          this.loadBatches();
        },

        error: error => {
          this.errorMessage = this.getApiError(
            error,
            'Unable to create batch.'
          );
        }
      });
  }

  // =========================================
  // DATE AND TIME HELPERS
  // =========================================

  private localDateAtMidnight(value: string): Date | null {

    const parts = value.split('-').map(Number);

    if (
      parts.length !== 3 ||
      parts.some(part => !Number.isFinite(part))
    ) {
      return null;
    }

    const date = new Date(
      parts[0],
      parts[1] - 1,
      parts[2],
      0, 0, 0, 0
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  private timeToMinutes(value: string): number {

    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private formatTime12Hour(value: string): string {

    const [hours, minutes] = value.split(':').map(Number);

    const suffix = hours >= 12 ? 'PM' : 'AM';

    const hour12 = hours % 12 || 12;

    return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }

  // =========================================
  // REMOVE / RESTORE BATCH
  // =========================================

  removeBatch(batch: Batch): void {

    if (
      !batch?.batch_id ||
      !window.confirm(`Remove batch ${batch.batch_name}?`)
    ) {
      return;
    }

    this.api.delete(Number(batch.batch_id)).subscribe({

      next: () => {
        this.successMessage = 'Batch removed successfully.';
        this.loadBatches();
      },

      error: error => {
        this.errorMessage = this.getApiError(
          error,
          'Unable to remove batch.'
        );
      }
    });
  }

  restoreBatch(batch: Batch): void {

    this.api.restore(Number(batch.batch_id)).subscribe({

      next: () => {
        this.successMessage = 'Batch restored successfully.';
        this.loadBatches();
      },

      error: error => {
        this.errorMessage = this.getApiError(
          error,
          'Unable to restore batch.'
        );
      }
    });
  }

  // =========================================
  // VIEW BATCH SCHEDULE
  // =========================================

  viewSchedule(batch: Batch): void {
    this.selectedBatch = batch;
    this.errorMessage = '';

    // Data was prefetched on page load; show it immediately without another API call.
    if (this.batchDataLoaded) {
      this.applyCachedBatchDetails(Number(batch.batch_id));
      return;
    }

    // Fallback only if the initial background load has not completed yet.
    this.loadingDetailStudents = true;
    this.loadingSchedules = true;
  }

  closeDetails(): void {
    this.selectedBatch = null;
    this.schedules = [];
    this.detailStudents = [];
  }

  // =========================================
  // REMOVE STUDENT FROM BATCH
  // =========================================

  removeBatchStudent(student: StudentOption): void {

    if (
      !student.batchStudentId ||
      !window.confirm('Remove this student from the batch?')
    ) {
      return;
    }

    this.http.delete(
      `${this.batchApiBase}/BatchStudent/${student.batchStudentId}`
    ).subscribe({

      next: () => {

        this.detailStudents = this.detailStudents.filter(
          s => s.batchStudentId !== student.batchStudentId
        );
        this.batchStudentRows = this.batchStudentRows.filter((row: any) =>
          Number(row?.batch_student_id ?? row?.batchStudentId ?? row?.id ?? 0) !== student.batchStudentId
        );

        if (this.selectedBatch) {
          this.studentCounts[Number(this.selectedBatch.batch_id)] = this.detailStudents.length;
        }

        this.successMessage = 'Student removed from batch.';
      },

      error: error => {
        this.errorMessage = this.getApiError(
          error,
          'Unable to remove student from batch.'
        );
      }
    });
  }

  // =========================================
  // GENERATE SCHEDULE
  // =========================================

  generateSchedule(batch: Batch): void {

    if (!window.confirm(
      `Generate schedule for ${batch.batch_name}?`
    )) {
      return;
    }

    this.generatingSchedule = true;

    this.api.generateBatchSchedule(Number(batch.batch_id))
      .pipe(finalize(() => this.generatingSchedule = false))
      .subscribe({

        next: () => {
          this.successMessage =
            'Batch schedule generated successfully.';

          this.viewSchedule(batch);
        },

        error: error => {
          this.errorMessage = this.getApiError(
            error,
            'Unable to generate batch schedule.'
          );
        }
      });
  }

  // =========================================
  // ADD STUDENTS
  // =========================================

  openAddStudents(batch: Batch): void {

    this.selectedBatch = batch;
    this.showAddStudents = true;

    this.studentSearch = '';
    this.errorMessage = '';
    this.students = [];

    this.loadStudents();
  }

  loadStudents(): void {

    if (!this.selectedBatch) return;

    this.loadingStudents = true;

    this.api.getRegisteredStudentsForBatch(
      Number(this.selectedBatch.batch_id)
    )
      .pipe(finalize(() => this.loadingStudents = false))
      .subscribe({

        next: response => {

          this.students = this.rows(response)
            .map(row => this.normalizeStudent(row))
            .filter(student => student.registrationId > 0);

          if (!this.students.length) {
            this.errorMessage =
              'No eligible registrations returned for this batch.';
          }
        },

        error: error => {
          this.errorMessage = this.getApiError(
            error,
            'Unable to load eligible student registrations.'
          );
        }
      });
  }

  get filteredStudents(): StudentOption[] {

    const q = this.studentSearch.trim().toLowerCase();

    if (!q) return this.students;

    return this.students.filter(s =>
      `${s.studentName} ${s.lastName} ${s.registrationCode} ${s.courseName} ${s.emailAddress} ${s.mobileNumber}`
        .toLowerCase()
        .includes(q)
    );
  }

  get selectedStudentCount(): number {
    return this.students.filter(s => s.selected).length;
  }

  toggleAllStudents(checked: boolean): void {
    this.filteredStudents.forEach(s => s.selected = checked);
  }

  closeAddStudents(): void {

    if (this.savingStudents) return;

    this.showAddStudents = false;
    this.students = [];
    this.selectedBatch = null;
  }

  addSelectedStudents(): void {

    if (!this.selectedBatch || this.savingStudents) return;

    const selected = this.students.filter(s => s.selected);

    if (!selected.length) {
      this.errorMessage = 'Select at least one student.';
      return;
    }

    const batchId = Number(this.selectedBatch.batch_id);

    this.savingStudents = true;

    forkJoin(
      selected.map(s =>
        this.api.addStudent({
          batch_id: batchId,
          registration_id: s.registrationId
        })
      )
    )
      .pipe(finalize(() => this.savingStudents = false))
      .subscribe({

        next: () => {

          this.successMessage =
            `${selected.length} student(s) added to ${this.selectedBatch?.batch_name}.`;

          this.closeAddStudents();
          this.loadBatches();
        },

        error: error => {
          this.errorMessage = this.getApiError(
            error,
            'Unable to add selected students.'
          );
        }
      });
  }

  // =========================================
  // ATTENDANCE SCHEDULE DROPDOWN
  // =========================================

  loadAttendanceSchedules(batchId: number): void {
    this.loadingAttendanceOptions = !this.batchDataLoaded;

    this.attendanceScheduleOptions = this.allScheduleRows
      .filter(row => Number(row.batch_id) === batchId)
      .map(row => ({
        batch_schedule_id: Number(row.batch_schedule_id),
        batch_id: Number(row.batch_id),
        batch_name: row.batch_name ?? '',
        content_name: row.content_name ?? '',
        expected_date: row.expected_date ?? '',
        expected_day: row.expected_day ?? ''
      }))
      .filter(item => item.batch_schedule_id > 0);

    this.selectedAttendanceScheduleId =
      this.attendanceScheduleOptions[0]?.batch_schedule_id ?? 0;
    this.loadingAttendanceOptions = false;
  }

  // =========================================
  // OPEN ATTENDANCE
  // =========================================

  openAttendance(batch: Batch): void {
    this.selectedBatch = batch;
    this.attendanceStudents = [];
    this.selectedAttendanceScheduleId = 0;
    this.attendanceDate = new Date().toISOString().slice(0, 10);
    this.errorMessage = '';

    this.loadAttendanceSchedules(Number(batch.batch_id));

    // Reuse the student assignments already loaded with the Batch List.
    const assignedRows = this.batchStudentRows.filter((row: any) =>
      Number(row?.batch_id ?? row?.batchId ?? row?.batch?.batch_id ?? 0) === Number(batch.batch_id)
    );

    this.attendanceStudents = assignedRows
      .map((row: any) => ({ ...this.normalizeStudent(row), isPresent: true }))
      .filter(student => student.registrationId > 0);

    this.showAttendance = true;
  }

  // =========================================
  // SAVE ATTENDANCE
  // =========================================

  saveAttendance(): void {

    if (this.savingAttendance) return;

    if (!this.selectedAttendanceScheduleId) {
      this.errorMessage =
        'Please select a batch schedule for attendance.';
      return;
    }

    if (!this.attendanceDate) {
      this.errorMessage = 'Please select attendance date.';
      return;
    }

    if (!this.attendanceStudents.length) {
      this.errorMessage =
        'No students are available for attendance.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.savingAttendance = true;

    const attendanceDateTime =
      new Date(`${this.attendanceDate}T00:00:00`).toISOString();

    const sessionUrl =
      `${this.batchApiBase}/BatchScheduleAttendance/create`;

    this.http.post<any>(sessionUrl, {
      batch_schedule_id: Number(this.selectedAttendanceScheduleId),
      attendance_date: attendanceDateTime
    }).subscribe({

      next: response => {

        const sessionId =
          this.extractAttendanceSessionId(response);

        if (sessionId > 0) {
          this.saveStudentAttendance(sessionId);
          return;
        }

        this.http.get<any>(
          `${this.batchApiBase}/BatchScheduleAttendance/get-all`
        ).subscribe({

          next: allResponse => {

            const matchingSession = this.rows(allResponse).find(
              (row: any) =>
                Number(
                  row?.batch_schedule_id ??
                  row?.batchScheduleId ?? 0
                ) === Number(this.selectedAttendanceScheduleId) &&
                String(
                  row?.attendance_date ??
                  row?.attendanceDate ?? ''
                ).slice(0, 10) === this.attendanceDate
            );

            const resolvedId = Number(
              matchingSession?.schedule_attendance_id ??
              matchingSession?.scheduleAttendanceId ??
              matchingSession?.id ?? 0
            );

            if (resolvedId > 0) {
              this.saveStudentAttendance(resolvedId);
            } else {
              this.savingAttendance = false;

              this.errorMessage =
                'Attendance session was created, but its ID was not returned by the API. Check BatchScheduleAttendance/get-all response.';
            }
          },

          error: error => {
            this.savingAttendance = false;

            this.errorMessage = this.getApiError(
              error,
              'Attendance session created, but unable to retrieve its ID.'
            );
          }
        });
      },

      error: error => {
        this.savingAttendance = false;

        this.errorMessage = this.getApiError(
          error,
          'Unable to create attendance session.'
        );
      }
    });
  }

  private extractAttendanceSessionId(response: any): number {

    const data = response?.data ?? response?.result ?? response;

    return Number(
      data?.schedule_attendance_id ??
      data?.scheduleAttendanceId ??
      data?.batch_schedule_attendance_id ??
      data?.batchScheduleAttendanceId ??
      data?.id ?? 0
    );
  }

  private saveStudentAttendance(scheduleAttendanceId: number): void {

    const requests = this.attendanceStudents.map(student =>
      this.http.post(
        `${this.batchApiBase}/ScheduleAttendance/create`,
        {
          schedule_attendance_id: Number(scheduleAttendanceId),
          registration_id: Number(student.registrationId),
          is_present: student.isPresent ? 1 : 0
        }
      )
    );

    forkJoin(requests)
      .pipe(finalize(() => this.savingAttendance = false))
      .subscribe({

        next: () => {

          const presentCount =
            this.attendanceStudents.filter(
              student => student.isPresent
            ).length;

          const absentCount =
            this.attendanceStudents.length - presentCount;

          this.successMessage =
            `Attendance saved successfully. Present: ${presentCount}, Absent: ${absentCount}.`;

          this.showAttendance = false;
        },

        error: error => {
          this.errorMessage = this.getApiError(
            error,
            'Attendance session was created, but one or more student attendance records could not be saved.'
          );
        }
      });
  }

  // =========================================
  // STUDENT NORMALIZATION
  // =========================================

  private normalizeStudent(row: any): StudentOption {

    return {
      batchStudentId: Number(
        row?.batchStudentId ??
        row?.batch_student_id ??
        row?.batchStudent_Id ??
        row?.id ?? 0
      ),

      registrationId: Number(
        row?.registrationId ??
        row?.registration_id ??
        row?.registration_Id ??
        row?.registrationID ?? 0
      ),

      studentId: Number(
        row?.studentId ??
        row?.student_id ??
        row?.student_Id ?? 0
      ),

      studentName: String(
        row?.studentName ??
        row?.student_name ??
        row?.firstName ??
        row?.first_name ??
        row?.name ?? ''
      ),

      lastName: String(
        row?.lastName ??
        row?.last_name ?? ''
      ),

      registrationCode: String(
        row?.registrationCode ??
        row?.registration_code ?? ''
      ),

      courseName: String(
        row?.courseName ??
        row?.course_name ?? ''
      ),

      emailAddress: String(
        row?.emailAddress ??
        row?.email_address ??
        row?.email ?? ''
      ),

      mobileNumber: String(
        row?.mobileNumber ??
        row?.mobile_number ??
        row?.mobile ?? ''
      )
    };
  }

  // =========================================
  // API ERROR
  // =========================================

  private getApiError(error: any, fallback: string): string {

    return error?.error?.message ||
      error?.error?.title ||
      error?.message ||
      fallback;
  }
}
