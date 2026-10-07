export interface UserProfile {
    userId?: string;
    employeeId?: number;
    employeeCode?: string;
    employeeName?: string;
    username?: string;
    emailAddress?: string;
    mobileNumber?: string;
    profilePhoto?: string;
    birthDate?: string|null;
    joiningDate?: string|null;
    salary?: number|null;
    qualification?: string|null;
    gender?: string|null;
    panNumber?: string|null;
    aadharCardNumber?: string|null;
    branchId?: number;
    branchName?: string;
    localAddress?: string|null;
    isActive?: boolean;
    roles?: string[];
}