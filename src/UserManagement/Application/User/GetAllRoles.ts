import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UserRepository } from "../../Domain/Repositories/Userrepositories";
import { Role } from "../../Domain/Entities/Role";

@Injectable({
    providedIn:"root"
})
export class GetAllRoles {
    constructor(
        private userRepository:UserRepository
    ){}

    execute():Observable<Role[]> {
        return this.userRepository.getAllRoles();
    }
}