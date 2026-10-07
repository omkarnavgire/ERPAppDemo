export interface User {
    id?:string|number;
    employeeCode?:string;
    userName?:string;
    employeeName?:string;
    emailAddress?:string;
    mobileNumber?:string;
    branchId?:number;
    branchName?:string;
    roleName?:string;
    role?:string;
    roles?:string[];
    isActive?:boolean;
}