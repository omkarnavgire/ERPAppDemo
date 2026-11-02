import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubmitAttendanceRequest } from '../../Domain/DTOs/SubmitAttendanceRequest';

/** All Trainer service endpoints are rooted here. Change this one value if the API host changes. */
@Injectable({ providedIn: 'root' })
export class TrainerApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_ENDPOINTS.trainer;

  getMyBatches(): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Trainer/my-batches`);
  }

  getBatchDetails(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Trainer/batch-details/${batchId}`);
  }

  getBatchStudents(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Trainer/batch-students/${batchId}`);
  }

  getBatchSchedules(batchId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Trainer/batch-schedules/${batchId}`);
  }

  getScheduleAttendanceStudents(batchScheduleId: number): Observable<unknown> {
    return this.http.get(`${this.baseUrl}/Attendance/schedule/${batchScheduleId}/students`);
  }

  submitAttendance(request: SubmitAttendanceRequest): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Attendance/submit`, request);
  }
}
