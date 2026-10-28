
import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { LogOut } from "./Application/Auth/LogOut";
import { GetAllUsers } from "./Application/User/GetAllUsers";
import { UserSessionService } from "./Core/Services/UserSessionService";
import { PermissionService, PERMISSIONS, Permission } from "./Core/Services/PermissionService";
import { User } from "./Domain/Entities/User";

interface SidebarMenu {
    label: string;
    route: string;
    icon: string;
    permission?: Permission;
    roles?: string[];
}

@Component({
    selector: "app-main-layout",
    standalone: true,
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
    templateUrl: "./Maincomponent.html",
    styleUrls: ["./Maincomponent.css"]
})
export class MainClass implements OnInit {
    private router = inject(Router);
    private logoutUsecase = inject(LogOut);
    private getAllUsersUsecase = inject(GetAllUsers);
    private session = inject(UserSessionService);
    private permissions = inject(PermissionService);

    employeeName = "";
    roleName = "";
    visibleMenus: SidebarMenu[] = [];
    isDarkTheme = false;
    showProfileMenu = false;

    menus: SidebarMenu[] = [
        { label: "Dashboard", route: "/main/dashboard", icon: "▣", permission: PERMISSIONS.DASHBOARD_VIEW },
        { label: "Employee", route: "/main/user", icon: "♙", permission: PERMISSIONS.USER_VIEW, roles: ["Admin", "Super User"] },
        { label: "Lead", route: "/main/lead", icon: "◉", permission: PERMISSIONS.LEAD_VIEW, roles: ["Super User", "Admin", "Counsellor"] },
        { label: "Enquiry", route: "/main/enquiry", icon: "✎", permission: PERMISSIONS.ENQUIRY_VIEW, roles: ["Super User", "Admin", "Counsellor"] },
        { label: "Course", route: "/main/course", icon: "📚", permission: PERMISSIONS.COURSE_VIEW, roles: ["Super User", "Admin", "Counsellor"] },
        { label: "Student Registration", route: "/main/student-registration", icon: "🎓", roles: ["Accountant", "Admin", "Super User"] },
        { label: "Student Payments", route: "/main/student-payments", icon: "₹", roles: ["Accountant", "Admin", "Super User"] },
        // {label: "Batch",route: "/main/batch", icon: "📅", permission: PERMISSIONS.BATCH_VIEW, roles: ["Super User", "Admin", "Group Leader"]},
        {label: "Batch",route: "/main/batch", icon: "📅",  roles: ["Super User", "Admin", "Group Leader"]},
        // { label: "Function Management", route: "/main/function-management", icon: "⚙", permission: PERMISSIONS.FUNCTION_MANAGEMENT_VIEW, roles: ["Admin", "Super User"] },
        { label: "Reports", route: "/main/reports", icon: "▤", permission: PERMISSIONS.REPORTS_VIEW, roles: ["Admin", "Super User", "Accountant"] },
        // { label: "Settings", route: "/main/settings", icon: "⚙" }
    ];

    ngOnInit(): void {
        const savedTheme = localStorage.getItem("ciit-theme");
        this.isDarkTheme = savedTheme === "dark";
        this.applyTheme();
        this.loadUserSession();
    }

    toggleTheme(): void {
        this.isDarkTheme = !this.isDarkTheme;
        localStorage.setItem("ciit-theme", this.isDarkTheme ? "dark" : "light");
        this.applyTheme();
    }

    private applyTheme(): void {
        document.documentElement.setAttribute("data-theme", this.isDarkTheme ? "dark" : "light");
    }

    toggleProfileMenu(): void {
        this.showProfileMenu = !this.showProfileMenu;
    }

    goToProfile(): void {
        this.showProfileMenu = false;
        this.router.navigate(["/main/profile"]);
    }

    goToChangePassword(): void {
        this.showProfileMenu = false;
        this.router.navigate(["/main/change-password"]);
    }

    private loadUserSession(): void {
        if (this.session.currentUser) {
            this.setUserData();
            this.setVisibleMenus();
            this.refreshUserSessionInBackground();
            return;
        }

        const username = localStorage.getItem("username");
        if (!username) {
            this.router.navigate(["/login"]);
            return;
        }

        this.getAllUsersUsecase.execute().subscribe({
            next: (response: any) => {
                const users: User[] = Array.isArray(response) ? response : response?.data ?? [];
                const u = username.trim().toLowerCase();
                const current = users.find(x =>
                    x.employeeCode?.trim().toLowerCase() === u ||
                    x.userName?.trim().toLowerCase() === u ||
                    x.emailAddress?.trim().toLowerCase() === u
                );

                if (current) {
                    this.session.setUser(current);
                    this.setUserData();
                    this.setVisibleMenus();
                }
            },
            error: e => console.error("User information API error:", e)
        });
    }

    private refreshUserSessionInBackground(): void {
        this.getAllUsersUsecase.execute().subscribe({
            next: (response: any) => {
                const users: User[] = Array.isArray(response) ? response : response?.data ?? [];
                const username = (this.session.username || localStorage.getItem("username") || "").trim().toLowerCase();
                const current = users.find(x =>
                    x.employeeCode?.trim().toLowerCase() === username ||
                    x.userName?.trim().toLowerCase() === username ||
                    x.emailAddress?.trim().toLowerCase() === username
                );

                if (current) {
                    this.session.setUser(current);
                    this.setUserData();
                    this.setVisibleMenus();
                }
            },
            error: e => console.warn("Background user refresh failed:", e)
        });
    }

    private setUserData(): void {
        this.employeeName = this.session.employeeName;

        this.roleName =
            this.session.roleName ||
            this.session.roles.find(role => role?.trim()) ||
            this.session.currentUser?.roleName ||
            this.session.currentUser?.role ||
            "";
    }

    private setVisibleMenus(): void {
        this.visibleMenus = this.menus.filter(menu => {
            if (menu.roles?.length && !this.session.hasAnyRole(menu.roles)) return false;
            if (!menu.permission) return true;
            return this.permissions.hasPermission(menu.permission);
        });
    }



    logout(): void {
        this.logoutUsecase.execute();
        this.session.clear();
        localStorage.removeItem("username");
        this.router.navigate(["/login"]);
    }
}
