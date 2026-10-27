import { Component, EventEmitter, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, timeout, finalize } from 'rxjs/operators';

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
    private router: Router,
    private cdr: ChangeDetectorRef
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
  loadingSelectedFee = false;
  savingPayment = false;

  paymentDate = this.getTodayDate();
  paymentAmount: number | null = null;
  paymentMode = 'Cash';
  paymentDescription = '';

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    console.info('[CreatePayment][CP-01] Component initialized', {
      loadingStudents: this.loadingStudents,
      route: this.router.url
    });
    this.loadStudentsAndPayments();
  }

  private getArray(response: any): any[] {
    if (Array.isArray(response)) return response;

    const candidates = [
      response?.data,
      response?.result,
      response?.items,
      response?.registrations,
      response?.$values,
      response?.data?.$values,
      response?.result?.$values,
      response?.items?.$values
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }

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
    if (this.loadingStudents) return;

    this.loadingStudents = true;
    this.errorMessage = '';
    console.info('[CreatePayment][CP-02] Registration request started', {
      loadingStudents: this.loadingStudents
    });

    // Load registrations first so fee APIs do not block the student dropdown.
    this.registrationApi.getRegistrations().pipe(
      timeout(20000)
    ).subscribe({
      next: registrations => {
        console.info('[CreatePayment][CP-03] Registration API responded', {
          responseType: typeof registrations,
          isArray: Array.isArray(registrations),
          responseKeys: registrations && typeof registrations === 'object' ? Object.keys(registrations) : []
        });
        const rows = this.getArray(registrations);
        console.info('[CreatePayment][CP-04] Registration rows extracted', {
          rowCount: rows.length,
          firstRowKeys: rows[0] ? Object.keys(rows[0]) : []
        });
        const studentMap = new Map<number, any>();

        for (const item of rows) {
          const studentId = this.toNumber(
            this.getValue(item, 'student_Id', 'studentId', 'StudentId')
          );

          const registrationId = this.toNumber(
            this.getValue(item, 'registration_Id', 'registrationId', 'RegistrationId')
          );

          const courseId = this.toNumber(
            this.getValue(item, 'course_Id', 'courseId', 'CourseId')
          );

          if (!studentId) continue;

          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              studentId,
              studentName: this.getValue(
                item, 'student_Name', 'studentName', 'StudentName'
              ) ?? '',
              lastName: this.getValue(
                item, 'last_Name', 'lastName', 'LastName'
              ) ?? '',
              mobileNumber: String(
                this.getValue(
                  item, 'mobile_Number', 'mobileNumber', 'MobileNumber'
                ) ?? ''
              ),
              emailAddress: String(
                this.getValue(
                  item, 'email_Address', 'emailAddress', 'EmailAddress'
                ) ?? ''
              ),
              registrations: []
            });
          }

          if (!registrationId || !courseId) continue;

          studentMap.get(studentId).registrations.push({
            ...item,
            registrationId,
            studentId,
            courseId,
            registrationCode: this.getValue(
              item, 'registration_Code', 'registrationCode', 'RegistrationCode'
            ) ?? '',
            courseName: this.getValue(
              item, 'course_Name', 'courseName', 'CourseName'
            ) ?? '',
            courseFees: this.toNumber(
              this.getValue(
                item,
                'course_Fees',
                'courseFees',
                'actualFees',
                'CourseFees',
                'ActualFees'
              )
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

        console.info('[CreatePayment][CP-05] Student mapping completed', {
          registrationRows: rows.length,
          mappedStudents: this.students.length,
          studentsWithRegistrations: this.students.filter(student => student.registrations?.length > 0).length,
          firstStudent: this.students[0] ?? null
        });

        // Student dropdown must not wait for payment history or fee requests.
        this.loadingStudents = false;
        this.cdr.detectChanges();

        console.info('[CreatePayment][CP-06] Student loading flag cleared', {
          loadingStudents: this.loadingStudents,
          studentCount: this.students.length,
          filteredStudentCount: this.filteredStudents.length
        });

        if (!this.students.length) {
          this.errorMessage = rows.length
            ? 'Registrations loaded, but no usable student IDs were found.'
            : 'No student registrations were returned. Use Reload to try again.';
        }

        this.refreshRegistrationBalances();
        console.info('[CreatePayment][CP-07] Initial balances calculated', {
          registrationCount: this.students.reduce((count, student) => count + (student.registrations?.length ?? 0), 0)
        });

        // Payment history loads separately and cannot block the dropdown.
        console.info('[CreatePayment][CP-08] Payment history request started');
        this.paymentService.getAllPayments().pipe(
          timeout(20000),
          catchError(error => {
            console.warn(
              'Payment history unavailable; student list remains available:',
              error
            );
            return of([]);
          })
        ).subscribe(payments => {
          this.allPayments = this.getArray(payments);
          this.refreshRegistrationBalances();
          console.info('[CreatePayment][CP-09] Payment history processed', {
            paymentCount: this.allPayments.length,
            loadingStudents: this.loadingStudents
          });
        });
      },
      error: error => {
        console.error('[CreatePayment][CP-ERR-01] Registration request failed', error);
        this.errorMessage = 'Unable to load students. Please try again.';
        this.loadingStudents = false;
        console.info('[CreatePayment][CP-10] Loading cleared after registration error', {
          loadingStudents: this.loadingStudents
        });
      }
    });
  }

  private refreshRegistrationBalances(): void {
    for (const student of this.students) {
      for (const registration of student.registrations ?? []) {
        const registrationPayments = this.allPayments.filter(payment =>
          this.toNumber(
            this.getValue(
              payment,
              'registrationId',
              'registration_Id',
              'RegistrationId'
            )
          ) === this.toNumber(registration.registrationId) &&
          this.getValue(payment, 'isPaid', 'IsPaid') !== false &&
          this.getValue(payment, 'isPaid', 'IsPaid') !== 0
        );

        registration.totalPaid = registrationPayments.reduce(
          (total: number, payment: any) =>
            total + this.toNumber(
              this.getValue(
                payment,
                'paymentAmount',
                'payment_Amount',
                'PaymentAmount'
              )
            ),
          0
        );

        if (registration.courseFees > 0) {
          registration.finalFees = Math.max(
            registration.courseFees - this.toNumber(registration.discount),
            0
          );

          registration.remainingBalance = Math.max(
            registration.finalFees - registration.totalPaid,
            0
          );

          registration.feeLoaded = true;
          registration.feeError = false;
          registration.fullyPaid = registration.remainingBalance <= 0;
        }
      }
    }
  }

  retryLoad(): void {
    if (!this.loadingStudents) {
      this.loadStudentsAndPayments();
    }
  }

  toggleStudentDropdown(): void {
    console.info('[CreatePayment][CP-11] Student dropdown clicked', {
      loadingStudents: this.loadingStudents,
      students: this.students.length,
      filteredStudents: this.filteredStudents.length
    });
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
    console.info('[CreatePayment][CP-12] Student selected', {
      studentId: student?.studentId,
      registrationCount: student?.registrations?.length ?? 0
    });
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
    console.info('[CreatePayment][CP-13] Registration/course changed', {
      selectedRegistrationId: this.selectedRegistrationId
    });
    this.paymentAmount = null;
    this.errorMessage = '';
    this.successMessage = '';

    const registration = this.selectedRegistration;

    if (
      !registration ||
      registration.feeLoaded ||
      this.loadingSelectedFee
    ) {
      return;
    }

    registration.feeError = false;
    this.loadingSelectedFee = true;

    this.registrationApi.getCourseFees(
      registration.courseId,
      registration.discount
    ).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Unable to load selected course fee:', error);
        registration.feeError = true;
        this.errorMessage =
          'Unable to load fees for this course. Please try selecting the course again.';
        return of(null);
      }),
      finalize(() => this.loadingSelectedFee = false)
    ).subscribe(response => {
      if (!response) return;

      const feeData: any = (response as any)?.data ?? response;

      registration.courseFees = this.toNumber(
        feeData.actualFees ??
        feeData.courseFees ??
        feeData.course_Fees ??
        feeData.ActualFees ??
        feeData.CourseFees
      );

      registration.discount = this.toNumber(
        feeData.discount ??
        feeData.Discount ??
        registration.discount
      );

      registration.finalFees = this.toNumber(
        feeData.finalFees ??
        feeData.FinalFees ??
        Math.max(registration.courseFees - registration.discount, 0)
      );

      registration.remainingBalance = Math.max(
        registration.finalFees - registration.totalPaid,
        0
      );

      registration.feeLoaded = true;
      registration.feeError = false;
      registration.fullyPaid = registration.remainingBalance <= 0;

      if (registration.fullyPaid) {
        this.errorMessage = 'This course is already fully paid.';
      }
    });
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

    this.paymentService.createPayment(request).pipe(
      finalize(() => this.savingPayment = false)
    ).subscribe({
      next: () => {
        this.router.navigate(['/main/student-payments'], {
          state: {
            paymentSuccess: true,
            message: 'Payment received successfully!'
          }
        });
      },
      error: error => {
        console.error('Unable to save payment:', error);
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