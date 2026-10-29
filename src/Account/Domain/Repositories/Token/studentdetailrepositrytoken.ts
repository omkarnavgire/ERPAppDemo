import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";
import { StudentDetailsResponse } from "../../DTOs/StudentDetailsResponse";

export interface IStudentDetailRepository {
  getAllStudentDetails(): Observable<StudentDetailsResponse>;
}

export const STUDENT_DETAIL_REPOSITORY =
  new InjectionToken<IStudentDetailRepository>(
    "STUDENT_DETAIL_REPOSITORY"
  );
