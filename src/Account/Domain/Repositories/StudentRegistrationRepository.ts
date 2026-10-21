
import { Observable } from "rxjs";
import { StudentRegistration } from "../Entities/StudentRegistration";
import { StudentRegistrationRequest } from "../DTOs/StudentRegistrationRequest";

export interface StudentRegistrationRepository {
    getRegistrations(): Observable<StudentRegistration[]>;

    getRegistrationById(id: number): Observable<StudentRegistration>;

    registerStudent(
        request: StudentRegistrationRequest
    ): Observable<StudentRegistration>;
}
