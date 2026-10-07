import {Injectable} from "@angular/core";
import {AuthRepository} from "../../Domain/Repositories/Authrepositories";
import {AuthApi} from "../Api/AuthApi";
import {Observable} from "rxjs";
import {LoginRequest} from "../../Domain/Entities/Auths/LoginRequest";
import {LoginResponse} from "../../Domain/Entities/Auths/LoginResponse";

@Injectable({
    providedIn:'root'
})
export class AuthRepositoryImpl extends AuthRepository{
    constructor(private authapi:AuthApi){
        super();
    }

    override login(request:LoginRequest):Observable<LoginResponse>{
        return this.authapi.login(request);
    }

    override refreshToken(refreshToken:string):Observable<LoginResponse>{
        return this.authapi.refreshToken(refreshToken);
    }
}