import { Component, EventEmitter, OnInit, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { catchError, finalize, of, timeout } from "rxjs";
import { EnquiryApplication } from "src/UserManagement/Application/Enquiry/EnquiryApplication";
import { StudentRegistrationRequest } from "../../../Domain/DTOs/StudentRegistrationRequest";
import { StudentRegistrationApi } from "../../../Infrastructure/Api/StudentRegistrationApi";
import { StudentPaymentApi } from "../../../Infrastructure/Api/StudentPaymentApi";
import { GetAllBranches } from "src/UserManagement/Application/Branch/GetAllBranches";
import { QualificationApplication } from "src/UserManagement/Application/Qualification/QualificationApplication";
import { TrainingCourse as TrainingCourseApplication } from "src/UserManagement/Application/TrainingCourse/TrainingCourse";
import { Branch } from "src/UserManagement/Domain/Entities/Branch";
import { Qualification } from "src/UserManagement/Domain/Entities/Qualification";
import { TrainingCourse } from "src/UserManagement/Domain/Entities/TrainingCourse";
@Component({
  selector: "app-new-student-registration",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./NewStudentRegistration.html",
  styleUrl: "./NewStudentRegistration.css"
})
export class NewStudentRegistration implements OnInit {
  private api = inject(StudentRegistrationApi);
  private paymentApi = inject(StudentPaymentApi);
  private branchApp = inject(GetAllBranches);
  private qualificationApp = inject(QualificationApplication);
  private courseApp = inject(TrainingCourseApplication);
  private router = inject(Router);
  private enquiryApp = inject(EnquiryApplication);
  private sanitizer = inject(DomSanitizer);
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  branches: Branch[] = [];
  qualifications: Qualification[] = [];
  courses: TrainingCourse[] = [];
  enquiries: any[] = [];
  enquiriesLoading = false;
  selectedEnquiryId = "";
  submitting = false;
  dropdownLoading = false;
  errorMessage = "";
  successMessage = "";
  mobileNumberError = "";
  showRegistrationSuccessAlert = false;
  private pendingReceiptMobile = "";
  private pendingReceiptCourseId = 0;
  showPostRegistrationReceipt = false;
  receiptLoading = false;
  receiptError = "";
  receiptDownloading = false;
  receiptPdfUrl = "";
  receiptSafeUrl: SafeResourceUrl | null = null;
  private receiptObjectUrl = "";
  private receiptRegistrationId = 0;
  private receiptPaymentId = 0;
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
    // leadId: null as number | null,
    paymentDate: this.today(),
    paymentAmount: 0,
    paymentMode: "",
    paymentDescription: ""
  };
  ngOnInit(): void {
    // Load independent dropdowns in parallel; each request has its own error state.
    this.branchApp.execute().pipe(timeout(15000), catchError(error => {
      console.error("Branch API error:", error);
      this.errorMessage = "Branches could not be loaded. Please retry or contact support.";
      return of([] as Branch[]);
    })).subscribe(data => this.branches = Array.isArray(data) ? data : []);
    this.qualificationApp.getAll().pipe(timeout(15000), catchError(error => {
      console.error("Qualification API error:", error);
      return of([] as Qualification[]);
    })).subscribe(data => this.qualifications = Array.isArray(data) ? data : []);
    this.dropdownLoading = true;
    this.courseApp.getAll().pipe(
      catchError(error => {
        console.error("Course loading error:", error);
        return of([] as TrainingCourse[]);
      }),
      finalize(() => {
        this.dropdownLoading = false;
      })
    ).subscribe(data => {
      this.courses = (Array.isArray(data) ? data : [])
        .filter(c => Number(c.courseId) > 0);
      if (this.courses.length === 0) {
        this.errorMessage =
          "Courses are temporarily unavailable. Please retry.";
      } else {
        this.errorMessage = "";
      }
    });
    this.loadEnquiries();
  }
  private loadEnquiries(): void {
    this.enquiriesLoading = true;
    this.enquiryApp.getAll()
      .pipe(
        timeout(15000),
        catchError(error => {
          console.error("Enquiry API error:", error);
          this.errorMessage =
            "Enquiries could not be loaded. You can enter student details manually.";
          return of([]);
        }),
        finalize(() => {
          this.enquiriesLoading = false;
        })
      )
      .subscribe((response: any) => {
        const rows = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.result)
              ? response.result
              : Array.isArray(response?.items)
                ? response.items
                : Array.isArray(response?.$values)
                  ? response.$values
                  : [];
        this.enquiries = rows;
      });
  }
  onEnquirySelected(): void {
    const enquiry = this.enquiries.find(item => String(this.valueOf(item, "enquiryId", "enquiry_Id", "id")) === String(this.selectedEnquiryId));
    if (!enquiry) return;
    const fullName = String(this.valueOf(enquiry, "candidateName", "candidate_Name", "studentName", "name") ?? "").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const mobile = String(this.valueOf(enquiry, "mobileNumber", "mobile_Number", "mobile", "phone") ?? "").replace(/\D/g, "").slice(-10);
    const gender = String(this.valueOf(enquiry, "gender") ?? "");
    const qualificationId = this.valueOf(enquiry, "qualificationId", "qualification_Id");
    const qualificationFromId = this.qualifications.find(q => Number((q as any).qualificationId ?? (q as any).qualification_Id) === Number(qualificationId));
    const qualification = this.valueOf(enquiry, "qualification", "qualificationName") ?? qualificationFromId?.qualification;
    this.studentForm = {
      ...this.studentForm,
      studentName: nameParts[0] ?? this.studentForm.studentName,
      lastName: nameParts.slice(1).join(" ") || this.studentForm.lastName,
      gender: ["Male", "Female", "Other"].includes(gender) ? gender : this.studentForm.gender,
      birthDate: this.dateInputValue(this.valueOf(enquiry, "birthDate", "birth_Date")) || this.studentForm.birthDate,
      emailAddress: String(this.valueOf(enquiry, "emailAddress", "email_Address", "email") ?? this.studentForm.emailAddress),
      mobileNumber: mobile || this.studentForm.mobileNumber,
      localAddress: String(this.valueOf(enquiry, "localAddress", "local_Address", "address") ?? this.studentForm.localAddress),
      branchId: Number(this.valueOf(enquiry, "branchId", "branch_Id") ?? this.studentForm.branchId) || this.studentForm.branchId,
      qualification: String(qualification ?? qualificationId ?? this.studentForm.qualification),
    };
    this.errorMessage = "";
  }
  public valueOf(item: any, ...keys: string[]): any {
    for (const key of keys) if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
    return undefined;
  }
  private dateInputValue(value: any): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  private today(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  onCourseChange(): void {
    const course = this.courses.find(
      c => Number(c.courseId) === Number(this.selectedCourseId)
    );
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
    this.studentForm.mobileNumber =
      (this.studentForm.mobileNumber ?? "").replace(/\D/g, "").slice(0, 10);
    // If the field has already been validated, update its error while typing.
    if (this.mobileNumberError) {
      this.validateMobileNumber();
    }
  }
  onMobileBlur(): void {
    this.validateMobileNumber();
  }
  private validateMobileNumber(): boolean {
    const mobile = (this.studentForm.mobileNumber ?? "").trim();
    if (!mobile) {
      this.mobileNumberError = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      this.mobileNumberError = "Enter a valid 10-digit Indian mobile number.";
    } else {
      this.mobileNumberError = "";
    }
    return this.mobileNumberError === "";
  }
  onWhatsappChange(): void {
    this.studentForm.whatsappNumber =
      this.studentForm.whatsappNumber.replace(/\D/g, "").slice(0, 10);
  }
  onParentNumberChange(): void {
    this.studentForm.parentNumber =
      this.studentForm.parentNumber.replace(/\D/g, "").slice(0, 10);
  }
  onAadharNumberChange(): void {
    this.studentForm.aadharCardNumber =
      this.studentForm.aadharCardNumber.replace(/\D/g, "").slice(0, 12);
  }
  onAadharFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];
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
    reader.onerror = () => {
      this.errorMessage = "Unable to read Aadhaar document.";
    };
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
      paymentDate: this.today(),
      paymentAmount: 0,
      paymentMode: "",
      paymentDescription: ""
    };
    this.selectedCourseId = 0;
    this.selectedEnquiryId = "";
    this.discount = 0;
    this.actualFees = 0;
    this.finalFees = 0;
    this.errorMessage = "";
    this.successMessage = "";
  }
  backToStudents(): void {
    this.router.navigate(["/main/student-registration"]);
  }
  closeForm(): void {
    this.backToStudents();
  }
  registerStudent(): void {
    if (this.submitting) return;
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
    if (
      f.emailAddress.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.emailAddress.trim())
    ) {
      this.errorMessage = "Enter a valid email address.";
      return;
    }
    if (!this.validateMobileNumber()) {
      this.errorMessage = this.mobileNumberError;
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
    const request: StudentRegistrationRequest = {
      ...f,
      courseId: Number(this.selectedCourseId),
      discount: Number(this.discount),
      paymentAmount: Number(f.paymentAmount),
      birthDate: new Date(`${f.birthDate}T00:00:00`).toISOString(),
      registrationDate: new Date(`${f.registrationDate}T00:00:00`).toISOString(),
      paymentDate: new Date(`${f.paymentDate}T00:00:00`).toISOString()
    };
    this.submitting = true;
    this.api.registerStudent(request).subscribe({
      next: response => {
        console.log("New student registration success:", response);
        this.submitting = false;
        this.successMessage = "Student registered successfully.";
        this.mobileNumberError = "";
        this.receiptError = "";
        this.showRegistrationSuccessAlert = true;
        // Open the receipt only after the user clicks OK on the success alert.
        this.pendingReceiptMobile = f.mobileNumber;
        this.pendingReceiptCourseId = Number(this.selectedCourseId);
        const payload = this.unwrapResponse(response);
        this.receiptRegistrationId = Number(
          this.valueOf(payload, "registrationId", "registration_Id", "id") || 0
        );
        this.receiptPaymentId = Number(
          this.valueOf(payload, "paymentId", "payment_Id") || 0
        );
      },
      error: error => {
        console.error("New student registration error:", error);
        this.submitting = false;
        const errors = error?.error?.errors;
        if (errors) {
          const mobileErrorKey = Object.keys(errors).find(
            key => ["mobilenumber", "mobile_number"].includes(key.toLowerCase())
          );
          if (mobileErrorKey) {
            const value = (errors as Record<string, unknown>)[mobileErrorKey];
            this.mobileNumberError = Array.isArray(value)
              ? String(value[0] ?? "Enter a valid 10-digit mobile number.")
              : String(value ?? "Enter a valid 10-digit mobile number.");
          }
        }
        this.errorMessage = errors
          ? Object.entries(errors)
            .map(([key, value]) =>
              `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
            )
            .join(" | ")
          : error?.error?.message ||
          `Registration failed. HTTP status: ${error?.status ?? "Unknown"}.`;
      }
    });
  }
  private unwrapResponse(response: any): any {
    return response?.data ?? response?.result ?? response?.value ?? response ?? {};
  }
  confirmRegistrationSuccess(): void {
    this.showRegistrationSuccessAlert = false;
    this.showPostRegistrationReceipt = true;
    this.receiptLoading = true;
    this.receiptError = "";
    this.resolveAndLoadReceipt(
      this.pendingReceiptMobile,
      this.pendingReceiptCourseId
    );
  }
  private resolveAndLoadReceipt(mobile: string, courseId: number): void {
    // If API returned both IDs, go straight to the PDF. Otherwise refresh lists once.
    if (this.receiptRegistrationId > 0 && this.receiptPaymentId > 0) {
      this.fetchReceiptPdf();
      return;
    }
    this.api.getRegistrations().pipe(
      timeout(15000),
      catchError(error => {
        console.error("Unable to resolve new registration for receipt:", error);
        return of([] as any[]);
      })
    ).subscribe(regResponse => {
      const registrations = this.toArray(regResponse).map((item: any) => ({
        ...item,
        registrationId: Number(item?.registrationId ?? item?.registration_Id ?? item?.id ?? 0),
        mobileNumber: String(item?.mobileNumber ?? item?.mobile_Number ?? item?.mobile ?? ""),
        courseId: Number(item?.courseId ?? item?.course_Id ?? 0),
        studentName: String(item?.studentName ?? item?.student_Name ?? "")
      }));
      const matching = registrations.filter((item: any) =>
        item.mobileNumber.replace(/\D/g, "").slice(-10) === mobile.replace(/\D/g, "").slice(-10) &&
        (!item.courseId || item.courseId === courseId)
      ).sort((a: any, b: any) => b.registrationId - a.registrationId);
      if (!this.receiptRegistrationId) this.receiptRegistrationId = Number(matching[0]?.registrationId || 0);
      this.paymentApi.getAllPayments().pipe(
        timeout(15000),
        catchError(error => {
          console.error("Unable to resolve payment for receipt:", error);
          return of([] as any[]);
        })
      ).subscribe(paymentResponse => {
        const payments = this.toArray(paymentResponse).map((item: any) => ({
          ...item,
          paymentId: Number(item?.paymentId ?? item?.payment_Id ?? item?.paymentID ?? 0),
          registrationId: Number(item?.registrationId ?? item?.registration_Id ?? 0),
          courseId: Number(item?.courseId ?? item?.course_Id ?? 0),
          paymentDate: item?.paymentDate ?? item?.payment_Date ?? ""
        }));
        const matchingPayments = payments.filter((item: any) =>
          (this.receiptRegistrationId > 0 && item.registrationId === this.receiptRegistrationId) ||
          (!this.receiptRegistrationId && item.courseId === courseId && matching.length > 0 && item.registrationId === matching[0].registrationId)
        ).sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        if (!this.receiptRegistrationId && matchingPayments[0]) this.receiptRegistrationId = matchingPayments[0].registrationId;
        if (!this.receiptPaymentId && matchingPayments[0]) this.receiptPaymentId = matchingPayments[0].paymentId;
        if (this.receiptRegistrationId > 0 && this.receiptPaymentId > 0) {
          this.fetchReceiptPdf();
        } else {
          this.receiptLoading = false;
          this.receiptError = "Student registered successfully, but the payment receipt could not be identified automatically. You can find it in Accountant → Student Payments.";
        }
      });
    });
  }
  private toArray(response: any): any[] {
    const value = response?.data ?? response?.result ?? response;
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.$values)) return value.$values;
    if (Array.isArray(response?.$values)) return response.$values;
    return [];
  }
  private fetchReceiptPdf(): void {
    if (!this.receiptRegistrationId || !this.receiptPaymentId) {
      this.receiptLoading = false;
      this.receiptError = "Receipt identifiers are missing. Please open the receipt from Student Payments.";
      return;
    }
    this.paymentApi.downloadInvoice(this.receiptRegistrationId, this.receiptPaymentId).pipe(
      timeout(20000),
      catchError(error => {
        console.error("Receipt PDF request failed:", error);
        this.receiptError = error?.status === 404
          ? "The backend receipt download endpoint returned 404. Please verify the invoice/download route."
          : "Student was registered, but the receipt could not be loaded. You can download it later from Student Payments.";
        return of(null);
      }),
      finalize(() => this.receiptLoading = false)
    ).subscribe(blob => {
      if (!blob || !(blob instanceof Blob) || blob.size === 0) return;
      if (this.receiptObjectUrl) URL.revokeObjectURL(this.receiptObjectUrl);
      this.receiptObjectUrl = URL.createObjectURL(blob);
      this.receiptPdfUrl = this.receiptObjectUrl;
      this.receiptSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.receiptObjectUrl);
    });
  }
  downloadPostRegistrationReceipt(): void {
    if (!this.receiptPdfUrl || this.receiptDownloading) return;
    this.receiptDownloading = true;
    const anchor = document.createElement("a");
    anchor.href = this.receiptPdfUrl;
    anchor.download = `Payment-Receipt-${this.receiptPaymentId}.pdf`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    this.receiptDownloading = false;
  }
  printPostRegistrationReceipt(): void {
    if (!this.receiptPdfUrl) return;
    const printWindow = window.open(this.receiptPdfUrl, "_blank");
    if (!printWindow) {
      this.receiptError = "Your browser blocked the receipt window. Allow pop-ups or download the PDF and print it.";
      return;
    }
    // Browser PDF viewer provides the print control; avoid auto-print before it has rendered.
  }
  closePostRegistrationReceipt(): void {
    this.showPostRegistrationReceipt = false;
    this.receiptLoading = false;
    this.receiptPdfUrl = "";
    this.receiptSafeUrl = null;
    if (this.receiptObjectUrl) URL.revokeObjectURL(this.receiptObjectUrl);
    this.receiptObjectUrl = "";
    this.saved.emit();
    this.router.navigate(["/main/student-registration"]);
  }

  currentStep = 1;

nextStep(): void {
  if (this.currentStep < 4) {
    this.currentStep++;
  }
}

previousStep(): void {
  if (this.currentStep > 1) {
    this.currentStep--;
  }
}


sameAsLocalAddress = false;

onLocalAddressChange(): void {
  if (this.sameAsLocalAddress) {
    this.studentForm.permanentAddress =
      this.studentForm.localAddress;
  }
}

onSameAddressChange(): void {
  if (this.sameAsLocalAddress) {
    this.studentForm.permanentAddress =
      this.studentForm.localAddress;
  }
}

}
