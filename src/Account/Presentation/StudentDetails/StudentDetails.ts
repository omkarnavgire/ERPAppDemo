
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

import { StudentDetailsService } from
  "../../Application/StudentDetails/StudentDetails";

import { StudentRegistrationApi } from
  "../../Infrastructure/Api/StudentRegistrationApi";

import { StudentPaymentService } from
  "../../Application/StudentPayment/StudentPaymentService";


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

  private readonly studentDetailsService =
    inject(StudentDetailsService);

  private readonly studentRegistrationApi =
    inject(StudentRegistrationApi);

  private readonly studentPaymentService =
    inject(StudentPaymentService);

  loading = false;
  errorMessage = "";

  student: StudentDetailModel = this.emptyStudent();

  ngOnInit(): void {
    const routeIdValue =
      this.route.snapshot.paramMap.get("studentId") ??
      this.route.snapshot.paramMap.get("id");

    const studentId = Number(routeIdValue);

    console.log(
      "[StudentDetails] Route student ID:",
      studentId
    );

    if (!Number.isInteger(studentId) || studentId <= 0) {
      this.errorMessage =
        "Invalid Student ID. Please go back and select a student.";

      console.error(
        "[StudentDetails] Invalid route ID:",
        routeIdValue
      );

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
      detailsResponse: this.studentDetailsService
        .getAllStudentDetails(true)
        .pipe(
          timeout(20000),
          catchError(error => {
            console.error(
              "[StudentDetails] StudentDetails API failed:",
              error
            );
            return of(null);
          })
        ),

      registrationResponse: this.studentRegistrationApi
        .getRegistrations()
        .pipe(
          timeout(20000),
          catchError(error => {
            console.error(
              "[StudentDetails] StudentRegistration API failed:",
              error
            );
            return of(null);
          })
        ),

      paymentResponse: this.studentPaymentService
        .getAllPayments()
        .pipe(
          timeout(20000),
          catchError(error => {
            console.error(
              "[StudentDetails] StudentPayment API failed:",
              error
            );
            return of(null);
          })
        )
    })
      .pipe(
        finalize(() => {
          this.loading = false;

          console.log(
            "[StudentDetails] Loading finished."
          );

          // Update the HTML after all API requests finish.
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({
          detailsResponse,
          registrationResponse,
          paymentResponse
        }) => {

          console.group("[StudentDetails] API responses");

          console.log(
            "StudentDetails response:",
            detailsResponse
          );

          console.log(
            "StudentRegistration response:",
            registrationResponse
          );

          console.log(
            "StudentPayment response:",
            paymentResponse
          );

          console.groupEnd();

          const detailsRows =
            this.extractRows(detailsResponse);

          const registrationRows =
            this.extractRows(registrationResponse);

          const paymentRows =
            this.extractRows(paymentResponse);

          console.log(
            "[StudentDetails] Normalized response counts:",
            {
              details: detailsRows.length,
              registrations: registrationRows.length,
              payments: paymentRows.length,
              selectedStudentId: studentId
            }
          );

          const detailRecord = detailsRows.find(
            row => this.getStudentId(row) === studentId
          );

          const selectedRegistrations =
            registrationRows.filter(
              row => this.getStudentId(row) === studentId
            );

          const selectedRegistrationIds = new Set(
            selectedRegistrations
              .map(row =>
                this.getNumber(
                  row,
                  "registrationId",
                  "registration_Id",
                  "registrationID"
                )
              )
              .filter(
                (id): id is number =>
                  id !== null && id > 0
              )
          );

          const selectedPayments = paymentRows.filter(row => {
            const paymentStudentId =
              this.getStudentId(row);

            if (paymentStudentId > 0) {
              return paymentStudentId === studentId;
            }

            const registrationId = this.getNumber(
              row,
              "registrationId",
              "registration_Id",
              "registrationID"
            );

            return registrationId !== null &&
              selectedRegistrationIds.has(registrationId);
          });

          console.log(
            "[StudentDetails] Matched data:",
            {
              selectedStudentId: studentId,
              detailRecordFound: !!detailRecord,
              registrations: selectedRegistrations,
              payments: selectedPayments,
              registrationIds:
                Array.from(selectedRegistrationIds)
            }
          );

          const qualificationSource =
            selectedRegistrations.find(row =>
              this.firstValue(
                row,
                "qualification",
                "qualification_Name",
                "qualificationName",
                "student_Qualification"
              ) !== null
            ) ?? {};

          const profile = detailRecord ?? {};

          this.student = this.mapStudent(
            profile,
            qualificationSource,
            studentId
          );

          // Build each registered course from the registration record, then
          // enrich it with the fee summary supplied by StudentPayment/get-all.
          // The payment API contains courseFees, finalFees, totalPaid and
          // remainingBalance, while StudentRegistration/get-all may omit them.
          this.student.courses = selectedRegistrations
            .map(registration => {
              const registrationId = this.getNumber(
                registration,
                "registrationId",
                "registration_Id",
                "registrationID"
              );

              const matchingPayment = selectedPayments.find(payment => {
                const paymentRegistrationId = this.getNumber(
                  payment,
                  "registrationId",
                  "registration_Id",
                  "registrationID"
                );

                return registrationId !== null &&
                  paymentRegistrationId === registrationId;
              });

              const feeSource = matchingPayment ?? registration;

              return {
                registrationCode:
                  this.toText(
                    registration,
                    "registrationCode",
                    "registration_Code"
                  ) ||
                  this.toText(
                    feeSource,
                    "registrationCode",
                    "registration_Code"
                  ),

                courseName:
                  this.toText(registration, "courseName", "course_Name") ||
                  this.toText(feeSource, "courseName", "course_Name"),

                courseFees: this.getNumber(
                  feeSource,
                  "courseFees",
                  "course_Fees",
                  "courseFeesAmount",
                  "feesAmount",
                  "actualFees",
                  "courseFee",
                  "course_Fee"
                ),

                discount: this.getNumber(
                  feeSource,
                  "discount",
                  "discountAmount",
                  "discount_Amount"
                ) ?? 0,

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
                  "total_Received_Fees",
                  "receivedFees",
                  "received_Fees"
                ),

                remainingBalance: this.getNumber(
                  feeSource,
                  "remainingBalance",
                  "remaining_Balance",
                  "remainingFees",
                  "remaining_Fees",
                  "balanceAmount"
                ),

                status: this.toText(
                  registration,
                  "currentStatus",
                  "current_Status",
                  "status"
                ) || this.toText(
                  feeSource,
                  "currentStatus",
                  "current_Status",
                  "status"
                )
              };
            })
            .filter(course =>
              !!course.courseName || !!course.registrationCode
            );

          console.log(
            "[StudentDetails] Final course fee summaries:",
            this.student.courses
          );

          const paymentSource =
            selectedPayments.length > 0
              ? selectedPayments
              : selectedRegistrations.filter(row =>
                  this.firstValue(
                    row,
                    "paymentId",
                    "payment_Id",
                    "paymentID"
                  ) !== null ||
                  this.firstValue(
                    row,
                    "paymentAmount",
                    "payment_Amount"
                  ) !== null
                );

          this.student.payments =
            this.uniquePayments(paymentSource).map(row => ({
              paymentDate: this.toText(
                row,
                "paymentDate",
                "payment_Date"
              ),

              amount: this.getNumber(
                row,
                "amount",
                "paymentAmount",
                "payment_Amount"
              ),

              paymentMode: this.toText(
                row,
                "paymentMode",
                "payment_Mode"
              ),

              description: this.toText(
                row,
                "description",
                "paymentDescription",
                "payment_Description"
              ),

              status: this.toText(
                row,
                "status",
                "paymentStatus",
                "payment_Status",
                "isPaid",
                "is_Paid"
              )
            }));

          console.log(
            "[StudentDetails] Final view model:",
            this.student
          );

          if (
            !detailRecord &&
            selectedRegistrations.length === 0 &&
            selectedPayments.length === 0
          ) {
            this.errorMessage =
              `No details were found for Student ID ${studentId}. ` +
              "Check that this ID exists in the API responses.";
          } else if (!detailRecord) {
            this.errorMessage =
              `Personal details were not found for Student ID ${studentId}; ` +
              "available registration/payment data is shown if present.";
          }

          // Immediately update Student ID and all HTML bindings.
          this.cdr.detectChanges();
        },

        error: error => {
          console.error(
            "[StudentDetails] Unexpected combined API error:",
            error
          );

          this.errorMessage =
            "Unable to load student details. " +
            "Check the browser console and try again.";

          this.cdr.detectChanges();
        }
      });
  }

  get totalPaid(): number {
    return this.student.payments.reduce(
      (total, payment) =>
        total + (Number(payment.amount) || 0),
      0
    );
  }

  goBack(): void {
    this.location.back();
  }

  private extractRows(
    response: any
  ): Record<string, any>[] {

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

    const rows = candidates.find(Array.isArray);

    return rows ?? [];
  }

  private getStudentId(
    row: Record<string, any>
  ): number {
    return this.getNumber(
      row,
      "studentId",
      "student_Id",
      "studentID"
    ) ?? 0;
  }

  private getNumber(
    row: Record<string, any>,
    ...keys: string[]
  ): number | null {

    const value = this.firstValue(row, ...keys);

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : null;
  }

  private toText(
    row: Record<string, any>,
    ...keys: string[]
  ): string {

    const value = this.firstValue(row, ...keys);

    return value === null || value === undefined
      ? ""
      : String(value);
  }

  private firstValue(
    row: Record<string, any>,
    ...keys: string[]
  ): any {

    for (const key of keys) {
      const value = row?.[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return null;
  }

  private uniquePayments(
    rows: Record<string, any>[]
  ): Record<string, any>[] {

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
        : `fallback-${this.toText(
            row,
            "registrationId",
            "registration_Id"
          )}-${this.toText(
            row,
            "paymentDate",
            "payment_Date"
          )}-${this.toText(
            row,
            "paymentAmount",
            "payment_Amount",
            "amount"
          )}-${index}`;

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

      studentId:
        this.getNumber(
          profile,
          "studentId",
          "student_Id",
          "studentID"
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

      lastName: String(
        value("lastName", "last_Name") ?? ""
      ),

      dateOfBirth: String(
        value(
          "birthDate",
          "birth_Date",
          "dateOfBirth",
          "date_of_birth"
        ) ?? ""
      ),

      gender: String(value("gender") ?? ""),

      mobileNumber: String(
        value(
          "mobileNumber",
          "mobile_Number",
          "mobile"
        ) ?? ""
      ),

      whatsAppNumber: String(
        value(
          "whatsappNumber",
          "whatsapp_Number",
          "whatsAppNumber"
        ) ?? ""
      ),

      emailAddress: String(
        value(
          "emailAddress",
          "email_Address",
          "email"
        ) ?? ""
      ),

      parentName: String(
        value("parentName", "parent_Name") ?? ""
      ),

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

      localAddress: String(
        value("localAddress", "local_Address") ?? ""
      ),

      permanentAddress: String(
        value(
          "permanentAddress",
          "permanent_Address"
        ) ?? ""
      ),

      qualification: String(
        value(
          "qualification",
          "qualificationName",
          "qualification_Name",
          "studentQualification",
          "student_Qualification"
        ) ?? ""
      ),

      universityBoard: String(
        value(
          "university",
          "universityBoard",
          "university_Board",
          "boardName"
        ) ?? ""
      ),

      passingYear:
        this.getNumber(
          qualificationSource,
          "passingYear",
          "passing_Year"
        ) ??
        this.getNumber(
          profile,
          "passingYear",
          "passing_Year"
        ),

      medium: String(value("medium") ?? ""),

      percentageCgpa:
        value(
          "percentage",
          "percentageCgpa",
          "percentage_Cgpa",
          "cgpa"
        ) ?? null,

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

  
getReceivedFees(course: StudentCourseDetail): number | string {
    // Prefer the amount returned by the registration API for this course.
    if (course.totalPaid !== null && Number.isFinite(course.totalPaid)) {
      return course.totalPaid;
    }

    // Payment API records are student-level in this component. Only use their
    // total as a fallback when there is exactly one registered course.
    if (this.student.courses.length === 1) {
      return this.totalPaid;
    }

    return "-";
  }

  getRemainingFees(course: StudentCourseDetail): number | string {
    // Prefer the API-calculated balance for this course.
    if (
      course.remainingBalance !== null &&
      Number.isFinite(course.remainingBalance)
    ) {
      return course.remainingBalance;
    }

    const finalFees = course.finalFees;
    const receivedFees = this.getReceivedFees(course);

    if (
      finalFees === null ||
      typeof receivedFees !== "number" ||
      !Number.isFinite(finalFees)
    ) {
      return "-";
    }

    return Math.max(0, finalFees - receivedFees);
  }

}
