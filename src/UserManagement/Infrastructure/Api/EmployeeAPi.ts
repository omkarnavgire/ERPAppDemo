import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { RegisterEmployeeRequest } from "../../Domain/Entities/Employee";

@Injectable({
    providedIn:"root"
})
export class EmployeeApi {
    private baseUrl="https://superuser.ciitstudent.com/api/Auth/register-employee";

    constructor(private http:HttpClient){}

    registerEmployee(
        request:RegisterEmployeeRequest
    ):Observable<any>{
        console.log("Register employee API request:",request);
        return this.http.post<any>(
            this.baseUrl,
            request
        );
    }
}