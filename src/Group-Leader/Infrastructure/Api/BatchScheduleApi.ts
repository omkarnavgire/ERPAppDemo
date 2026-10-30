import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({ providedIn: 'root' })
export class BatchScheduleApi {
  private http = inject(HttpClient);
  private url = 'https://batchmanagement.ciitstudent.com/api/BatchSchedule';
  generate(batchId: number) { return this.http.post(`${this.url}/generate/${batchId}`, {}); }
  getAll() { return this.http.get(`${this.url}/get-all`); }
  getById(id: number) { return this.http.get(`${this.url}/${id}`); }
  update(id: number, body: unknown) { return this.http.put(`${this.url}/${id}`, body); }
  delete(id: number) { return this.http.delete(`${this.url}/${id}`); }
  getByBatch(batchId: number) { return this.http.get(`${this.url}/batch/${batchId}`); }
  restore(id: number) { return this.http.put(`${this.url}/${id}/restore`, {}); }
  getContents() { return this.http.get(`${this.url}/contents`); }
}
