import { Observable } from "rxjs";
import { Branch } from "../Entities/Branch";

export abstract class BranchRepository {
    abstract getAllBranches():Observable<Branch[]>;
}