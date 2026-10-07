import { Injectable } from "@angular/core";
import { AuthRepository } from "../../Domain/Repositories/Authrepositories";
import { LoginRequest } from "../../Domain/Entities/Auths/LoginRequest";
import { Observable } from "rxjs";
import { LoginResponse } from "../../Domain/Entities/Auths/LoginResponse";

@Injectable({
    providedIn:'root'
})

export class Login{
    constructor(private authRepository:AuthRepository){}

    execute(
        request:LoginRequest):Observable<LoginResponse>{
            return this.authRepository.login(request);
        }
    
}