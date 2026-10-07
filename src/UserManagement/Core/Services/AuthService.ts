import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {TokenService} from "./TokenService";
import {UserSessionService} from "./UserSessionService";

@Injectable({
    providedIn:'root'
})
export class AuthService{
    constructor(
        private tokenService:TokenService,
        private router:Router,
        private userSessionService:UserSessionService
    ){}

    saveLoginData(accessToken:string,refreshToken:string):void{
        this.tokenService.setAccessToken(accessToken);
        this.tokenService.setRefreshToken(refreshToken);
    }

    isLoggedIn():boolean{
        return this.tokenService.isLoggedIn();
    }

    logout():void{
        console.log("Logging out user.");
        this.tokenService.clearToken();
        this.userSessionService.clear();
        localStorage.removeItem("username");
        this.router.navigate(["/login"]);
    }
}