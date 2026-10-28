
import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { StudentRegistrationApi } from "../../Infrastructure/Api/StudentRegistrationApi";
import { StudentPaymentApi } from "../../../Account/Infrastructure/Api/StudentPaymentApi";
import { StudentPayment } from "../../../Account/Domain/Entities/StudentPayment";
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
  registrationDate?: string;
  paymentDate?: string;
  paymentMode?: string;
  paymentDescription?: string;
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
  private studentPaymentApi = inject(StudentPaymentApi);

  registrations: RegistrationRow[] = [];
  students: ExistingStudent[] = [];

  loading = false;
  showForm = false;
  showExistingCourseForm = false;
  showExistingStudentPicker = false;
  existingStudentSearch = "";
  existingStudentCourseFilter = "";
  profileStudent: ExistingStudent | null = null;
  profilePayments: StudentPayment[] = [];
  profilePaymentsLoading = false;
  profilePaymentsError = "";

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
          currentStatus: item.current_Status ?? item.currentStatus ?? "",
          registrationDate: item.registration_Date ?? item.registrationDate ?? item.created_At ?? item.createdAt ?? "",
          paymentDate: item.payment_Date ?? item.paymentDate ?? "",
          paymentMode: item.payment_Mode ?? item.paymentMode ?? "",
          paymentDescription: item.payment_Description ?? item.paymentDescription ?? ""
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


  openExistingStudentPicker(): void {
    this.existingStudentSearch = "";
    this.existingStudentCourseFilter = "";
    this.showExistingStudentPicker = true;
    this.errorMessage = "";
    if (!this.students.length && !this.loading) this.loadRegistrations();
  }

  closeExistingStudentPicker(): void {
    this.showExistingStudentPicker = false;
  }

  get filteredExistingStudents(): ExistingStudent[] {
    const search = this.existingStudentSearch.trim().toLowerCase();
    const course = this.existingStudentCourseFilter.trim().toLowerCase();
    return this.students.filter(student => {
      const name = `${student.studentName} ${student.lastName}`.toLowerCase();
      const matchesSearch = !search || name.includes(search) ||
        String(student.studentId).includes(search) ||
        student.mobileNumber.toLowerCase().includes(search) ||
        student.emailAddress.toLowerCase().includes(search) ||
        student.registrations.some(r => r.registrationCode.toLowerCase().includes(search));
      const matchesCourse = !course || student.registeredCourses.toLowerCase().includes(course);
      return matchesSearch && matchesCourse;
    });
  }

  selectStudentForNewCourse(student: ExistingStudent): void {
    this.showExistingStudentPicker = false;
    this.registerExistingStudent(student);
  }

  viewStudentProfile(student: ExistingStudent): void {
    this.profileStudent = student;
    this.profilePayments = [];
    this.profilePaymentsError = "";
    this.profilePaymentsLoading = true;

    const registrationIds = new Set(student.registrations.map(r => Number(r.registrationId)));
    this.studentPaymentApi.getAllPayments().subscribe({
      next: (response: any) => {
        const rows: any[] = Array.isArray(response?.data) ? response.data
          : Array.isArray(response?.data?.data) ? response.data.data
          : Array.isArray(response) ? response : [];
        this.profilePayments = rows.map((item: any) => ({
          paymentId: Number(item.payment_Id ?? item.paymentId ?? 0),
          paymentDate: item.payment_Date ?? item.paymentDate ?? "",
          paymentAmount: Number(item.payment_Amount ?? item.paymentAmount ?? 0),
          paymentMode: item.payment_Mode ?? item.paymentMode ?? "",
          paymentDescription: item.payment_Description ?? item.paymentDescription ?? "",
          registrationId: Number(item.registration_Id ?? item.registrationId ?? 0),
          registrationCode: item.registration_Code ?? item.registrationCode ?? "",
          studentId: Number(item.student_Id ?? item.studentId ?? 0),
          studentName: item.student_Name ?? item.studentName ?? "",
          lastName: item.last_Name ?? item.lastName ?? "",
          emailAddress: item.email_Address ?? item.emailAddress ?? "",
          mobileNumber: String(item.mobile_Number ?? item.mobileNumber ?? ""),
          courseId: Number(item.course_Id ?? item.courseId ?? 0),
          courseName: item.course_Name ?? item.courseName ?? "",
          courseFees: Number(item.course_Fees ?? item.courseFees ?? 0),
          discount: Number(item.discount ?? item.Discount ?? 0),
          finalFees: Number(item.final_Fees ?? item.finalFees ?? 0),
          totalPaid: Number(item.total_Paid ?? item.totalPaid ?? 0),
          remainingBalance: Number(item.remaining_Balance ?? item.remainingBalance ?? 0),
          branchId: Number(item.branch_Id ?? item.branchId ?? 0),
          branchName: item.branch_Name ?? item.branchName ?? ""
        })).filter(payment => Number(payment.studentId) === Number(student.studentId) || registrationIds.has(Number(payment.registrationId)));
        this.profilePaymentsLoading = false;
      },
      error: error => {
        console.error("Student payment history API error:", error);
        this.profilePayments = [];
        this.profilePaymentsError = "Unable to load detailed payment history. Registration amounts are still shown below.";
        this.profilePaymentsLoading = false;
      }
    });
  }

  closeStudentProfile(): void {
    this.profileStudent = null;
    this.profilePayments = [];
    this.profilePaymentsError = "";
  }

  getStudentProfileTotal(student: ExistingStudent): number {
    if (this.profilePayments.length) {
      return this.profilePayments.reduce((sum, payment) => sum + (Number(payment.paymentAmount) || 0), 0);
    }
    return student.registrations.reduce((sum, registration) => sum + (Number(registration.paymentAmount) || 0), 0);
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
