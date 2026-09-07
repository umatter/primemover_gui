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
   * announced as an absence of data.
   */
  get headlineKey(): string {
    const bad = this.badRunsCount;
    if (this.state === 'failure' || this.state === 'warning') {
      return this.totalRuns === null ? 'health.strip.attentionNoTotal' : 'health.strip.attention';
    }
    if (this.state === 'clean') {
      return this.totalRuns === null ? 'health.strip.cleanNoTotal' : 'health.strip.clean';
    }
    if (this.health && this.health.runs.unknown > 0) return 'health.strip.unknownRuns';
    if (this.health) return 'health.strip.noRuns';
    if (this.loading && bad === null) return 'health.strip.checking';
    return 'health.strip.noData';
  }

  get headlineParams(): Record<string, number> {
    return {
      bad: this.badRunsCount ?? 0,
      total: this.totalRuns ?? 0,
      unknown: this.health?.runs.unknown ?? 0
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
