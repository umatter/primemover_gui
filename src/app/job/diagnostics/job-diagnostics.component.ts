import { Component, Input, OnDestroy } from '@angular/core';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Job } from '@app/job/model/Job';
import { linkifyPreviousJob, StatusMessageSegment } from '@app/queue/status/status-message';
import { ClipboardService } from '@shared/service/clipboard.service';

/** What the runner's `captcha_found` flag can tell us. Three states, not two. */
export type CaptchaFoundState = 'yes' | 'no' | 'unknown';

/** How long the copy control confirms itself before going back to its resting label. */
const COPY_FEEDBACK_MS = 2000;

/**
 * Everything the API knows about one job's execution, in one expander.
 *
 * The three facts here are already on every job row the API sends and were rendered
 * nowhere: the full `status_message`, when the job ran, and whether the runner saw a
 * captcha string. Chasing any of them meant leaving the GUI for the runner log.
 *
 * Two deliberate omissions, both of which would otherwise be read as evidence:
 *
 * - **`captcha_solved` is not rendered at all.** The runner has no call site that ever
 *   writes it (`JobService.java`), so it is `null` on every job in the database. A field
 *   labelled "captcha solved: no" would state a fact nobody measured, and one labelled
 *   "unknown" would imply a signal exists that simply has not arrived. It does not exist.
 * - **`captcha_found` is labelled for what it is** — a substring match on the page source
 *   — and not as "a captcha appeared". It says a captcha-like string was present in the
 *   HTML, which is a hint, not a detection, and certainly not a blocked session.
 *
 * An absent value is "not reported", never "no": all three fields are nullable, and this
 * expander exists to make missing evidence visible rather than to round it down to a
 * reassuring zero.
 */
@Component({
  selector: 'app-job-diagnostics',
  templateUrl: './job-diagnostics.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, DatePipe, RouterLink, TranslateModule]
})
export class JobDiagnosticsComponent implements OnDestroy {
  @Input() job: Job | null = null;

  /** Route prefix for a `previous job <id>` reference; see {@link StatusComponent}. */
  @Input() jobLinkPrefix: unknown[] = ['/jobs', 'behaviors'];

  /** `null` at rest, `true` after a successful copy, `false` when the copy was refused. */
  copyOutcome: boolean | null = null;

  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Parse cache, keyed on the message itself — the same arrangement, for the same reason,
   * as {@link StatusMessageComponent}.
   *
   * `messageSegments` feeds an `*ngFor`, and a getter that re-splits the string hands back
   * a brand-new array of brand-new objects on every change-detection pass. `ngFor` tracks
   * by identity, so it would tear the `<a>`/`<span>` runs down and rebuild them several
   * times a second — losing a text selection mid-read of the very diagnostic this expander
   * exists to make readable, on every row of a hundred-row table.
   */
  private cacheKey: string | null = null;
  private cachedSegments: StatusMessageSegment[] = [];

  constructor(private clipboard: ClipboardService) {}

  /** The runner's diagnostic in full, or '' (never the literal 'null'). */
  get message(): string {
    return (this.job?.status_message ?? '').toString().trim();
  }

  /** The message split around any `previous job <id>` reference, so it can be followed. */
  get messageSegments(): StatusMessageSegment[] {
    const message = this.message;
    if (this.cacheKey !== message) {
      this.cacheKey = message;
      this.cachedSegments = linkifyPreviousJob(message);
    }
    return this.cachedSegments;
  }

  get startedAt(): string {
    return (this.job?.started_at ?? '').toString().trim();
  }

  get finishedAt(): string {
    return (this.job?.finished_at ?? '').toString().trim();
  }

  /**
   * Tri-state reading of `captcha_found`.
   *
   * The column arrives as a boolean, as MySQL's 0/1, or as the string form of either
   * depending on the driver and the serialiser, and as `null` for every job that never
   * reported. Anything unrecognised is `unknown`: inventing a "no" from a value we cannot
   * read is how an absent signal becomes a claim.
   */
  get captchaFound(): CaptchaFoundState {
    const raw = this.job?.captcha_found;
    if (raw === null || raw === undefined || raw === '') return 'unknown';
    if (raw === true || raw === 1) return 'yes';
    if (raw === false || raw === 0) return 'no';
    const text = raw.toString().trim().toLowerCase();
    if (['1', 'true', 'yes'].includes(text)) return 'yes';
    if (['0', 'false', 'no'].includes(text)) return 'no';
    return 'unknown';
  }

  /** Translation key for the captcha row's value. */
  get captchaLabelKey(): string {
    return `diagnostics.captcha.${this.captchaFound}`;
  }

  /** Label for the copy control: resting, confirmed, or refused. */
  get copyLabelKey(): string {
    if (this.copyOutcome === true) return 'statusMessage.copied';
    if (this.copyOutcome === false) return 'statusMessage.copyFailed';
    return 'statusMessage.copy';
  }

  /**
   * The outcome as something to announce, or `null` while nothing has happened yet.
   *
   * Feeds a visually-hidden `aria-live` region. Renaming the button is a name change, not
   * an event, so a screen-reader user was told nothing when a copy silently failed — which
   * on an insecure origin (the lab box over plain HTTP) is a reachable outcome, not a
   * theoretical one.
   */
  get copyOutcomeKey(): string | null {
    return this.copyOutcome === null ? null : this.copyLabelKey;
  }

  /** Router link for a `previous job <id>` reference. */
  jobLink(jobId: number): unknown[] {
    return [...this.jobLinkPrefix, jobId];
  }

  async copy(event?: Event): Promise<void> {
    event?.stopPropagation();
    if (!this.message) return;

    this.copyOutcome = await this.clipboard.copy(this.message);
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
    this.copyResetTimer = setTimeout(() => {
      this.copyOutcome = null;
      this.copyResetTimer = null;
    }, COPY_FEEDBACK_MS);
  }

  ngOnDestroy(): void {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }
}
