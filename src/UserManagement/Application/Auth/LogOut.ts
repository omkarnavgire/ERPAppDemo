import { Injectable } from "@angular/core";
import { TokenService } from "../../Core/Services/TokenService";

@Injectable({
    providedIn: 'root'
})
export class LogOut {
    constructor(private tokenService: TokenService) {}

    execute(): void {
        this.tokenService.clearToken();
        localStorage.removeItem('username');
    }
}
