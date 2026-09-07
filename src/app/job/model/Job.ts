import { StatusCode } from '@app/queue/status/status.enum';
import { JobDecisionFields } from '@app/job/model/decision';

/**
 * A job as the API sends it.
 *
 * Extends {@link JobDecisionFields}: the four nullable `decision_*` columns the runner
 * copies off the decision function's response (contract §7.3). They are the only place
 * in the whole system that answers "did the treatment actually apply?" for one job, and
 * **NULL on any of them is UNKNOWN** — a legacy job, a job that never called the decision
 * function, or a runner that has not been redeployed. Read them through
 * `jobDecisionVerdict` / `decisionBadgeKind`, never by testing the raw field, so that
 * "we cannot tell" never renders as "fine".
 */
export interface Job extends JobDecisionFields {
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
  status_code: StatusCode;
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
