import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { forkJoin, of } from "rxjs";
import { catchError, finalize, timeout } from "rxjs/operators";

import { StudentDetailsService } from "../../Application/StudentDetails/StudentDetails";
import { StudentRegistrationApi } from "../../Infrastructure/Api/StudentRegistrationApi";
import { StudentPaymentService } from "../../Application/StudentPayment/StudentPaymentService";

interface StudentCourseDetail {
  registrationCode: string;
  courseName: string;
  courseFees: number | null;
  discount: number | null;
  finalFees: number | null;
  totalPaid: number | null;
  remainingBalance: number | null;
  status: string;
}

interface StudentPaymentDetail {
  paymentDate: string;
  amount: number | null;
  paymentMode: string;
  description: string;
  status: string;
}

interface StudentDetailModel {
  studentId: number | null;
  firstName: string;
  studentName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  whatsAppNumber: string;
  emailAddress: string;
  parentName: string;
  parentMobileNumber: string;
  aadhaarNumber: string;
  localAddress: string;
  permanentAddress: string;
  qualification: string;
  universityBoard: string;
  passingYear: number | null;
  medium: string;
  percentageCgpa: number | string | null;
  courses: StudentCourseDetail[];
  payments: StudentPaymentDetail[];
}

@Component({
  selector: "app-student-details",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./StudentDetails.html",
  styleUrl: "./StudentDetails.css"
})
export class StudentDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly studentDetailsService = inject(StudentDetailsService);
  private readonly studentRegistrationApi = inject(StudentRegistrationApi);
  private readonly studentPaymentService = inject(StudentPaymentService);

  loading = false;
  errorMessage = "";
  student: StudentDetailModel = this.emptyStudent();

  ngOnInit(): void {
    const routeIdValue =
      this.route.snapshot.paramMap.get("studentId") ??
      this.route.snapshot.paramMap.get("id");

    const studentId = Number(routeIdValue);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      this.errorMessage = "Invalid Student ID. Please go back and select a student.";
      this.cdr.detectChanges();
      return;
    }

    this.loadStudentDetails(studentId);
  }

  loadStudentDetails(studentId: number): void {
    this.loading = true;
    this.errorMessage = "";
    this.student = this.emptyStudent();
    this.cdr.detectChanges();

    forkJoin({
      detailsResponse: this.studentDetailsService.getAllStudentDetails(true).pipe(
        timeout(20000),
        catchError(error => {
          console.error("[StudentDetails] StudentDetails API failed:", error);
          return of(null);
        })
      ),
      registrationResponse: this.studentRegistrationApi.getRegistrations().pipe(
        timeout(20000),
        catchError(error => {
          console.error("[StudentDetails] StudentRegistration API failed:", error);
          return of(null);
        })
      ),
      paymentResponse: this.studentPaymentService.getAllPayments().pipe(
        timeout(20000),
        catchError(error => {
          console.error("[StudentDetails] StudentPayment API failed:", error);
          return of(null);
        })
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ({ detailsResponse, registrationResponse, paymentResponse }) => {
        console.group("[StudentDetails] API responses");
        console.log("StudentDetails response:", detailsResponse);
        console.log("StudentRegistration response:", registrationResponse);
        console.log("StudentPayment response:", paymentResponse);
        console.groupEnd();

        const detailsRows = this.extractRows(detailsResponse);
        const registrationRows = this.extractRows(registrationResponse);
        const paymentRows = this.extractRows(paymentResponse);

        // New API shape: data[] contains student records, and each student
        // contains qualifications[], registrations[], and nested payments[].
        const registrationStudent = registrationRows.find(
          row => this.getStudentId(row) === studentId
        );

        const detailRecord = detailsRows.find(
          row => this.getStudentId(row) === studentId
        );

        // Prefer the dedicated student-details record; use the new
        // StudentRegistration/get-all student record as a fallback.
        const profile = detailRecord ?? registrationStudent ?? {};

        const nestedQualifications = this.getArray(
          profile,
          "qualifications",
          "Qualifications",
          "studentQualifications",
          "student_Qualifications"
        );

        const qualificationSource =
          nestedQualifications[0] ??
          registrationStudent?.["qualifications"]?.[0] ??
          {};

        // New API: registrations are nested inside the student record.
        // Keep compatibility with the older flat registration response.
        const nestedRegistrations = this.getArray(
          registrationStudent ?? profile,
          "registrations",
          "Registrations"
        );

        const selectedRegistrations = nestedRegistrations.length
          ? nestedRegistrations
          : registrationRows.filter(row => this.getStudentId(row) === studentId);

        // StudentPayment/get-all is the authoritative source for the latest
        // fee snapshot of each registration. Keep all its rows for payment history.
        const apiPaymentsForStudent = paymentRows.filter(
          payment => this.getStudentId(payment) === studentId
        );

        // Use nested payments only if the payment endpoint has no records
        // for this student.
        const nestedPayments = selectedRegistrations.flatMap(registration => {
          const registrationId = this.getNumber(
            registration,
            "registrationId",
            "registration_Id",
            "registrationID"
          );
          return this.getArray(registration, "payments", "Payments").map(payment => ({
            ...payment,
            registrationId:
              this.getNumber(payment, "registrationId", "registration_Id") ??
              registrationId,
            studentId
          }));
        });

        const selectedPayments = this.uniquePayments(
          apiPaymentsForStudent.length ? apiPaymentsForStudent : nestedPayments
        );

        // Latest paymentDate record is the latest receipt snapshot for each registration.
        // Fee totals are read directly from that receipt; they are not recalculated.
        const latestReceiptByRegistration = new Map<number, Record<string, any>>();
        for (const payment of [...selectedPayments].sort(
          (a, b) => this.getPaymentTimestamp(b) - this.getPaymentTimestamp(a)
        )) {
          const registrationId = this.getNumber(
            payment,
            "registrationId",
            "registration_Id",
            "registrationID"
          );
          if (registrationId !== null && !latestReceiptByRegistration.has(registrationId)) {
            latestReceiptByRegistration.set(registrationId, payment);
          }
        }

        console.log("[StudentDetails] Matched records:", {
          studentId,
          profileFound: !!profile && Object.keys(profile).length > 0,
          qualificationCount: nestedQualifications.length,
          registrationCount: selectedRegistrations.length,
          nestedPaymentCount: nestedPayments.length,
          matchedPaymentCount: selectedPayments.length
        });

        this.student = this.mapStudent(
          profile,
          qualificationSource,
          studentId
        );

        const registrationById = new Map<number, Record<string, any>>();
        for (const registration of selectedRegistrations) {
          const registrationId = this.getNumber(
            registration,
            "registrationId",
            "registration_Id",
            "registrationID"
          );
          if (registrationId !== null) {
            registrationById.set(registrationId, registration);
          }
        }

        // Include registrations present in payment data even if registration API
        // has not returned them yet.
        for (const [registrationId, receipt] of latestReceiptByRegistration) {
          if (!registrationById.has(registrationId)) {
            registrationById.set(registrationId, receipt);
          }
        }

        this.student.courses = [...registrationById.entries()].map(
          ([registrationId, registration]) => {
            const latestReceipt = latestReceiptByRegistration.get(registrationId);
            const feeSource = latestReceipt ?? registration;

            return {
              registrationCode:
                this.toText(feeSource, "registrationCode", "registration_Code") ||
                this.toText(registration, "registrationCode", "registration_Code"),
              courseName:
                this.toText(feeSource, "courseName", "course_Name") ||
                this.toText(registration, "courseName", "course_Name"),
              courseFees: this.getNumber(
                feeSource,
                "courseFees",
                "course_Fees",
                "courseFeesAmount",
                "feesAmount"
              ),
              discount: this.getNumber(
                feeSource,
                "discount",
                "discountAmount",
                "discount_Amount"
              ),
              finalFees: this.getNumber(
                feeSource,
                "finalFees",
                "final_Fees",
                "final_Course_Fees",
                "finalCourseFees"
              ),
              totalPaid: this.getNumber(
                feeSource,
                "totalPaid",
                "total_Paid",
                "totalReceivedFees",
                "total_Received_Fees"
              ),
              remainingBalance: this.getNumber(
                feeSource,
                "remainingBalance",
                "remaining_Balance",
                "remainingFees",
                "remaining_Fees",
                "balanceAmount"
              ),
              status:
                this.toText(registration, "currentStatus", "current_Status", "status") ||
                this.toText(feeSource, "status", "paymentStatus", "payment_Status")
            };
          }
        ).filter(course => !!course.courseName || !!course.registrationCode);

        this.student.payments = selectedPayments.map(payment => ({
          paymentDate: this.toText(payment, "paymentDate", "payment_Date"),
          amount: this.getNumber(payment, "paymentAmount", "payment_Amount", "amount"),
          paymentMode: this.toText(payment, "paymentMode", "payment_Mode"),
          description: this.toText(
            payment,
            "description",
            "paymentDescription",
            "payment_Description"
          ),
          status: this.toText(
            payment,
            "status",
            "paymentStatus",
            "payment_Status",
            "isPaid",
            "is_Paid"
          )
        }));

        console.log("[StudentDetails] Final view model:", this.student);

        if (
          !detailRecord &&
          !registrationStudent &&
          selectedRegistrations.length === 0
        ) {
          this.errorMessage =
            `No details were found for Student ID ${studentId}. ` +
            "Check that this ID exists in the API responses.";
        } else if (!detailRecord && registrationStudent) {
          console.info(
            "[StudentDetails] Student profile was mapped from StudentRegistration/get-all."
          );
        }

        this.cdr.detectChanges();
      },
      error: error => {
        console.error("[StudentDetails] Unexpected combined API error:", error);
        this.errorMessage =
          "Unable to load student details. Check the browser console and try again.";
        this.cdr.detectChanges();
      }
    });
  }

  get totalPaid(): number {
    return this.student.payments.reduce(
      (total, payment) => total + (Number(payment.amount) || 0),
      0
    );
  }

  goBack(): void {
    this.location.back();
  }

  getReceivedFees(course: StudentCourseDetail): number | string {
    return course.totalPaid !== null && Number.isFinite(course.totalPaid)
      ? course.totalPaid
      : "-";
  }

  getRemainingFees(course: StudentCourseDetail): number | string {
    return course.remainingBalance !== null &&
      Number.isFinite(course.remainingBalance)
      ? course.remainingBalance
      : "-";
  }

  private getPaymentTimestamp(payment: Record<string, any>): number {
    const value = this.firstValue(payment, "paymentDate", "payment_Date");
    if (!value) {
      return 0;
    }
    const timestamp = new Date(String(value)).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private extractRows(response: any): Record<string, any>[] {
    if (Array.isArray(response)) {
      return response;
    }

    const candidates = [
      response?.data,
      response?.result,
      response?.items,
      response?.payments,
      response?.registrations,
      response?.studentDetails,
      response?.$values,
      response?.data?.$values,
      response?.result?.$values
    ];

    return candidates.find(Array.isArray) ?? [];
  }

  private getArray(row: any, ...keys: string[]): Record<string, any>[] {
    for (const key of keys) {
      const value = row?.[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
    return [];
  }

  private getStudentId(row: Record<string, any>): number {
    return this.getNumber(
      row,
      "studentId",
      "student_Id",
      "studentID",
      "student_id"
    ) ?? 0;
  }

  private getNumber(
    row: Record<string, any>,
    ...keys: string[]
  ): number | null {
    const value = this.firstValue(row, ...keys);

    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private toText(row: Record<string, any>, ...keys: string[]): string {
    const value = this.firstValue(row, ...keys);
    return value === null || value === undefined ? "" : String(value);
  }

  private firstValue(row: Record<string, any>, ...keys: string[]): any {
    for (const key of keys) {
      const value = row?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  }

  private uniquePayments(rows: Record<string, any>[]): Record<string, any>[] {
    const seen = new Set<string>();

    return rows.filter((row, index) => {
      const paymentId = this.firstValue(
        row,
        "paymentId",
        "payment_Id",
        "paymentID"
      );

      const key = paymentId !== null
        ? `payment-${paymentId}`
        : `fallback-${this.toText(row, "registrationId", "registration_Id")}-` +
        `${this.toText(row, "paymentDate", "payment_Date")}-` +
        `${this.toText(row, "paymentAmount", "payment_Amount", "amount")}-${index}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  private mapStudent(
    profile: Record<string, any>,
    qualificationSource: Record<string, any>,
    routeStudentId: number
  ): StudentDetailModel {
    const value = (...keys: string[]) =>
      this.firstValue(profile, ...keys) ??
      this.firstValue(qualificationSource, ...keys);

    const name = String(
      value(
        "studentName",
        "student_Name",
        "firstName",
        "first_Name",
        "candidateName"
      ) ?? ""
    );

    return {
      ...this.emptyStudent(),
      studentId: this.getNumber(
        profile,
        "studentId",
        "student_Id",
        "studentID",
        "student_id"
      ) ?? routeStudentId,
      firstName: String(
        value(
          "firstName",
          "first_Name",
          "studentName",
          "student_Name",
          "candidateName"
        ) ?? name
      ),
      studentName: name,
      lastName: String(value("lastName", "last_Name") ?? ""),
      dateOfBirth: String(
        value("birthDate", "birth_Date", "dateOfBirth", "date_of_birth") ?? ""
      ),
      gender: String(value("gender") ?? ""),
      mobileNumber: String(
        value("mobileNumber", "mobile_Number", "mobile") ?? ""
      ),
      whatsAppNumber: String(
        value("whatsappNumber", "whatsapp_Number", "whatsAppNumber") ?? ""
      ),
      emailAddress: String(
        value("emailAddress", "email_Address", "email") ?? ""
      ),
      parentName: String(value("parentName", "parent_Name") ?? ""),
      parentMobileNumber: String(
        value(
          "parentNumber",
          "parent_Number",
          "parentMobileNumber",
          "parent_Mobile_Number"
        ) ?? ""
      ),
      aadhaarNumber: String(
        value(
          "aadharCardNumber",
          "aadhar_Card_Number",
          "aadhaarNumber",
          "aadhaar_Number",
          "permanentIdentificationNumber"
        ) ?? ""
      ),
      localAddress: String(value("localAddress", "local_Address") ?? ""),
      permanentAddress: String(
        value("permanentAddress", "permanent_Address") ?? ""
      ),
      qualification: String(
        this.firstValue(
          qualificationSource,
          "qualificationName",
          "qualification_Name",
          "qualification"
        ) ??
        this.firstValue(
          profile,
          "qualification",
          "qualificationName",
          "qualification_Name",
          "studentQualification",
          "student_Qualification"
        ) ?? ""
      ),
      universityBoard: String(
        value("university", "universityBoard", "university_Board", "boardName") ?? ""
      ),
      passingYear:
        this.getNumber(qualificationSource, "passingYear", "passing_Year") ??
        this.getNumber(profile, "passingYear", "passing_Year"),
      medium: String(value("medium") ?? ""),
      percentageCgpa:
        value("percentage", "percentageCgpa", "percentage_Cgpa", "cgpa") ?? null,
      courses: [],
      payments: []
    };
  }

  private emptyStudent(): StudentDetailModel {
    return {
      studentId: null,
      firstName: "",
      studentName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      mobileNumber: "",
      whatsAppNumber: "",
      emailAddress: "",
      parentName: "",
      parentMobileNumber: "",
      aadhaarNumber: "",
      localAddress: "",
      permanentAddress: "",
      qualification: "",
      universityBoard: "",
      passingYear: null,
      medium: "",
      percentageCgpa: null,
      courses: [],
      payments: []
    };
  }
}
