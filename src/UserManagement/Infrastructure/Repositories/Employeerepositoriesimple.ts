import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { EmployeeRepository } from "../../Domain/Repositories/Employeerepositories";
import { EmployeeApi } from "../Api/EmployeeAPi";
import { RegisterEmployeeRequest } from "../../Domain/Entities/Employee";

@Injectable({
    providedIn:"root"
})
export class EmployeeRepositoryImpl extends EmployeeRepository {
    constructor(
        private employeeApi:EmployeeApi
    ){
        super();
    }

    override registerEmployee(
        request:RegisterEmployeeRequest
    ):Observable<any>{
        return this.employeeApi.registerEmployee(request);
    }
}