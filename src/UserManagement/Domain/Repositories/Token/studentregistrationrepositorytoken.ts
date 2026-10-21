import { InjectionToken } from "@angular/core";
import { StudentRegistrationRepository } from "../StudentRegistrationRepository";

export const STUDENT_REGISTRATION_REPOSITORY =
    new InjectionToken<StudentRegistrationRepository>(
        "STUDENT_REGISTRATION_REPOSITORY"
    );