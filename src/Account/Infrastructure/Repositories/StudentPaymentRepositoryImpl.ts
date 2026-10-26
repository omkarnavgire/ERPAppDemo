import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { StudentPayment } from '../../Domain/Entities/StudentPayment';
import { StudentPaymentRequest } from '../../Domain/DTOs/StudentPaymentRequest';
// import { StudentPaymentRepository } from '../../Domain/Repositories/StudentPaymentRepository';
import { StudentPaymentApi } from '../Api/StudentPaymentApi';
import { StudentPaymentRepository } from 'src/Account/Domain/Repositories/StudentPaymentRepositry';

@Injectable({
  providedIn: 'root'
})
export class StudentPaymentRepositoryImpl
  implements StudentPaymentRepository {

  constructor(private api: StudentPaymentApi) {}

  createPayment(
    request: StudentPaymentRequest
  ): Observable<any> {
    return this.api.createPayment(request);
  }

  getAllPayments(): Observable<StudentPayment[]> {
    return this.api.getAllPayments();
  }

  getPaymentById(
    paymentId: number
  ): Observable<StudentPayment> {
    return this.api.getPaymentById(paymentId);
  }

  downloadInvoice(registrationId: number, paymentId: number): Observable<Blob> {
    return this.api.downloadInvoice(registrationId, paymentId);
  }

  updatePayment(
    paymentId: number,
    request: StudentPaymentRequest
  ): Observable<any> {
    return this.api.updatePayment(paymentId, request);
  }

  deletePayment(paymentId: number): Observable<any> {
    return this.api.deletePayment(paymentId);
  }

  restorePayment(paymentId: number): Observable<any> {
    return this.api.restorePayment(paymentId);
  }
}
