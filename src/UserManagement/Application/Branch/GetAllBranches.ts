import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { BranchRepository } from "../../Domain/Repositories/Branchrepositories";
import { Branch } from "../../Domain/Entities/Branch";

@Injectable({
    providedIn:"root"
})
export class GetAllBranches {
    constructor(
        private branchRepository:BranchRepository
    ){}

    execute():Observable<Branch[]>{
        console.log("GetAllBranches use case executed");
        return this.branchRepository.getAllBranches();
    }
}