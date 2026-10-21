
import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { StudentRegistrationApi } from "../../Infrastructure/Api/StudentRegistrationApi";
import { NewStudentRegistration } from "./NewStudent/NewStudentRegistration";
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
    NewStudentRegistration,
    ExistingStudentRegistration
  ],
  templateUrl: "./StudentRegistration.html",
  styleUrl: "./StudentRegistration.css"
})
export class StudentRegistrationComponent implements OnInit {
  private registrationApi = inject(StudentRegistrationApi);

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

  loadRegistrations(): void {
    this.loading = true;
    this.errorMessage = "";

    this.registrationApi.getRegistrations().subscribe({
      next: (response: any) => {
        const rows: any[] = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        this.registrations = rows.map((item: any) => ({
          registrationId: Number(
            item.registration_Id ?? item.registrationId ?? 0
          ),
          studentId: Number(item.student_Id ?? item.studentId ?? 0),
          studentName: item.student_Name ?? item.studentName ?? "",
          lastName: item.last_Name ?? item.lastName ?? "",
          mobileNumber: String(
            item.mobile_Number ?? item.mobileNumber ?? ""
          ),
          emailAddress: item.email_Address ?? item.emailAddress ?? "",
          registrationCode:
            item.registration_Code ?? item.registrationCode ?? "",
          courseId: Number(item.course_Id ?? item.courseId ?? 0),
          courseName: item.course_Name ?? item.courseName ?? "",
          paymentAmount: Number(
            item.payment_Amount ?? item.paymentAmount ?? 0
          ),
          currentStatus: item.current_Status ?? item.currentStatus ?? ""
        }));

        this.buildUniqueStudents();
        this.loading = false;
      },
      error: (error) => {
        console.error("Load Registrations Error:", error);
        this.registrations = [];
        this.students = [];
        this.errorMessage = "Unable to load student registrations.";
        this.loading = false;
      }
    });
  }

  private buildUniqueStudents(): void {
    const studentMap = new Map<number, ExistingStudent>();

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
      }

      student.registrations.push(registration);
    }

    for (const student of studentMap.values()) {
      student.registeredCourses = [
        ...new Set(
          student.registrations
            .map(registration => registration.courseName)
            .filter(courseName => !!courseName)
        )
      ].join(", ");
    }

    this.students = Array.from(studentMap.values());
  }

  get filteredRegistrations(): RegistrationRow[] {
    const search = this.searchText.trim().toLowerCase();
    const course = this.courseSearch.trim().toLowerCase();

    return this.registrations.filter(registration => {
      const name =
        `${registration.studentName} ${registration.lastName}`.toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search) ||
        registration.mobileNumber.toLowerCase().includes(search) ||
        registration.emailAddress.toLowerCase().includes(search) ||
        registration.registrationCode.toLowerCase().includes(search);

      const matchesCourse =
        !course || registration.courseName.toLowerCase().includes(course);

      return matchesSearch && matchesCourse;
    });
  }

  openNewStudentForm(): void {
    this.showExistingCourseForm = false;
    this.selectedStudent = null;
    this.errorMessage = "";
    this.successMessage = "";
    this.showForm = true;
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
    this.successMessage = "Student registration completed successfully.";
    this.loadRegistrations();
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
