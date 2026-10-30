export interface ScheduleAttendance {
  attendance_id: number;
  registration_id: number;
  attendance_date?: string;
  is_present?: boolean | number;
}
