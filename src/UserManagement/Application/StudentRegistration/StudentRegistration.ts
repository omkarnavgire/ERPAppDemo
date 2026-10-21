
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";

import {
    StudentRegistration as StudentRegistrationEntity
} from "../../Domain/Entities/StudentRegistration";

import {
    StudentRegistrationRequest
} from "../../Domain/DTOs/StudentRegistrationRequest";

import {
    STUDENT_REGISTRATION_REPOSITORY
} from "../../Domain/Repositories/Token/studentregistrationrepositorytoken";

@Injectable({
    providedIn: "root"
})
export class StudentRegistration {

    private repository = inject(STUDENT_REGISTRATION_REPOSITORY);

    getAll(): Observable<StudentRegistrationEntity[]> {
        return this.repository.getRegistrations();
    }

    getById(id: number): Observable<StudentRegistrationEntity> {
        return this.repository.getRegistrationById(id);
    }

    register(
        request: StudentRegistrationRequest
    ): Observable<StudentRegistrationEntity> {
        return this.repository.registerStudent(request);
    }
}
