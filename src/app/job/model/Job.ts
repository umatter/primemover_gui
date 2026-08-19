export interface Job {
  id: number;
  name: string;
  description: string;
  type: string;
  active: number;
  status_code: string;
  status_message: string;
  order: number;
  started_at: string;
  finished_at: string;
  user_id: number;
  queue_id: number;
  captcha_found: any;
  captcha_solved: any;
  reports: any;
  reports_with_path_count: number;
}
