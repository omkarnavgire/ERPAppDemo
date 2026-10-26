
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';

import { StudentPayment } from '../../Domain/Entities/StudentPayment';
import { StudentPaymentRequest } from '../../Domain/DTOs/StudentPaymentRequest';
import { STUDENT_PAYMENT_REPOSITORY } from 'src/Account/Domain/Repositories/Token/studentpaymentrepositrytoken';
import { StudentPaymentRepository } from 'src/Account/Domain/Repositories/StudentPaymentRepositry';


@Injectable({
  providedIn: 'root'
})
export class StudentPaymentService {

  constructor(
    @Inject(STUDENT_PAYMENT_REPOSITORY)
    private repository: StudentPaymentRepository
  ) {}

  createPayment(
    request: StudentPaymentRequest
  ): Observable<any> {
    return this.repository.createPayment(request);
  }

  getAllPayments(): Observable<StudentPayment[]> {
    return this.repository.getAllPayments();
  }

  getPaymentById(
    paymentId: number
  ): Observable<StudentPayment> {
    return this.repository.getPaymentById(paymentId);
  }

  downloadInvoice(registrationId: number, paymentId: number): Observable<Blob> {
    return this.repository.downloadInvoice(registrationId, paymentId);
  }

  updatePayment(
    paymentId: number,
    request: StudentPaymentRequest
  ): Observable<any> {
    return this.repository.updatePayment(paymentId, request);
  }

  deletePayment(paymentId: number): Observable<any> {
    return this.repository.deletePayment(paymentId);
  }

  restorePayment(paymentId: number): Observable<any> {
    return this.repository.restorePayment(paymentId);
  }
}
