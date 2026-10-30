import { Observable } from 'rxjs';
import { Batch } from '../Entities/Batch';
import { CreateBatchRequest } from '../DTOs/CreateBatchRequest';
import { AddBatchStudentRequest } from '../DTOs/AddBatchStudentRequest';

export abstract class BatchRepository {
  abstract getAllBatches(): Observable<Batch[]>;
  abstract createBatch(request: CreateBatchRequest): Observable<unknown>;
  abstract addStudent(request: AddBatchStudentRequest): Observable<unknown>;
  abstract getStudentsForBatch(batchId: number): Observable<unknown>;
}
