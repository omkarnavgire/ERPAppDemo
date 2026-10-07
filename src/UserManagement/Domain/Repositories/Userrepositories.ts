import { Observable } from "rxjs";
import { User } from "../Entities/User";
import { Role } from "../Entities/Role";
import { UpdateUserRolesRequest } from "../DTOs/UpdateUserRolesRequest";

export abstract class UserRepository {
    abstract getAllUsers():Observable<User[]>;
    abstract getAllRoles():Observable<Role[]>;
    abstract getUserRoles(userId:string):Observable<Role[]>;
    abstract updateUserRoles(
        request:UpdateUserRolesRequest
    ):Observable<any>;
    abstract removeUserRole(
        userId:string,
        roleId:string
    ):Observable<any>;
}