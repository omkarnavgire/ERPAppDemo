
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { StudentRegistrationApi } from '../../../Infrastructure/Api/StudentRegistrationApi';
import { StudentPaymentService } from '../../../Application/StudentPayment/StudentPaymentService';
import { StudentPaymentRequest } from '../../../Domain/DTOs/StudentPaymentRequest';

@Component({
  selector: 'app-create-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-payment.html',
  styleUrls: ['./create-payment.css']
})
export class CreatePaymentComponent implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() paymentSaved = new EventEmitter<void>();

  constructor(
    private registrationApi: StudentRegistrationApi,
    private paymentService: StudentPaymentService,
    private router: Router
  ) {}

  students: any[] = [];
  filteredStudents: any[] = [];
  studentRegistrations: any[] = [];
  allPayments: any[] = [];

  studentSearch = '';
  selectedStudentId: number | null = null;
  selectedRegistrationId: number | null = null;

  dropdownOpen = false;
  loadingStudents = false;
  savingPayment = false;

  paymentDate = this.getTodayDate();
  paymentAmount: number | null = null;
  paymentMode = 'Cash';
  paymentDescription = '';

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadStudentsAndPayments();
  }

  private getArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.result)) return response.result;
    return [];
  }

  private getValue(item: any, ...keys: string[]): any {
    for (const key of keys) {
      if (item?.[key] !== undefined && item?.[key] !== null) {
        return item[key];
      }
    }
    return undefined;
  }

  private toNumber(value: any): number {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  loadStudentsAndPayments(): void {
    this.loadingStudents = true;
    this.errorMessage = '';

    forkJoin({
      registrations: this.registrationApi.getRegistrations(),
      payments: this.paymentService.getAllPayments()
    }).pipe(timeout(20000)).subscribe({
      next: ({ registrations, payments }) => {
        const rows = this.getArray(registrations);
        this.allPayments = this.getArray(payments);

        const studentMap = new Map<number, any>();

        for (const item of rows) {
          const studentId = this.toNumber(
            this.getValue(item, 'student_Id', 'studentId')
          );

          const registrationId = this.toNumber(
            this.getValue(item, 'registration_Id', 'registrationId')
          );

          const courseId = this.toNumber(
            this.getValue(item, 'course_Id', 'courseId')
          );

          if (!studentId || !registrationId || !courseId) {
            continue;
          }

          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              studentId,
              studentName: this.getValue(
                item, 'student_Name', 'studentName'
              ) ?? '',
              lastName: this.getValue(
                item, 'last_Name', 'lastName'
              ) ?? '',
              mobileNumber: String(
                this.getValue(item, 'mobile_Number', 'mobileNumber') ?? ''
              ),
              emailAddress: String(
                this.getValue(item, 'email_Address', 'emailAddress') ?? ''
              ),
              registrations: []
            });
          }

          const student = studentMap.get(studentId);

          student.registrations.push({
            ...item,
            registrationId,
            studentId,
            courseId,
            registrationCode: this.getValue(
              item, 'registration_Code', 'registrationCode'
            ) ?? '',
            courseName: this.getValue(
              item, 'course_Name', 'courseName'
            ) ?? '',
            courseFees: this.toNumber(
              this.getValue(item, 'course_Fees', 'courseFees', 'actualFees')
            ),
            discount: this.toNumber(
              this.getValue(item, 'discount', 'Discount')
            ),
            finalFees: 0,
            totalPaid: 0,
            remainingBalance: 0,
            fullyPaid: false,
            feeLoaded: false,
            feeError: false
          });
        }

        this.students = Array.from(studentMap.values());
        this.filteredStudents = [...this.students];

        if (this.students.length === 0) {
          this.errorMessage =
            'No student registrations were returned by the API.';
          this.loadingStudents = false;
          return;
        }

        this.loadRegistrationFees();
      },
      error: error => {
        console.error('Unable to load registrations or payments:', error);
        this.errorMessage =
          'Unable to load students or payment history. Please try again.';
        this.loadingStudents = false;
      }
    });
  }

  private loadRegistrationFees(): void {
    const registrations = this.students.flatMap(student => student.registrations);
    if (!registrations.length) {
      this.loadingStudents = false;
      return;
    }

    // Calculate payment history immediately; call the fee API only when the list API
    // did not provide fee totals. This prevents N unnecessary requests on first load.
    for (const registration of registrations) {
      const registrationPayments = this.allPayments.filter(payment =>
        Number(payment.registrationId) === Number(registration.registrationId) &&
        payment.isPaid !== false && payment.isPaid !== 0
      );
      registration.totalPaid = registrationPayments.reduce(
        (total: number, payment: any) => total + this.toNumber(payment.paymentAmount), 0
      );
      if (registration.courseFees > 0) {
        registration.finalFees = Math.max(registration.courseFees - this.toNumber(registration.discount), 0);
        registration.remainingBalance = Math.max(registration.finalFees - registration.totalPaid, 0);
        registration.feeLoaded = true;
        registration.feeError = false;
        registration.fullyPaid = registration.remainingBalance <= 0;
      }
    }

    const missingFees = registrations.filter(registration => !(registration.courseFees > 0));
    if (!missingFees.length) {
      this.loadingStudents = false;
      return;
    }

    forkJoin(missingFees.map(registration =>
      this.registrationApi.getCourseFees(registration.courseId, registration.discount).pipe(
        timeout(10000),
        map(response => ({ registration, response, error: false })),
        catchError(error => {
          console.warn('Fee details unavailable for registration:', registration.registrationId, error);
          return of({ registration, response: null, error: true });
        })
      )
    )).subscribe(results => {
      for (const result of results) {
        const registration = result.registration;
        const feeData = (result.response as any)?.data ?? result.response;
        if (feeData && !result.error) {
          registration.courseFees = this.toNumber(feeData.actualFees ?? feeData.courseFees);
          registration.discount = this.toNumber(feeData.discount ?? registration.discount);
          registration.finalFees = this.toNumber(feeData.finalFees ?? Math.max(registration.courseFees - registration.discount, 0));
          registration.remainingBalance = Math.max(registration.finalFees - registration.totalPaid, 0);
          registration.feeLoaded = true;
          registration.feeError = false;
          registration.fullyPaid = registration.remainingBalance <= 0;
        } else {
          registration.feeLoaded = false;
          registration.feeError = true;
          registration.finalFees = Math.max(registration.courseFees - registration.discount, 0);
          registration.remainingBalance = Math.max(registration.finalFees - registration.totalPaid, 0);
        }
      }
      this.loadingStudents = false;
    });
  }

  toggleStudentDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;

    if (this.dropdownOpen) {
      this.studentSearch = '';
      this.filterStudents();
    }
  }

  filterStudents(): void {
    const query = this.studentSearch.trim().toLowerCase();

    this.filteredStudents = this.students.filter(student => {
      const fullName =
        `${student.studentName} ${student.lastName}`.toLowerCase();

      return (
        fullName.includes(query) ||
        String(student.mobileNumber).toLowerCase().includes(query) ||
        String(student.emailAddress).toLowerCase().includes(query)
      );
    });
  }

  selectStudent(student: any): void {
    this.selectedStudentId = student.studentId;
    this.studentSearch =
      `${student.studentName} ${student.lastName}`.trim();

    this.studentRegistrations = student.registrations ?? [];
    this.selectedRegistrationId = null;
    this.paymentAmount = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.dropdownOpen = false;
  }

  get selectedStudent(): any | null {
    return this.students.find(
      student =>
        Number(student.studentId) === Number(this.selectedStudentId)
    ) ?? null;
  }

  get selectedRegistration(): any | null {
    return this.studentRegistrations.find(
      registration =>
        Number(registration.registrationId) ===
        Number(this.selectedRegistrationId)
    ) ?? null;
  }

  onRegistrationChange(): void {
    this.paymentAmount = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelPayment(): void {
    this.router.navigate(['/main/student-payments']);
  }

  savePayment(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const registration = this.selectedRegistration;
    const amount = Number(this.paymentAmount);

    if (!registration) {
      this.errorMessage = 'Please select a course registration.';
      return;
    }

    if (!registration.feeLoaded || registration.feeError) {
      this.errorMessage =
        'Course fee could not be loaded. Please reload and try again.';
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      this.errorMessage = 'Enter a valid payment amount.';
      return;
    }

    if (registration.fullyPaid || registration.remainingBalance <= 0) {
      this.errorMessage = 'This course is already fully paid.';
      return;
    }

    if (amount > registration.remainingBalance) {
      this.errorMessage =
        'Payment cannot exceed the remaining balance.';
      return;
    }

    const request: StudentPaymentRequest = {
      registrationId: registration.registrationId,
      paymentDate: this.paymentDate,
      paymentAmount: amount,
      paymentMode: this.paymentMode,
      paymentDescription: this.paymentDescription
    };

    this.savingPayment = true;

    this.paymentService.createPayment(request).subscribe({
      next: () => {
        this.savingPayment = false;

        this.router.navigate(['/main/student-payments'], {
          state: {
            paymentSuccess: true,
            message: 'Payment received successfully!'
          }
        });
      },
      error: error => {
        console.error('Unable to save payment:', error);
        this.savingPayment = false;
        this.errorMessage =
          error?.error?.message ||
          'Unable to save payment. Please check the details and try again.';
      }
    });
  }

  private getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
