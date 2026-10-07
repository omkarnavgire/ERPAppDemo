import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AccountRepository } from "../../Domain/Repositories/Accountrepositories";
import { ChangePasswordRequest } from "../../Domain/Entities/Account/ChangePasswordrequest";

@Injectable({
    providedIn: 'root'
})
export class ChangePassword {
    constructor(private accountRepository: AccountRepository) {}

    execute(request: ChangePasswordRequest): Observable<any> {
        return this.accountRepository.changePassword(request);
    }
}
