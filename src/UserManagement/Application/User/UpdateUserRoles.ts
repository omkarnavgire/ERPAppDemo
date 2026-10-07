import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UserRepository } from "../../Domain/Repositories/Userrepositories";
import { UpdateUserRolesRequest } from "../../Domain/DTOs/UpdateUserRolesRequest";
import { Role } from "../../Domain/Entities/Role";

@Injectable({
    providedIn:"root"
})
export class UpdateUserRoles {
    constructor(
        private userRepository:UserRepository
    ){}

    getUserRoles(
        userId:string
    ):Observable<Role[]> {
        return this.userRepository.getUserRoles(
            userId
        );
    }

    execute(
        request:UpdateUserRolesRequest
    ):Observable<any> {
        return this.userRepository.updateUserRoles(
            request
        );
    }

    remove(
        userId:string,
        roleId:string
    ):Observable<any> {
        return this.userRepository.removeUserRole(
            userId,
            roleId
        );
    }
}