
import { Observable } from 'rxjs';
import { StudentPayment } from '../Entities/StudentPayment';
import { StudentPaymentRequest } from '../DTOs/StudentPaymentRequest';

export abstract class StudentPaymentRepository {
  abstract createPayment(
    request: StudentPaymentRequest
  ): Observable<any>;

  abstract getAllPayments(): Observable<StudentPayment[]>;

  abstract getPaymentById(
    paymentId: number
  ): Observable<StudentPayment>;

  abstract updatePayment(
    paymentId: number,
    request: StudentPaymentRequest
  ): Observable<any>;

  abstract deletePayment(
    paymentId: number
  ): Observable<any>;

  abstract restorePayment(
    paymentId: number
  ): Observable<any>;
}
