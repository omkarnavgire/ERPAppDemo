
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StudentPayment } from '../../../Domain/Entities/StudentPayment';
import { StudentPaymentService } from '../../../Application/StudentPayment/StudentPaymentService';
import { CreatePaymentComponent } from '../create-payment/create-payment';
import { RouterModule } from '@angular/router';
import { catchError, finalize, of, timeout } from 'rxjs';

@Component({
  selector: 'app-student-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule ],
  templateUrl: './student-payment-list.component.html',
  styleUrls: ['./student-payment-list.component.css']
})
export class StudentPaymentListComponent implements OnInit {

  payments: StudentPayment[] = [];
  filteredPayments: StudentPayment[] = [];

  searchText = '';
  fromDate = '';
  toDate = '';
  selectedPaymentMode = '';

  loading = false;
  errorMessage = '';

  selectedPayment: StudentPayment | null = null;
  receiptLoading = false;
  downloadingReceipt = false;
  showStudentReceipts = false;
  receiptCourses: Array<{ courseId: number; courseName: string; payments: StudentPayment[] }> = [];
  selectedReceiptCourse: { courseId: number; courseName: string; payments: StudentPayment[] } | null = null;
  receiptListStudent: StudentPayment | null = null;

  // Create Payment Modal
  showCreatePayment = false;

  constructor(
    private readonly paymentService: StudentPaymentService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  // Open Create Payment Modal
  openCreatePayment(): void {
    this.showCreatePayment = true;
    this.errorMessage = '';
  }

  // Close Create Payment Modal
  closeCreatePayment(): void {
    this.showCreatePayment = false;
  }

  // Called after payment is successfully saved
  onPaymentSaved(): void {
    this.showCreatePayment = false;
    this.loadPayments();
  }

  // Load All Payments
  loadPayments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.paymentService.getAllPayments().pipe(
      timeout(20000),
      catchError(error => {
        console.error('Unable to load payments:', error);
        this.errorMessage = error?.name === 'TimeoutError'
          ? 'Loading payments took too long. Please retry.'
          : 'Unable to load payments. Please try again.';
        return of(null);
      }),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        if (response === null) {
          this.payments = [];
          this.filteredPayments = [];
          return;
        }
        const data = Array.isArray(response) ? response
          : Array.isArray(response?.data) ? response.data
          : Array.isArray(response?.result) ? response.result
          : Array.isArray(response?.$values) ? response.$values
          : Array.isArray(response?.data?.$values) ? response.data.$values
          : [];

        this.payments = data.map((item: any) => this.normalizePayment(item));
        this.applyFilters();
      },
      error: (error) => {
        // catchError normally handles this; retained as a final safeguard.
        console.error('Unexpected payment-list error:', error);
        this.errorMessage = 'Unable to load payments. Please try again.';
        this.payments = [];
        this.filteredPayments = [];
      }
    });
  }

  // Apply Search, Date and Payment Mode Filters
  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredPayments = this.payments.filter(payment => {
      const matchesSearch =
        !search ||
        String(payment.paymentId ?? '').toLowerCase().includes(search) ||
        String(payment.registrationId ?? '').toLowerCase().includes(search) ||
        String(payment.registrationCode ?? '').toLowerCase().includes(search) ||
        String(payment.studentName ?? '').toLowerCase().includes(search) ||
        String(payment.lastName ?? '').toLowerCase().includes(search) ||
        String(payment.courseName ?? '').toLowerCase().includes(search);

      const paymentDate = this.toDateKey(payment.paymentDate);

      const matchesFromDate =
        !this.fromDate ||
        (!!paymentDate && paymentDate >= this.fromDate);

      const matchesToDate =
        !this.toDate ||
        (!!paymentDate && paymentDate <= this.toDate);

      const matchesMode =
        !this.selectedPaymentMode ||
        payment.paymentMode === this.selectedPaymentMode;

      return (
        matchesSearch &&
        matchesFromDate &&
        matchesToDate &&
        matchesMode
      );
    });
  }

  private toDateKey(
    value: string | Date | null | undefined
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Clear Filters
  clearFilters(): void {
    this.searchText = '';
    this.fromDate = '';
    this.toDate = '';
    this.selectedPaymentMode = '';

    this.applyFilters();
  }

  // Total Amount of Filtered Payments
  get totalAmount(): number {
    return this.filteredPayments.reduce(
      (total, payment) =>
        total + this.toNumber(payment.paymentAmount),
      0
    );
  }

  // Open all receipts for the selected student's course(s).
  openStudentReceipts(payment: StudentPayment): void {
    const studentId = Number(payment.studentId || 0);
    const studentPayments = this.payments.filter(item => {
      if (studentId > 0) return Number(item.studentId || 0) === studentId;
      return Number(item.registrationId) === Number(payment.registrationId);
    });
    const byCourse = new Map<string, { courseId: number; courseName: string; payments: StudentPayment[] }>();

    for (const item of studentPayments) {
      const courseId = Number(item.courseId || 0);
      const courseName = String(item.courseName || 'Course not specified');
      const key = courseId > 0 ? `id:${courseId}` : `name:${courseName.toLowerCase()}`;
      if (!byCourse.has(key)) byCourse.set(key, { courseId, courseName, payments: [] });
      byCourse.get(key)!.payments.push(item);
    }

    this.receiptCourses = Array.from(byCourse.values()).map(course => ({
      ...course,
      payments: [...course.payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    }));
    this.receiptListStudent = payment;
    this.showStudentReceipts = true;
    this.selectedReceiptCourse = this.receiptCourses.length === 1 ? this.receiptCourses[0] : null;
    this.errorMessage = '';
  }

  selectReceiptCourse(course: { courseId: number; courseName: string; payments: StudentPayment[] }): void {
    this.selectedReceiptCourse = course;
  }

  closeStudentReceipts(): void {
    this.showStudentReceipts = false;
    this.receiptCourses = [];
    this.selectedReceiptCourse = null;
    this.receiptListStudent = null;
  }

  // Open one selected payment receipt from the student's course receipt list.
  viewPayment(payment: StudentPayment): void {
    if (this.receiptLoading) return;
    this.errorMessage = '';
    this.receiptLoading = true;

    this.paymentService.getPaymentById(payment.paymentId).pipe(
      timeout(15000),
      finalize(() => this.receiptLoading = false)
    ).subscribe({
      next: (response: any) => {
        const details =
          response?.data ??
          response?.result ??
          response;

        this.selectedPayment = this.normalizePayment({
          ...payment,
          ...(details && typeof details === 'object' ? details : {})
        });

      },
      error: (error) => {
        console.error('Unable to load payment details:', error);
        this.selectedPayment = payment;
        this.errorMessage = error?.name === 'TimeoutError'
          ? 'Receipt details took too long to load. Showing available payment details.'
          : 'Could not load full receipt details. Showing available payment details.';
      }
    });
  }

  // Close Receipt
  closeReceipt(): void {
    this.selectedPayment = null;
    this.receiptLoading = false;
    this.downloadingReceipt = false;
  }

  // Calculate Final Fees
  getReceiptFinalFees(payment: StudentPayment): number {
    if (payment.finalFees != null) {
      return this.toNumber(payment.finalFees);
    }

    return Math.max(
      this.toNumber(payment.courseFees) -
      this.toNumber(payment.discount),
      0
    );
  }

  // Calculate Total Paid
  getReceiptTotalPaid(payment: StudentPayment): number {
    if (payment.totalPaid != null) {
      return this.toNumber(payment.totalPaid);
    }

    return this.toNumber(payment.paymentAmount);
  }

  // Calculate Remaining Balance
  getReceiptBalance(payment: StudentPayment): number {
    if (payment.remainingBalance != null) {
      return this.toNumber(payment.remainingBalance);
    }

    return Math.max(
      this.getReceiptFinalFees(payment) -
      this.getReceiptTotalPaid(payment),
      0
    );
  }

  // Print Receipt
  printReceipt(): void {
    if (!this.selectedPayment) {
      return;
    }

    window.print();
  }

  // Download the receipt PDF generated by the backend (same format as the supplied sample).
  downloadReceiptPdf(): void {
    const payment = this.selectedPayment;
    if (!payment || this.downloadingReceipt) return;

    const registrationId = Number(payment.registrationId || 0);
    const paymentId = Number(payment.paymentId || 0);
    if (!registrationId || !paymentId) {
      this.errorMessage = 'Cannot download receipt: registration ID or payment ID is missing.';
      return;
    }

    this.downloadingReceipt = true;
    this.paymentService.downloadInvoice(registrationId, paymentId).subscribe({
      next: blob => {
        this.downloadingReceipt = false;
        if (!(blob instanceof Blob) || blob.size === 0) {
          this.errorMessage = 'The backend returned an empty receipt file.';
          return;
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Payment-Receipt-${paymentId}.pdf`;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: error => {
        console.error('Unable to download backend receipt:', error);
        this.downloadingReceipt = false;
        this.errorMessage = error?.status === 404
          ? 'Receipt download endpoint was not found. Please verify the backend invoice/download route.'
          : 'Unable to download receipt from the backend. Please try again.';
      }
    });
  }

  private normalizePayment(item: any): StudentPayment {
    return {
      ...item,
      paymentId: Number(item?.paymentId ?? item?.payment_Id ?? item?.paymentID ?? 0),
      paymentDate: item?.paymentDate ?? item?.payment_Date ?? '',
      paymentAmount: Number(item?.paymentAmount ?? item?.payment_Amount ?? 0),
      paymentMode: item?.paymentMode ?? item?.payment_Mode ?? '',
      paymentDescription: item?.paymentDescription ?? item?.payment_Description ?? '',
      registrationId: Number(item?.registrationId ?? item?.registration_Id ?? 0),
      registrationCode: item?.registrationCode ?? item?.registration_Code ?? '',
      studentId: Number(item?.studentId ?? item?.student_Id ?? item?.studentID ?? 0) || undefined,
      studentName: item?.studentName ?? item?.student_Name ?? '',
      lastName: item?.lastName ?? item?.last_Name ?? '',
      emailAddress: item?.emailAddress ?? item?.email_Address ?? '',
      mobileNumber: item?.mobileNumber ?? item?.mobile_Number ?? '',
      courseId: Number(item?.courseId ?? item?.course_Id ?? 0) || undefined,
      courseName: item?.courseName ?? item?.course_Name ?? '',
      courseFees: Number(item?.courseFees ?? item?.course_Fees ?? item?.actualFees ?? 0),
      discount: Number(item?.discount ?? item?.Discount ?? 0),
      finalFees: item?.finalFees ?? item?.final_Fees,
      totalPaid: item?.totalPaid ?? item?.total_Paid,
      remainingBalance: item?.remainingBalance ?? item?.remaining_Balance,
      branchName: item?.branchName ?? item?.branch_Name ?? ''
    };
  }

  private toNumber(value: unknown): number {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  private formatRupees(value: unknown): string {
    return `Rs. ${this.toNumber(value).toFixed(2)}`;
  }

  private formatDate(
    value: string | Date | null | undefined
  ): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-IN');
  }
}
