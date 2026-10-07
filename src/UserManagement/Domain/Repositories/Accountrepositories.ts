import { Observable } from "rxjs";
import { ChangePasswordRequest } from "../Entities/Account/ChangePasswordrequest";
import { ForgotPasswordRequest } from "../Entities/Account/ForgotPasswordRequest";
import { ResetPasswordRequest } from "../Entities/Account/ResetPasswordRequest";

export abstract class AccountRepository {
    abstract changePassword(request: ChangePasswordRequest): Observable<any>;
    abstract forgotPassword(request: ForgotPasswordRequest): Observable<any>;
    abstract resetPassword(request: ResetPasswordRequest): Observable<any>;
}
