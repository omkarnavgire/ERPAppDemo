export interface Batch {
  batch_id: number;
  batch_name: string;
  topic_id: number;
  topic_name?: string;
  employee_id: number;
  employee_name?: string;
  start_date: string;
  end_date: string;
  batch_time: string;
  branch_id: number;
  branch_name?: string;
  playlist_title?: string | null;
  playlist_key?: string | null;
}
