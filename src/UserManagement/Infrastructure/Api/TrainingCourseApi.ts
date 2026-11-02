import { API_ENDPOINTS } from "../../../Core/config/api-endpoints";
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {Observable,ReplaySubject,catchError,finalize,of,tap,timeout} from "rxjs";
import { TrainingCourse } from "../../Domain/Entities/TrainingCourse";

@Injectable({
  providedIn: "root"
})
export class TrainingCourseApi {

  private http = inject(HttpClient);

  private readonly apiUrl = `${API_ENDPOINTS.lead}/TrainingCourse`;
  private readonly cacheKey = "training-courses-cache";

  private coursesSubject = new ReplaySubject<TrainingCourse[]>(1);

  private requestStarted = false;
  private hasData = false;

  getTrainingCourses(): Observable<TrainingCourse[]> {

    if (!this.hasData) {

      const cachedCourses = this.getLocalCache();

      if (cachedCourses !== null) {
        this.hasData = true;
        this.coursesSubject.next(cachedCourses);
      }
    }

    this.refreshCourses();

    return this.coursesSubject.asObservable();
  }

  private refreshCourses(): void {

    if (this.requestStarted) return;

    this.requestStarted = true;

    console.log("Training Course API: Refresh started");

    this.http
      .get<any>(this.apiUrl)
      .pipe(
        timeout(20000),

        tap(response => {

          console.log("Training Course API Response:", response);

          const courses = this.extractCourses(response);

          if (courses === null) {
            throw new Error("Invalid Training Course API response");
          }

          const normalizedCourses = courses
            .map((course: any) => ({
              ...course,

              courseId: Number(
                course.courseId ??
                course.course_Id ??
                course.id ??
                0
              ),

              courseName:
                course.courseName ??
                course.course_Name ??
                course.name ??
                "",

              feesAmount: Number(
                course.feesAmount ??
                course.fees_Amount ??
                course.fees ??
                0
              )
            }))
            .filter((course: any) => course.courseId > 0);

          this.saveLocalCache(normalizedCourses);

          this.hasData = true;

          this.coursesSubject.next(normalizedCourses);

          console.log(
            "Training Course API: Fresh data:",
            normalizedCourses
          );

        }),

        catchError(error => {

          console.error(
            "Training Course API refresh failed:",
            error
          );

          if (!this.hasData) {
            this.hasData = true;
            this.coursesSubject.next([]);
          }

          return of(null);
        }),

        finalize(() => {

          this.requestStarted = false;

          console.log("Training Course API: Refresh finished");

        })
      )
      .subscribe();
  }

  private extractCourses(response: any): any[] | null {

    let data =
      response?.data ??
      response?.result ??
      response?.items ??
      response?.records ??
      response?.list ??
      response?.value ??
      response;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.$values)) {
      return data.$values;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return null;
  }

  getTrainingCourseById(id: number): Observable<TrainingCourse> {

    return this.http.get<TrainingCourse>(
      `${this.apiUrl}/${id}`
    );
  }

  createTrainingCourse(
    trainingCourse: TrainingCourse
  ): Observable<TrainingCourse> {

    return this.http
      .post<TrainingCourse>(
        `${this.apiUrl}/Create`,
        trainingCourse
      )
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  updateTrainingCourse(
    id: number,
    trainingCourse: TrainingCourse
  ): Observable<TrainingCourse> {

    return this.http
      .put<TrainingCourse>(
        `${this.apiUrl}/Update/${id}`,
        trainingCourse
      )
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  deleteTrainingCourse(id: number): Observable<void> {

    return this.http
      .delete<void>(
        `${this.apiUrl}/Delete/${id}`
      )
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  restoreTrainingCourse(id: number): Observable<void> {

    return this.http
      .put<void>(
        `${this.apiUrl}/restore/${id}`,
        {}
      )
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  clearCoursesCache(): void {

    localStorage.removeItem(this.cacheKey);

    this.hasData = false;
    this.requestStarted = false;

    this.refreshCourses();

    console.log("Training Course cache cleared");
  }

  private saveLocalCache(courses: TrainingCourse[]): void {

    try {

      localStorage.setItem(
        this.cacheKey,
        JSON.stringify(courses)
      );

    } catch (error) {

      console.warn(
        "Unable to save Training Course cache:",
        error
      );

    }
  }

  private getLocalCache(): TrainingCourse[] | null {

    try {

      const cached = localStorage.getItem(this.cacheKey);

      if (!cached) return null;

      const courses = JSON.parse(cached);

      return Array.isArray(courses) ? courses : null;

    } catch (error) {

      console.warn(
        "Unable to read Training Course cache:",
        error
      );

      return null;
    }
  }
}