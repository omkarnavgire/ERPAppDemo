
import { Observable } from "rxjs";
import { StudentRegistration } from "src/Account/Application/StudentRegistration/StudentRegistration";
import { StudentRegistrationRequest } from "src/Account/Domain/DTOs/StudentRegistrationRequest";


export interface StudentRegistrationRepository {
    getRegistrations(): Observable<StudentRegistration[]>;

    getRegistrationById(id: number): Observable<StudentRegistration>;

    registerStudent(
        request: StudentRegistrationRequest
    ): Observable<StudentRegistration>;
}
