
export interface StudentPayment {
  paymentId: number;
  paymentDate: string | Date;
  paymentAmount: number;
  paymentMode: string;
  paymentDescription: string;

  isPaid?: number | boolean;

  registrationId: number;
  registrationCode?: string;

  studentId?: number;
  studentName?: string;
  lastName?: string;
  emailAddress?: string;
  mobileNumber?: string;

  courseId?: number;
  courseName?: string;
  courseFees?: number;
  discount?: number;
  finalFees?: number;
  totalPaid?: number;
  remainingBalance?: number;

  branchId?: number;
  branchName?: string;
}
