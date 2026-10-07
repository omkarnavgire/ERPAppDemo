import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AccountRepository } from "../../Domain/Repositories/Accountrepositories";
import { ResetPasswordRequest } from "../../Domain/Entities/Account/ResetPasswordRequest";

@Injectable({
    providedIn: 'root'
})
export class ResetPassword {
    constructor(private accountRepository: AccountRepository) {}

    execute(request: ResetPasswordRequest): Observable<any> {
        return this.accountRepository.resetPassword(request);
    }
}
