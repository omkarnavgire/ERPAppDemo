
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RegisterExistingStudentCourseRequest } from "../../../Domain/DTOs/RegisterExistingStudentCourseRequest";
import { StudentRegistrationApi } from "../../../Infrastructure/Api/StudentRegistrationApi";
import { TrainingCourse as TrainingCourseApplication } from "src/UserManagement/Application/TrainingCourse/TrainingCourse";
import { TrainingCourse } from "src/UserManagement/Domain/Entities/TrainingCourse";

export interface ExistingStudentRegistrationData {
  studentId: number;
  studentName: string;
  lastName: string;
  mobileNumber: string;
  emailAddress: string;
  registeredCourses: string;
  registrations: { courseId: number; courseName: string }[];
}

@Component({
  selector: "app-existing-student-registration",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./ExistingStudentRegistration.html",
  styleUrl: "./ExistingStudentRegistration.css"
})
export class ExistingStudentRegistration implements OnChanges {
  private api = inject(StudentRegistrationApi);
  private courseApp = inject(TrainingCourseApplication);

  @Input() student: ExistingStudentRegistrationData | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  courses: TrainingCourse[] = [];
  selectedCourseId = 0;
  discount = 0;
  actualFees = 0;
  finalFees = 0;
  dropdownLoading = false;
  submitting = false;
  errorMessage = "";
  successMessage = "";

  paymentForm = {
    paymentDate: this.today(),
    paymentAmount: 0,
    paymentMode: "",
    paymentDescription: "",
    leadId: 0
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["student"] && this.student) {
      this.loadCourses();
      this.resetPaymentForm();
    }
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  private loadCourses(): void {
    this.dropdownLoading = true;
    this.courseApp.getAll().subscribe({
      next: data => {
        this.courses = (Array.isArray(data) ? data : [])
          .filter(c => Number(c.courseId) > 0);
        this.dropdownLoading = false;
      },
      error: error => {
        console.error("Course API error:", error);
        this.errorMessage = "Unable to load courses.";
        this.dropdownLoading = false;
      }
    });
  }

  get availableCourses(): TrainingCourse[] {
    if (!this.student) return [];
    const registeredIds = this.student.registrations.map(r => Number(r.courseId));
    return this.courses.filter(c => !registeredIds.includes(Number(c.courseId)));
  }

  onCourseChange(): void {
    const course = this.courses.find(c => Number(c.courseId) === Number(this.selectedCourseId));
    this.actualFees = Number(course?.feesAmount) || 0;
    this.calculateFees();
  }

  onDiscountChange(): void {
    this.discount = Math.max(0, Number(this.discount) || 0);
    this.calculateFees();
  }

  private calculateFees(): void {
    this.finalFees = Math.max(0, this.actualFees - this.discount);
  }

  resetPaymentForm(): void {
    this.selectedCourseId = 0;
    this.discount = 0;
    this.actualFees = 0;
    this.finalFees = 0;
    this.errorMessage = "";
    this.successMessage = "";
    this.paymentForm = {
      paymentDate: this.today(),
      paymentAmount: 0,
      paymentMode: "",
      paymentDescription: "",
      leadId: 0
    };
  }

  closeForm(): void {
    this.closed.emit();
  }

  registerCourse(): void {
    this.errorMessage = "";
    this.successMessage = "";

    if (this.submitting) return;

    if (!this.student) {
      this.errorMessage = "Please select a student.";
      return;
    }

    if (Number(this.selectedCourseId) <= 0) {
      this.errorMessage = "Please select a new course.";
      return;
    }

    if (this.discount > this.actualFees) {
      this.errorMessage = "Discount cannot be greater than course fees.";
      return;
    }

    if (!this.paymentForm.paymentDate || !this.paymentForm.paymentMode) {
      this.errorMessage = "Please enter payment date and payment mode.";
      return;
    }

    if (Number(this.paymentForm.paymentAmount) < 0) {
      this.errorMessage = "Payment amount cannot be negative.";
      return;
    }

    const request: RegisterExistingStudentCourseRequest = {
      studentId: this.student.studentId,
      courseId: Number(this.selectedCourseId),
      discount: Number(this.discount),
      paymentAmount: Number(this.paymentForm.paymentAmount),
      paymentDate: new Date(this.paymentForm.paymentDate).toISOString(),
      paymentMode: this.paymentForm.paymentMode,
      paymentDescription: this.paymentForm.paymentDescription,
      leadId: Number(this.paymentForm.leadId) || 0
    };

    this.submitting = true;

    this.api.registerExistingStudentCourse(request).subscribe({
      next: response => {
        console.log("Existing student course registration success:", response);
        this.submitting = false;
        this.successMessage = "Student registered for the new course successfully.";
        window.alert(this.successMessage);
        this.saved.emit();
      },
      error: error => {
        console.error("Existing student registration error:", error);
        this.submitting = false;
        const errors = error?.error?.errors;
        this.errorMessage = errors
          ? Object.entries(errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" | ")
          : error?.error?.message || `Registration failed. HTTP status: ${error?.status ?? "Unknown"}.`;
      }
    });
  }
}
