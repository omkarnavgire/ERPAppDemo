import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BatchApi } from '../Api/BatchApi';
import { BatchRepository } from '../../Domain/Repositories/BatchRepository';
import { Batch } from '../../Domain/Entities/Batch';
import { CreateBatchRequest } from '../../Domain/DTOs/CreateBatchRequest';
import { AddBatchStudentRequest } from '../../Domain/DTOs/AddBatchStudentRequest';

@Injectable({ providedIn: 'root' })
export class BatchRepositoryImpl extends BatchRepository {
  private readonly api = inject(BatchApi);

  getAllBatches(): Observable<Batch[]> {
    return this.api.getAllBatches().pipe(map((response: any) => {
      const rows = Array.isArray(response) ? response
        : Array.isArray(response?.data) ? response.data
        : Array.isArray(response?.result) ? response.result
        : Array.isArray(response?.$values) ? response.$values : [];
      return rows.map((row: any) => ({
        ...row,
        batch_id: Number(row?.batch_id ?? row?.batchId ?? row?.batch_ID ?? 0),
        batch_name: String(row?.batch_name ?? row?.batchName ?? ''),
        topic_id: Number(row?.topic_id ?? row?.topicId ?? 0),
        employee_id: Number(row?.employee_id ?? row?.employeeId ?? 0),
        branch_id: Number(row?.branch_id ?? row?.branchId ?? 0),
        start_date: String(row?.start_date ?? row?.startDate ?? ''),
        end_date: String(row?.end_date ?? row?.endDate ?? ''),
        batch_time: String(row?.batch_time ?? row?.batchTime ?? '')
      } as Batch));
    }));
  }

  createBatch(request: CreateBatchRequest): Observable<unknown> {
    return this.api.createBatch(request);
  }

  addStudent(request: AddBatchStudentRequest): Observable<unknown> {
    return this.api.addStudent(request);
  }

  getStudentsForBatch(batchId: number): Observable<unknown> {
    return this.api.getStudentsForBatch(batchId);
  }
}
