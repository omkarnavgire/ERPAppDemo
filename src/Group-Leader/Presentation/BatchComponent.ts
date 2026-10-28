import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { Batch } from '../Domain/Entities/Batch';
import { CreateBatchRequest } from '../Domain/DTOs/CreateBatchRequest';
import { BatchManagement } from '../Application/BatchManagement';
import { StudentRegistrationApi } from '../../Account/Infrastructure/Api/StudentRegistrationApi';

interface StudentOption {
  registrationId: number;
  studentId: number;
  studentName: string;
  lastName: string;
  registrationCode: string;
  courseName: string;
  emailAddress: string;
  mobileNumber: string;
  selected?: boolean;
}

@Component({
  selector: 'app-batch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './BatchComponent.html',
  styleUrls: ['./BatchComponent.css']
})
export class BatchComponent implements OnInit {
  private readonly batchManagement = inject(BatchManagement);
  private readonly studentRegistrationApi = inject(StudentRegistrationApi);

  loading = false;
  savingBatch = false;
  loadingStudents = false;
  savingStudents = false;
  errorMessage = '';
  successMessage = '';
  studentSearch = '';
  showCreateBatch = false;
  showAddStudents = false;
  batches: Batch[] = [];
  students: StudentOption[] = [];
  selectedBatch: Batch | null = null;

  batchForm: CreateBatchRequest = this.createEmptyBatchForm();

  ngOnInit(): void {
    this.loadBatches();
  }

  private createEmptyBatchForm(): CreateBatchRequest {
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

  loadBatches(): void {
    this.loading = true;
    this.errorMessage = '';
    this.batchManagement.getAll().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: rows => this.batches = rows,
      error: error => {
        console.error('Unable to load batches:', error);
        this.errorMessage = 'Unable to load batches. Check the Batch API and try again.';
      }
    });
  }

  openCreateBatch(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.batchForm = this.createEmptyBatchForm();
    this.showCreateBatch = true;
  }

  closeCreateBatch(): void {
    if (this.savingBatch) return;
    this.showCreateBatch = false;
  }

  createBatch(form: NgForm): void {
    if (form.invalid || this.savingBatch) {
      form.control.markAllAsTouched();
      return;
    }

    const start = new Date(this.batchForm.start_date);
    const end = new Date(this.batchForm.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      this.errorMessage = 'End date and time must be later than the start date and time.';
      return;
    }

    const request: CreateBatchRequest = {
      ...this.batchForm,
      batch_name: this.batchForm.batch_name.trim(),
      topic_id: Number(this.batchForm.topic_id),
      employee_id: Number(this.batchForm.employee_id),
      branch_id: Number(this.batchForm.branch_id),
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      batch_time: this.batchForm.batch_time.trim(),
      playlist_title: this.batchForm.playlist_title.trim(),
      playlist_key: this.batchForm.playlist_key.trim()
    };

    this.savingBatch = true;
    this.errorMessage = '';
    this.batchManagement.create(request).pipe(
      finalize(() => this.savingBatch = false)
    ).subscribe({
      next: () => {
        this.showCreateBatch = false;
        this.successMessage = 'Batch created successfully.';
        this.loadBatches();
      },
      error: error => {
        console.error('Unable to create batch:', error);
        this.errorMessage = this.getApiError(error, 'Unable to create batch. Verify the entered IDs and try again.');
      }
    });
  }

  openAddStudents(batch: Batch): void {
    this.selectedBatch = batch;
    this.showAddStudents = true;
    this.studentSearch = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.students = [];
    this.loadStudents();
  }

  closeAddStudents(): void {
    if (this.savingStudents) return;
    this.showAddStudents = false;
    this.selectedBatch = null;
    this.students = [];
  }

  loadStudents(): void {
    this.loadingStudents = true;
    this.studentRegistrationApi.getRegistrations().pipe(
      finalize(() => this.loadingStudents = false)
    ).subscribe({
      next: (response: any) => {
        const rows = this.unwrapRows(response);
        this.students = rows.map((row: any) => this.normalizeStudent(row))
          .filter((student: StudentOption) => student.registrationId > 0);
        if (!this.students.length) {
          this.errorMessage = 'No student registrations were returned by the Student Registration API.';
        }
      },
      error: error => {
        console.error('Unable to load registered students:', error);
        this.errorMessage = this.getApiError(error, 'Unable to load students. Please check the Student Registration API.');
      }
    });
  }

  get filteredStudents(): StudentOption[] {
    const query = this.studentSearch.trim().toLowerCase();
    if (!query) return this.students;
    return this.students.filter(student =>
      `${student.studentName} ${student.lastName} ${student.registrationCode} ${student.courseName} ${student.emailAddress} ${student.mobileNumber}`
        .toLowerCase().includes(query)
    );
  }

  get selectedStudentCount(): number {
    return this.students.filter(student => student.selected).length;
  }

  toggleAllStudents(checked: boolean): void {
    this.filteredStudents.forEach(student => student.selected = checked);
  }

  addSelectedStudents(): void {
    if (!this.selectedBatch || this.savingStudents) return;
    const selected = this.students.filter(student => student.selected);
    if (!selected.length) {
      this.errorMessage = 'Select at least one student.';
      return;
    }

    const batchId = Number(this.selectedBatch.batch_id);
    if (!batchId) {
      this.errorMessage = 'Batch ID is missing. Refresh the batch list and try again.';
      return;
    }

    this.savingStudents = true;
    this.errorMessage = '';
    const requests = selected.map(student => this.batchManagement.addStudent({
      batch_id: batchId,
      registration_id: student.registrationId
    }));

    forkJoin(requests).pipe(
      finalize(() => this.savingStudents = false)
    ).subscribe({
      next: () => {
        this.successMessage = `${selected.length} student(s) added to ${this.selectedBatch?.batch_name ?? 'the batch'}.`;
        this.closeAddStudents();
      },
      error: error => {
        console.error('Unable to add students to batch:', error);
        this.errorMessage = this.getApiError(error,
          'Unable to add students. The BatchStudent API may use different request field names; check its Swagger request schema.');
      }
    });
  }

  private normalizeStudent(row: any): StudentOption {
    return {
      registrationId: Number(row?.registrationId ?? row?.registration_id ?? row?.registration_Id ?? row?.registrationID ?? 0),
      studentId: Number(row?.studentId ?? row?.student_id ?? row?.student_Id ?? 0),
      studentName: String(row?.studentName ?? row?.student_name ?? row?.firstName ?? row?.first_name ?? row?.name ?? ''),
      lastName: String(row?.lastName ?? row?.last_name ?? ''),
      registrationCode: String(row?.registrationCode ?? row?.registration_code ?? row?.registration_Code ?? ''),
      courseName: String(row?.courseName ?? row?.course_name ?? ''),
      emailAddress: String(row?.emailAddress ?? row?.email_address ?? row?.email ?? ''),
      mobileNumber: String(row?.mobileNumber ?? row?.mobile_number ?? row?.mobile ?? '')
    };
  }

  private unwrapRows(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response?.$values)) return response.$values;
    if (Array.isArray(response?.data?.$values)) return response.data.$values;
    return [];
  }

  private getApiError(error: any, fallback: string): string {
    return error?.error?.message || error?.error?.title || error?.message || fallback;
  }
}
