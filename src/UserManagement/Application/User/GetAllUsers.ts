import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UserRepository } from "../../Domain/Repositories/Userrepositories";
import { User } from "../../Domain/Entities/User";

@Injectable({
    providedIn:"root"
})
export class GetAllUsers {
    constructor(private userRepository:UserRepository){}

    execute():Observable<User[]> {
        return this.userRepository.getAllUsers();
    }
}