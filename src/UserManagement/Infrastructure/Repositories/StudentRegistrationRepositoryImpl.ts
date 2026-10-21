import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import { StudentRegistration } from "../../Domain/Entities/StudentRegistration";
import { StudentRegistrationRepository } from "../../Domain/Repositories/StudentRegistrationRepository";
import { StudentRegistrationRequest } from "../../Domain/DTOs/StudentRegistrationRequest";
import { StudentRegistrationApi } from "../Api/StudentRegistrationApi";

@Injectable({
    providedIn: "root"
})
export class StudentRegistrationRepositoryImpl
    implements StudentRegistrationRepository {

    private api = inject(StudentRegistrationApi);

    getRegistrations(): Observable<StudentRegistration[]> {
        return this.api.getRegistrations();
    }

    getRegistrationById(id: number): Observable<StudentRegistration> {
        return this.api.getRegistrationById(id) as Observable<StudentRegistration>;
    }

    registerStudent(
        request: StudentRegistrationRequest
    ): Observable<StudentRegistration> {
        return this.api.registerStudent(request) as Observable<StudentRegistration>;
    }
}