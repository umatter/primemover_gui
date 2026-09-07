/**
 * The decision function's verdict, as persisted on a job row.
 *
 * The single source of truth is `orchestrator/status.py` (`lambda_verdict`,
 * `job_decision_verdict`) and `docs/integration-contract.md` §7.3; this file is the
 * TypeScript copy of the same rules. If the two ever disagree, the module is right.
 *
 * Why the rules are worth copying rather than approximating: the decision function
 * returns **HTTP 200 even when the treatment did not apply**. Nothing about the call,
 * the job, or the run says anything is wrong — a valid xpath, a real video clicked, a
 * green run. The only trace is these fields. So the three questions are kept strictly
 * apart, exactly as the contract keeps them:
 *
 * | question | field |
 * |---|---|
 * | a human should look at this decision | `degraded` |
 * | this session's data is scientifically void | `treatment_lost` — **the alarm** |
 * | how was the video chosen | `selection_mode` — description only, **never a branch** |
 *
 * `selection_mode === 'random'` is the *correct* output for a control crawler, and 236 of
 * the 243 parameter rows on the production box are control-arm. Branching on it alone
 * would paint ~82% of all lambda jobs as broken, which is why nothing here does.
 */

import { Job } from '@app/job/model/Job';

/**
 * The six filters the decision function reports on, in the contract's fixed order.
 * A filter missing from the map was not reported at all, which is not the same as
 * "not requested" — see {@link decisionFilterState}.
 */
export const DECISION_FILTER_NAMES: readonly string[] = [
  'already_watched',
  'mainstream_media',
  'children_entertainment',
  'similar',
  'political',
  'fringe'
];

/**
 * What one entry of the `filters` map means.
 *
 * `'not-requested'` is the contract's `"skipped"`. **It is never a failure** — it is the
 * normal state of five of the six filters on a control crawler, and counting it as a
 * failure is the single most common way to turn this contract back into a false-alarm
 * generator.
 */
export type DecisionFilterState = 'ok' | 'not-requested' | 'failed';

export interface DecisionFilterRow {
  name: string;
  state: DecisionFilterState;
  /** The raw value, so a `"failed: <ExcClass>: <msg>"` keeps its reason. */
  raw: string;
  /** Just the reason for a failed filter (the text after `failed:`), or ''. */
  reason: string;
}

/** The decision function's LLM block: was a rating available, and if not why not. */
export interface DecisionLlm {
  available?: boolean | null;
  error_type?: string | null;
  error?: string | null;
}

/**
 * `decision_report`, the JSON column. Every member is optional: it is written by the
 * runner and any of it can be absent on an older payload.
 */
export interface DecisionReport {
  filters?: Record<string, string> | null;
  llm?: DecisionLlm | null;
  warnings?: string[] | null;
  applied?: string[] | null;
  requested?: string[] | null;
}

/**
 * The four `decision_*` columns as they arrive on a job.
 *
 * **NULL / undefined means UNKNOWN.** It never means clean and it never means false.
 * Three indistinguishable jobs are all unknown: one that predates the migration, one
 * that never called the decision function (most jobs), and a lambda job written by a
 * runner that has not been redeployed. A renderer must show "no verdict"; it must never
 * show a green tick.
 */
export interface JobDecisionFields {
  decision_degraded?: boolean | null;
  decision_treatment_lost?: boolean | null;
  decision_selection_mode?: string | null;
  decision_report?: DecisionReport | string | null;
}

/**
 * One job's verdict, with "clean" and "we cannot tell" kept apart.
 *
 * Mirrors `orchestrator.status.LambdaVerdict`. `reported === false` is *unknown*: it is
 * never an alarm, and it is never a clean bill of health either.
 */
export interface JobDecisionVerdict {
  /** Did this job carry a degradation report at all? `false` = unknown. */
  reported: boolean;
  /** A **requested** filter failed to apply, or nothing could be selected. */
  degraded: boolean;
  /** The bot was treated and produced control-arm data. The alarm. */
  treatmentLost: boolean;
  /** `'llm' | 'random' | ''`. A descriptor. Never branch on it alone. */
  selectionMode: string;
  /** Every reported filter, in contract order, classified. */
  filters: DecisionFilterRow[];
  /** Only the filters that genuinely failed. `"skipped"` is not one of them. */
  failedFilters: DecisionFilterRow[];
  /** Filters that were never requested. Informational, never a finding. */
  notRequestedFilters: DecisionFilterRow[];
  llm: DecisionLlm | null;
  warnings: string[];
  applied: string[];
  requested: string[];
}

/** What a job's badge should say. `'none'` = nothing to show. */
export type DecisionBadgeKind = 'lost' | 'degraded' | 'unknown' | 'none';

/**
 * Job types that invoke the decision function.
 *
 * Matched on the substring `lambda` rather than an exact list because the same job wears
 * two names across the stack: the API/designer type is `lambdasingleselectjob`, while the
 * runner's handler and every MinIO object key say `lambdaselectjob`. A future third
 * spelling should keep working — the cost of a false positive here is one grey "no
 * verdict" mark on a job that never had a verdict to give, and the cost of a false
 * negative is hiding the fact that a treatment arm reported nothing at all.
 */
export function isDecisionJobType(type: string | null | undefined): boolean {
  return (type ?? '').toString().toLowerCase().includes('lambda');
}

/** `decision_report` as an object, whether it arrived decoded or as a JSON string. */
function reportOf(job: JobDecisionFields | null | undefined): DecisionReport {
  const raw = job?.decision_report;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as DecisionReport) : {};
    } catch {
      // A corrupt report must not make the job unreadable; it is simply absent.
      return {};
    }
  }
  return typeof raw === 'object' ? raw : {};
}

/**
 * Classify one raw `filters` value.
 *
 * `"skipped"` means **not requested**, never a failure: it is the normal state of five of
 * the six filters on every healthy control crawler. `"ok"` — and an absent value, which is
 * what a filter the decision function never reported looks like — is fine.
 *
 * **Everything else counts as a failure.** That is `orchestrator/status.py`'s rule
 * (`_FILTER_OK_STATES = {"ok", "skipped", ""}`, and anything outside it lands in
 * `_failed_filters` "so an unrecognised future state errs towards being seen"), and this
 * file is that module's copy — where the two disagree, the module is right. The
 * alternative, reading an unrecognised word as `ok`, is the one thing the contract forbids
 * outright: it paints a value nobody here can read as a green tick, so a seventh filter
 * state invented by a future decision function would report healthy on every job that has
 * it. Erring towards being seen is the safe direction, and the raw text is carried into
 * {@link DecisionFilterRow.reason} so the reader sees what was actually said rather than
 * just the word "failed".
 */
export function decisionFilterState(raw: string | null | undefined): DecisionFilterState {
  const text = (raw ?? '').toString().trim().toLowerCase();
  if (!text || text === 'ok') return 'ok';
  if (text === 'skipped') return 'not-requested';
  return 'failed';
}

function filterRows(report: DecisionReport): DecisionFilterRow[] {
  const map = report.filters;
  if (!map || typeof map !== 'object') return [];
  const names = [
    ...DECISION_FILTER_NAMES.filter((name) => name in map),
    // Anything the decision function reports that this GUI has not heard of still shows.
    ...Object.keys(map).filter((name) => !DECISION_FILTER_NAMES.includes(name))
  ];
  return names.map((name) => {
    const raw = (map[name] ?? '').toString();
    const state = decisionFilterState(raw);
    // The reason is the text after `failed:` for the shape the contract documents, and the
    // whole raw value for anything else — a state this GUI cannot classify is exactly the
    // case where the reader needs the verbatim string rather than the label "Failed".
    const colon = raw.indexOf(':');
    const reason = state !== 'failed' ? '' : colon >= 0 ? raw.slice(colon + 1).trim() : raw.trim();
    return { name, state, raw, reason };
  });
}

function stringList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

/**
 * Read a job's persisted verdict.
 *
 * The rules, in the order `orchestrator.status` applies them:
 *
 * - **reported** — the row carries `decision_degraded`, `decision_treatment_lost` or a
 *   `filters` map. `decision_selection_mode` alone is deliberately *not* enough: a mode
 *   is a descriptor, and a row carrying only a mode still cannot say whether anything
 *   degraded.
 * - **degraded** — the explicit column when present; otherwise `treatment_lost` (which
 *   implies it), otherwise a genuinely failed filter, otherwise a non-empty warnings
 *   list. Never `selection_mode`.
 * - **treatmentLost** — the explicit column when present; otherwise, for a payload that
 *   has `degraded` but predates `treatment_lost`, `degraded && mode === 'random'` —
 *   *both* terms, never the mode alone.
 */
export function jobDecisionVerdict(
  job: (JobDecisionFields & { type?: string }) | null | undefined
): JobDecisionVerdict {
  const report = reportOf(job);
  const filters = filterRows(report);
  // `'filters' in report` rather than `filters.length`: an empty map is still a report
  // (the decision function answered), which is how `status.py` reads it too.
  const hasFiltersKey = Object.prototype.hasOwnProperty.call(report, 'filters') && !!report.filters;
  const failedFilters = filters.filter((f) => f.state === 'failed');
  const notRequestedFilters = filters.filter((f) => f.state === 'not-requested');
  const warnings = stringList(report.warnings);
  const selectionMode = (job?.decision_selection_mode ?? '').toString().trim().toLowerCase();

  const hasDegradedColumn = job?.decision_degraded !== null && job?.decision_degraded !== undefined;
  const hasLostColumn = job?.decision_treatment_lost !== null && job?.decision_treatment_lost !== undefined;
  const reported = hasDegradedColumn || hasLostColumn || hasFiltersKey;

  let degraded: boolean;
  if (hasDegradedColumn) {
    degraded = Boolean(job?.decision_degraded);
  } else if (hasLostColumn && Boolean(job?.decision_treatment_lost)) {
    degraded = true;
  } else {
    degraded = failedFilters.length > 0 || warnings.length > 0;
  }

  let treatmentLost: boolean;
  if (hasLostColumn) {
    treatmentLost = Boolean(job?.decision_treatment_lost);
  } else if (hasDegradedColumn) {
    treatmentLost = Boolean(job?.decision_degraded) && selectionMode === 'random';
  } else {
    treatmentLost = false;
  }

  return {
    reported,
    degraded,
    treatmentLost,
    selectionMode,
    filters,
    failedFilters,
    notRequestedFilters,
    llm: report.llm ?? null,
    warnings,
    applied: stringList(report.applied),
    requested: stringList(report.requested)
  };
}

/**
 * Which badge, if any, a job row should carry.
 *
 * - `'lost'` — `decision_treatment_lost` is true. Red: this session's data carries no
 *   treatment signal even though the run finished green.
 * - `'degraded'` — degraded but not lost. Amber: part of the treatment did not happen.
 * - `'unknown'` — the job type calls the decision function and there is **no verdict**.
 *   Grey and quiet, but present: a legacy job, or a runner that has not been redeployed,
 *   is not evidence that the treatment applied.
 * - `'none'` — a healthy verdict, or a job type that never calls the decision function.
 *   A control crawler that correctly picked at random lands here and shows nothing.
 */
export function decisionBadgeKind(
  job: (Job | (JobDecisionFields & { type?: string })) | null | undefined
): DecisionBadgeKind {
  if (!job) return 'none';
  const verdict = jobDecisionVerdict(job);
  if (verdict.treatmentLost) return 'lost';
  if (verdict.degraded) return 'degraded';
  if (verdict.reported) return 'none';
  return isDecisionJobType((job as { type?: string }).type) ? 'unknown' : 'none';
}

/** True when the job carries anything worth opening the report drawer for. */
export function hasDecisionReport(job: (Job | JobDecisionFields) | null | undefined): boolean {
  const verdict = jobDecisionVerdict(job);
  return verdict.reported || verdict.warnings.length > 0 || Boolean(verdict.llm);
}
