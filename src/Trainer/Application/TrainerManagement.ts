import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TrainerApi } from '../Infrastructure/Api/TrainerApi';
import { TrainerBatch, TrainerSchedule, TrainerStudent, AttendanceStudent } from '../Domain/Entities/TrainerBatch';
import { SubmitAttendanceRequest } from '../Domain/DTOs/SubmitAttendanceRequest';

@Injectable({ providedIn: 'root' })
export class TrainerManagement {
  private readonly api = inject(TrainerApi);

getMyBatches(): Observable<TrainerBatch[]> {
    return this.api.getMyBatches().pipe(
        map(value => this.toRows(value).map(row => ({
            batchId: this.number(row, 'batchId', 'batch_id', 'id'),
            batchName: this.string(row, 'batchName', 'batch_name', 'name') || 'Unnamed Batch',
            courseName: this.string(row, 'courseName', 'course_name', 'course'),
            startDate: this.string(row, 'startDate', 'start_date'),
            endDate: this.string(row, 'endDate', 'end_date'),
            batchTime: this.string(row, 'batchTime', 'batch_time'),
            studentCount: this.optionalNumber(row, 'studentCount', 'student_count', 'totalStudents')
        })).filter(batch => batch.batchId > 0))
    );
}

  getBatchDetails(batchId: number): Observable<Record<string, unknown>> {
    return this.api.getBatchDetails(batchId).pipe(map(value => this.toObject(value)));
  }

  getBatchStudents(batchId: number): Observable<TrainerStudent[]> {
    return this.api.getBatchStudents(batchId).pipe(map(value => this.toRows(value).map(row => ({
      ...row,
      registrationId: this.number(row, 'registrationId', 'registration_id'),
      studentName: this.string(row, 'studentName', 'student_name', 'name') || 'Student'
    })) as TrainerStudent[]));
  }

  getBatchSchedules(batchId: number): Observable<TrainerSchedule[]> {
    return this.api.getBatchSchedules(batchId).pipe(map(value => this.toRows(value).map(row => ({
      ...row,
      batchScheduleId: this.number(row, 'batchScheduleId', 'batch_schedule_id', 'id'),
      batchId: this.number(row, 'batchId', 'batch_id') || batchId,
      topicName: this.string(row, 'topicName', 'topic_name', 'contentName', 'content_name', 'title') || 'Scheduled Topic',
      expectedDate: this.string(row, 'expectedDate', 'expected_date'),
      actualDate: this.string(row, 'actualDate', 'actual_date'),
      status: this.string(row, 'status')
    })) as TrainerSchedule[]));
  }

  getAttendanceStudents(scheduleId: number): Observable<AttendanceStudent[]> {
    return this.api.getScheduleAttendanceStudents(scheduleId).pipe(map(value => this.toRows(value).map(row => ({
      registrationId: this.number(row, 'registrationId', 'registration_id'),
      studentName: this.string(row, 'studentName', 'student_name', 'name') || 'Student',
      isPresent: Boolean(row['isPresent'] ?? row['is_present'] ?? false)
    }))));
  }

  submitAttendance(request: SubmitAttendanceRequest): Observable<unknown> {
    return this.api.submitAttendance(request);
  }

  private toRows(value: unknown): Record<string, unknown>[] {
    if (Array.isArray(value)) return value.filter(this.isRecord);
    if (!this.isRecord(value)) return [];
    for (const key of ['data', 'result', 'items', 'batches', 'students', 'schedules', '$values']) {
      const candidate = value[key];
      if (Array.isArray(candidate)) return candidate.filter(this.isRecord);
      if (this.isRecord(candidate)) {
        const nested = this.toRows(candidate);
        if (nested.length) return nested;
      }
    }
    return [];
  }

  private toObject(value: unknown): Record<string, unknown> {
    if (!this.isRecord(value)) return {};
    const nested = value['data'] ?? value['result'];
    return this.isRecord(nested) ? nested : value;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private string(row: Record<string, unknown>, ...keys: string[]): string | undefined {
    for (const key of keys) if (row[key] !== null && row[key] !== undefined) return String(row[key]);
    return undefined;
  }

  private number(row: Record<string, unknown>, ...keys: string[]): number {
    return this.optionalNumber(row, ...keys) ?? 0;
  }

  private optionalNumber(row: Record<string, unknown>, ...keys: string[]): number | undefined {
    for (const key of keys) {
      const value = Number(row[key]);
      if (row[key] !== null && row[key] !== undefined && Number.isFinite(value)) return value;
    }
    return undefined;
  }
}
