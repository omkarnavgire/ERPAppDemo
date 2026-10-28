export interface CreateBatchRequest {
  batch_name: string;
  topic_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  batch_time: string;
  branch_id: number;
  playlist_title: string;
  playlist_key: string;
}
