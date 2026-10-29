
import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, finalize } from "rxjs";

import { StudentDetailsResponse } from
  "../../Domain/DTOs/StudentDetailsResponse";

import { STUDENT_DETAIL_REPOSITORY } from
  "src/Account/Domain/Repositories/Token/studentdetailrepositrytoken";

@Injectable({
  providedIn: "root"
})
export class StudentDetailsService {

  private readonly repository = inject(STUDENT_DETAIL_REPOSITORY);

  private studentDetailsCache$?: Observable<StudentDetailsResponse>;

  getAllStudentDetails(
    forceRefresh = false
  ): Observable<StudentDetailsResponse> {

    if (forceRefresh) {
      this.clearStudentDetailsCache();
    }

    if (!this.studentDetailsCache$) {

      const request$ = this.repository
        .getAllStudentDetails()
        .pipe(
          finalize(() => {
            // Clear a failed request from cache so retry can work.
            // Successful responses remain cached through shareReplay.
          }),
          shareReplay({
            bufferSize: 1,
            refCount: false
          })
        );

      this.studentDetailsCache$ = request$;
    }

    return this.studentDetailsCache$;
  }

  clearStudentDetailsCache(): void {
    this.studentDetailsCache$ = undefined;
  }

  refreshStudentDetails(): Observable<StudentDetailsResponse> {
    this.clearStudentDetailsCache();

    return this.getAllStudentDetails();
  }
}
