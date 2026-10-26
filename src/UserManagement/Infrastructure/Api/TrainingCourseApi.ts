
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  ReplaySubject,
  catchError,
  finalize,
  of,
  tap,
  timeout
} from "rxjs";
import { TrainingCourse } from "../../Domain/Entities/TrainingCourse";

@Injectable({
  providedIn: "root"
})
export class TrainingCourseApi {
  private http = inject(HttpClient);

  private readonly apiUrl = "/lead-api/TrainingCourse";
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

        console.log(
          "Training Course: Showing cached data:",
          cachedCourses.length
        );
      }
    }

    // Return cached/current data immediately.
    // Only one background request runs at a time.
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
          const courses = this.extractCourses(response);

          if (!courses) {
            throw new Error("Invalid Training Course API response");
          }

          this.saveLocalCache(courses);

          this.hasData = true;
          this.coursesSubject.next(courses);

          console.log(
            "Training Course API: Fresh data:",
            courses.length
          );
        }),

        catchError(error => {
          console.error("Training Course API refresh failed:", error);

          // Keep the last successful/cache data.
          // If no data exists yet, allow an empty initial state.
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

  private extractCourses(response: any): TrainingCourse[] | null {
    const data =
      response?.data ??
      response?.result ??
      response?.items ??
      response;

    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.$values)) return data.$values;

    return null;
  }

  getTrainingCourseById(id: number): Observable<TrainingCourse> {
    return this.http.get<TrainingCourse>(`${this.apiUrl}/${id}`);
  }

  createTrainingCourse(
    trainingCourse: TrainingCourse
  ): Observable<TrainingCourse> {
    return this.http
      .post<TrainingCourse>(`${this.apiUrl}/Create`, trainingCourse)
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  updateTrainingCourse(
    id: number,
    trainingCourse: TrainingCourse
  ): Observable<TrainingCourse> {
    return this.http
      .put<TrainingCourse>(`${this.apiUrl}/Update/${id}`, trainingCourse)
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  deleteTrainingCourse(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/Delete/${id}`)
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  restoreTrainingCourse(id: number): Observable<void> {
    return this.http
      .put<void>(`${this.apiUrl}/restore/${id}`, {})
      .pipe(
        tap(() => this.clearCoursesCache())
      );
  }

  clearCoursesCache(): void {
    localStorage.removeItem(this.cacheKey);

    this.hasData = false;
    this.requestStarted = false;

    // Refresh after a successful create/update/delete/restore.
    this.refreshCourses();

    console.log("Training Course cache cleared");
  }

  private saveLocalCache(courses: TrainingCourse[]): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(courses));
    } catch (error) {
      console.warn("Unable to save Training Course cache:", error);
    }
  }

  private getLocalCache(): TrainingCourse[] | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);

      if (!cached) return null;

      const courses = JSON.parse(cached);

      return Array.isArray(courses) ? courses : null;
    } catch (error) {
      console.warn("Unable to read Training Course cache:", error);
      return null;
    }
  }
}
