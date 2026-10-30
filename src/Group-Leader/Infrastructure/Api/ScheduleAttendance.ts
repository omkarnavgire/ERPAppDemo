import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class ScheduleAttendanceApi {
  private http = inject(HttpClient);
  private url = 'https://batchmanagement.ciitstudent.com/api/ScheduleAttendance';
  create(body: unknown) { return this.http.post(`${this.url}/create`, body); }
  getAll() { return this.http.get(`${this.url}/get-all`); }
  getById(id: number) { return this.http.get(`${this.url}/get-by-id/${id}`); }
  update(id: number, body: unknown) { return this.http.put(`${this.url}/update/${id}`, body); }
  delete(id: number) { return this.http.delete(`${this.url}/delete/${id}`); }
  restore(id: number) { return this.http.put(`${this.url}/restore/${id}`, {}); }
}
