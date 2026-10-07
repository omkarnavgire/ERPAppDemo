import {Injectable} from "@angular/core";

@Injectable({
    providedIn:'root'
})
export class TokenService{
    setAccessToken(token:string):void{
        localStorage.setItem('accessToken',token);
    }

    getAccessToken():string|null{
        return localStorage.getItem('accessToken');
    }

    setRefreshToken(refreshToken:string):void{
        localStorage.setItem('refreshToken',refreshToken);
    }

    getRefreshToken():string|null{
        return localStorage.getItem('refreshToken');
    }

    clearToken():void{
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    isAccessTokenExpired():boolean{
        const token=this.getAccessToken();

        if(!token){
            return true;
        }

        try{
            const payload=JSON.parse(atob(token.split('.')[1]));
            const expiry=Number(payload.exp);

            if(!expiry){
                return true;
            }

            return Date.now()>=expiry*1000;
        }catch(error){
            console.error("Invalid access token:",error);
            return true;
        }
    }

    isLoggedIn():boolean{
        return !!this.getAccessToken()||!!this.getRefreshToken();
    }
}