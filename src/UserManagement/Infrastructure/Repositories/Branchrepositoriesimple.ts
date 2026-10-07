import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { BranchRepository } from "../../Domain/Repositories/Branchrepositories";
import { BranchApi } from "../Api/BranchApi";
import { Branch } from "../../Domain/Entities/Branch";

@Injectable({
    providedIn:"root"
})
export class BranchRepositoryImpl extends BranchRepository {
    constructor(private branchApi:BranchApi){
        super();
    }

    override getAllBranches():Observable<Branch[]>{
        return this.branchApi.getAllBranches().pipe(
            map((response:any)=>{
                console.log("Branch API response:",response);
                return response?.data||[];
            })
        );
    }
}