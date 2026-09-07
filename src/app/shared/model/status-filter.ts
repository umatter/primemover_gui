import { QueueStatusEnum } from '@app/queue/status/status.enum';

/**
 * The status filter a list screen is currently showing.
 *
 * `'bad'` is the contract's `is_bad` predicate — `failure OR warning`, the set a human
 * should look at (`docs/integration-contract.md` §3.4). It is deliberately a key of its
 * own rather than "failure plus warning" assembled at the call site, because the two-term
 * predicate is exactly the thing consumers keep getting wrong: reading `failure` alone is
 * what hid silent treatment-arm degradation for as long as it existed.
 */
export type StatusFilterKey = 'all' | 'bad' | `${QueueStatusEnum}`;

/** Query parameter carrying the server-side `is_bad` predicate. */
export const STATUS_FILTER_BAD_PARAM = 'filter[bad]';

/** Query parameter carrying an explicit, alias-expanded status list. */
export const STATUS_FILTER_STATUS_PARAM = 'filter[status_code]';

export interface StatusFilterOption {
  key: StatusFilterKey;
  /** i18n key for the chip's label. */
  labelKey: string;
  /** i18n key for the chip's tooltip / description. */
  hintKey: string;
}

/**
 * The chips, in the order they are rendered.
 *
 * "Needs attention" sits second, immediately after "All", because it is the one a
 * researcher wants on almost every visit; the single-status chips after it are for
 * narrowing once the bad set is too big to read.
 */
export const STATUS_FILTER_OPTIONS: readonly StatusFilterOption[] = [
  { key: 'all', labelKey: 'statusFilter.all', hintKey: 'statusFilter.allHint' },
  { key: 'bad', labelKey: 'statusFilter.bad', hintKey: 'statusFilter.badHint' },
  { key: QueueStatusEnum.WARNING, labelKey: 'status.warning', hintKey: 'statusFilter.warningHint' },
  { key: QueueStatusEnum.FAILURE, labelKey: 'status.failure', hintKey: 'statusFilter.failureHint' },
  { key: QueueStatusEnum.SKIPPED, labelKey: 'status.skipped', hintKey: 'statusFilter.skippedHint' },
  { key: QueueStatusEnum.RUNNING, labelKey: 'status.running', hintKey: 'statusFilter.runningHint' },
  { key: QueueStatusEnum.SUCCESS, labelKey: 'status.success', hintKey: 'statusFilter.successHint' }
];

/**
 * The query parameters a chip sends, and the whole of what the GUI knows about filtering
 * by status.
 *
 * Two rules, both load-bearing:
 *
 * 1. **"Needs attention" sends `filter[bad]=1`**, never `filter[status_code]=failure,warning`
 *    and emphatically never a hand-assembled alias list. The database really holds 256
 *    `failed` rows beside 170 `failure` rows and 277 legacy queues besides, so a client-side
 *    list is a list that will be wrong: it either misses the legacy spellings or it goes
 *    stale the next time one is added. `filter[bad]` exists precisely so the alias table
 *    lives in one place — `orchestrator/status.py`, mirrored server-side — and the GUI
 *    asks the question instead of answering it.
 * 2. **A single-status chip sends the canonical code only** (`filter[status_code]=failure`).
 *    The API expands it through `statusVariants()`, so a legacy `failed` row appears in the
 *    "Failure" view without the GUI naming the alias.
 *
 * `'all'` contributes nothing, so the caller's other parameters (crawler, queue, recency,
 * page, sort) are untouched.
 */
export function statusFilterParams(key: StatusFilterKey | null | undefined): Record<string, string> {
  if (!key || key === 'all') return {};
  if (key === 'bad') return { [STATUS_FILTER_BAD_PARAM]: '1' };
  return { [STATUS_FILTER_STATUS_PARAM]: key };
}

/** True when `key` names one of the chips; guards a value arriving from a URL or storage. */
export function isStatusFilterKey(key: string | null | undefined): key is StatusFilterKey {
  return STATUS_FILTER_OPTIONS.some((option) => option.key === key);
}
