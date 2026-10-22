
import { InjectionToken } from '@angular/core';
import { StudentPaymentRepository } from '../StudentPaymentRepositry';

export const STUDENT_PAYMENT_REPOSITORY =
  new InjectionToken<StudentPaymentRepository>(
    'StudentPaymentRepository'
  );
