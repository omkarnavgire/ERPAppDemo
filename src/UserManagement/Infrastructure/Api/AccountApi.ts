import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ChangePasswordRequest } from "../../Domain/Entities/Account/ChangePasswordrequest";
import { ForgotPasswordRequest } from "../../Domain/Entities/Account/ForgotPasswordRequest";
import { ResetPasswordRequest } from "../../Domain/Entities/Account/ResetPasswordRequest";

@Injectable({
    providedIn: 'root'
})
export class AccountApi {
    
    private baseurl = 'https://superuser.ciitstudent.com/api/account';

    constructor(private http: HttpClient) {}

    changePassword(request: ChangePasswordRequest): Observable<any> {
        return this.http.post(`${this.baseurl}/change-password`, request);
    }

    forgotPassword(request: ForgotPasswordRequest): Observable<any> {
        return this.http.post(`${this.baseurl}/forgot-password`, request);
    }

    resetPassword(request: ResetPasswordRequest): Observable<any> {
        return this.http.post(`${this.baseurl}/reset-password`, request);
    }
}
