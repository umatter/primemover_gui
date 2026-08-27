export interface Job {
  id: number;
  name: string;
  description: string;
  type: string;
  active: number;
  /**
   * Canonical job state: `running | success | warning | failure | skipped`
   * (see `QueueStatusEnum`). Legacy rows may still hold `skpped` or `failed`; run every
   * read through `normalizeStatus`.
   */
  status_code: string;
  /**
   * `"<state text>"` or `"<state text> - <single-line detail>"`. Nullable: the runner only
   * attaches a diagnostic when it has one, and older rows have none.
   */
  status_message?: string | null;
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
