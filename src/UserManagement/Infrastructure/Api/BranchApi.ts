import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable,shareReplay} from "rxjs";

@Injectable({
    providedIn:"root"
})
export class BranchApi {
    private baseUrl=`${API_ENDPOINTS.branch}/get-all`;

    private branchesCache$:Observable<any>|null=null;

    constructor(private http:HttpClient){}

    getAllBranches():Observable<any>{
        if(!this.branchesCache$){
            console.log("Branch API called:",this.baseUrl);

            this.branchesCache$=this.http.get<any>(
                this.baseUrl
            ).pipe(
                shareReplay(1)
            );
        }

        return this.branchesCache$;
    }

    clearBranchesCache():void{
        this.branchesCache$=null;
    }
}