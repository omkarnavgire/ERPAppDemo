import {Injectable,inject} from "@angular/core";
import {Observable} from "rxjs";
import {AuthRepository} from "../../Domain/Repositories/Authrepositories";
import {LoginResponse} from "../../Domain/Entities/Auths/LoginResponse";

@Injectable({
    providedIn:"root"
})
export class RefreshToken{
    private authRepository=inject(AuthRepository);

    execute(refreshToken:string):Observable<LoginResponse>{
        console.log("Refreshing access token...");
        return this.authRepository.refreshToken(refreshToken);
    }
}