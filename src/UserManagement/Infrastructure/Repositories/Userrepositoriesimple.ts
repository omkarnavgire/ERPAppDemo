import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UserRepository } from "../../Domain/Repositories/Userrepositories";
import {UserApi} from "../Api/UserAPi";
import { RoleApi } from "../Api/RoleAPi";
import { UserRole } from "../Api/UserRole";
import { User } from "../../Domain/Entities/User";
import { Role } from "../../Domain/Entities/Role";
import { UpdateUserRolesRequest } from "../../Domain/DTOs/UpdateUserRolesRequest";

@Injectable({
    providedIn:"root"
})
export class UserRepositoryImpl extends UserRepository {
    constructor(
        private userApi:UserApi,
        private roleApi:RoleApi,
        private userRole:UserRole
    ) {
        super();
    }

    override getAllUsers():Observable<User[]> {
        return this.userApi.getAllUsers();
    }

    override getAllRoles():Observable<Role[]> {
        return this.roleApi.getAllRoles();
    }

    override getUserRoles(userId:string):Observable<Role[]> {
        return this.userRole.getUserRoles(userId);
    }

    override updateUserRoles(
        request:UpdateUserRolesRequest
    ):Observable<any> {
        return this.userRole.assignRole(
            request.userId,
            request.roleId
        );
    }

    override removeUserRole(
        userId:string,
        roleId:string
    ):Observable<any> {
        return this.userRole.removeUserRole(
            userId,
            roleId
        );
    }
}