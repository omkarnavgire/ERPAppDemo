import { Component, inject, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { UserSessionService } from "../../../Core/Services/UserSessionService";

@Component({
    selector:"app-profile",
    standalone:true,
    imports:[RouterLink],
    templateUrl:"./Profile.html",
    styleUrl:"./Profile.css"
})
export class ProfileComponent implements OnInit {
    private userSessionService=inject(UserSessionService);

    employeeName="";
    employeeCode="";
    username="";
    email="";
    mobile="";
    branch="";
    role="";
    roles:string[]=[];

    ngOnInit():void {
        this.loadProfile();
    }

    private loadProfile():void {
        this.employeeName=this.userSessionService.employeeName;
        this.employeeCode=this.userSessionService.employeeCode;
        this.username=this.userSessionService.username;
        this.email=this.userSessionService.email;
        this.mobile=this.userSessionService.mobile;
        this.branch=this.userSessionService.branch;
        this.role=this.userSessionService.roleName;
        this.roles=this.userSessionService.roles;

        console.log("Profile loaded:",this.userSessionService.currentUser);
    }
}