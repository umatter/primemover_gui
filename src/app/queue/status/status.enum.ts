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

/**
 * The five canonical `status_code` values, as a union usable in a type position.
 *
 * Mirrors {@link QueueStatusEnum} — the template literal keeps them provably in step, so
 * adding a member to the enum widens this union rather than letting the two drift.
 */
export type CanonicalStatusCode = `${QueueStatusEnum}`;

/**
 * A `status_code` as it actually arrives on the wire.
 *
 * The five canonical values, plus *any other string* — deliberately, because the API does
 * not validate the field (`RunnerJobUpdateRequest` marks it `nullable` with no `in:` rule),
 * legacy rows really do hold `failed` and `skpped`, and a future runner can invent a sixth
 * value tomorrow. `(string & {})` keeps editor completion on the five while still typing
 * the reality; narrowing this to `CanonicalStatusCode` would be a lie that turns every
 * unrecognised value into a compile error instead of an "Unknown" pill.
 */
export type StatusCode = CanonicalStatusCode | (string & {});

/** What a status resolves to when it is neither canonical nor a known alias. */
export const UNKNOWN_STATUS = 'unknown';

/** A canonical code, or the explicit `'unknown'` sentinel. Never an arbitrary string. */
export type StatusOrUnknown = CanonicalStatusCode | typeof UNKNOWN_STATUS;

/**
 * Is an **already-normalised** code one of the five canonical values?
 *
 * The one place the membership test lives, so {@link isCanonicalStatus} and
 * {@link statusOrUnknown} cannot drift apart — they answer the same question and used to
 * carry two copies of the answer.
 */
function isCanonicalCode(canonical: string): boolean {
  return (Object.values(QueueStatusEnum) as string[]).includes(canonical);
}

/** True when `code` normalises onto one of the five canonical values. */
export function isCanonicalStatus(code: StatusCode | number | null | undefined): boolean {
  return isCanonicalCode(normalizeStatus(code));
}

/**
 * Canonical code, or `'unknown'` — the form to switch on.
 *
 * `normalizeStatus` returns unrecognised input verbatim, which is right for rendering but
 * wrong for control flow: a `switch` over it needs a `default`, and a `default` is exactly
 * where an unrecognised status gets silently dropped into no bucket (or, worse, into a
 * benign one). Switching over this instead makes the fall-through explicit and typed:
 * every unrecognised value — and only an unrecognised value — arrives as `UNKNOWN_STATUS`.
 *
 * An **absent** status (null, undefined, '') is a different question from an
 * unrecognised one — "not reported yet" versus "reported something we do not
 * understand" — and this function does not answer it: it maps both onto
 * `'unknown'`. Callers that care (a run with no `status_code` may simply be scheduled)
 * must test for absence *before* calling.
 */
export function statusOrUnknown(code: StatusCode | number | null | undefined): StatusOrUnknown {
  const canonical = normalizeStatus(code);
  return isCanonicalCode(canonical) ? (canonical as CanonicalStatusCode) : UNKNOWN_STATUS;
}

/**
 * "A human should look at this": `failure OR warning`, the contract's `is_bad`.
 *
 * Never `failure` alone — using that predicate is what hid silent treatment-arm
 * degradation, which is the whole reason `warning` exists.
 */
export function isBadStatus(code: StatusCode | number | null | undefined): boolean {
  const canonical = statusOrUnknown(code);
  return canonical === QueueStatusEnum.FAILURE || canonical === QueueStatusEnum.WARNING;
}
