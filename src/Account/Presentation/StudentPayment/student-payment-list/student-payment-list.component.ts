
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StudentPayment } from '../../../Domain/Entities/StudentPayment';
import { StudentPaymentService } from '../../../Application/StudentPayment/StudentPaymentService';
import { CreatePaymentComponent } from '../create-payment/create-payment';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { catchError, finalize, of, timeout } from 'rxjs';

@Component({
  selector: 'app-student-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule],
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

  // Highlight the newly created payment until the user performs another action.
  highlightedPaymentId: number | null = null;
  private paymentIdsBeforeSave = new Set<number>();
  private detectNewPaymentAfterSave = false;

  selectedPayment: StudentPayment | null = null;
  receiptLoading = false;
  downloadingReceipt = false;
  receiptPdfUrl = '';
  receiptSafeUrl: SafeResourceUrl | null = null;
  private receiptObjectUrl = '';
  showStudentReceipts = false;
  receiptCourses: Array<{ courseId: number; courseName: string; payments: StudentPayment[] }> = [];
  selectedReceiptCourse: { courseId: number; courseName: string; payments: StudentPayment[] } | null = null;
  receiptListStudent: StudentPayment | null = null;


/**
 * Displays one row per student while retaining
 * every payment record in the original payments array.
 */
get uniqueStudents(): Array<StudentPayment & { totalPaidForList: number }> {
  const uniqueMap = new Map<
    string,
    StudentPayment & { totalPaidForList: number }
  >();

  for (const payment of this.filteredPayments) {
    const studentId = Number(payment.studentId || 0);
    const registrationId = Number(payment.registrationId || 0);

    // Prefer Student ID. Use Registration ID only when Student ID is missing.
    const key = studentId > 0
      ? `student:${studentId}`
      : registrationId > 0
        ? `registration:${registrationId}`
        : `payment:${payment.paymentId}`;

    // Keep only one row for each student.
    if (uniqueMap.has(key)) {
      continue;
    }

    // Calculate total received from all payment records for this student.
    const totalPaidForList = this.payments.reduce((total, item) => {
      const itemStudentId = Number(item.studentId || 0);
      const itemRegistrationId = Number(item.registrationId || 0);

      const matchesStudent = studentId > 0
        ? itemStudentId === studentId
        : registrationId > 0
          ? itemStudentId <= 0 &&
            itemRegistrationId === registrationId
          : item.paymentId === payment.paymentId;

      return matchesStudent
        ? total + this.toNumber(item.paymentAmount)
        : total;
    }, 0);

    uniqueMap.set(key, {
      ...payment,
      totalPaidForList
    });
  }

  return Array.from(uniqueMap.values());
}


  // Create Payment Modal
  showCreatePayment = false;

  constructor(
    private readonly paymentService: StudentPaymentService,
    private readonly sanitizer: DomSanitizer
  ) { }

  private readonly paymentsCacheKey = 'ciit-account-student-payments-v1';

  ngOnInit(): void {
    // Show previously loaded payments immediately while the API refreshes.
    try {
      const cached = localStorage.getItem(this.paymentsCacheKey);
      if (cached) {
        const rows = JSON.parse(cached);
        if (Array.isArray(rows)) {
          this.payments = rows.map((item: any) => this.normalizePayment(item));
          this.sortPaymentsLatestFirst();
          this.applyFilters();
        }
      }
    } catch {
      // Ignore invalid/stale cache and fetch fresh data.
    }
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

  private sortPaymentsLatestFirst(): void {
    this.payments = [...this.payments].sort((a, b) => {
      const dateA = new Date(a.paymentDate).getTime() || 0;
      const dateB = new Date(b.paymentDate).getTime() || 0;

      if (dateA !== dateB) {
        return dateB - dateA;
      }

      // Payment IDs break ties when several payments share the same date.
      return Number(b.paymentId || 0) - Number(a.paymentId || 0);
    });
  }

  // Called after payment is successfully saved from the create-payment modal.
  onPaymentSaved(): void {
    this.showCreatePayment = false;

    // Capture existing IDs so the refreshed response can identify the new record.
    this.paymentIdsBeforeSave = new Set(
      this.payments.map(payment => Number(payment.paymentId || 0))
        .filter(id => id > 0)
    );

    this.detectNewPaymentAfterSave = true;
    this.loadPayments();
  }

  private identifyNewPayment(): void {
    if (!this.detectNewPaymentAfterSave) {
      return;
    }

    const newPayments = this.payments
      .filter(payment => {
        const id = Number(payment.paymentId || 0);
        return id > 0 && !this.paymentIdsBeforeSave.has(id);
      })
      .sort((a, b) => {
        const dateA = new Date(a.paymentDate).getTime() || 0;
        const dateB = new Date(b.paymentDate).getTime() || 0;

        if (dateA !== dateB) {
          return dateB - dateA;
        }

        return Number(b.paymentId || 0) - Number(a.paymentId || 0);
      });

    if (newPayments.length > 0) {
      this.highlightedPaymentId = Number(newPayments[0].paymentId);
    }

    this.detectNewPaymentAfterSave = false;
    this.paymentIdsBeforeSave.clear();
  }

  isHighlightedPayment(payment: StudentPayment): boolean {
    return this.highlightedPaymentId !== null &&
      Number(payment.paymentId) === this.highlightedPaymentId;
  }

  // Call this from the list template when the user performs another action.
  clearNewPaymentHighlight(): void {
    this.highlightedPaymentId = null;
  }

  // Load All Payments
  loadPayments(): void {
    this.loading = this.payments.length === 0;
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
          // Keep cached rows visible when a background refresh fails.
          if (!this.payments.length) this.filteredPayments = [];
          return;
        }
        const data = Array.isArray(response) ? response
          : Array.isArray(response?.data) ? response.data
            : Array.isArray(response?.result) ? response.result
              : Array.isArray(response?.$values) ? response.$values
                : Array.isArray(response?.data?.$values) ? response.data.$values
                  : [];

        this.payments = data.map((item: any) => this.normalizePayment(item));
        this.sortPaymentsLatestFirst();
        this.identifyNewPayment();

        try {
          localStorage.setItem(this.paymentsCacheKey, JSON.stringify(this.payments));
        } catch {
          // Cache failure must not block the payment list.
        }
        this.applyFilters();
      },
      error: (error) => {
        // catchError normally handles this; retained as a final safeguard.
        console.error('Unexpected payment-list error:', error);
        this.errorMessage = 'Unable to load payments. Please try again.';
        if (!this.payments.length) this.filteredPayments = [];
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
    this.clearNewPaymentHighlight();
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

  // Download a specific receipt directly from the backend API.
downloadPaymentReceipt(receipt: StudentPayment): void {
  if (this.downloadingReceipt) {
    return;
  }

  const registrationId = Number(receipt.registrationId);
  const paymentId = Number(receipt.paymentId);

  if (registrationId <= 0 || paymentId <= 0) {
    this.errorMessage =
      'Unable to download receipt: registration or payment ID is missing.';
    return;
  }

  this.downloadingReceipt = true;
  this.errorMessage = '';

  this.paymentService
    .downloadInvoice(registrationId, paymentId)
    .pipe(
      timeout(20000),
      finalize(() => this.downloadingReceipt = false)
    )
    .subscribe({
      next: (pdfBlob: Blob) => {
        if (!pdfBlob || pdfBlob.size === 0) {
          this.errorMessage = 'The backend returned an empty PDF.';
          return;
        }

        const blobUrl = URL.createObjectURL(
          new Blob([pdfBlob], { type: 'application/pdf' })
        );

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = `Payment-Receipt-${paymentId}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      },
      error: (error) => {
        console.error('Receipt download failed:', error);
        this.errorMessage =
          'Unable to download receipt. Please try again.';
      }
    });
}

  // Load the exact backend-generated PDF used by the Download action.
  viewPayment(payment: StudentPayment): void {
    if (this.receiptLoading) return;
    const registrationId = Number(payment.registrationId || 0);
    const paymentId = Number(payment.paymentId || 0);
    if (!registrationId || !paymentId) {
      this.errorMessage = 'Cannot view receipt: registration ID or payment ID is missing.';
      return;
    }

    this.errorMessage = '';
    this.receiptLoading = true;
    this.paymentService.downloadInvoice(registrationId, paymentId).pipe(
      timeout(20000),
      finalize(() => this.receiptLoading = false)
    ).subscribe({
      next: blob => {
        if (!(blob instanceof Blob) || blob.size === 0) {
          this.errorMessage = 'The backend returned an empty receipt file.';
          return;
        }
        this.releaseReceiptUrl();
        this.receiptObjectUrl = URL.createObjectURL(blob);
        this.receiptPdfUrl = this.receiptObjectUrl;
        this.receiptSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.receiptObjectUrl);
        this.selectedPayment = this.normalizePayment(payment);
      },
      error: error => {
        console.error('Unable to load backend receipt PDF:', error);
        this.errorMessage = error?.name === 'TimeoutError'
          ? 'Loading the receipt took too long. Please try again.'
          : error?.status === 404
            ? 'The backend receipt endpoint was not found. Please verify the invoice/download route.'
            : 'Unable to display the backend receipt. Please try again.';
      }
    });
  }

  // Release the object URL when the receipt viewer is closed or replaced.
  private releaseReceiptUrl(): void {
    if (this.receiptObjectUrl) URL.revokeObjectURL(this.receiptObjectUrl);
    this.receiptObjectUrl = '';
    this.receiptPdfUrl = '';
    this.receiptSafeUrl = null;
  }

  closeReceipt(): void {
    this.selectedPayment = null;
    this.receiptLoading = false;
    this.downloadingReceipt = false;
    this.releaseReceiptUrl();
  }

  // Open the same backend PDF in the browser PDF viewer so its own Print control prints the real receipt.
  printReceipt(): void {
    if (!this.receiptPdfUrl) return;
    const printWindow = window.open(this.receiptPdfUrl, '_blank');
    if (!printWindow) {
      this.errorMessage = 'Your browser blocked the receipt window. Allow pop-ups or download the PDF and print it.';
    }
  }

// Download the receipt PDF directly from the backend API.
downloadReceiptPdf(): void {
  const payment = this.selectedPayment;

  if (!payment || this.downloadingReceipt) {
    return;
  }

  const registrationId = Number(payment.registrationId);
  const paymentId = Number(payment.paymentId);

  if (
    !Number.isFinite(registrationId) || registrationId <= 0 ||
    !Number.isFinite(paymentId) || paymentId <= 0
  ) {
    console.error('Registration ID or Payment ID is missing.');
    return;
  }

  this.downloadingReceipt = true;

  this.paymentService
    .downloadInvoice(registrationId, paymentId)
    .subscribe({
      next: (pdfBlob: Blob) => {
        if (!pdfBlob || pdfBlob.size === 0) {
          console.error('The backend returned an empty PDF.');
          this.downloadingReceipt = false;
          return;
        }

        const blobUrl = URL.createObjectURL(
          new Blob([pdfBlob], { type: 'application/pdf' })
        );

        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = `Payment-Receipt-${paymentId}.pdf`;
        anchor.style.display = 'none';

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        this.downloadingReceipt = false;
      },
      error: (error) => {
        console.error('Backend receipt download failed:', error);
        this.downloadingReceipt = false;
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
