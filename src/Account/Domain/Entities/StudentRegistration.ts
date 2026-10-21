
export interface StudentRegistration {
  registrationId: number;
  studentId: number;
  courseId: number;

  studentName?: string;
  lastName?: string;
  registrationCode?: string;
  courseName?: string;
  paymentAmount?: number;
  currentStatus?: string;
}
