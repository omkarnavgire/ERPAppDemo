import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AccountRepository } from "../../Domain/Repositories/Accountrepositories";
import { ForgotPasswordRequest } from "../../Domain/Entities/Account/ForgotPasswordRequest";

@Injectable({
    providedIn: 'root'
})
export class ForgotPassword {
    constructor(private accountRepository: AccountRepository) {}

    execute(request: ForgotPasswordRequest): Observable<any> {
        return this.accountRepository.forgotPassword(request);
    }
}
