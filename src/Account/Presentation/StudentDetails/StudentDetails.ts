
import { Component, OnInit, inject } from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import { ActivatedRoute } from "@angular/router";

interface StudentCourseDetail {
  registrationCode: string;
  courseName: string;
  courseFees: number | null;
  discount: number | null;
  finalFees: number | null;
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

  loading = false;
  errorMessage = "";

  student: StudentDetailModel = this.emptyStudent();

  ngOnInit(): void {
    const navigationState = history.state as {
      student?: Record<string, any>;
    };

    const routeId = Number(
      this.route.snapshot.paramMap.get("studentId")
    );

    const incomingStudent = navigationState?.student;

    if (incomingStudent) {
      this.student = this.mapStudent(incomingStudent);

      // If the student was passed through navigation state,
      // the list data is displayed immediately.
      return;
    }

    if (routeId > 0) {
      this.student.studentId = routeId;
      this.errorMessage =
        "Student ID was received, but full details are unavailable. " +
        "Connect the student details API to load personal, qualification, " +
        "course and payment information.";
      return;
    }

    this.errorMessage =
      "No student was selected. Please go back and select a student.";
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

  private mapStudent(
    source: Record<string, any>
  ): StudentDetailModel {

    // Bracket notation avoids TS4111 errors.
    const get = (...keys: string[]): any => {
      for (const key of keys) {
        const value = source[key];

        if (value !== undefined && value !== null) {
          return value;
        }
      }

      return null;
    };

    const rawCourses = get("courses");
    const rawPayments = get("payments");

    return {
      ...this.emptyStudent(),

      studentId:
        Number(get("studentId", "student_Id", "studentID")) || null,

      firstName: String(
        get("firstName", "first_Name") ?? ""
      ),

      studentName: String(
        get("studentName", "student_Name", "candidateName") ?? ""
      ),

      lastName: String(
        get("lastName", "last_Name") ?? ""
      ),

      dateOfBirth: String(
        get("dateOfBirth", "date_of_birth") ?? ""
      ),

      gender: String(
        get("gender") ?? ""
      ),

      mobileNumber: String(
        get("mobileNumber", "mobile_Number", "mobile") ?? ""
      ),

      whatsAppNumber: String(
        get("whatsAppNumber", "whatsapp_Number", "whatsappNumber") ?? ""
      ),

      emailAddress: String(
        get("emailAddress", "email_Address", "email") ?? ""
      ),

      parentName: String(
        get("parentName", "parent_Name") ?? ""
      ),

      parentMobileNumber: String(
        get("parentMobileNumber", "parent_Mobile_Number") ?? ""
      ),

      aadhaarNumber: String(
        get("aadhaarNumber", "aadhaar_Number", "aadharNumber") ?? ""
      ),

      localAddress: String(
        get("localAddress", "local_Address") ?? ""
      ),

      permanentAddress: String(
        get("permanentAddress", "permanent_Address") ?? ""
      ),

      qualification: String(
        get("qualification", "qualificationName") ?? ""
      ),

      universityBoard: String(
        get("universityBoard", "university_Board", "boardName") ?? ""
      ),

      passingYear: this.toNullableNumber(
        get("passingYear", "passing_Year")
      ),

      medium: String(
        get("medium") ?? ""
      ),

      percentageCgpa:
        get("percentageCgpa", "percentage_Cgpa", "percentage") ?? null,

      courses: Array.isArray(rawCourses)
        ? rawCourses.map((course: Record<string, any>) => ({
            registrationCode: String(
              course["registrationCode"] ??
              course["registration_Code"] ??
              ""
            ),

            courseName: String(
              course["courseName"] ??
              course["course_Name"] ??
              ""
            ),

            courseFees: this.toNullableNumber(
              course["courseFees"] ??
              course["feesAmount"] ??
              course["actualFees"]
            ),

            discount: this.toNullableNumber(
              course["discount"] ??
              course["discountAmount"]
            ),

            finalFees: this.toNullableNumber(
              course["finalFees"] ??
              course["final_Course_Fees"]
            ),

            status: String(
              course["status"] ??
              course["currentStatus"] ??
              course["current_Status"] ??
              ""
            )
          }))
        : this.getCoursesFromRegistrations(source),

      payments: Array.isArray(rawPayments)
        ? rawPayments.map((payment: Record<string, any>) => ({
            paymentDate: String(
              payment["paymentDate"] ??
              payment["payment_Date"] ??
              ""
            ),

            amount: this.toNullableNumber(
              payment["amount"] ??
              payment["paymentAmount"] ??
              payment["payment_Amount"]
            ),

            paymentMode: String(
              payment["paymentMode"] ??
              payment["payment_Mode"] ??
              ""
            ),

            description: String(
              payment["description"] ??
              payment["paymentDescription"] ??
              payment["payment_Description"] ??
              ""
            ),

            status: String(
              payment["status"] ??
              payment["paymentStatus"] ??
              payment["payment_Status"] ??
              ""
            )
          }))
        : []
    };
  }

  private getCoursesFromRegistrations(
    source: Record<string, any>
  ): StudentCourseDetail[] {

    const registrations =
      source["registrations"];

    if (!Array.isArray(registrations)) {
      // A single registration row may have been passed.
      const courseName =
        source["courseName"] ?? source["course_Name"] ?? "";

      if (!courseName) {
        return [];
      }

      return [{
        registrationCode: String(
          source["registrationCode"] ??
          source["registration_Code"] ??
          ""
        ),
        courseName: String(courseName),
        courseFees: this.toNullableNumber(
          source["courseFees"] ??
          source["feesAmount"] ??
          source["paymentAmount"]
        ),
        discount: this.toNullableNumber(source["discount"]),
        finalFees: this.toNullableNumber(source["finalFees"]),
        status: String(
          source["currentStatus"] ??
          source["current_Status"] ??
          ""
        )
      }];
    }

    return registrations.map((registration: Record<string, any>) => ({
      registrationCode: String(
        registration["registrationCode"] ??
        registration["registration_Code"] ??
        ""
      ),

      courseName: String(
        registration["courseName"] ??
        registration["course_Name"] ??
        ""
      ),

      courseFees: this.toNullableNumber(
        registration["courseFees"] ??
        registration["feesAmount"] ??
        registration["paymentAmount"]
      ),

      discount: this.toNullableNumber(
        registration["discount"] ??
        registration["discountAmount"]
      ),

      finalFees: this.toNullableNumber(
        registration["finalFees"] ??
        registration["final_Course_Fees"]
      ),

      status: String(
        registration["currentStatus"] ??
        registration["current_Status"] ??
        ""
      )
    }));
  }

  private toNullableNumber(value: any): number | null {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
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
