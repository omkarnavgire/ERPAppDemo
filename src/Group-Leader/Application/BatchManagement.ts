import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Batch } from '../Domain/Entities/Batch';
import { CreateBatchRequest } from '../Domain/DTOs/CreateBatchRequest';
import { AddBatchStudentRequest } from '../Domain/DTOs/AddBatchStudentRequest';
import { BATCH_REPOSITORY } from '../Domain/Repositories/Token/batchrepositorytoken';

@Injectable({ providedIn: 'root' })
export class BatchManagement {
  private readonly repository = inject(BATCH_REPOSITORY);

  getAll(): Observable<Batch[]> {
    return this.repository.getAllBatches();
  }

  create(request: CreateBatchRequest): Observable<unknown> {
    return this.repository.createBatch(request);
  }

  addStudent(request: AddBatchStudentRequest): Observable<unknown> {
    return this.repository.addStudent(request);
  }

  getStudents(batchId: number): Observable<unknown> {
    return this.repository.getStudentsForBatch(batchId);
  }
}
