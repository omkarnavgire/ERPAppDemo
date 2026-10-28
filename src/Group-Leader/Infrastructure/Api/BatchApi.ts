import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Batch } from '../../Domain/Entities/Batch';
import { CreateBatchRequest } from '../../Domain/DTOs/CreateBatchRequest';
import { AddBatchStudentRequest } from '../../Domain/DTOs/AddBatchStudentRequest';

@Injectable({ providedIn: 'root' })
export class BatchApi {
  private readonly http = inject(HttpClient);
  private readonly batchUrl = 'https://student.ciitstudent.com/api/Batch';
  private readonly batchStudentUrl = 'https://student.ciitstudent.com/api/BatchStudent';

  getAllBatches(): Observable<unknown> {
    return this.http.get<unknown>(`${this.batchUrl}/get-all`);
  }

  createBatch(request: CreateBatchRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.batchUrl}/create`, request);
  }

  addStudent(request: AddBatchStudentRequest): Observable<unknown> {
    return this.http.post<unknown>(`${this.batchStudentUrl}/create`, request);
  }

  getStudentsForBatch(batchId: number): Observable<unknown> {
    return this.http.get<unknown>(`${this.batchStudentUrl}/batch/${batchId}`);
  }
}
