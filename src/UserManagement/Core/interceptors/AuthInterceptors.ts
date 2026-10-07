import {HttpErrorResponse,HttpInterceptorFn} from "@angular/common/http";
import {inject} from "@angular/core";
import {Router} from "@angular/router";
import {BehaviorSubject,Observable,throwError} from "rxjs";
import {catchError,filter,switchMap,take} from "rxjs/operators";
import {RefreshToken} from "../../Application/Auth/RefreshToken";
import {TokenService} from "../Services/TokenService";
import {UserSessionService} from "../Services/UserSessionService";

let isRefreshing=false;
const refreshTokenSubject=new BehaviorSubject<string|null>(null);

export const authInterceptor:HttpInterceptorFn=(req,next)=>{
    const tokenService=inject(TokenService);
    const router=inject(Router);
    const refreshTokenUsecase=inject(RefreshToken);
    const userSessionService=inject(UserSessionService);

    // Public authentication and password reset APIs
    if(
        req.url.includes("/api/Auth/login") ||
        req.url.includes("/api/Auth/refresh") ||
        req.url.includes("/api/account/forgot-password") ||
        req.url.includes("/api/account/reset-password")
    ){
        return next(req);
    }

    if(req.url.startsWith("https://leadapis.ciitstudent.com/")){
        console.log("Lead API request without JWT:",req.url);
        return next(req);
    }

    const token=tokenService.getAccessToken();
    const refreshToken=tokenService.getRefreshToken();

    const redirectToLogin=()=>{
        console.log("Session expired. Redirecting to login.");
        tokenService.clearToken();
        userSessionService.clear();
        localStorage.removeItem("username");
        router.navigate(["/login"]);
    };

    const retryWithToken=(newToken:string):Observable<any>=>{
        const retryRequest=req.clone({
            setHeaders:{
                Authorization:`Bearer ${newToken}`
            }
        });
        return next(retryRequest);
    };

    const refreshAccessToken=():Observable<string>=>{
        if(!refreshToken){
            redirectToLogin();
            return throwError(()=>new Error("Refresh token not available"));
        }

        if(!isRefreshing){
            isRefreshing=true;
            refreshTokenSubject.next(null);

            return refreshTokenUsecase.execute(refreshToken).pipe(
                switchMap(response=>{
                    console.log("Access token refreshed successfully.");

                    tokenService.setAccessToken(response.token);
                    tokenService.setRefreshToken(response.refreshToken);

                    isRefreshing=false;
                    refreshTokenSubject.next(response.token);

                    return [response.token];
                }),
                catchError(error=>{
                    console.error("Refresh token failed:",error);

                    isRefreshing=false;
                    refreshTokenSubject.next(null);
                    redirectToLogin();

                    return throwError(()=>error);
                })
            );
        }

        return refreshTokenSubject.pipe(
            filter(newToken=>newToken!==null),
            take(1)
        );
    };

    if(token&&!tokenService.isAccessTokenExpired()){
        req=req.clone({
            setHeaders:{
                Authorization:`Bearer ${token}`
            }
        });

        return next(req).pipe(
            catchError((error:HttpErrorResponse)=>{
                if(error.status!==401){
                    return throwError(()=>error);
                }

                return refreshAccessToken().pipe(
                    switchMap(newToken=>retryWithToken(newToken))
                );
            })
        );
    }

    if(token&&tokenService.isAccessTokenExpired()){
        console.log("Access token expired. Refreshing before API request.");

        return refreshAccessToken().pipe(
            switchMap(newToken=>retryWithToken(newToken))
        );
    }

    if(!token&&refreshToken){
        console.log("Access token missing. Refreshing access token.");

        return refreshAccessToken().pipe(
            switchMap(newToken=>retryWithToken(newToken))
        );
    }

    redirectToLogin();
    return throwError(()=>new Error("Authentication required"));
};