export interface TrainerBatch {
  batchId: number;
  batchName: string;
  courseName?: string;
  startDate?: string;
  endDate?: string;
  batchTime?: string;
  studentCount?: number;
}

export interface TrainerStudent {
  registrationId: number;
  studentName: string;
  email?: string;
  mobileNumber?: string;
  [key: string]: unknown;
}

export interface TrainerSchedule {
  batchScheduleId: number;
  batchId: number;
  topicName: string;
  expectedDate?: string;
  actualDate?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AttendanceStudent {
  registrationId: number;
  studentName: string;
  isPresent: boolean;
}
