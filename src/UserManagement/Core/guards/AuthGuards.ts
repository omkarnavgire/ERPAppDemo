import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
import { TokenService } from "../Services/TokenService";
import { UserSessionService } from "../Services/UserSessionService";
import { PERMISSIONS, Permission, PermissionService } from "../Services/PermissionService";

export const authGuard = (route: ActivatedRouteSnapshot) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);
    const session = inject(UserSessionService);
    const permissionService = inject(PermissionService);

    if (!tokenService.isLoggedIn()) {
        return router.createUrlTree(["/login"]);
    }

    const requiredPermission = route.data["permission"] as Permission | undefined;
    const requiredPermissions = route.data["permissions"] as Permission[] | undefined;
    const requiredRoles = route.data["roles"] as string[] | undefined;

    const accessDenied = () => router.createUrlTree(
        session.hasPermission(PERMISSIONS.DASHBOARD_VIEW)
            ? ["/main/dashboard"]
            : ["/login"]
    );

    // If both role and permission are configured, BOTH must pass.
    if (requiredRoles?.length && !session.hasAnyRole(requiredRoles)) {
        return accessDenied();
    }

    if (requiredPermission) {
        const superUserLeadFollowup =
            requiredPermission === PERMISSIONS.LEAD_FOLLOWUP && session.isSuperUser();
        const enabledAdminLeadFollowup =
            requiredPermission === PERMISSIONS.LEAD_FOLLOWUP &&
            session.isAdmin() && permissionService.isAdminFunctionEnabled(requiredPermission);

        if (
            !superUserLeadFollowup &&
            !enabledAdminLeadFollowup &&
            !permissionService.hasPermission(requiredPermission)
        ) {
            return accessDenied();
        }
    }

    if (requiredPermissions?.length && !permissionService.hasAnyPermission(requiredPermissions)) {
        return accessDenied();
    }

    return true;
};
