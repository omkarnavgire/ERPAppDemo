import {Routes} from "@angular/router";
import {LoginClass} from "./Presentation/Account/Login/LoginComponent";
import {ForgotPasswordClass} from "./Presentation/Account/ForgotPassword/ForgotPasswordComponent";
import {ResetPasswordClass} from "./Presentation/Account/ResetPassword/ResetPasswordComponent";
import {ChangePasswordClass} from "./Presentation/Account/ChangePassword/ChangePasswordComponent";
import {ProfileComponent} from "./Presentation/Account/Profile/ProfileComponent";
import {DashboardComponent} from "./Presentation/Dashboard/DashboardComponent";
import {UserComponent} from "./Presentation/User/UserComponent";
import {LeadComponent} from "./Presentation/Lead/LeadComponent";
import {EmployeeComponent} from "./Presentation/Employee/EmployeeComponent";
import {MainClass} from "./Maincomponent";
import {authGuard} from "./Core/guards/AuthGuards";
import {Enquiryform} from "./Presentation/EneuiryFollowup/EnquiryFollowupFrom/EnquiryFollowupFrom";
import {Enquirylist} from "./Presentation/EneuiryFollowup/EnquiryFollowupList/EnquiryfollowupList";
import {TrainingCourseComponent} from "./Presentation/TrainingCourse/TrainingCourseComponent";
import {SettingsComponent} from "./Presentation/Settings/SettingsComponent";
import {EditUserRolesComponent} from "./Presentation/User/EditUserRoles/EditUserRolesComponent";
import {FollowupForm} from "./Presentation/EneuiryFollowup/Followup/FollowupForm/FollowupForm";
import {LeadFollowupComponent} from "./Presentation/Lead/LeadFollowup/LeadFollowupComponent";
import {FunctionManagementComponent} from "./Presentation/FunctionManagement/FunctionManagementComponent";
import {ReportsComponent} from "./Presentation/Reports/ReportsComponent";
import {PERMISSIONS} from "./Core/Services/PermissionService";

export const routes:Routes=[
    {path:"login",component:LoginClass},
    {path:"forgot-password",component:ForgotPasswordClass},
    {path:"reset-password",component:ResetPasswordClass},
    {
        path:"main",
        component:MainClass,
        canActivate:[authGuard],
        children:[
            {path:"dashboard",component:DashboardComponent,data:{permission:PERMISSIONS.DASHBOARD_VIEW},canActivate:[authGuard]},
            {path:"user",component:UserComponent,data:{permission:PERMISSIONS.USER_VIEW},canActivate:[authGuard]},
            {path:"edit-user-roles/:userId",component:EditUserRolesComponent,data:{permission:PERMISSIONS.ROLE_UPDATE},canActivate:[authGuard]},
            {path:"lead",component:LeadComponent,data:{permission:PERMISSIONS.LEAD_VIEW},canActivate:[authGuard]},
            {path:"lead/followup/:leadId",component:LeadFollowupComponent,data:{permission:PERMISSIONS.LEAD_FOLLOWUP},canActivate:[authGuard]},
            {path:"employee",component:EmployeeComponent,data:{permission:PERMISSIONS.EMPLOYEE_VIEW},canActivate:[authGuard]},
            {path:"change-password",component:ChangePasswordClass,canActivate:[authGuard]},
            {path:"profile",component:ProfileComponent,canActivate:[authGuard]},
            {path:"enquiry",component:Enquirylist,data:{permission:PERMISSIONS.ENQUIRY_VIEW},canActivate:[authGuard]},
            {path:"enquiry/add",component:Enquiryform,data:{permission:PERMISSIONS.ENQUIRY_CREATE},canActivate:[authGuard]},
            {path:"enquiry/edit/:id",component:Enquiryform,data:{permission:PERMISSIONS.ENQUIRY_UPDATE},canActivate:[authGuard]},
            {path:"enquiry/followup/:enquiryId",component:FollowupForm,data:{permission:PERMISSIONS.ENQUIRY_FOLLOWUP},canActivate:[authGuard]},
            {path:"course",component:TrainingCourseComponent,data:{permission:PERMISSIONS.COURSE_VIEW},canActivate:[authGuard]},
            {path:"function-management",component:FunctionManagementComponent,data:{permission:PERMISSIONS.FUNCTION_MANAGEMENT_VIEW,roles:["Admin","Super User"]},canActivate:[authGuard]},
            {path:"reports",component:ReportsComponent,data:{permission:PERMISSIONS.REPORTS_VIEW,roles:["Admin","Super User"]},canActivate:[authGuard]},
            {path:"settings",component:SettingsComponent,canActivate:[authGuard]},
            {path:"",redirectTo:"dashboard",pathMatch:"full"}
        ]
    },
    {path:"",redirectTo:"login",pathMatch:"full"},
    {path:"**",redirectTo:"login"}
];