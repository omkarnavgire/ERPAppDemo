import {Injectable} from "@angular/core";

export const PERMISSIONS={
    DASHBOARD_VIEW:"DASHBOARD_VIEW",
    USER_VIEW:"USER_VIEW",USER_CREATE:"USER_CREATE",USER_UPDATE:"USER_UPDATE",
    EMPLOYEE_VIEW:"EMPLOYEE_VIEW",EMPLOYEE_CREATE:"EMPLOYEE_CREATE",EMPLOYEE_UPDATE:"EMPLOYEE_UPDATE",EMPLOYEE_ACTIVATE:"EMPLOYEE_ACTIVATE",EMPLOYEE_DEACTIVATE:"EMPLOYEE_DEACTIVATE",
    BRANCH_VIEW:"BRANCH_VIEW",BRANCH_CREATE:"BRANCH_CREATE",BRANCH_UPDATE:"BRANCH_UPDATE",BRANCH_DELETE:"BRANCH_DELETE",BRANCH_RESTORE:"BRANCH_RESTORE",
    ROLE_VIEW:"ROLE_VIEW",ROLE_CREATE:"ROLE_CREATE",ROLE_UPDATE:"ROLE_UPDATE",ROLE_DELETE:"ROLE_DELETE",
    MENU_VIEW:"MENU_VIEW",MENU_CREATE:"MENU_CREATE",MENU_UPDATE:"MENU_UPDATE",MENU_DELETE:"MENU_DELETE",
    COURSE_VIEW:"COURSE_VIEW",COURSE_CREATE:"COURSE_CREATE",COURSE_UPDATE:"COURSE_UPDATE",COURSE_DELETE:"COURSE_DELETE",COURSE_RESTORE:"COURSE_RESTORE",
    LEAD_VIEW:"LEAD_VIEW",LEAD_CREATE:"LEAD_CREATE",LEAD_FOLLOWUP:"LEAD_FOLLOWUP",LEAD_UPDATE:"LEAD_UPDATE",LEAD_DELETE:"LEAD_DELETE",LEAD_RESTORE:"LEAD_RESTORE",LEAD_EXPORT:"LEAD_EXPORT",
    ENQUIRY_VIEW:"ENQUIRY_VIEW",ENQUIRY_CREATE:"ENQUIRY_CREATE",ENQUIRY_FOLLOWUP:"ENQUIRY_FOLLOWUP",ENQUIRY_UPDATE:"ENQUIRY_UPDATE",ENQUIRY_DELETE:"ENQUIRY_DELETE",ENQUIRY_EXPORT:"ENQUIRY_EXPORT",
    LEAD_SOURCE_VIEW:"LEAD_SOURCE_VIEW",LEAD_SOURCE_CREATE:"LEAD_SOURCE_CREATE",LEAD_SOURCE_UPDATE:"LEAD_SOURCE_UPDATE",LEAD_SOURCE_DELETE:"LEAD_SOURCE_DELETE",
    QUALIFICATION_VIEW:"QUALIFICATION_VIEW",QUALIFICATION_CREATE:"QUALIFICATION_CREATE",QUALIFICATION_UPDATE:"QUALIFICATION_UPDATE",QUALIFICATION_DELETE:"QUALIFICATION_DELETE",
    FUNCTION_MANAGEMENT_VIEW:"FUNCTION_MANAGEMENT_VIEW",
    REPORTS_VIEW:"REPORTS_VIEW"
} as const;

export type Permission=typeof PERMISSIONS[keyof typeof PERMISSIONS];

@Injectable({providedIn:"root"})
export class PermissionService{
    private permissions=new Set<Permission>();
    private readonly disabledKey="erp-disabled-functions";
    private readonly adminDisabledKey="erp-admin-disabled-functions";
    private disabled=new Set<Permission>(this.readDisabled());
    private adminDisabled=new Set<Permission>(this.readAdminDisabled());

    setPermissions(permissions:Permission[]):void{this.permissions=new Set(permissions);}
    clearPermissions():void{this.permissions.clear();}
    hasPermission(permission:Permission):boolean{return this.permissions.has(permission)&&!this.disabled.has(permission);}
    hasAnyPermission(permissions:Permission[]):boolean{return permissions.some(p=>this.hasPermission(p));}
    hasAllPermissions(permissions:Permission[]):boolean{return permissions.every(p=>this.hasPermission(p));}
    getPermissions():Permission[]{return Array.from(this.permissions).filter(p=>!this.disabled.has(p));}
    isFunctionEnabled(permission:Permission):boolean{
        if(permission===PERMISSIONS.LEAD_FOLLOWUP)return !this.adminDisabled.has(permission);
        return permission===PERMISSIONS.FUNCTION_MANAGEMENT_VIEW||permission===PERMISSIONS.DASHBOARD_VIEW||!this.disabled.has(permission);
    }
    setFunctionEnabled(permission:Permission,enabled:boolean):void{
        if(permission===PERMISSIONS.LEAD_FOLLOWUP){
            if(enabled)this.adminDisabled.delete(permission); else this.adminDisabled.add(permission);
            this.persistAdminDisabled();
            return;
        }
        if(permission===PERMISSIONS.FUNCTION_MANAGEMENT_VIEW||permission===PERMISSIONS.DASHBOARD_VIEW)return;
        if(enabled)this.disabled.delete(permission); else this.disabled.add(permission);
        this.persistDisabled();
    }
    enableAll():void{this.disabled.clear();this.adminDisabled.clear();this.persistDisabled();this.persistAdminDisabled();}
    disableAll():void{for(const p of Object.values(PERMISSIONS) as Permission[]){if(p!==PERMISSIONS.FUNCTION_MANAGEMENT_VIEW&&p!==PERMISSIONS.DASHBOARD_VIEW&&p!==PERMISSIONS.LEAD_FOLLOWUP)this.disabled.add(p);}this.adminDisabled.add(PERMISSIONS.LEAD_FOLLOWUP);this.persistDisabled();this.persistAdminDisabled();}
    resetDefaults():void{this.disabled.clear();this.adminDisabled.clear();this.persistDisabled();this.persistAdminDisabled();}
    isAdminFunctionEnabled(permission:Permission):boolean{return !this.adminDisabled.has(permission);}
    private readDisabled():Permission[]{try{return JSON.parse(localStorage.getItem(this.disabledKey)||"[]");}catch{return [];}}
    private readAdminDisabled():Permission[]{try{return JSON.parse(localStorage.getItem(this.adminDisabledKey)||"[]");}catch{return [];}}
    private persistDisabled():void{localStorage.setItem(this.disabledKey,JSON.stringify(Array.from(this.disabled)));}
    private persistAdminDisabled():void{localStorage.setItem(this.adminDisabledKey,JSON.stringify(Array.from(this.adminDisabled)));}
}
