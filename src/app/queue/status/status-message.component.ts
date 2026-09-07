import { Component, Input, OnDestroy } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import {
  linkifyPreviousJob,
  splitStatusMessage,
  StatusMessageParts,
  StatusMessageSegment
} from '@app/queue/status/status-message';
import { ClipboardService } from '@shared/service/clipboard.service';

/** Unique per instance, so `aria-controls` points at this disclosure and no other. */
let disclosureSequence = 0;

/** How long the copy control confirms itself before going back to its resting label. */
const COPY_FEEDBACK_MS = 2000;

/**
 * A `status_message`, readable.
 *
 * Since 2026-08-27 the runner writes `"<state text> - <detail>"` and real details run to
 * the 1800-character cap:
 *
 * ```
 * minor error encountered - lambda filter children_entertainment failed: APIConnectionError: Connection error.; lambda: UserWarning (line 1007): Videos targeted at children not filtered out...
 * completed with lost jobs - 23/29 jobs succeeded (0 warning, 2 failed, 4 skipped)
 * previous task was not executed - previous job 34129 did not succeed
 * ```
 *
 * Rendered into a `max-w-xs` cell with `truncate` — which is how every screen showed it —
 * that is a diagnosis nobody can read, recoverable only by hovering a mouse over it. That
 * is the same "the answer exists but you cannot get at it" failure the whole error/warning
 * overhaul set out to end, one layer down. So:
 *
 * - the **first clause is always visible**, and wraps rather than truncating;
 * - the remainder expands **in place** behind a real `<button>` carrying `aria-expanded`
 *   and `aria-controls` — a disclosure, keyboard operable, not a hover tooltip;
 * - a copy control puts the **whole** message on the clipboard, because the next thing
 *   anyone does with an 1800-character diagnostic is paste it somewhere, and a copy of the
 *   visible fragment would be worse than none — it looks complete;
 * - `previous job <id>` becomes a link, so a cascade of skipped jobs can be walked back to
 *   the job that actually failed. One failure can skip a hundred and forty jobs, and
 *   without that reference the reader has to guess which one broke.
 *
 * Its own component rather than markup inside the pill, because two screens need it: the
 * shared `app-status` pill, and the bot-detail run list, whose status pill is hand-rolled
 * (it has richer states than the five codes) but whose message had exactly the same
 * problem.
 */
@Component({
  selector: 'app-status-message',
  templateUrl: './status-message.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, RouterLink, TranslateModule]
})
export class StatusMessageComponent implements OnDestroy {
  /** Raw `status_message`. Bind it — interpolation renders a null as the string "null". */
  @Input() statusMessage?: string | null;

  /**
   * Tailwind text colour for the first clause, so the message can carry the severity its
   * pill does. The remainder stays muted: it is detail, not headline.
   */
  @Input() toneClass = 'text-muted';

  /**
   * Route prefix for a `previous job <id>` reference.
   *
   * `/jobs/behaviors/:id` is the app's only per-job screen — it is where the job list's
   * own "show" action goes — so that is where the link points. A dedicated job-detail
   * route would be a better target; when one exists, this input is the single place to
   * repoint every message in the app.
   */
  @Input() jobLinkPrefix: unknown[] = ['/jobs', 'behaviors'];

  /** Whether the remainder of the message is on screen. */
  expanded = false;

  /** `null` at rest, `true` after a successful copy, `false` when the copy was refused. */
  copyOutcome: boolean | null = null;

  /** DOM id of the expanded region, for `aria-controls`. */
  readonly disclosureId = `status-message-${++disclosureSequence}`;

  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Parse cache, keyed on the message itself.
   *
   * Getters rather than `ngOnChanges` fields because these inputs are set both from
   * templates and directly (specs, and any host assigning the instance); an `ngOnChanges`
   * that never fires would leave the disclosure showing a stale message. Memoising on the
   * string keeps that cheap in a hundred-row table.
   */
  private cacheKey: string | null = null;
  private cachedParts: StatusMessageParts = { head: '', rest: '', hasMore: false, full: '' };
  private cachedHead: StatusMessageSegment[] = [];
  private cachedRest: StatusMessageSegment[] = [];

  constructor(private clipboard: ClipboardService) {}

  /** The diagnostic, or '' when the API sent nothing (rather than the literal 'null'). */
  get message(): string {
    return (this.statusMessage ?? '').toString().trim();
  }

  /** The first clause — always rendered. */
  get head(): string {
    return this.parts.head;
  }

  /** Everything after the first ` - `, or ''. */
  get rest(): string {
    return this.parts.rest;
  }

  /** True when there is a remainder worth a disclosure control. */
  get hasMore(): boolean {
    return this.parts.hasMore;
  }

  /** The head, split around any `previous job <id>` reference. */
  get headSegments(): StatusMessageSegment[] {
    this.parse();
    return this.cachedHead;
  }

  /** The remainder, split around any `previous job <id>` reference. */
  get restSegments(): StatusMessageSegment[] {
    this.parse();
    return this.cachedRest;
  }

  /** Label for the copy control: resting, confirmed, or refused. */
  get copyLabelKey(): string {
    if (this.copyOutcome === true) return 'statusMessage.copied';
    if (this.copyOutcome === false) return 'statusMessage.copyFailed';
    return 'statusMessage.copy';
  }

  /** Router link for a `previous job <id>` reference. */
  jobLink(jobId: number): unknown[] {
    return [...this.jobLinkPrefix, jobId];
  }

  /** Toggle the disclosure. A plain method so the control stays a real button. */
  toggle(event?: Event): void {
    // Some rows are themselves clickable; expanding a message must not also navigate.
    event?.stopPropagation();
    this.expanded = !this.expanded;
  }

  /**
   * Put the whole message — head and detail — on the clipboard.
   *
   * The whole one, never the visible fragment: it is about to be pasted into an issue or
   * a chat message, where a silent truncation reads as the complete diagnosis.
   */
  async copy(event?: Event): Promise<void> {
    event?.stopPropagation();
    const text = this.parts.full;
    if (!text) return;

    this.copyOutcome = await this.clipboard.copy(text);
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
    this.copyResetTimer = setTimeout(() => {
      this.copyOutcome = null;
      this.copyResetTimer = null;
    }, COPY_FEEDBACK_MS);
  }

  ngOnDestroy(): void {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }

  private get parts(): StatusMessageParts {
    this.parse();
    return this.cachedParts;
  }

  private parse(): void {
    const message = this.message;
    if (this.cacheKey === message) return;
    this.cacheKey = message;
    this.cachedParts = splitStatusMessage(message);
    this.cachedHead = linkifyPreviousJob(this.cachedParts.head);
    this.cachedRest = linkifyPreviousJob(this.cachedParts.rest);
  }
}
