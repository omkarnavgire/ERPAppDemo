
import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
    PermissionService,
    PERMISSIONS
} from "../../Core/Services/PermissionService";
import { UserSessionService } from "../../Core/Services/UserSessionService";

@Component({
    selector: "app-dashboard",
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: "./Dashboard.html"
})
export class DashboardComponent implements OnInit {

    private session = inject(UserSessionService);
    private permissions = inject(PermissionService);

    employeeName = "";
    roleName = "";

    isAdmin = false;
    isSuperUser = false;
    canManageFunctions = false;

    canViewUsers = false;
    canViewEmployees = false;
    canViewLeads = false;
    canViewEnquiries = false;
    canViewCourses = false;
    canViewBranches = false;
    canViewRoles = false;

    ngOnInit(): void {

        // Load current user details
        this.employeeName = this.session.employeeName;

        // Get role from roleName or roles array
        this.roleName =
            this.session.roleName ||
            this.session.roles[0] ||
            "";

        this.isAdmin = this.session.isAdmin();
        this.isSuperUser = this.session.isSuperUser();

        // Normalize all role names
        const roles = [
            ...this.session.roles,
            this.roleName
        ]
            .filter((role): role is string =>
                typeof role === "string" && role.trim().length > 0
            )
            .map(role => role.trim().toLowerCase());

        // Roles allowed to access Lead, Enquiry and Course
        const canAccessLeadEnquiryCourse = roles.some(role =>
            [
                "admin",
                "super user",
                "counsellor",
                "counciler"
            ].includes(role)
        );

        // Other cards controlled by permissions
        this.canManageFunctions =
            this.permissions.hasPermission(
                PERMISSIONS.FUNCTION_MANAGEMENT_VIEW
            );

        this.canViewUsers =
            this.permissions.hasPermission(
                PERMISSIONS.USER_VIEW
            );

        this.canViewEmployees =
            this.permissions.hasPermission(
                PERMISSIONS.EMPLOYEE_VIEW
            );

        this.canViewBranches =
            this.permissions.hasPermission(
                PERMISSIONS.BRANCH_VIEW
            );

        this.canViewRoles =
            this.permissions.hasPermission(
                PERMISSIONS.ROLE_VIEW
            );

        // Lead card
        this.canViewLeads =
            canAccessLeadEnquiryCourse &&
            this.permissions.hasPermission(
                PERMISSIONS.LEAD_VIEW
            );

        // Enquiry card
        this.canViewEnquiries =
            canAccessLeadEnquiryCourse &&
            this.permissions.hasPermission(
                PERMISSIONS.ENQUIRY_VIEW
            );

        // Course card
        this.canViewCourses =
            canAccessLeadEnquiryCourse &&
            this.permissions.hasPermission(
                PERMISSIONS.COURSE_VIEW
            );

        // Debug logs for testing
        // console.log("Dashboard Role Name:", this.roleName);
        // console.log("Dashboard All Roles:", roles);
        // console.log(
        //     "Dashboard Permissions:",
        //     this.permissions.getPermissions()
        // );
        // console.log("Can View Leads:", this.canViewLeads);
        // console.log("Can View Enquiries:", this.canViewEnquiries);
        // console.log("Can View Courses:", this.canViewCourses);
    }
}
