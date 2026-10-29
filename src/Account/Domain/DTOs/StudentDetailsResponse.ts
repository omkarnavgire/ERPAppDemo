
export interface StudentDetailsResponse {
  statusCode: number;
  message: string;
  data: StudentDetailsDto[];
}

export interface StudentDetailsDto {
  studentId: number;
  studentName: string;
  parentName: string;
  lastName: string;
  gender: string;
  mobileNumber: string;
  emailAddress: string;
  birthDate: string | null;
  profilePhoto: string | null;
  qualification: string;
  parentNumber: string;
  branchId: number;
  branchName: string;
  branchCode: string;
  studentCode: string;
  whatsappNumber: string;
  localAddress: string;
  permanentAddress: string;
  permanentIdentificationNumber: string;
  aadharCardNumber: string;
  aadharCardPhoto: string | null;
}
