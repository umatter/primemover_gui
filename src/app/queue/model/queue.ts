export interface Queue {
  id: number;
  name: string;
  description: string;
  active: number;
  new: number;
  processed: number;
  processing: number;
  reviewed: number;
  order: number;
  start_at: string;
  started_at: string;
  finished_at: string;
  crawler_id: number;
  user_id: number;
  status_code: string;
  status_message?: string;
}
