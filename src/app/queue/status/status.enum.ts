/**
 * Canonical job/queue status vocabulary.
 *
 * The single source of truth is `orchestrator/status.py` in the primemover-orchestrator
 * repo (see `docs/integration-contract.md`); keep this enum and {@link STATUS_ALIASES}
 * in sync with it.
 *
 * `WARNING` is new (2026-08-27) and is a *job* state: the job ran to completion but
 * something the experiment cares about degraded — job data was not written, or the
 * decision function reported a degraded decision (see treatment_lost). It used to be
 * reported as `success`, which is exactly what hid silent treatment-arm degradation.
 * Queues never report `warning` themselves; a run is shown as degraded when its job
 * rollup says so (see `queueJobRollup` in `@app/queue/model/queue`).
 */
export enum QueueStatusEnum {
  FAILURE = 'failure',
  SUCCESS = 'success',
  WARNING = 'warning',
  RUNNING = 'running',
  SKIPPED = 'skipped'
}

/**
 * Legacy, misspelled and synonymous values that still occur in the database, mapped onto
 * the canonical vocabulary. `skpped` is the runner typo emitted for skipped joblists
 * until 2026-08-27 — rows written before then persist and must not render as "Unknown".
 *
 * Mirrors `STATUS_ALIASES` in `orchestrator/status.py`.
 */
export const STATUS_ALIASES: Readonly<Record<string, string>> = {
  skpped: QueueStatusEnum.SKIPPED,
  failed: QueueStatusEnum.FAILURE,
  error: QueueStatusEnum.FAILURE,
  fatal: QueueStatusEnum.FAILURE,
  completed: QueueStatusEnum.SUCCESS,
  done: QueueStatusEnum.SUCCESS,
  finished: QueueStatusEnum.SUCCESS,
  ok: QueueStatusEnum.SUCCESS,
  warn: QueueStatusEnum.WARNING,
  processing: QueueStatusEnum.RUNNING,
  inprogress: QueueStatusEnum.RUNNING,
  in_progress: QueueStatusEnum.RUNNING
};

/**
 * Canonical lowercase status code for a raw `status_code` off the API.
 *
 * An unrecognised value is returned lowercased rather than mapped onto a canonical code:
 * callers must treat it as unknown, never as a success.
 */
export function normalizeStatus(code: string | number | null | undefined): string {
  const text = (code ?? '').toString().trim().toLowerCase();
  return STATUS_ALIASES[text] ?? text;
}
