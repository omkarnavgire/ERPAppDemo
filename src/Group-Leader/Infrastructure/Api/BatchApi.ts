import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CreateBatchRequest } from '../../Domain/DTOs/CreateBatchRequest';

@Injectable({ providedIn: 'root' })
export class BatchApi {
  private http = inject(HttpClient);
  private url = 'https://batchmanagement.ciitstudent.com/api/Batch';
  getAll() { return this.http.get(`${this.url}/get-all`); }
  getById(id: number) { return this.http.get(`${this.url}/get-by-id/${id}`); }
  create(body: CreateBatchRequest) { return this.http.post(`${this.url}/create`, body); }
  update(id: number, body: Partial<CreateBatchRequest>) { return this.http.put(`${this.url}/update/${id}`, body); }
  delete(id: number) { return this.http.delete(`${this.url}/delete/${id}`); }
  restore(id: number) { return this.http.put(`${this.url}/restore/${id}`, {}); }
}
