import {Observable} from "rxjs";
import {LoginRequest} from "../Entities/Auths/LoginRequest";
import {LoginResponse} from "../Entities/Auths/LoginResponse";

export abstract class AuthRepository{
    abstract login(request:LoginRequest):Observable<LoginResponse>;
    abstract refreshToken(refreshToken:string):Observable<LoginResponse>;
}