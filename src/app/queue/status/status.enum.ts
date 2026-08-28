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
 * Since 2026-08-28 queues report `warning` too, for the same reason: a run that
 * completed but lost jobs is neither a success nor a total failure. Before that the
 * runner set the joblist result unconditionally, so a run reported `success` however
 * many of its jobs had died — observed on experiment 145, where two runs finished
 * 8 of 204 jobs (4%) and both recorded `success` / "done". A run's own status and its
 * job rollup (`queueJobRollup` in `@app/queue/model/queue`) can now both show it.
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
