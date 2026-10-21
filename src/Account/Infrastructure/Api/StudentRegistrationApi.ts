
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { StudentRegistration } from "../../Domain/Entities/StudentRegistration";
import { StudentRegistrationRequest } from "../../Domain/DTOs/StudentRegistrationRequest";
import { StudentRegistrationDropdownItem } from "../../Domain/DTOs/StudentRegistrationDropdownResponse";
import { StudentCourseFeesResponse } from "../../Domain/DTOs/StudentCourseFeesResponse";
import { RegisterExistingStudentCourseRequest } from "../../Domain/DTOs/RegisterExistingStudentCourseRequest";

@Injectable({
    providedIn: "root"
})
export class StudentRegistrationApi {

    private http = inject(HttpClient);

    private readonly apiUrl =
        "https://student.ciitstudent.com/api/StudentRegistration";

    // 1. Register a new student
    registerStudent(
        request: StudentRegistrationRequest
    ): Observable<unknown> {
        return this.http.post<unknown>(
            `${this.apiUrl}/register`,
            request
        );
    }

    // 2. Load dropdown data
    getDropdownData(): Observable<StudentRegistrationDropdownItem[]> {
        return this.http.get<StudentRegistrationDropdownItem[]>(
            `${this.apiUrl}/dropdown-data`
        );
    }

    // 3. Get all registrations
    getRegistrations(): Observable<StudentRegistration[]> {
        return this.http.get<StudentRegistration[]>(
            `${this.apiUrl}/get-all`
        );
    }

    // 4. Get registration by student ID
    getRegistrationById(
        studentId: number
    ): Observable<unknown> {
        return this.http.get<unknown>(
            `${this.apiUrl}/get-by-id/${studentId}`
        );
    }

    // 5. Get course fees
    getCourseFees(
        courseId: number,
        discount: number
    ): Observable<StudentCourseFeesResponse> {
        return this.http.get<StudentCourseFeesResponse>(
            `${this.apiUrl}/course-fees/${courseId}`,
            {
                params: {
                    discount: discount
                }
            }
        );
    }

    // 6. Register an existing student for another course
registerExistingStudentCourse(
    request: RegisterExistingStudentCourseRequest
): Observable<unknown> {
    return this.http.post<unknown>(
        `${this.apiUrl}/register-existing-student-course`,
        request
    );
}
}
