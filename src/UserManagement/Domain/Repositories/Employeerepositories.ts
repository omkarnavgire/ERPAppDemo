import { Observable } from "rxjs";
import { RegisterEmployeeRequest } from "../Entities/Employee";

export abstract class EmployeeRepository {
    abstract registerEmployee(
        request:RegisterEmployeeRequest
    ):Observable<any>;
}