
import { Routes } from "@angular/router";

import { LoginClass } from "./Presentation/Account/Login/LoginComponent";
import { ForgotPasswordClass } from "./Presentation/Account/ForgotPassword/ForgotPasswordComponent";
import { ResetPasswordClass } from "./Presentation/Account/ResetPassword/ResetPasswordComponent";
import { ChangePasswordClass } from "./Presentation/Account/ChangePassword/ChangePasswordComponent";
import { ProfileComponent } from "./Presentation/Account/Profile/ProfileComponent";

import { DashboardComponent } from "./Presentation/Dashboard/DashboardComponent";
import { LeadComponent } from "./Presentation/Lead/LeadComponent";
import { MainClass } from "./Maincomponent";

import { authGuard } from "./Core/guards/AuthGuards";
import { PERMISSIONS } from "./Core/Services/PermissionService";

import { Enquiryform } from "./Presentation/EneuiryFollowup/EnquiryFollowupFrom/EnquiryFollowupFrom";
import { Enquirylist } from "./Presentation/EneuiryFollowup/EnquiryFollowupList/EnquiryfollowupList";
import { FollowupForm } from "./Presentation/EneuiryFollowup/Followup/FollowupForm/FollowupForm";

import { TrainingCourseComponent } from "./Presentation/TrainingCourse/TrainingCourseComponent";
import { SettingsComponent } from "./Presentation/Settings/SettingsComponent";
import { EditUserRolesComponent } from "./Presentation/Employee/EditUserRoles/EditUserRolesComponent";
import { LeadFollowupComponent } from "./Presentation/Lead/LeadFollowup/LeadFollowupComponent";
import { FunctionManagementComponent } from "./Presentation/FunctionManagement/FunctionManagementComponent";
import { ReportsComponent } from "./Presentation/Reports/ReportsComponent";

import { StudentRegistrationComponent } from "../Account/Presentation/StudentRegistration/StudentRegistrationComponent";
import { NewStudentRegistration } from "../Account/Presentation/StudentRegistration/NewStudent/NewStudentRegistration";
import { StudentDetails } from "../Account/Presentation/StudentDetails/StudentDetails";

import { StudentPaymentListComponent } from "../Account/Presentation/StudentPayment/student-payment-list/student-payment-list.component";
import { CreatePaymentComponent } from "../Account/Presentation/StudentPayment/create-payment/create-payment";

import { BatchComponent } from "src/Group-Leader/Presentation/BatchComponent";
import { EmployeeComponent } from "./Presentation/Employee/Employee";

export const routes: Routes = [
    // Authentication Routes
    {
        path: "login",
        component: LoginClass
    },
    {
        path: "forgot-password",
        component: ForgotPasswordClass
    },
    {
        path: "reset-password",
        component: ResetPasswordClass
    },

    // Main Application Routes
    {
        path: "main",
        component: MainClass,
        canActivate: [authGuard],
        children: [
            {
                path: "dashboard",
                component: DashboardComponent,
                data: { permission: PERMISSIONS.DASHBOARD_VIEW },
                canActivate: [authGuard]
            },
            {
                path: "user",
                component: EmployeeComponent,
                data: { permission: PERMISSIONS.USER_VIEW },
                canActivate: [authGuard]
            },
            {
                path: "edit-user-roles/:userId",
                component: EditUserRolesComponent,
                data: { permission: PERMISSIONS.ROLE_UPDATE },
                canActivate: [authGuard]
            },
            {
                path: "lead",
                component: LeadComponent,
                data: { permission: PERMISSIONS.LEAD_VIEW },
                canActivate: [authGuard]
            },
            {
                path: "lead/followup/:leadId",
                component: LeadFollowupComponent,
                data: { permission: PERMISSIONS.LEAD_FOLLOWUP },
                canActivate: [authGuard]
            },
            {
                path: "change-password",
                component: ChangePasswordClass,
                canActivate: [authGuard]
            },

            // Group Leader - Batch Management Route
            {
                path: "batch",
                component: BatchComponent,
                canActivate: [authGuard],
                data: {
                    roles: ["Admin", "Super User", "Group Leader"]
                }
            },

            // Profile Route
            {
                path: "profile",
                component: ProfileComponent,
                canActivate: [authGuard]
            },

            // Enquiry Routes
            {
                path: "enquiry",
                component: Enquirylist,
                data: { permission: PERMISSIONS.ENQUIRY_VIEW },
                canActivate: [authGuard]
            },
            {
                path: "enquiry/add",
                component: Enquiryform,
                data: { permission: PERMISSIONS.ENQUIRY_CREATE },
                canActivate: [authGuard]
            },
            {
                path: "enquiry/edit/:id",
                component: Enquiryform,
                data: { permission: PERMISSIONS.ENQUIRY_UPDATE },
                canActivate: [authGuard]
            },
            {
                path: "enquiry/followup/:enquiryId",
                component: FollowupForm,
                data: { permission: PERMISSIONS.ENQUIRY_FOLLOWUP },
                canActivate: [authGuard]
            },

            // Course and Administration Routes
            {
                path: "course",
                component: TrainingCourseComponent,
                data: { permission: PERMISSIONS.COURSE_VIEW },
                canActivate: [authGuard]
            },
            {
                path: "function-management",
                component: FunctionManagementComponent,
                data: {
                    permission: PERMISSIONS.FUNCTION_MANAGEMENT_VIEW,
                    roles: ["Admin", "Super User"]
                },
                canActivate: [authGuard]
            },
            {
                path: "reports",
                component: ReportsComponent,
                data: {
                    permission: PERMISSIONS.REPORTS_VIEW,
                    roles: ["Admin", "Super User"]
                },
                canActivate: [authGuard]
            },
            {
                path: "settings",
                component: SettingsComponent,
                canActivate: [authGuard]
            },

            // Student Registration Routes
            {
                path: "student-registration",
                component: StudentRegistrationComponent,
                canActivate: [authGuard]
            },
            {
                path: "student-details/:studentId",
                component: StudentDetails,
                canActivate: [authGuard]
            },
            {
                path: "account/student-registration",
                loadComponent: () =>
                    import("../Account/Presentation/StudentRegistration/StudentRegistrationComponent")
                        .then(m => m.StudentRegistrationComponent),
                canActivate: [authGuard]
            },
            {
                path: "student-registration/add",
                component: StudentRegistrationComponent,
                canActivate: [authGuard]
            },
            {
                path: "student-registration/new",
                component: NewStudentRegistration,
                canActivate: [authGuard]
            },

            // Student Payment Routes
            {
                path: "student-payments",
                component: StudentPaymentListComponent,
                canActivate: [authGuard]
            },
            {
                path: "student-payments/create",
                component: CreatePaymentComponent,
                canActivate: [authGuard]
            },

            // Default Child Route
            {
                path: "",
                redirectTo: "dashboard",
                pathMatch: "full"
            }
        ]
    },

    // Default Application Route
    {
        path: "",
        redirectTo: "login",
        pathMatch: "full"
    },

    // Unknown Route
    {
        path: "**",
        redirectTo: "login"
    }
];
