/**
 * Reading a `status_message`.
 *
 * Since 2026-08-27 the runner writes a real diagnostic into `status_message` instead of
 * one of seven fixed enum strings, in the shape `"<state text> - <detail>"`, single-line
 * and truncated at 1800 characters. Real examples off the ex63 database:
 *
 * ```
 * minor error encountered - lambda filter children_entertainment failed: APIConnectionError: Connection error.; lambda: UserWarning (line 1007): Videos targeted at children not filtered out...
 * completed with lost jobs - 23/29 jobs succeeded (0 warning, 2 failed, 4 skipped)
 * previous task was not executed - previous job 34129 did not succeed
 * ```
 *
 * The GUI used to render that into a `truncate` cell with the full text only in a
 * `title` attribute — invisible on touch, unreachable by keyboard, and the same
 * "the diagnosis exists but you cannot read it" problem the overhaul set out to end, one
 * layer down. This module is the parsing half of the fix: the component keeps the first
 * clause on screen and expands the rest on demand.
 */

/**
 * The separator the runner writes between the state text and the detail.
 *
 * Deliberately the ASCII `" - "` only. A hyphen without spaces occurs *inside* details
 * (`content-type`, `2026-09-07`, `non-lambda`), so a looser split would cut messages in
 * the middle of a word and invent a second clause that was never written.
 */
export const STATUS_MESSAGE_SEPARATOR = ' - ';

/** A message split into the clause always shown and the remainder behind the disclosure. */
export interface StatusMessageParts {
  /** The first clause — the runner's state text. Always rendered. */
  head: string;
  /** Everything after the first separator, trimmed. `''` when there is nothing more. */
  rest: string;
  /** True when `rest` holds something worth expanding. */
  hasMore: boolean;
  /** The whole message, trimmed — what the copy control puts on the clipboard. */
  full: string;
}

/**
 * Split a `status_message` at its **first** separator.
 *
 * Only the first: a detail routinely contains further `" - "` runs (`"lambda: UserWarning
 * (line 1007) - ..."`), and every one of them belongs to the detail, not to a third
 * clause. A separator at position 0, or none at all, means the whole message is the head
 * — there is no second clause to hide, and hiding the only clause there is would be the
 * bug this function exists to prevent.
 */
export function splitStatusMessage(message: string | null | undefined): StatusMessageParts {
  const full = (message ?? '').toString().trim();
  const index = full.indexOf(STATUS_MESSAGE_SEPARATOR);
  if (index <= 0) {
    // A message that ended with a separator and an empty detail ("state - ") loses the
    // space to `trim()` and would otherwise render its dangling hyphen as if it were part
    // of the state text.
    return { head: full.replace(/\s+-$/, ''), rest: '', hasMore: false, full };
  }

  const head = full.slice(0, index).trim();
  const rest = full.slice(index + STATUS_MESSAGE_SEPARATOR.length).trim();
  return { head, rest, hasMore: rest.length > 0, full };
}

/**
 * A run of message text, optionally carrying the job it refers to.
 *
 * `jobId === null` is plain text; a non-null id is a reference the reader should be able
 * to follow.
 */
export interface StatusMessageSegment {
  text: string;
  jobId: number | null;
}

/**
 * `previous job <id>` as the runner writes it when a job is skipped because its
 * predecessor did not succeed.
 *
 * The `#` is optional and the whitespace is loose, because the phrase is assembled in
 * Java string concatenation rather than from a format string, and the exact spacing has
 * already changed once. Matching is case-insensitive for the same reason.
 */
const PREVIOUS_JOB_PATTERN = /previous\s+job\s+#?(\d+)/gi;

/**
 * The id of the job this message blames, or `null`.
 *
 * That reference is the whole value of a skipped job's message: a run can skip 140 jobs
 * off one failure, and without it the reader has to guess which job actually broke.
 */
export function previousJobId(message: string | null | undefined): number | null {
  const text = (message ?? '').toString();
  const match = new RegExp(PREVIOUS_JOB_PATTERN.source, 'i').exec(text);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Split text into plain runs and `previous job <id>` references, in order.
 *
 * The whole phrase becomes the link, not just the digits: "previous job 34129" is a
 * target a person can hit, and it reads as a link rather than as a number that happens to
 * be blue. Text with no reference comes back as a single plain segment, so callers can
 * render the same way in both cases.
 *
 * A fresh `RegExp` per call on purpose — a module-level global regex carries `lastIndex`
 * between calls and would skip matches in every second message.
 */
export function linkifyPreviousJob(text: string | null | undefined): StatusMessageSegment[] {
  const source = (text ?? '').toString();
  if (!source) return [];

  const pattern = new RegExp(PREVIOUS_JOB_PATTERN.source, PREVIOUS_JOB_PATTERN.flags);
  const segments: StatusMessageSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    const id = Number(match[1]);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (match.index > cursor) {
      segments.push({ text: source.slice(cursor, match.index), jobId: null });
    }
    segments.push({ text: match[0], jobId: id });
    cursor = match.index + match[0].length;
  }

  if (cursor < source.length) {
    segments.push({ text: source.slice(cursor), jobId: null });
  }

  return segments.length ? segments : [{ text: source, jobId: null }];
}
