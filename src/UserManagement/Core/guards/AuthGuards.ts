import {inject} from "@angular/core";
import {ActivatedRouteSnapshot,Router} from "@angular/router";
import {TokenService} from "../Services/TokenService";
import {UserSessionService} from "../Services/UserSessionService";
import {PERMISSIONS,PermissionService,Permission} from "../Services/PermissionService";

export const authGuard=(route:ActivatedRouteSnapshot)=>{
    const token=inject(TokenService),router=inject(Router),session=inject(UserSessionService),permissions=inject(PermissionService);
    if(!token.isLoggedIn()){router.navigate(["/login"]);return false;}
    const requiredPermission=route.data["permission"] as Permission|undefined;
    const requiredPermissions=route.data["permissions"] as Permission[]|undefined;
    const requiredRoles=route.data["roles"] as string[]|undefined;
    if(requiredPermission){
        if(requiredPermission===PERMISSIONS.LEAD_FOLLOWUP&&session.isSuperUser())return true;
        if(requiredPermission===PERMISSIONS.LEAD_FOLLOWUP&&session.isAdmin()){
            if(permissions.isAdminFunctionEnabled(requiredPermission))return true;
            router.navigate(["/main/lead"]);return false;
        }
        if(!permissions.hasPermission(requiredPermission)){router.navigate(["/main/dashboard"]);return false;}
    }
    if(requiredPermissions?.length&&!permissions.hasAnyPermission(requiredPermissions)){router.navigate(["/main/dashboard"]);return false;}
    if(!requiredPermission&&!requiredPermissions?.length&&requiredRoles?.length&&!session.hasAnyRole(requiredRoles)){router.navigate(["/main/dashboard"]);return false;}
    return true;
};
