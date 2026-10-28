import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentRegistrationApi } from 'src/Account/Infrastructure/Api/StudentRegistrationApi';
import { TrainingCourse as TrainingCourseApplication } from 'src/UserManagement/Application/TrainingCourse/TrainingCourse';
import { TrainingCourse } from 'src/UserManagement/Domain/Entities/TrainingCourse';
import { RegisterExistingStudentCourseRequest } from 'src/Account/Domain/DTOs/RegisterExistingStudentCourseRequest';


export interface ExistingStudentRegistrationData {
  studentId: number;
  studentName: string;
  lastName: string;
  mobileNumber: string;
  emailAddress: string;
  registeredCourses: string;
  registrations: {
    courseId: number;
    courseName: string;
  }[];
}

@Component({
  selector: 'app-existing-student-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ExistingStudentRegistration.html',
  styleUrls: ['./ExistingStudentRegistration.css']
})
export class ExistingStudentRegistration implements OnInit, OnChanges {

  private api = inject(StudentRegistrationApi);
  private courseApp = inject(TrainingCourseApplication);

  @Input() student: ExistingStudentRegistrationData | null = null;
  @Input() students: ExistingStudentRegistrationData[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  selectedStudentId = 0;
  activeStudent: ExistingStudentRegistrationData | null = null;

  courses: TrainingCourse[] = [];
  selectedCourseId = 0;

  discount = 0;
  actualFees = 0;
  finalFees = 0;

  dropdownLoading = false;
  submitting = false;

  errorMessage = '';
  successMessage = '';

  paymentForm = {
    paymentAmount: 0,
    paymentDate: new Date().toISOString().substring(0, 10),
    paymentMode: '',
    leadId: null as number | null,
    paymentDescription: ''
  };

  ngOnInit(): void {
    this.loadCourses();
    this.syncSelectedStudent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['students'] || changes['student']) {
      this.syncSelectedStudent();
    }
  }

  // Create unique student list using Student ID only.
  get uniqueStudents(): ExistingStudentRegistrationData[] {
    const unique = new Map<number, ExistingStudentRegistrationData>();

    for (const item of this.students ?? []) {
      const id = Number(item.studentId);

      if (id > 0 && !unique.has(id)) {
        unique.set(id, item);
      }
    }

    return Array.from(unique.values());
  }

  syncSelectedStudent(): void {
    if (this.student) {
      this.selectedStudentId = Number(this.student.studentId);
      this.activeStudent =
        this.uniqueStudents.find(
          s => Number(s.studentId) === this.selectedStudentId
        ) ?? this.student;

      this.resetCourseAndPayment();
      return;
    }

    if (this.selectedStudentId > 0) {
      this.activeStudent =
        this.uniqueStudents.find(
          s => Number(s.studentId) === Number(this.selectedStudentId)
        ) ?? null;
    } else {
      this.activeStudent = null;
    }
  }

  onStudentSelect(value: number | string): void {
    this.selectedStudentId = Number(value) || 0;

    this.activeStudent =
      this.uniqueStudents.find(
        s => Number(s.studentId) === this.selectedStudentId
      ) ?? null;

    this.errorMessage = '';
    this.successMessage = '';

    this.resetCourseAndPayment();
  }

  loadCourses(): void {
    this.dropdownLoading = true;

    this.courseApp.getAll().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response)
          ? response
          : response?.data ?? response?.result ?? [];

        this.courses = Array.isArray(data)
          ? data.filter((course: any) => Number(course.courseId) > 0) as TrainingCourse[]
          : [];
        this.dropdownLoading = false;
      },
      error: (error: any) => {
        console.error('Failed to load courses:', error);
        this.errorMessage = 'Unable to load courses. Please try again.';
        this.dropdownLoading = false;
      }
    });
  }

  get availableCourses(): any[] {
    if (!this.activeStudent) {
      return [];
    }

    const registeredCourseIds = new Set(
      (this.activeStudent.registrations ?? []).map(
        r => Number(r.courseId)
      )
    );

    return this.courses.filter(course => {
      const id = Number(course.courseId);

      return id > 0 && !registeredCourseIds.has(id);
    });
  }

  onCourseChange(): void {
    const course = this.courses.find(
      c => Number(c.courseId) === Number(this.selectedCourseId)
    );

    this.actualFees = Number(course?.feesAmount) || 0;

    this.onDiscountChange();
  }

  onDiscountChange(): void {
    this.discount = Math.max(0, Number(this.discount) || 0);

    if (this.discount > this.actualFees) {
      this.discount = this.actualFees;
    }

    this.finalFees = Math.max(0, this.actualFees - this.discount);
    this.paymentForm.paymentAmount = this.finalFees;
  }

  resetCourseAndPayment(): void {
    this.selectedCourseId = 0;
    this.discount = 0;
    this.actualFees = 0;
    this.finalFees = 0;

    this.paymentForm = {
      paymentAmount: 0,
      paymentDate: new Date().toISOString().substring(0, 10),
      paymentMode: '',
      leadId: null,
      paymentDescription: ''
    };
  }

  resetPaymentForm(): void {
    this.resetCourseAndPayment();
    this.errorMessage = '';
    this.successMessage = '';
  }

  registerCourse(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.activeStudent) {
      this.errorMessage = 'Please select a student.';
      return;
    }

    if (!this.selectedCourseId || this.selectedCourseId <= 0) {
      this.errorMessage = 'Please select a course.';
      return;
    }

    if (this.paymentForm.paymentAmount < 0) {
      this.errorMessage = 'Payment amount cannot be negative.';
      return;
    }

    if (!this.paymentForm.paymentDate) {
      this.errorMessage = 'Please select the payment date.';
      return;
    }

    if (!this.paymentForm.paymentMode) {
      this.errorMessage = 'Please select the payment mode.';
      return;
    }

    if (this.paymentForm.paymentAmount > this.finalFees) {
      this.errorMessage = 'Payment amount cannot exceed the final course fees.';
      return;
    }

    const course = this.courses.find(
      c => Number(c.courseId) === Number(this.selectedCourseId)
    );

    if (!course) {
      this.errorMessage = 'Selected course was not found.';
      return;
    }

    /*
      IMPORTANT:
      Keep the request property names below aligned with the DTO
      expected by your existing StudentRegistrationApi.
    */
    const request: RegisterExistingStudentCourseRequest = {
      studentId: this.activeStudent.studentId,
      courseId: Number(this.selectedCourseId),
      discount: Number(this.discount),
      paymentAmount: Number(this.paymentForm.paymentAmount),
      paymentDate: new Date(this.paymentForm.paymentDate).toISOString(),
      paymentMode: this.paymentForm.paymentMode,
      paymentDescription: this.paymentForm.paymentDescription,
      leadId: Number(this.paymentForm.leadId) || 0
    };

    this.submitting = true;

    this.api.registerExistingStudentCourse(request)
      .subscribe({
        next: (response: any) => {
          this.submitting = false;
          this.successMessage =
            response?.message ?? 'Student registered successfully.';

          this.saved.emit();
        },
        error: (error: any) => {
          console.error('Student registration failed:', error);

          this.submitting = false;
          this.errorMessage =
            error?.error?.message ??
            'Unable to register the student. Please check the details and try again.';
        }
      });
  }

  closeForm(): void {
    this.closed.emit();
  }
}