
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { StudentPayment } from '../../Domain/Entities/StudentPayment';
import { StudentPaymentRequest } from '../../Domain/DTOs/StudentPaymentRequest';

@Injectable({
  providedIn: 'root'
})
export class StudentPaymentApi {

  private readonly apiUrl =
    'https://student.ciitstudent.com/api/StudentPayment';

  constructor(private http: HttpClient) {}

  createPayment(
    request: StudentPaymentRequest
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/create`,
      request
    );
  }

  getAllPayments(): Observable<StudentPayment[]> {
    return this.http.get<StudentPayment[]>(
      `${this.apiUrl}/get-all`
    );
  }

  getPaymentById(
    paymentId: number
  ): Observable<StudentPayment> {
    return this.http.get<StudentPayment>(
      `${this.apiUrl}/get-by-id/${paymentId}`
    );
  }

  updatePayment(
    paymentId: number,
    request: StudentPaymentRequest
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/update/${paymentId}`,
      request
    );
  }

  deletePayment(paymentId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/delete/${paymentId}`
    );
  }

  restorePayment(paymentId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/restore/${paymentId}`,
      {}
    );
  }
}
