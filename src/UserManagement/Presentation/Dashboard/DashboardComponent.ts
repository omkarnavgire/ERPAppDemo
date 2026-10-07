import {CommonModule} from "@angular/common";
import {Component,inject,OnInit} from "@angular/core";
import {RouterLink} from "@angular/router";
import {PermissionService,PERMISSIONS} from "../../Core/Services/PermissionService";
import {UserSessionService} from "../../Core/Services/UserSessionService";

@Component({
    selector:"app-dashboard",
    standalone:true,
    imports:[CommonModule,RouterLink],
    templateUrl:"./Dashboard.html"
})
export class DashboardComponent implements OnInit{
    private session=inject(UserSessionService);
    private permissions=inject(PermissionService);

    employeeName="";
    roleName="";
    isAdmin=false;
    isSuperUser=false;
    canManageFunctions=false;

    canViewUsers=false;
    canViewEmployees=false;
    canViewLeads=false;
    canViewEnquiries=false;
    canViewCourses=false;
    canViewBranches=false;
    canViewRoles=false;

    ngOnInit():void{
        this.employeeName=this.session.employeeName;
        this.roleName=this.session.roleName;
        this.isAdmin=this.session.isAdmin();
        this.isSuperUser=this.session.isSuperUser();

        this.canManageFunctions=this.permissions.hasPermission(PERMISSIONS.FUNCTION_MANAGEMENT_VIEW);
        this.canViewUsers=this.permissions.hasPermission(PERMISSIONS.USER_VIEW);
        this.canViewEmployees=this.permissions.hasPermission(PERMISSIONS.EMPLOYEE_VIEW);
        this.canViewLeads=this.permissions.hasPermission(PERMISSIONS.LEAD_VIEW);
        this.canViewEnquiries=this.permissions.hasPermission(PERMISSIONS.ENQUIRY_VIEW);
        this.canViewCourses=this.permissions.hasPermission(PERMISSIONS.COURSE_VIEW);
        this.canViewBranches=this.permissions.hasPermission(PERMISSIONS.BRANCH_VIEW);
        this.canViewRoles=this.permissions.hasPermission(PERMISSIONS.ROLE_VIEW);
    }
}