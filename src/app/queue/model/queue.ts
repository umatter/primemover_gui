import { Crawler } from '@app/crawler/model/crawler';
import { StatusCode } from '@app/queue/status/status.enum';

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
  /**
   * Jobs of this run whose decision `degraded` — a *requested* filter did not apply
   * (contract §7.3). A count of **verdicts**, not of statuses.
   */
  jobs_degraded_count?: number;
  /**
   * Jobs of this run whose bot was treated and produced control-arm data
   * (`decision_treatment_lost`). The alarm: those sessions carry no treatment signal
   * even though the run may have finished green.
   *
   * A **zero is not a clean bill of health.** The count is taken off a nullable column,
   * so `jobs_count: 40, jobs_treatment_lost_count: 0` may mean forty verdicts saying
   * "fine" or forty NULLs saying nothing at all. Render the alarm when it is positive;
   * never render the zero as reassurance.
   */
  jobs_treatment_lost_count?: number;
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
  /**
   * Canonical run state: `running | success | warning | failure | skipped`.
   *
   * Typed as {@link StatusCode}, which admits any string on purpose: the API does not
   * validate the field, legacy rows hold `failed` and `skpped`, and an unrecognised value
   * must render as "Unknown" rather than fail to compile. Read it through
   * `normalizeStatus` / `statusOrUnknown`, never by comparing the raw string.
   */
  status_code: StatusCode;
  /** `"<state text>"` or `"<state text> - <single-line detail>"`. Nullable. */
  status_message?: string | null;
  crawler: Crawler;
}

export type JobRollupKind = 'total' | 'succeeded' | 'warning' | 'failed' | 'skipped' | 'degraded' | 'treatmentLost';

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
  skipped: ['jobs_skipped_count', 'jobs_skipped'],
  degraded: ['jobs_degraded_count', 'jobs_degraded'],
  treatmentLost: ['jobs_treatment_lost_count', 'jobs_treatment_lost']
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

/**
 * True when the API sent any part of the **status** rollup for this run.
 *
 * Deliberately the five status counts only. The two decision counts answer a different
 * question ("did the treatment apply?" rather than "how much of the run survived"), and
 * a `jobs_treatment_lost_count: 0` is not evidence that a status rollup exists — nor,
 * for that matter, evidence that any verdict exists. Use {@link hasQueueDecisionRollup}
 * for the other question.
 */
export function hasQueueJobRollup(run: Queue | null | undefined): boolean {
  const kinds: JobRollupKind[] = ['total', 'succeeded', 'warning', 'failed', 'skipped'];
  return kinds.some((kind) => queueJobRollup(run, kind) !== null);
}

/**
 * True when the API sent either decision count for this run.
 *
 * Note what it does *not* license: a `true` here plus a zero count still does not mean
 * "no treatment was lost". It means the API counted the column, and the column is NULL
 * for every job that predates the runner deploy. Only a positive count asserts anything.
 */
export function hasQueueDecisionRollup(run: Queue | null | undefined): boolean {
  const kinds: JobRollupKind[] = ['degraded', 'treatmentLost'];
  return kinds.some((kind) => queueJobRollup(run, kind) !== null);
}

/**
 * One drawable slice of a run's job rollup.
 *
 * `unaccounted` is the remainder — `jobs_count` minus the four terminal buckets. It is a
 * real category, not rounding slack: it holds the jobs that are still running, the ones
 * the runner has not reached yet, and any whose `status_code` the API could not classify.
 * Drawing it (in neutral grey) rather than dropping it is the point: a run of 113 jobs
 * that reports 8 successes and nothing else must look 7% coloured, not 100% green.
 */
export interface JobRollupSegment {
  kind: 'succeeded' | 'warning' | 'failed' | 'skipped' | 'unaccounted';
  count: number;
  /** Share of the bar, 0–100. */
  percent: number;
}

export interface JobRollupBreakdown {
  /**
   * Whether the API sent a status rollup at all. When false every count below is zero and
   * nothing may be rendered as a measurement — "0 of 0 jobs succeeded" is a claim no API
   * ever made, and an older API sends no rollup at all.
   */
  reported: boolean;
  /** `jobs_count` when sent, otherwise the sum of the four terminal buckets. */
  total: number;
  /** All five segments, always, in draw order; a segment with `count: 0` is still listed. */
  segments: JobRollupSegment[];
}

/**
 * The stacked-bar arithmetic for a run's jobs.
 *
 * Two deliberate properties, both there because the inputs are not guaranteed consistent:
 *
 * - **The percentages are taken over `max(total, accounted)`.** If the four buckets ever
 *   sum to more than `jobs_count` (a rollup counted mid-write, a status counted twice),
 *   the bar still sums to 100% and no slice overflows its track — rather than a bar that
 *   silently renders 130% wide.
 * - **The remainder is never negative.** In that same case `unaccounted` clamps to 0
 *   instead of subtracting a slice back out of the picture.
 */
export function queueJobRollupBreakdown(run: Queue | null | undefined): JobRollupBreakdown {
  const counts = {
    succeeded: queueJobRollup(run, 'succeeded') ?? 0,
    warning: queueJobRollup(run, 'warning') ?? 0,
    failed: queueJobRollup(run, 'failed') ?? 0,
    skipped: queueJobRollup(run, 'skipped') ?? 0
  };
  const accounted = counts.succeeded + counts.warning + counts.failed + counts.skipped;
  const total = queueJobRollup(run, 'total') ?? accounted;
  const unaccounted = Math.max(0, total - accounted);
  const denominator = Math.max(total, accounted);

  const share = (count: number): number => (denominator > 0 ? (count / denominator) * 100 : 0);

  return {
    reported: hasQueueJobRollup(run),
    total,
    segments: [
      { kind: 'succeeded', count: counts.succeeded, percent: share(counts.succeeded) },
      { kind: 'warning', count: counts.warning, percent: share(counts.warning) },
      { kind: 'failed', count: counts.failed, percent: share(counts.failed) },
      { kind: 'skipped', count: counts.skipped, percent: share(counts.skipped) },
      { kind: 'unaccounted', count: unaccounted, percent: share(unaccounted) }
    ]
  };
}
