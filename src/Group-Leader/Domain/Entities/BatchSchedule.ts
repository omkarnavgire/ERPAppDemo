export interface BatchSchedule {
  batch_schedule_id: number;
  batch_id: number;
  batch_name?: string;
  topic_id?: number;
  content_id?: number;
  content_name?: string;
  expected_date?: string;
  expected_day?: string;
  actual_date?: string | null;
  actual_day?: string | null;
  status?: string;
}
