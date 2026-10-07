import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AccountRepository } from "../../Domain/Repositories/Accountrepositories";
import { AccountApi } from "../Api/AccountApi";
import { ChangePasswordRequest } from "../../Domain/Entities/Account/ChangePasswordrequest";
import { ForgotPasswordRequest } from "../../Domain/Entities/Account/ForgotPasswordRequest";
import { ResetPasswordRequest } from "../../Domain/Entities/Account/ResetPasswordRequest";

@Injectable({
    providedIn: 'root'
})
export class AccountRepositoryImpl extends AccountRepository {
    constructor(private accountapi: AccountApi) {
        super();
    }

    override changePassword(request: ChangePasswordRequest): Observable<any> {
        return this.accountapi.changePassword(request);
    }

    override forgotPassword(request: ForgotPasswordRequest): Observable<any> {
        return this.accountapi.forgotPassword(request);
    }

    override resetPassword(request: ResetPasswordRequest): Observable<any> {
        return this.accountapi.resetPassword(request);
    }
}
