
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { StudentDetailsResponse } from
  "../../Domain/DTOs/StudentDetailsResponse";

@Injectable({
  providedIn: "root"
})
export class StudentDetailApi {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    "https://student.ciitstudent.com/api/StudentDetails";

  getAllStudentDetails(): Observable<StudentDetailsResponse> {
    return this.http.get<StudentDetailsResponse>(
      `${this.apiUrl}/get-all`
    );
  }

  // Force a fresh API request
  refreshStudentDetails(): Observable<StudentDetailsResponse> {
    return this.getAllStudentDetails();
  }
}
