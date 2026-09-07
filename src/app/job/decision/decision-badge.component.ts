import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Job } from '@app/job/model/Job';
import { DecisionBadgeKind, JobDecisionVerdict, decisionBadgeKind, jobDecisionVerdict } from '@app/job/model/decision';

/**
 * The decision function's verdict for one job, as a badge.
 *
 * This is the scientifically load-bearing pixel of the whole status overhaul. Everything
 * else on a job row describes whether the *software* worked; this describes whether the
 * *experiment* worked. The two genuinely come apart: `treatment_lost` means a valid
 * xpath was returned, a real video was clicked, the job finished and the run went green —
 * and the bot nevertheless produced control-arm data, so that session cannot answer the
 * question it was scheduled to answer.
 *
 * Four outcomes, and the two quiet ones matter as much as the loud ones:
 *
 * | kind | look | when |
 * |---|---|---|
 * | `lost` | red | `decision_treatment_lost === true` |
 * | `degraded` | amber | degraded but not lost — part of the treatment did not apply |
 * | `unknown` | grey, quiet | a decision job with **no verdict**: legacy row, or a runner that has not been redeployed |
 * | `none` | nothing rendered | a healthy verdict, or a job type that never calls the decision function |
 *
 * A control crawler whose video was picked at random is `none`: nothing was requested,
 * nothing failed, `selection_mode: "random"` is its *correct* output. Rendering a warning
 * there would paint roughly 82% of all lambda jobs on the production box yellow, which is
 * exactly the false-alarm machine `treatment_lost` was introduced to avoid.
 */
@Component({
  selector: 'app-decision-badge',
  templateUrl: './decision-badge.component.html',
  standalone: true,
  imports: [NgIf, TranslateModule]
})
export class DecisionBadgeComponent {
  @Input() job: Job | null = null;

  /**
   * Verdict cache, keyed on the job object the badge was last read from.
   *
   * `kind` is read half a dozen times per change-detection pass (the `*ngIf`, the label,
   * the tooltip, the tint), and every read rebuilds the verdict from the four columns —
   * `JSON.parse`-ing `decision_report` when the API sent it as a string. On a hundred-row
   * job list that is a few hundred parses a second for an answer that only changes when
   * the row does. @ngrx/data replaces the object on an upsert, so a real update still
   * invalidates this.
   */
  private cachedJob: Job | null | undefined;
  private cachedKind: DecisionBadgeKind = 'none';
  private cachedVerdict: JobDecisionVerdict | null = null;

  constructor(private translate: TranslateService) {}

  get kind(): DecisionBadgeKind {
    this.ensure();
    return this.cachedKind;
  }

  /** This job's full verdict, rebuilt only when the job row itself changes. */
  private get verdict(): JobDecisionVerdict {
    this.ensure();
    return this.cachedVerdict as JobDecisionVerdict;
  }

  private ensure(): void {
    if (this.cachedVerdict !== null && this.cachedJob === this.job) return;
    this.cachedJob = this.job;
    this.cachedVerdict = jobDecisionVerdict(this.job);
    this.cachedKind = decisionBadgeKind(this.job);
  }

  get labelKey(): string {
    switch (this.kind) {
      case 'lost':
        return 'decision.badge.treatmentLost';
      case 'degraded':
        return 'decision.badge.degraded';
      case 'unknown':
        return 'decision.badge.noVerdict';
      default:
        return '';
    }
  }

  /**
   * The whole verdict in one line: what failed, why the LLM was unavailable, and how the
   * video was chosen — the last one explicitly labelled as a description, so nobody reads
   * `random` as a fault. Everything a researcher needs to decide whether to open the
   * report, without opening the report.
   */
  get tooltip(): string {
    const kind = this.kind;
    if (kind === 'none') return '';

    const parts: string[] = [this.translate.instant('decision.badge.' + this.tooltipLeadKey)];

    if (kind !== 'unknown') {
      const verdict = this.verdict;

      if (verdict.failedFilters.length) {
        parts.push(
          this.translate.instant('decision.tooltip.failedFilters', {
            filters: verdict.failedFilters.map((f) => f.name).join(', ')
          })
        );
      }

      const llmError = verdict.llm?.error_type || verdict.llm?.error;
      if (llmError) {
        parts.push(this.translate.instant('decision.tooltip.llmError', { error: llmError }));
      }

      if (verdict.selectionMode) {
        // Labelled "how it was chosen (description only)" on purpose: this string is the
        // one place a reader could mistake a neutral descriptor for a verdict.
        parts.push(this.translate.instant('decision.tooltip.selectionMode', { mode: verdict.selectionMode }));
      }
    }

    return parts.filter(Boolean).join(' · ');
  }

  private get tooltipLeadKey(): string {
    switch (this.kind) {
      case 'lost':
        return 'treatmentLostHint';
      case 'degraded':
        return 'degradedHint';
      default:
        return 'noVerdictHint';
    }
  }
}
