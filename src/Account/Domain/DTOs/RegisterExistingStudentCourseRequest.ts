export interface RegisterExistingStudentCourseRequest {
    studentId: number;
    courseId: number;
    discount: number;
    paymentAmount: number;
    paymentDate: string;
    paymentMode: string;
    paymentDescription: string;
    leadId: number;
}
