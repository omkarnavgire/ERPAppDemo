export interface SubmitAttendanceStudent {
  registrationId: number;
  isPresent: boolean;
}

export interface SubmitAttendanceRequest {
  batchScheduleId: number;
  attendanceDate: string;
  students: SubmitAttendanceStudent[];
}
