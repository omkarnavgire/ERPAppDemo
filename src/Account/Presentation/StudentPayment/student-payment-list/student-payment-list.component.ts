
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StudentPayment } from '../../../Domain/Entities/StudentPayment';
import { StudentPaymentService } from '../../../Application/StudentPayment/StudentPaymentService';
import { CreatePaymentComponent } from '../create-payment/create-payment';
import { RouterModule } from '@angular/router';

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

    this.paymentService.getAllPayments().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
              ? response.result
              : [];

        this.payments = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Unable to load payments:', error);

        this.errorMessage =
          'Unable to load payments. Please try again.';

        this.loading = false;
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

  // View Payment Receipt
  viewPayment(payment: StudentPayment): void {
    this.receiptLoading = true;

    this.paymentService.getPaymentById(payment.paymentId).subscribe({
      next: (response: any) => {
        const details =
          response?.data ??
          response?.result ??
          response;

        this.selectedPayment = {
          ...payment,
          ...(details && typeof details === 'object' ? details : {})
        };

        this.receiptLoading = false;
      },
      error: (error) => {
        console.error('Unable to load payment details:', error);

        this.selectedPayment = payment;
        this.receiptLoading = false;
      }
    });
  }

  // Close Receipt
  closeReceipt(): void {
    this.selectedPayment = null;
    this.receiptLoading = false;
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

  // Download Receipt PDF
  async downloadReceiptPdf(): Promise<void> {
    const payment = this.selectedPayment;

    if (!payment) {
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const rows: string[][] = [
        ['Receipt Number', String(payment.paymentId)],
        [
          'Student Name',
          `${payment.studentName || ''} ${payment.lastName || ''}`.trim() || 'N/A'
        ],
        ['Email', payment.emailAddress || 'N/A'],
        [
          'Registration',
          String(payment.registrationCode || payment.registrationId || 'N/A')
        ],
        ['Branch', payment.branchName || 'N/A'],
        ['Course', payment.courseName || 'N/A'],
        ['Course Fees', this.formatRupees(payment.courseFees)],
        ['Discount', this.formatRupees(payment.discount)],
        [
          'Final Fees',
          this.formatRupees(this.getReceiptFinalFees(payment))
        ],
        ['Payment Date', this.formatDate(payment.paymentDate)],
        ['Payment Mode', payment.paymentMode || 'N/A'],
        ['Description', payment.paymentDescription || 'N/A'],
        ['This Payment', this.formatRupees(payment.paymentAmount)],
        [
          'Total Paid',
          this.formatRupees(this.getReceiptTotalPaid(payment))
        ],
        [
          'Remaining Balance',
          this.formatRupees(this.getReceiptBalance(payment))
        ]
      ];

      doc.setFontSize(18);
      doc.text('CIIT Stack Lab', 14, 20);

      doc.setFontSize(14);
      doc.text('Student Payment Receipt', 14, 30);

      doc.setFontSize(10);

      let y = 43;

      for (const [label, value] of rows) {
        const valueLines: string[] = doc.splitTextToSize(value, 115);
        const rowHeight = Math.max(8, valueLines.length * 5);

        if (y + rowHeight > 280) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 14, y);

        doc.setFont('helvetica', 'normal');
        doc.text(valueLines, 75, y);

        y += rowHeight;
      }

      doc.save(`Payment-Receipt-${payment.paymentId}.pdf`);
    } catch (error) {
      console.error('Unable to generate receipt PDF:', error);

      this.errorMessage =
        'Unable to generate PDF. Check whether jspdf is installed.';
    }
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
