
export interface StudentRegistrationRequest {
    branchId: number;
    registrationDate: string;
    studentName: string;
    lastName: string;
    gender: string;
    birthDate: string;
    emailAddress: string;
    mobileNumber: string;
    whatsappNumber: string;
    parentName: string;
    parentNumber: string;
    aadharCardNumber: string;
    aadharCardPhoto: string;
    localAddress: string;
    permanentAddress: string;
    qualification: string;
    university: string;
    passingYear: number;
    medium: string;
    percentage: number;
    discount: number;
    currentStatus: string;
    courseId: number;
    leadId?: number | null;
    paymentDate: string;
    paymentAmount: number;
    paymentMode: string;
    paymentDescription: string;
}
