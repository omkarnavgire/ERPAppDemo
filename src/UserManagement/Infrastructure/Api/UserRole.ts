import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn:"root"
})
export class UserRole {
    private baseUrl="https://superuser.ciitstudent.com/api/UserRole";

    constructor(private http:HttpClient){}

    getUserRoles(userId:string):Observable<any> {
        console.log("Get user roles API request:",userId);
        return this.http.post<any>(
            `${this.baseUrl}/get-user-roles`,
            {userId:userId}
        );
    }

    assignRole(userId:string,roleId:string):Observable<any> {
        console.log("Assign role API request:",{userId,roleId});
        return this.http.post<any>(
            `${this.baseUrl}/assign-role`,
            {userId:userId,roleId:roleId}
        );
    }

    removeUserRole(userId:string,roleId:string):Observable<any> {
        console.log("Remove role API request:",{userId,roleId});
        return this.http.delete<any>(
            `${this.baseUrl}/remove-assigned-role/${userId}/${roleId}`
        );
    }
}