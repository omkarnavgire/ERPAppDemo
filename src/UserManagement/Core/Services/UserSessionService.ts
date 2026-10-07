import {Injectable} from "@angular/core";
import {User} from "../../Domain/Entities/User";
import {PermissionService,PERMISSIONS,Permission} from "./PermissionService";

@Injectable({providedIn:"root"})
export class UserSessionService{
    private readonly sessionKey="erp-current-user";
    currentUser:User|null=null;
    employeeName="";
    employeeCode="";
    username="";
    email="";
    mobile="";
    branch="";
    roleName="";
    roles:string[]=[];

    constructor(private permissionService:PermissionService){
        this.restoreUser();
    }

    setUser(user:User):void{
        this.currentUser=user;
        this.employeeName=user.employeeName||"";
        this.employeeCode=user.employeeCode||"";
        this.username=user.userName||"";
        this.email=user.emailAddress||"";
        this.mobile=user.mobileNumber||"";
        this.branch=user.branchName||"";
        this.roleName=user.roleName||user.role||"";

        const userRoles=Array.isArray(user.roles)?user.roles:[];
        const primaryRole=this.roleName?[this.roleName]:[];
        this.roles=[...new Set(
            [...userRoles,...primaryRole]
                .filter((r):r is string=>typeof r==="string")
                .map(r=>r.trim())
                .filter(Boolean)
        )];

        this.setRolePermissions();
        this.persistUser(user);
    }

    private restoreUser():void{
        try{
            const raw=localStorage.getItem(this.sessionKey);
            if(!raw)return;

            const user=JSON.parse(raw) as User;
            if(user&&typeof user==="object"){
                this.setUserState(user);
                this.setRolePermissions();
            }
        }catch(error){
            console.warn("Could not restore user session:",error);
            localStorage.removeItem(this.sessionKey);
        }
    }

    private setUserState(user:User):void{
        this.currentUser=user;
        this.employeeName=user.employeeName||"";
        this.employeeCode=user.employeeCode||"";
        this.username=user.userName||"";
        this.email=user.emailAddress||"";
        this.mobile=user.mobileNumber||"";
        this.branch=user.branchName||"";
        this.roleName=user.roleName||user.role||"";

        const userRoles=Array.isArray(user.roles)?user.roles:[];
        const primaryRole=this.roleName?[this.roleName]:[];
        this.roles=[...new Set(
            [...userRoles,...primaryRole]
                .filter((r):r is string=>typeof r==="string")
                .map(r=>r.trim())
                .filter(Boolean)
        )];
    }

    private persistUser(user:User):void{
        try{
            localStorage.setItem(this.sessionKey,JSON.stringify(user));
        }catch(error){
            console.warn("Could not persist user session:",error);
        }
    }

    private setRolePermissions():void{
        const all:Permission[]=[];
        for(const role of this.roles){
            all.push(...this.getPermissionsForRole(role));
        }
        this.permissionService.setPermissions([...new Set(all)]);
    }

    private getPermissionsForRole(role:string):Permission[]{
        const r=role.trim().toLowerCase();

        if(r==="super user"){
            return Object.values(PERMISSIONS) as Permission[];
        }

        if(r==="admin"){
            return Object.values(PERMISSIONS).filter(
                p=>p!==PERMISSIONS.FUNCTION_MANAGEMENT_VIEW
            ) as Permission[];
        }

        if(r==="counsellor"){
            return [
                PERMISSIONS.DASHBOARD_VIEW,
                PERMISSIONS.LEAD_VIEW,
                PERMISSIONS.LEAD_CREATE,
                PERMISSIONS.LEAD_FOLLOWUP,
                PERMISSIONS.ENQUIRY_VIEW,
                PERMISSIONS.ENQUIRY_CREATE,
                PERMISSIONS.ENQUIRY_FOLLOWUP,
                PERMISSIONS.LEAD_SOURCE_VIEW,
                PERMISSIONS.QUALIFICATION_VIEW
            ];
        }

        if(r==="developer"){
            return [
                PERMISSIONS.DASHBOARD_VIEW,
                PERMISSIONS.COURSE_VIEW,
                PERMISSIONS.COURSE_CREATE,
                PERMISSIONS.COURSE_UPDATE,
                PERMISSIONS.COURSE_DELETE,
                PERMISSIONS.COURSE_RESTORE
            ];
        }

        if(r==="accountant"){
            return [
                PERMISSIONS.DASHBOARD_VIEW,
                PERMISSIONS.ENQUIRY_VIEW
            ];
        }

        if(r==="group leader"||r==="trainer"||r==="student"){
            return [PERMISSIONS.DASHBOARD_VIEW];
        }

        return [];
    }

    hasPermission(p:Permission):boolean{
        return this.permissionService.hasPermission(p);
    }

    hasAnyPermission(p:Permission[]):boolean{
        return this.permissionService.hasAnyPermission(p);
    }

    hasAllPermissions(p:Permission[]):boolean{
        return this.permissionService.hasAllPermissions(p);
    }

    getPermissions():Permission[]{
        return this.permissionService.getPermissions();
    }

    hasRole(role:string):boolean{
        return this.roles.some(
            r=>r.trim().toLowerCase()===role.trim().toLowerCase()
        );
    }

    hasAnyRole(required:string[]):boolean{
        return required.some(x=>this.hasRole(x));
    }

    isSuperUser():boolean{
        return this.hasRole("Super User");
    }

    isAdmin():boolean{
        return this.hasRole("Admin");
    }

    clear():void{
        this.currentUser=null;
        this.employeeName="";
        this.employeeCode="";
        this.username="";
        this.email="";
        this.mobile="";
        this.branch="";
        this.roleName="";
        this.roles=[];
        this.permissionService.clearPermissions();
        localStorage.removeItem(this.sessionKey);
    }
}
