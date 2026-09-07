import { Component, Input } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { JobRollupBreakdown, JobRollupSegment, Queue, queueJobRollupBreakdown } from '@app/queue/model/queue';

/** Fill colour per segment. Same vocabulary as the status pill, so nothing has to be relearned. */
const SEGMENT_CLASS: Readonly<Record<JobRollupSegment['kind'], string>> = {
  succeeded: 'bg-success',
  warning: 'bg-warning',
  failed: 'bg-danger',
  skipped: 'bg-faint',
  unaccounted: 'bg-surface-3'
};

/**
 * A run's job rollup as one compact stacked bar: succeeded / degraded / failed / skipped,
 * plus the unaccounted remainder, of the run's total.
 *
 * It replaces the three `processed` / `processing` / `reviewed` Yes/No columns on
 * `/queues`, which were given equal width to the run's actual status while the typed
 * `jobs_*_count` rollup — the numbers that say whether a run produced a full session — was
 * rendered nowhere. Those flags are not deleted: the caller passes them in
 * {@link footnote}, and they stay on hover and in the screen-reader label.
 *
 * The numbers themselves are not rendered as text (the bar has to fit a table cell); they
 * are in the `title` and in the `aria-label`, which carry the same sentence.
 */
@Component({
  selector: 'app-job-rollup-bar',
  templateUrl: './job-rollup-bar.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, TranslateModule]
})
export class JobRollupBarComponent {
  @Input() run: Queue | null = null;

  /**
   * Extra text appended to the hover title and the screen-reader label.
   *
   * `/queues` uses it to keep `processed` / `processing` / `reviewed` reachable after
   * their columns were replaced by this bar.
   */
  @Input() footnote = '';

  /**
   * Breakdown cache, keyed on the run object the bar was last drawn from.
   *
   * `drawn` feeds an `*ngFor`, so a getter that recomputes it returns a fresh array of
   * fresh objects on every change-detection pass and `ngFor`, which tracks by identity,
   * rebuilds every slice of every bar in the table each time. The key is the `run`
   * reference because that is what @ngrx/data replaces when a row's counts actually change
   * — an upsert produces a new object, so a real update still invalidates this.
   */
  private cachedRun: Queue | null | undefined;
  private cachedBreakdown: JobRollupBreakdown | null = null;
  private cachedDrawn: JobRollupSegment[] = [];

  constructor(private translate: TranslateService) {}

  get breakdown(): JobRollupBreakdown {
    return this.compute().breakdown;
  }

  /** Only the non-empty slices are drawn; the empty ones stay in {@link summary}. */
  get drawn(): JobRollupSegment[] {
    return this.compute().drawn;
  }

  private compute(): { breakdown: JobRollupBreakdown; drawn: JobRollupSegment[] } {
    if (this.cachedBreakdown === null || this.cachedRun !== this.run) {
      this.cachedRun = this.run;
      this.cachedBreakdown = queueJobRollupBreakdown(this.run);
      this.cachedDrawn = this.cachedBreakdown.segments.filter((segment) => segment.count > 0);
    }
    return { breakdown: this.cachedBreakdown, drawn: this.cachedDrawn };
  }

  segmentClass(kind: JobRollupSegment['kind']): string {
    return SEGMENT_CLASS[kind];
  }

  /**
   * The whole rollup as one sentence, for the tooltip and the screen reader.
   *
   * Built with `instant()` rather than the pipe because it is a single attribute made of
   * six numbers; splitting it across template expressions would put half of it in the
   * label and half nowhere.
   */
  get summary(): string {
    const breakdown = this.breakdown;
    if (!breakdown.reported) return this.withFootnote(this.translate.instant('queue.rollup.none'));

    const by = (kind: JobRollupSegment['kind']): number =>
      breakdown.segments.find((segment) => segment.kind === kind)?.count ?? 0;

    return this.withFootnote(
      this.translate.instant('queue.rollup.label', {
        succeeded: by('succeeded'),
        warning: by('warning'),
        failed: by('failed'),
        skipped: by('skipped'),
        unaccounted: by('unaccounted'),
        total: breakdown.total
      })
    );
  }

  private withFootnote(text: string): string {
    const extra = (this.footnote ?? '').trim();
    return extra ? `${text} · ${extra}` : text;
  }
}
