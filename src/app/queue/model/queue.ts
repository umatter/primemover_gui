import { Crawler } from '@app/crawler/model/crawler';

/**
 * Per-run rollup of its jobs' terminal states, added API-side alongside the new `warning`
 * job status (2026-08-27). Every field is optional on purpose: the GUI must keep working
 * against an API that predates the rollup, and "absent" must not be read as "zero".
 * Use {@link queueJobRollup} rather than touching these directly.
 */
export interface QueueJobRollup {
  jobs_count?: number;
  jobs_succeeded_count?: number;
  jobs_warning_count?: number;
  jobs_failed_count?: number;
  jobs_skipped_count?: number;
}

export interface Queue extends QueueJobRollup {
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
  crawler: Crawler;
}

export type JobRollupKind = 'total' | 'succeeded' | 'warning' | 'failed' | 'skipped';

/**
 * Accepted field names per rollup kind, best first. Laravel's `withCount` spelling
 * (`jobs_warning_count`) is the contract; the bare `jobs_warning` alias is tolerated so a
 * naming difference between the API and this GUI degrades to "not sent" rather than to a
 * wrong count.
 */
const ROLLUP_KEYS: Readonly<Record<JobRollupKind, string[]>> = {
  total: ['jobs_count', 'jobs_total'],
  succeeded: ['jobs_succeeded_count', 'jobs_succeeded'],
  warning: ['jobs_warning_count', 'jobs_warning'],
  failed: ['jobs_failed_count', 'jobs_failed'],
  skipped: ['jobs_skipped_count', 'jobs_skipped']
};

/**
 * One rollup count for a run, or `null` when the API did not send it at all.
 *
 * `null` and `0` mean different things — "we don't know" versus "none" — so callers that
 * render a count must handle `null` rather than defaulting it to zero.
 */
export function queueJobRollup(run: Queue | null | undefined, kind: JobRollupKind): number | null {
  if (!run) return null;
  const record = run as unknown as Record<string, unknown>;
  for (const key of ROLLUP_KEYS[kind]) {
    const value = record[key];
    if (value === null || value === undefined || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

/** True when the API sent any part of the job rollup for this run. */
export function hasQueueJobRollup(run: Queue | null | undefined): boolean {
  const kinds: JobRollupKind[] = ['total', 'succeeded', 'warning', 'failed', 'skipped'];
  return kinds.some((kind) => queueJobRollup(run, kind) !== null);
}
