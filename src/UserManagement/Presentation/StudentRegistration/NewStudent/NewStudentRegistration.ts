
import { Component, EventEmitter, OnInit, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { StudentRegistrationRequest } from "../../../Domain/DTOs/StudentRegistrationRequest";
import { StudentRegistrationApi } from "../../../Infrastructure/Api/StudentRegistrationApi";
import { GetAllBranches } from "../../../Application/Branch/GetAllBranches";
import { QualificationApplication } from "../../../Application/Qualification/QualificationApplication";
import { TrainingCourse as TrainingCourseApplication } from "../../../Application/TrainingCourse/TrainingCourse";
import { Branch } from "../../../Domain/Entities/Branch";
import { Qualification } from "../../../Domain/Entities/Qualification";
import { TrainingCourse } from "../../../Domain/Entities/TrainingCourse";

@Component({
  selector: "app-new-student-registration",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./NewStudentRegistration.html",
  styleUrl: "./NewStudentRegistration.css"
})
export class NewStudentRegistration implements OnInit {
  private api = inject(StudentRegistrationApi);
  private branchApp = inject(GetAllBranches);
  private qualificationApp = inject(QualificationApplication);
  private courseApp = inject(TrainingCourseApplication);

  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  branches: Branch[] = [];
  qualifications: Qualification[] = [];
  courses: TrainingCourse[] = [];

  submitting = false;
  dropdownLoading = false;
  errorMessage = "";
  successMessage = "";
  selectedCourseId = 0;
  discount = 0;
  actualFees = 0;
  finalFees = 0;

  studentForm = {
    branchId: 0,
    registrationDate: this.today(),
    studentName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    emailAddress: "",
    mobileNumber: "",
    whatsappNumber: "",
    parentName: "",
    parentNumber: "",
    aadharCardNumber: "",
    aadharCardPhoto: "",
    localAddress: "",
    permanentAddress: "",
    qualification: "",
    university: "",
    passingYear: 0,
    medium: "",
    percentage: 0,
    currentStatus: "Active",
    leadId: null as number | null,
    paymentDate: this.today(),
    paymentAmount: 0,
    paymentMode: "",
    paymentDescription: ""
  };

  ngOnInit(): void {
    this.branchApp.execute().subscribe({
      next: data => this.branches = Array.isArray(data) ? data : [],
      error: error => console.error("Branch API error:", error)
    });

    this.qualificationApp.getAll().subscribe({
      next: data => this.qualifications = Array.isArray(data) ? data : [],
      error: error => console.error("Qualification API error:", error)
    });

    this.dropdownLoading = true;
    this.courseApp.getAll().subscribe({
      next: data => {
        this.courses = (Array.isArray(data) ? data : [])
          .filter(c => Number(c.courseId) > 0);
        this.dropdownLoading = false;
      },
      error: error => {
        this.dropdownLoading = false;
        this.errorMessage = "Unable to load courses.";
        console.error("Course API error:", error);
      }
    });
  }

  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  onMobileChange(): void {
    this.studentForm.mobileNumber = this.studentForm.mobileNumber.replace(/\D/g, "").slice(0, 10);
  }

  onWhatsappChange(): void {
    this.studentForm.whatsappNumber = this.studentForm.whatsappNumber.replace(/\D/g, "").slice(0, 10);
  }

  onParentNumberChange(): void {
    this.studentForm.parentNumber = this.studentForm.parentNumber.replace(/\D/g, "").slice(0, 10);
  }

  onAadharNumberChange(): void {
    this.studentForm.aadharCardNumber = this.studentForm.aadharCardNumber.replace(/\D/g, "").slice(0, 12);
  }

  onAadharFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.errorMessage = "Select a PDF, JPG, PNG or WEBP file up to 5 MB.";
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        this.studentForm.aadharCardPhoto = reader.result;
        this.errorMessage = "";
      }
    };
    reader.onerror = () => this.errorMessage = "Unable to read Aadhaar document.";
    reader.readAsDataURL(file);
  }

  resetForm(): void {
    this.studentForm = {
      branchId: 0,
      registrationDate: this.today(),
      studentName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      emailAddress: "",
      mobileNumber: "",
      whatsappNumber: "",
      parentName: "",
      parentNumber: "",
      aadharCardNumber: "",
      aadharCardPhoto: "",
      localAddress: "",
      permanentAddress: "",
      qualification: "",
      university: "",
      passingYear: 0,
      medium: "",
      percentage: 0,
      currentStatus: "Active",
      leadId: null,
      paymentDate: this.today(),
      paymentAmount: 0,
      paymentMode: "",
      paymentDescription: ""
    };
    this.selectedCourseId = 0;
    this.discount = 0;
    this.actualFees = 0;
    this.finalFees = 0;
    this.errorMessage = "";
    this.successMessage = "";
  }

  closeForm(): void {
    this.closed.emit();
  }

  registerStudent(): void {
    this.errorMessage = "";
    this.successMessage = "";

    const f = this.studentForm;

    if (!f.studentName.trim() || !f.lastName.trim()) {
      this.errorMessage = "Enter first name and last name.";
      return;
    }
    if (!f.gender || !f.birthDate || !f.registrationDate || !f.paymentDate) {
      this.errorMessage = "Complete all required date and gender fields.";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.emailAddress.trim())) {
      this.errorMessage = "Enter a valid email address.";
      return;
    }
    if (!/^\d{10}$/.test(f.mobileNumber)) {
      this.errorMessage = "Mobile number must contain 10 digits.";
      return;
    }
    if (f.whatsappNumber && !/^\d{10}$/.test(f.whatsappNumber)) {
      this.errorMessage = "WhatsApp number must contain 10 digits.";
      return;
    }
    if (f.parentNumber && !/^\d{10}$/.test(f.parentNumber)) {
      this.errorMessage = "Parent number must contain 10 digits.";
      return;
    }
    if (f.aadharCardNumber && !/^\d{12}$/.test(f.aadharCardNumber)) {
      this.errorMessage = "Aadhaar number must contain 12 digits.";
      return;
    }
    if (Number(f.branchId) <= 0 || Number(this.selectedCourseId) <= 0) {
      this.errorMessage = "Select branch and course.";
      return;
    }
    if (this.discount > this.actualFees) {
      this.errorMessage = "Discount cannot be greater than course fees.";
      return;
    }
    if (!f.paymentMode || Number(f.paymentAmount) < 0) {
      this.errorMessage = "Enter valid payment details.";
      return;
    }

    const leadId = f.leadId === null || String(f.leadId).trim() === "" ? null : Number(f.leadId);

    const request: StudentRegistrationRequest = {
      ...f,
      leadId,
      courseId: Number(this.selectedCourseId),
      discount: Number(this.discount),
      paymentAmount: Number(f.paymentAmount),
      birthDate: new Date(f.birthDate).toISOString(),
      registrationDate: new Date(f.registrationDate).toISOString(),
      paymentDate: new Date(f.paymentDate).toISOString()
    };

    this.submitting = true;
    this.api.registerStudent(request).subscribe({
      next: response => {
        console.log("New student registration success:", response);
        this.submitting = false;
        this.successMessage = "Student registered successfully!";
        window.alert(this.successMessage);
        this.resetForm();
        this.saved.emit();
      },
      error: error => {
        console.error("New student registration error:", error);
        this.submitting = false;
        const errors = error?.error?.errors;
        this.errorMessage = errors
          ? Object.entries(errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join(" | ")
          : error?.error?.message || `Registration failed. HTTP status: ${error?.status ?? "Unknown"}.`;
      }
    });
  }
}
