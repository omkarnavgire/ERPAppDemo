
import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { catchError, finalize, of, timeout } from "rxjs";

import { StudentRegistrationApi } from "../../Infrastructure/Api/StudentRegistrationApi";
import {
  ExistingStudentRegistration,
  ExistingStudentRegistrationData
} from "./ExistingStudent/ExistingStudentRegistration";

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

  private registrationApi = inject(StudentRegistrationApi);
  private router = inject(Router);

  registrations: RegistrationRow[] = [];
  students: ExistingStudent[] = [];

  loading = false;
  showForm = false;
  showExistingCourseForm = false;

  searchText = "";
  courseSearch = "";

  errorMessage = "";
  successMessage = "";

  selectedStudent: ExistingStudentRegistrationData | null = null;

  ngOnInit(): void {
    this.loadRegistrations();
  }

clearSearch(): void {
  this.searchText = "";
  this.courseSearch = "";

  // Refresh the displayed list after clearing filters
  this.registrations = [...this.registrations];
}

  loadRegistrations(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    const startTime = performance.now();

    this.registrationApi.getRegistrations()
      .pipe(
        timeout(20000),
        finalize(() => {
          this.loading = false;

          console.log(
            `Student registrations request completed in ${
              (performance.now() - startTime).toFixed(0)
            } ms`
          );
        })
      )
      .subscribe({
        next: (response: any) => {
          const rows: any[] = Array.isArray(response) ? response
            : Array.isArray(response?.data) ? response.data
            : Array.isArray(response?.result) ? response.result
            : Array.isArray(response?.$values) ? response.$values
            : Array.isArray(response?.data?.$values) ? response.data.$values
            : [];

          this.registrations = rows.map((item: any) => ({
            registrationId: Number(
              item.registration_Id ?? item.registrationId ?? item.registrationID ?? 0
            ),
            studentId: Number(
              item.student_Id ?? item.studentId ?? item.studentID ?? 0
            ),
            studentName:
              item.student_Name ?? item.studentName ?? item.candidateName ?? "",
            lastName:
              item.last_Name ?? item.lastName ?? "",
            mobileNumber: String(
              item.mobile_Number ?? item.mobileNumber ?? item.mobile ?? ""
            ),
            emailAddress:
              item.email_Address ?? item.emailAddress ?? item.email ?? "",
            registrationCode:
              item.registration_Code ?? item.registrationCode ?? "",
            courseId: Number(
              item.course_Id ?? item.courseId ?? item.courseID ?? 0
            ),
            courseName:
              item.course_Name ?? item.courseName ?? "",
            paymentAmount: Number(
              item.payment_Amount ?? item.paymentAmount ?? 0
            ),
            currentStatus:
              item.current_Status ?? item.currentStatus ?? ""
          }));

          this.buildUniqueStudents();

          console.log(
            `Loaded ${this.registrations.length} registrations and ${this.students.length} unique students`
          );
        },

        error: (error) => {
          console.error("Load Registrations Error:", error);

          this.registrations = [];
          this.students = [];

          this.errorMessage =
            "Unable to load student registrations. Please try again.";
        }
      });
  }

  private buildUniqueStudents(): void {
    const studentMap = new Map<number, ExistingStudent>();
    const courseSets = new Map<number, Set<string>>();

    for (const registration of this.registrations) {
      if (!registration.studentId) {
        continue;
      }

      let student = studentMap.get(registration.studentId);

      if (!student) {
        student = {
          studentId: registration.studentId,
          studentName: registration.studentName,
          lastName: registration.lastName,
          mobileNumber: registration.mobileNumber,
          emailAddress: registration.emailAddress,
          registeredCourses: "",
          registrations: []
        };

        studentMap.set(registration.studentId, student);
        courseSets.set(registration.studentId, new Set<string>());
      }

      student.registrations.push(registration);

      if (registration.courseName) {
        courseSets.get(registration.studentId)?.add(
          registration.courseName
        );
      }
    }

    for (const [studentId, student] of studentMap) {
      student.registeredCourses = [
        ...(courseSets.get(studentId) ?? [])
      ].join(", ");
    }

    this.students = Array.from(studentMap.values());
  }

  get filteredRegistrations(): RegistrationRow[] {
    const search = this.searchText.trim().toLowerCase();
    const course = this.courseSearch.trim().toLowerCase();

    if (!search && !course) {
      return this.registrations;
    }

    return this.registrations.filter(registration => {
      const matchesSearch =
        !search ||
        `${registration.studentName} ${registration.lastName}`
          .toLowerCase().includes(search) ||
        registration.mobileNumber.toLowerCase().includes(search) ||
        registration.emailAddress.toLowerCase().includes(search) ||
        registration.registrationCode.toLowerCase().includes(search);

      const matchesCourse =
        !course ||
        registration.courseName.toLowerCase().includes(course);

      return matchesSearch && matchesCourse;
    });
  }

  openNewStudentForm(): void {
    this.showExistingCourseForm = false;
    this.selectedStudent = null;
    this.errorMessage = "";
    this.successMessage = "";

    this.router.navigate(["/main/student-registration/new"]);
  }

  closeNewStudentForm(): void {
    this.showForm = false;
  }

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

  onNewStudentSaved(): void {
    this.showForm = false;
    this.errorMessage = "";
    this.successMessage =
      "Student registration completed successfully.";

    this.loadRegistrations();
  }
trackByRegistrationId(
  index: number,
  registration: RegistrationRow
): number {
  return registration.registrationId || index;
}
  onExistingStudentSaved(): void {
    this.showExistingCourseForm = false;
    this.selectedStudent = null;
    this.errorMessage = "";
    this.successMessage =
      "Existing student registered for the new course successfully.";

    this.loadRegistrations();
  }
}
