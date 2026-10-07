import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EmployeeRepository } from "../../Domain/Repositories/Employeerepositories";
import { RegisterEmployeeRequest } from "../../Domain/Entities/Employee";

@Injectable({
    providedIn:"root"
})
export class RegisterEmployee {
    constructor(
        private employeeRepository:EmployeeRepository
    ){}

    execute(
        request:RegisterEmployeeRequest
    ):Observable<any>{
        console.log("RegisterEmployee use case:",request);
        return this.employeeRepository.registerEmployee(request);
    }
}