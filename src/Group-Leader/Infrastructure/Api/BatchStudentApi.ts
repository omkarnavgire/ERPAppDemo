import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AddBatchStudentRequest } from '../../Domain/DTOs/AddBatchStudentRequest';
@Injectable({ providedIn: 'root' })
export class BatchStudentApi {
  private http = inject(HttpClient);
  private url = 'https://batchmanagement.ciitstudent.com/api/BatchStudent';
  create(body: AddBatchStudentRequest) { return this.http.post(`${this.url}/create`, body); }
  getAll() { return this.http.get(`${this.url}/get-all`); }
  getById(id: number) { return this.http.get(`${this.url}/${id}`); }
  update(id: number, body: unknown) { return this.http.put(`${this.url}/${id}`, body); }
  delete(id: number) { return this.http.delete(`${this.url}/${id}`); }
  getByBatch(batchId: number) { return this.http.get(`${this.url}/batch/${batchId}`); }
  restore(id: number) { return this.http.put(`${this.url}/${id}/restore`, {}); }
  getRegistrations(batchId: number) { return this.http.get(`${this.url}/registrations`, { params: { batchId } }); }
}
