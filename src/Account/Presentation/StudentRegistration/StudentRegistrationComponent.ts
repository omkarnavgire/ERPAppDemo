import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { finalize, timeout } from "rxjs";

import { StudentRegistrationApi } from "../../Infrastructure/Api/StudentRegistrationApi";

import { StudentDetailsDto } from "../../Domain/DTOs/StudentDetailsResponse";

import {
  ExistingStudentRegistration,
  ExistingStudentRegistrationData
} from "./ExistingStudent/ExistingStudentRegistration";
import { StudentDetailsService } from "src/Account/Application/StudentDetails/StudentDetails";

// Registration API model.
// Used to preserve the existing-student registration functionality.
interface RegistrationRow {
  registrationId: number;
  studentId: number;
  studentName: string;
  lastName: string;
  mobileNumber: string;
  emailAddress: string;
  registrationCode: string;
  courseId: number;
  courseName: string;
  paymentAmount: number;
  currentStatus: string;
}

interface ExistingStudent {
  studentId: number;
  studentName: string;
  lastName: string;
  mobileNumber: string;
  emailAddress: string;
  registeredCourses: string;
  registrations: RegistrationRow[];
}

@Component({
  selector: "app-student-registration",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExistingStudentRegistration
  ],
  templateUrl: "./StudentRegistration.html",
  styleUrl: "./StudentRegistration.css"
})
export class StudentRegistrationComponent implements OnInit {

  private readonly registrationApi = inject(StudentRegistrationApi);
  private readonly studentDetailsService: any = inject(StudentDetailsService);
  private readonly router = inject(Router);

  // Data used by the Student Details API table.
  studentDetails: StudentDetailsDto[] = [];

  // Keep this name if the HTML table uses filteredStudents.
  get filteredStudents(): StudentDetailsDto[] {
    const search = this.searchText.trim().toLowerCase();

    return this.studentDetails.filter(student => {
      if (!search) {
        return true;
      }

      const searchableValues = [
        student.studentId,
        student.studentName,
        student.lastName,
        student.mobileNumber,
        student.emailAddress,
        student.qualification,
        student.studentCode,
        student.branchName
      ];

      return searchableValues.some(value =>
        String(value ?? "").toLowerCase().includes(search)
      );
    });
  }

  // Registration data is retained for existing-course registration.
  registrations: RegistrationRow[] = [];
  students: ExistingStudent[] = [];

  loading = false;
  loadingRegistrations = false;

  showForm = false;
  showExistingCourseForm = false;

  searchText = "";
  courseSearch = "";

  errorMessage = "";
  successMessage = "";

  selectedStudent: ExistingStudentRegistrationData | null = null;

  highlightedStudentId: number | null = null;

  private previousStudentIds = new Set<number>();
  private highlightTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly registrationsCacheKey =
    "ciit-account-student-registrations-v1";

  ngOnInit(): void {
    // Load the personal details for the main table.
    this.loadStudentDetails();

    // Retain registration data for existing-student registration.
    this.loadRegistrations();
  }

  // -----------------------------------------
  // STUDENT DETAILS API
  // -----------------------------------------

  loadStudentDetails(highlightNewStudent = false): void {
    if (this.loading) {
      return;
    }

    this.loading = this.studentDetails.length === 0;
    this.errorMessage = "";

    this.studentDetailsService
      .getAllStudentDetails()
      .pipe(
        timeout(20000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: { data?: StudentDetailsDto[] | null } | null) => {
          const apiStudents = Array.isArray(response?.data)
            ? response.data
            : [];

          // Keep only valid Student IDs and avoid duplicate IDs.
          const uniqueStudents = new Map<number, StudentDetailsDto>();

          for (const student of apiStudents) {
            const studentId = Number(student.studentId);

            if (studentId > 0 && !uniqueStudents.has(studentId)) {
              uniqueStudents.set(studentId, student);
            }
          }

          this.studentDetails = Array.from(uniqueStudents.values());

          // Highlight a newly registered student if the API now returns
          // a Student ID that was not present before registration.
          if (highlightNewStudent) {
            const newStudent = this.studentDetails.find(
              student => !this.previousStudentIds.has(
                Number(student.studentId)
              )
            );

            if (newStudent) {
              this.highlightStudent(Number(newStudent.studentId));
              this.successMessage =
                "Student registered successfully.";
            } else {
              this.successMessage =
                "Registration saved. The student list has been refreshed.";
            }
          }

          this.previousStudentIds = new Set(
            this.studentDetails.map(student => Number(student.studentId))
          );

          console.log(
            `Loaded ${this.studentDetails.length} unique students`
          );
        },

        error: (error: unknown) => {
          console.error("Student Details API Error:", error);

          this.errorMessage =
            "Unable to load student details. Please try again.";
        }
      });
  }

  // -----------------------------------------
  // TEMPORARY NEW-STUDENT HIGHLIGHT
  // -----------------------------------------

  private highlightStudent(studentId: number): void {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }

    this.highlightedStudentId = studentId;

    // Highlight the new row for 10 seconds.
    this.highlightTimeout = setTimeout(() => {
      this.highlightedStudentId = null;
      this.highlightTimeout = null;
    }, 10000);
  }

  // -----------------------------------------
  // REGISTRATION API
  // Retained for existing-student registration.
  // -----------------------------------------

  private readCache<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch {
      return null;
    }
  }

  private writeCache<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Cache is optional; the API remains the source of truth.
    }
  }

  loadRegistrations(): void {
    if (this.loadingRegistrations) {
      return;
    }

    this.loadingRegistrations = true;

    const cached = this.readCache<RegistrationRow[]>(
      this.registrationsCacheKey
    );

    if (cached?.length && !this.registrations.length) {
      this.registrations = cached;
      this.buildUniqueStudents();
    }

    const startTime = performance.now();

    this.registrationApi
      .getRegistrations()
      .pipe(
        timeout(20000),
        finalize(() => {
          this.loadingRegistrations = false;

          console.log(
            `Registration request completed in ${
              (performance.now() - startTime).toFixed(0)
            } ms`
          );
        })
      )
      .subscribe({
        next: (response: any) => {
          const rows: any[] = this.getRows(response);

          this.registrations = rows.map((item: any) => ({
            registrationId: Number(
              item.registration_Id ??
              item.registrationId ??
              item.registrationID ??
              0
            ),

            studentId: Number(
              item.student_Id ??
              item.studentId ??
              item.studentID ??
              0
            ),

            studentName:
              item.student_Name ??
              item.studentName ??
              item.candidateName ??
              "",

            lastName:
              item.last_Name ??
              item.lastName ??
              "",

            mobileNumber: String(
              item.mobile_Number ??
              item.mobileNumber ??
              item.mobile ??
              ""
            ),

            emailAddress:
              item.email_Address ??
              item.emailAddress ??
              item.email ??
              "",

            registrationCode:
              item.registration_Code ??
              item.registrationCode ??
              "",

            courseId: Number(
              item.course_Id ??
              item.courseId ??
              item.courseID ??
              0
            ),

            courseName:
              item.course_Name ??
              item.courseName ??
              "",

            paymentAmount: Number(
              item.payment_Amount ??
              item.paymentAmount ??
              0
            ),

            currentStatus:
              item.current_Status ??
              item.currentStatus ??
              ""
          }));

          this.buildUniqueStudents();

          this.writeCache(
            this.registrationsCacheKey,
            this.registrations
          );

          console.log(
            `Loaded ${this.registrations.length} registrations and ` +
            `${this.students.length} unique registration students`
          );
        },

        error: (error: unknown) => {
          console.error("Load Registrations Error:", error);

          // Keep cached registration data if refresh fails.
          if (!this.registrations.length) {
            this.registrations = [];
            this.students = [];
          }
        }
      });
  }

  private getRows(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    const candidates = [
      response?.data,
      response?.result,
      response?.items,
      response?.registrations,
      response?.$values,
      response?.data?.$values,
      response?.result?.$values,
      response?.items?.$values
    ];

    return candidates.find(Array.isArray) ?? [];
  }

  buildUniqueStudents(): void {
    const studentMap = new Map<number, ExistingStudent>();
    const courseNames = new Map<number, Set<string>>();

    for (const registration of this.registrations) {
      const studentId = Number(registration.studentId);

      if (studentId <= 0) {
        continue;
      }

      let student = studentMap.get(studentId);

      if (!student) {
        student = {
          studentId,
          studentName: registration.studentName,
          lastName: registration.lastName,
          mobileNumber: registration.mobileNumber,
          emailAddress: registration.emailAddress,
          registeredCourses: "",
          registrations: []
        };

        studentMap.set(studentId, student);
        courseNames.set(studentId, new Set<string>());
      }

      student.registrations.push(registration);

      if (registration.courseName) {
        courseNames.get(studentId)?.add(registration.courseName);
      }
    }

    for (const [studentId, student] of studentMap) {
      student.registeredCourses = Array.from(
        courseNames.get(studentId) ?? new Set<string>()
      ).join(", ");
    }

    this.students = Array.from(studentMap.values());
  }

  
  refreshStudentDetails(highlightNewStudent = false): void {
    // Keep existing IDs so a newly registered student can be highlighted.
    if (highlightNewStudent) {
      this.previousStudentIds = new Set(
        this.studentDetails.map(student => Number(student.studentId))
      );
    }

    this.errorMessage = "";
    this.successMessage = "";
    this.loading = true;

    this.studentDetailsService
      .refreshStudentDetails()
      .pipe(
        timeout(20000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: { data?: StudentDetailsDto[] | null }) => {
          const apiStudents = Array.isArray(response?.data)
            ? response.data
            : [];

          const uniqueStudents = new Map<number, StudentDetailsDto>();

          for (const student of apiStudents) {
            const studentId = Number(student.studentId);

            if (studentId > 0 && !uniqueStudents.has(studentId)) {
              uniqueStudents.set(studentId, student);
            }
          }

          this.studentDetails = Array.from(uniqueStudents.values());

          if (highlightNewStudent) {
            const newStudent = this.studentDetails.find(
              student => !this.previousStudentIds.has(Number(student.studentId))
            );

            if (newStudent) {
              this.highlightStudent(Number(newStudent.studentId));
              this.successMessage = "Student registered successfully.";
            } else {
              this.successMessage =
                "Registration saved. The student list has been refreshed.";
            }
          }

          this.previousStudentIds = new Set(
            this.studentDetails.map(student => Number(student.studentId))
          );

          console.log(
            `Refreshed ${this.studentDetails.length} unique students`
          );
        },
        error: (error: unknown) => {
          console.error("Refresh Student Details Error:", error);
          this.errorMessage =
            "Unable to refresh student details. Please try again.";
        }
      });
  }


  // -----------------------------------------
  // SEARCH
  // -----------------------------------------

  clearSearch(): void {
    this.searchText = "";
    this.courseSearch = "";
  }

  // -----------------------------------------
  // NEW STUDENT REGISTRATION
  // -----------------------------------------

  openNewStudentForm(): void {
    // Save existing IDs before opening the new registration page.
    this.previousStudentIds = new Set(
      this.studentDetails.map(student => Number(student.studentId))
    );

    this.showExistingCourseForm = false;
    this.selectedStudent = null;
    this.errorMessage = "";
    this.successMessage = "";

    this.router.navigate(["/main/student-registration/new"]);
  }

  closeNewStudentForm(): void {
    this.showForm = false;
  }

  onNewStudentSaved(): void {
    this.showForm = false;
    this.errorMessage = "";
    this.successMessage = "";

    // Force a fresh API request and highlight the newly added student.
    this.refreshStudentDetails(true);
    this.loadRegistrations();
  }

  // -----------------------------------------
  // EXISTING STUDENT REGISTRATION
  // -----------------------------------------

  registerExistingStudent(student: ExistingStudent): void {
    this.showForm = false;
    this.errorMessage = "";
    this.successMessage = "";

    this.selectedStudent = {
      studentId: student.studentId,
      studentName: student.studentName,
      lastName: student.lastName,
      mobileNumber: student.mobileNumber,
      emailAddress: student.emailAddress,
      registeredCourses: student.registeredCourses,
      registrations: student.registrations
    };

    this.showExistingCourseForm = true;
  }

  closeExistingCourseForm(): void {
    this.showExistingCourseForm = false;
    this.selectedStudent = null;
  }

  openExistingStudentForm(): void {
    this.showForm = false;
    this.errorMessage = "";
    this.successMessage = "";
    this.selectedStudent = null;
    this.showExistingCourseForm = true;
  }

  onExistingStudentSaved(): void {
    this.showExistingCourseForm = false;
    this.selectedStudent = null;
    this.errorMessage = "";
    this.successMessage =
      "Existing student registered for the new course successfully.";

    this.refreshStudentDetails();
    this.loadRegistrations();
  }

  // -----------------------------------------
  // STUDENT DETAILS PAGE NAVIGATION
  // -----------------------------------------

  openStudentDetails(student: StudentDetailsDto): void {
    const studentId = Number(student.studentId);

    if (studentId <= 0) {
      this.errorMessage = "Invalid Student ID.";
      return;
    }

    this.errorMessage = "";
    this.successMessage = "";

    this.router.navigate([
      "/main/student-details",
      studentId
    ]);
  }

  trackByStudentId(
    index: number,
    student: StudentDetailsDto
  ): number {
    return Number(student.studentId) || index;
  }

  trackByRegistrationId(
    index: number,
    registration: RegistrationRow
  ): number {
    return registration.registrationId || index;
  }
}
