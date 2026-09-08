import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Experiment, experimentBadRuns } from '@app/experiment/model/experiment';
import {
  DEFAULT_HEALTH_WINDOW,
  ExperimentHealth,
  HealthState,
  HealthTone,
  experimentHealthState,
  healthJobsNeedAttention,
  healthRunsNeedAttention,
  healthTone,
  healthWindowHours
} from '@app/experiment/model/health';
import { ExperimentHealthApiService } from '@app/experiment/service/experiment-health-api.service';

/** Tailwind classes per tone: [container, dot, headline]. */
const TONE_CLASSES: Readonly<Record<HealthTone, { box: string; dot: string; text: string }>> = {
  danger: { box: 'border-danger/40 bg-danger-tint', dot: 'bg-danger', text: 'text-danger' },
  warning: { box: 'border-warning/40 bg-warning-tint', dot: 'bg-warning', text: 'text-warning' },
  success: { box: 'border-line bg-surface-2', dot: 'bg-success', text: 'text-success' },
  neutral: { box: 'border-line bg-surface-2', dot: 'bg-faint', text: 'text-muted' }
};

/**
 * The health strip on an experiment card: whether this study needs attention, without
 * opening it.
 *
 * Until this existed the grid showed a contact and an `updated_at` — nothing above the
 * individual bot said anything about whether the runs were healthy, so triage meant
 * opening every study in turn.
 *
 * **Where the numbers come from, and why there are two sources.** `runs_bad_count` rides
 * along with the experiment list and answers *whether* immediately, for free. It cannot
 * answer *why* (failed or merely degraded?) or *out of how many*, and those need
 * `/experiments/{id}/health`. So the strip renders from the count the moment the list
 * lands and refines itself when the health call answers — one request per card, gated to
 * four at a time, cached per (experiment, window), and switched off entirely after the
 * first 404 (see {@link ExperimentHealthApiService}).
 *
 * **Never green on missing data.** An absent `runs_bad_count` and an unreachable `/health`
 * are the same claim — *we do not know* — and both render neutral grey. So does a window
 * with no runs in it, and so does a run whose status code we do not recognise: an
 * unrecognised status is not a success, and colouring it green is precisely the class of
 * bug this change set exists to remove.
 *
 * **Never green on runs that were fine and jobs that were not**, either. The two tallies
 * come from two independent grouped queries API-side, so a study whose runs all report
 * `success` while 22 of its jobs failed is an ordinary payload, not a contradiction — and
 * it was rendering "All 1 runs completed cleanly" on the one screen a researcher triages
 * from, while the screen one click deeper showed the same run red. The job buckets now
 * drive the state and get a line of their own, so the headline can never claim more than
 * the runs alone justify.
 */
@Component({
  selector: 'app-health-strip',
  templateUrl: './health-strip.component.html',
  standalone: true,
  imports: [NgIf, NgClass, DatePipe, TranslateModule]
})
export class HealthStripComponent implements OnChanges, OnDestroy {
  @Input() experiment: Experiment | null = null;
  /** Window in hours; the card grid uses the endpoint's own default. */
  @Input() hours: number = healthWindowHours(DEFAULT_HEALTH_WINDOW);

  health: ExperimentHealth | null = null;
  /** True while the health call is in flight, so the strip does not assert "no data" yet. */
  loading = false;

  private subscription = new Subscription();

  constructor(private healthService: ExperimentHealthApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['experiment'] && !changes['hours']) return;
    this.load();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /** `runs_bad_count`, or null when the API does not append it. */
  get badRunsCount(): number | null {
    return this.health ? this.health.bad_runs : experimentBadRuns(this.experiment);
  }

  /** Total runs in the window — only the health endpoint knows it. */
  get totalRuns(): number | null {
    return this.health ? this.health.runs.total : null;
  }

  get state(): HealthState {
    return experimentHealthState(this.health, experimentBadRuns(this.experiment));
  }

  /** Jobs in the window that produced control-arm data while configured to be treated. */
  get treatmentLostJobs(): number {
    return this.health?.treatment_lost_jobs ?? 0;
  }

  /** Runs still executing in the window; 0 until the health call answers. */
  get runningRuns(): number {
    return this.health?.runs.running ?? 0;
  }

  /** Runs the runner declined to execute; 0 until the health call answers. */
  get skippedRuns(): number {
    return this.health?.runs.skipped ?? 0;
  }

  /** Jobs the contract calls bad: `failure OR warning`, alias-expanded server-side. */
  get badJobs(): number {
    return this.health?.bad_jobs ?? 0;
  }

  /** Jobs in the window; 0 until the health call answers. */
  get totalJobs(): number {
    return this.health?.jobs.total ?? 0;
  }

  /**
   * True when the state was raised by the **jobs** while every run looks fine.
   *
   * That combination is not an edge case, it is the dominant state for the whole
   * API → GUI → runner deploy window: a queue only reports `warning` once the new jar is
   * running, so until then a degraded run is spelled `success` and the only evidence is
   * in the job counts. The headline has to name the jobs then, because "0 of 10 runs need
   * attention" is both wrong and reassuring.
   */
  get jobsDriveState(): boolean {
    return !healthRunsNeedAttention(this.health) && healthJobsNeedAttention(this.health);
  }

  /**
   * Whether to add the job line under a run-driven headline.
   *
   * Suppressed when the headline is already the job one, so the strip states the figure
   * once.
   */
  get showJobsAttention(): boolean {
    return this.badJobs > 0 && this.headlineKey !== 'health.strip.jobsAttention';
  }

  /** Red when a job failed outright, amber for the degraded ones. */
  get jobsAttentionClass(): string {
    return (this.health?.jobs.failure ?? 0) > 0 ? 'text-danger' : 'text-warning';
  }

  get tone(): HealthTone {
    return healthTone(this.state, this.treatmentLostJobs);
  }

  get boxClass(): string {
    return TONE_CLASSES[this.tone].box;
  }

  get dotClass(): string {
    return TONE_CLASSES[this.tone].dot;
  }

  get textClass(): string {
    return TONE_CLASSES[this.tone].text;
  }

  /**
   * The headline, chosen so it never claims more than is known.
   *
   * "N of M" only when M is known; "N runs need attention" when only the count is;
   * "checking" while the health call is in flight, so an in-flight request is not
   * announced as an absence of data. Three of the branches exist because the obvious
   * sentence would have been false:
   *
   * - runs clean, jobs bad → the headline is about the **jobs**, not "0 of M runs";
   * - runs still executing → "N of M still running", never "completed cleanly";
   * - a finished window that also skipped runs → the skipped ones are named rather than
   *   folded into a claim that all M completed.
   */
  get headlineKey(): string {
    const bad = this.badRunsCount;
    if (this.state === 'failure' || this.state === 'warning') {
      if (this.jobsDriveState) return 'health.strip.jobsAttention';
      return this.totalRuns === null ? 'health.strip.attentionNoTotal' : 'health.strip.attention';
    }
    if (this.state === 'running') return 'health.strip.running';
    if (this.state === 'clean') {
      if (this.totalRuns === null) return 'health.strip.cleanNoTotal';
      return this.skippedRuns > 0 ? 'health.strip.cleanWithSkipped' : 'health.strip.clean';
    }
    if (this.health && this.health.runs.unknown > 0) return 'health.strip.unknownRuns';
    if (this.health && this.health.jobs.unknown > 0) return 'health.strip.unknownJobs';
    // Unknown with a non-empty window and no unrecognised bucket: the run buckets do not
    // add up to `total`, and the difference is the thing nobody may round down to zero.
    if (this.health && this.health.runs.total > 0) return 'health.strip.unaccountedRuns';
    if (this.health) return 'health.strip.noRuns';
    if (this.loading && bad === null) return 'health.strip.checking';
    return 'health.strip.noData';
  }

  get headlineParams(): Record<string, number> {
    const runs = this.health?.runs;
    // Every bucket, not just the benign ones: `unaccounted` is what NO bucket claims, and
    // it is only rendered in the state where the others are empty anyway.
    const bucketed = runs ? runs.success + runs.skipped + runs.running + runs.warning + runs.failure + runs.unknown : 0;
    return {
      bad: this.badRunsCount ?? 0,
      total: this.totalRuns ?? 0,
      unknown: runs?.unknown ?? 0,
      success: runs?.success ?? 0,
      running: this.runningRuns,
      skipped: this.skippedRuns,
      badJobs: this.badJobs,
      totalJobs: this.totalJobs,
      unknownJobs: this.health?.jobs.unknown ?? 0,
      unaccounted: Math.max((this.totalRuns ?? 0) - bucketed, 0)
    };
  }

  /** When the last run in the window finished; null when nothing has, or is not known. */
  get lastFinishedAt(): string | null {
    return this.health?.last_finished_at ?? null;
  }

  private load(): void {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();
    this.health = null;
    const id = Number(this.experiment?.id);
    if (!Number.isFinite(id) || id <= 0) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.subscription.add(
      // The service never errors: a 404 from an API without the endpoint arrives here as
      // `null`, which is the neutral unknown state, not an error toast. The error arm is
      // defence in depth — if that contract is ever broken, this strip must fail neutral
      // grey rather than green, and must not throw its way to the global handler.
      this.healthService.health(id, this.hours).subscribe({
        next: (health) => {
          this.health = health;
          this.loading = false;
        },
        error: () => {
          this.health = null;
          this.loading = false;
        }
      })
    );
  }
}
