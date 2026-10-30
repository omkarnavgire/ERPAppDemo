import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Batch } from '../Domain/Entities/Batch';
import { CreateBatchRequest } from '../Domain/DTOs/CreateBatchRequest';
import { AddBatchStudentRequest } from '../Domain/DTOs/AddBatchStudentRequest';

export interface ApiEnvelope<T> { statusCode?: number; message?: string; data?: T; }

@Injectable({ providedIn: 'root' })
export class BatchManagement {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://batchmanagement.ciitstudent.com/api';

  getAll(): Observable<Batch[]> {
    return this.http.get<ApiEnvelope<Batch[]> | Batch[]>(`${this.baseUrl}/Batch/get-all`).pipe(
      map(response => Array.isArray(response) ? response : this.unwrap<Batch[]>(response) ?? [])
    );
  }

  create(request: CreateBatchRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Batch/create`, request);
  }

  getById(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Batch/get-by-id/${batchId}`);
  }

  update(batchId: number, request: Partial<CreateBatchRequest>): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Batch/update/${batchId}`, request);
  }

  delete(batchId: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/Batch/delete/${batchId}`);
  }

  restore(batchId: number): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Batch/restore/${batchId}`, {});
  }

  addStudent(request: AddBatchStudentRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/BatchStudent/create`, request);
  }

  getStudents(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/BatchStudent/batch/${batchId}`);
  }

  getRegisteredStudentsForBatch(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/BatchStudent/registrations`, { params: { batchId } });
  }

  getEmployees(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Employee/get-all-for-dropdown`);
  }

  generateBatchSchedule(batchId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/BatchSchedule/generate/${batchId}`, {});
  }

  getBatchSchedules(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/BatchSchedule/batch/${batchId}`);
  }

  getAllBatchSchedules(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/BatchSchedule/get-all`);
  }

  createBatchScheduleAttendance(request: { batch_schedule_id: number; attendance_date: string }): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/BatchScheduleAttendance/create`, request);
  }

  private unwrap<T>(response: ApiEnvelope<T> | unknown): T | undefined {
    return (response as ApiEnvelope<T>)?.data;
  }
}
