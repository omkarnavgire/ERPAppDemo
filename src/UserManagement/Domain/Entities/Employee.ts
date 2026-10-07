export interface RegisterEmployeeRequest {
    employeeName:string;
    emailAddress:string;
    mobileNumber:string;
    branchId:number;
}

export interface Employee {
    employeeName:string;
    emailAddress:string;
    mobileNumber:string;
    branchId:number;
    role:string;
}

export interface EmployeeBranchOption {
    branchId:number;
    branchName:string;
}