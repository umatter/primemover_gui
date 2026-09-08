/**
 * Experiment-level health: the answer to "which of my studies needs attention?".
 *
 * Everything here mirrors `GET /api/v1/experiments/{id}/health?hours=24` and the status
 * contract it is computed from (`docs/integration-contract.md` §3.4, executable copy
 * `orchestrator/status.py`). Three of its rules decide every line below:
 *
 * 1. **"Needs attention" is `failure OR warning`**, never `failure` alone. Reading
 *    `failure` alone is what hid silent treatment-arm degradation for as long as it
 *    existed.
 * 2. **Unknown is unknown.** An unrecognised run status is neither a success nor a
 *    failure, and folding it into either is how a bad run disappears. It has its own
 *    bucket here and its own strip state.
 * 3. **Absence is unknown, not clean.** A missing `runs_bad_count` (an API that predates
 *    it) and an unreachable `/health` (a 404 from the same API) both mean *we do not
 *    know*, and must never render as green.
 */

/** Runs — or jobs — in the window, split by canonical status. */
export interface HealthCounts {
  total: number;
  running: number;
  success: number;
  warning: number;
  failure: number;
  skipped: number;
  /**
   * Rows whose `status_code` normalises onto none of the five canonical values.
   *
   * Kept as its own bucket deliberately: `success + warning + failure + running + skipped`
   * may be less than `total`, and the difference is the thing nobody should be allowed to
   * quietly round down to zero.
   */
  unknown: number;
}

/** The `/experiments/{id}/health` response. */
export interface ExperimentHealth {
  experiment_id: number;
  /** The window the server actually applied, which may differ from the one requested. */
  window_hours: number;
  bots: number;
  runs: HealthCounts;
  jobs: HealthCounts;
  /** Runs matching the contract's `is_bad`: `failure OR warning`, alias-expanded. */
  bad_runs: number;
  bad_jobs: number;
  /** Jobs where a bot configured to be treated produced control-arm data (§7.3). */
  treatment_lost_jobs: number;
  /** Jobs where a requested filter did not apply (§7.3). */
  degraded_jobs: number;
  last_finished_at: string | null;
}

/** The windows offered in the UI. */
export type HealthWindowKey = '24h' | '7d' | 'all';

/**
 * Window key → the `hours` query parameter.
 *
 * `all` is **720 hours = 30 days**, the endpoint's documented maximum, not the whole
 * history — the label says "all" because that is what a researcher calls it, and the
 * chip's tooltip says what it really is rather than letting the number lie.
 */
export const HEALTH_WINDOW_HOURS: Readonly<Record<HealthWindowKey, number>> = {
  '24h': 24,
  '7d': 168,
  all: 720
};

/** The window chips, in render order. */
export const HEALTH_WINDOWS: readonly HealthWindowKey[] = ['24h', '7d', 'all'];

/** The window used until the researcher picks another — the endpoint's own default. */
export const DEFAULT_HEALTH_WINDOW: HealthWindowKey = '24h';

/** `hours` for a window key; the default window for anything unrecognised. */
export function healthWindowHours(key: HealthWindowKey | null | undefined): number {
  return (
    HEALTH_WINDOW_HOURS[(key ?? DEFAULT_HEALTH_WINDOW) as HealthWindowKey] ?? HEALTH_WINDOW_HOURS[DEFAULT_HEALTH_WINDOW]
  );
}

/**
 * What a health strip is saying.
 *
 * Five states, and the ordering between them is the contract's severity ordering with the
 * benign end collapsed: `failure` outranks `warning`, `warning` outranks `unknown`,
 * `unknown` outranks `running`, and `clean` is only reached when nothing else applies,
 * runs actually exist **and** every one of them has finished.
 *
 * `running` is not a mild `clean`. A window that is still executing has not completed
 * anything yet, cleanly or otherwise, and the one claim the strip must never make about
 * work in flight is that it went well.
 */
export type HealthState = 'failure' | 'warning' | 'unknown' | 'running' | 'clean';

/** A count off the wire, or `null` when the field was not sent at all. */
export function healthCount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A count off the wire, defaulted to 0 — only for fields inside a payload we did receive. */
function count(value: unknown): number {
  return healthCount(value) ?? 0;
}

function counts(raw: unknown): HealthCounts {
  const source = (raw ?? {}) as Record<string, unknown>;
  return {
    total: count(source['total']),
    running: count(source['running']),
    success: count(source['success']),
    warning: count(source['warning']),
    failure: count(source['failure']),
    skipped: count(source['skipped']),
    unknown: count(source['unknown'])
  };
}

/**
 * Parse a `/health` payload, or `null` if it is not one.
 *
 * Tolerant on purpose in two directions, because both have bitten this GUI before:
 * Laravel serialises appended integers as strings often enough that `Number()` is not
 * optional, and a resource-wrapped `{data: {...}}` body is one `JsonResource` away at any
 * time. A body that carries no `runs` object is not a health payload and reads as
 * **unknown** rather than as a zeroed-out clean bill of health.
 */
export function normalizeExperimentHealth(payload: unknown): ExperimentHealth | null {
  if (!payload || typeof payload !== 'object') return null;
  const outer = payload as Record<string, unknown>;
  const body = (
    outer['runs'] === undefined && outer['data'] && typeof outer['data'] === 'object' ? outer['data'] : outer
  ) as Record<string, unknown>;
  if (!body['runs'] || typeof body['runs'] !== 'object') return null;

  const runs = counts(body['runs']);
  const jobs = counts(body['jobs']);
  const lastFinished = body['last_finished_at'];

  return {
    experiment_id: count(body['experiment_id']),
    window_hours: count(body['window_hours']),
    bots: count(body['bots']),
    runs,
    jobs,
    // The server computes is_bad; falling back to the two buckets keeps the number right
    // rather than zero if an older build of the endpoint omits the aggregate.
    bad_runs: healthCount(body['bad_runs']) ?? runs.failure + runs.warning,
    bad_jobs: healthCount(body['bad_jobs']) ?? jobs.failure + jobs.warning,
    treatment_lost_jobs: count(body['treatment_lost_jobs']),
    degraded_jobs: count(body['degraded_jobs']),
    last_finished_at: typeof lastFinished === 'string' && lastFinished ? lastFinished : null
  };
}

/**
 * Runs in the window a human should look at: the contract's `is_bad`, `failure OR
 * warning`, plus a server-computed `bad_runs` the two buckets do not explain (a legacy
 * spelling the server expanded through its alias table and this GUI does not model).
 */
export function healthRunsNeedAttention(health: ExperimentHealth | null | undefined): boolean {
  if (!health) return false;
  return health.runs.failure > 0 || health.runs.warning > 0 || health.bad_runs > 0;
}

/**
 * The same question one level down, over the jobs those runs contained.
 *
 * It is a **separate** question, not a detail of the one above: the API buckets runs and
 * jobs in two independent grouped queries, so `runs.failure === 0` with `jobs.failure > 0`
 * is an ordinary result rather than an inconsistency. Live example: queue 845 reported
 * `status_code = 'success'`, `status_message = 'done'`, with 22 of its 113 jobs failed.
 * Reading only the runs is exactly how that experiment renders green.
 */
export function healthJobsNeedAttention(health: ExperimentHealth | null | undefined): boolean {
  if (!health) return false;
  return health.jobs.failure > 0 || health.jobs.warning > 0 || health.bad_jobs > 0;
}

/**
 * The strip's state, from whatever is actually known.
 *
 * `health` is the full breakdown from `/experiments/{id}/health`; `badRuns` is the
 * appended `runs_bad_count` on an experiment row, which arrives with the list and is
 * `null` on an API that predates it. The card renders from `badRuns` the moment the list
 * lands and refines to the real severity when (if) the health call answers.
 *
 * The rules, in order:
 *
 * - a failed run outranks everything — red. So does a failed **job**: the run that
 *   carried it routinely reports `success`, and until the new jar is everywhere a
 *   degraded run is spelled `success` on the queue row with the only evidence in the job
 *   counts. Dropping them is what let a study with 22 failed jobs read "completed
 *   cleanly";
 * - a `warning` run, **or** a `bad_runs` the two buckets do not explain, is amber — and so
 *   is a `warning`/bad job under otherwise clean runs. Over-reporting "look at this" is
 *   the safe direction; under-reporting it is the bug this change set exists to fix;
 * - runs *or jobs* with an unrecognised status, with nothing worse present, are **grey,
 *   not green**, and so is a total the buckets cannot account for;
 * - a window still executing is `running`, never `clean`: those runs have not completed,
 *   so nothing may claim they completed cleanly;
 * - green needs runs that exist, nothing outstanding about any of them, and every one of
 *   them finished;
 * - no runs in the window is *no data*, not a clean bill of health.
 *
 * With no health payload the count alone cannot say whether the bad runs failed or merely
 * degraded, so it reports amber — "someone should look", without inventing a driver.
 */
export function experimentHealthState(
  health: ExperimentHealth | null | undefined,
  badRuns: number | null
): HealthState {
  if (health) {
    if (health.runs.failure > 0 || health.jobs.failure > 0) return 'failure';
    if (healthRunsNeedAttention(health) || healthJobsNeedAttention(health)) return 'warning';
    if (health.runs.unknown > 0 || health.jobs.unknown > 0) return 'unknown';
    if (health.runs.total <= 0) return 'unknown';
    // Nothing bad and nothing unrecognised is left, so every run is success, skipped or
    // running. A shortfall against `total` is a remainder no bucket explains: unknown,
    // never rounded into either of the two benign readings below.
    const settled = health.runs.success + health.runs.skipped;
    if (settled + health.runs.running < health.runs.total) return 'unknown';
    return health.runs.running > 0 ? 'running' : 'clean';
  }
  if (badRuns === null) return 'unknown';
  return badRuns > 0 ? 'warning' : 'clean';
}

/** How the strip is tinted: the severity of the state, escalated by the treatment alarm. */
export type HealthTone = 'danger' | 'warning' | 'neutral' | 'success';

/**
 * The strip's colour.
 *
 * Treatment loss escalates a strip to red whatever the run statuses say, because those
 * runs typically finished **green**: every status field is fine and the observations still
 * cannot answer the experiment's question. A green strip on a study that lost a treatment
 * would be the most expensive lie in this GUI.
 */
export function healthTone(state: HealthState, treatmentLostJobs: number = 0): HealthTone {
  if (treatmentLostJobs > 0 || state === 'failure') return 'danger';
  switch (state) {
    case 'warning':
      return 'warning';
    case 'clean':
      return 'success';
    // `running` and `unknown` are both neutral grey. Green is reserved for a window that
    // finished and finished well; work still in flight has not earned it yet.
    default:
      return 'neutral';
  }
}
