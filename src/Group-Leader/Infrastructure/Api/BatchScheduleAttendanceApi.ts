import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class BatchScheduleAttendanceApi {
  private http = inject(HttpClient);
  private url = 'https://batchmanagement.ciitstudent.com/api/BatchScheduleAttendance';
  create(body: { batch_schedule_id: number; attendance_date: string }) { return this.http.post(`${this.url}/create`, body); }
  getAll() { return this.http.get(`${this.url}/get-all`); }
  getById(id: number) { return this.http.get(`${this.url}/${id}`); }
  update(id: number, body: unknown) { return this.http.put(`${this.url}/${id}`, body); }
  delete(id: number) { return this.http.delete(`${this.url}/${id}`); }
  restore(id: number) { return this.http.put(`${this.url}/${id}/restore`, {}); }
  getBatchSchedules() { return this.http.get(`${this.url}/batch-schedules`); }
}
