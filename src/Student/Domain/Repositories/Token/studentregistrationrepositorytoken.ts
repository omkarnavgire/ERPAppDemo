import { InjectionToken } from "@angular/core";
import { StudentRegistrationRepository } from "../StudentRegistrationRepository";

export const STUDENT_REGISTRATION_REPOSITORY = new InjectionToken<StudentRegistrationRepository>("ACCOUNT_STUDENT_REGISTRATION_REPOSITORY");
