import { Component, Input, OnDestroy } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { saveAs } from 'file-saver';

import { Job } from '@app/job/model/Job';
import { DecisionFilterRow, JobDecisionVerdict, isDecisionJobType, jobDecisionVerdict } from '@app/job/model/decision';
import { DecisionApiService } from '@app/job/service/decision-api.service';

/**
 * The parsed decision report for one job, as an expander.
 *
 * Three rules from `docs/integration-contract.md` §7.3 are load-bearing here, and each
 * one has already been got wrong once somewhere in this stack:
 *
 * 1. **`filters[x] === "skipped"` means NOT REQUESTED, never a failure.** Five of the six
 *    filters are "skipped" on every control crawler. Rendering them as failures is how a
 *    report turns into noise nobody reads.
 * 2. **`selection_mode` is a description.** It is shown, labelled as such, and nothing is
 *    coloured or counted by it.
 * 3. **No verdict is not a clean verdict.** A job with all four columns NULL gets an
 *    explicit "nothing was recorded" panel — with the raw-payload fetch offered, because
 *    for a pre-deploy job the answer really does still exist, in MinIO.
 */
@Component({
  selector: 'app-decision-report',
  templateUrl: './decision-report.component.html',
  standalone: true,
  imports: [NgIf, NgForOf, TranslateModule]
})
export class DecisionReportComponent implements OnDestroy {
  @Input() job: Job | null = null;

  /** Set while the raw payload is in flight, so the button can say so. */
  loadingRaw = false;
  /** Set when the fetch failed — a 404 (nothing archived) reads the same as a 500 here. */
  rawErrorKey: string | null = null;

  /**
   * Verdict cache, keyed on the job object the report was last rendered from.
   *
   * `<details>` keeps its contents in the DOM while collapsed, so every binding in this
   * template is evaluated on every change-detection pass whether or not anyone has opened
   * it — and `verdict` is read a dozen times over. Recomputing it each time re-runs
   * `JSON.parse` on `decision_report` for every row of a hundred-row job list. @ngrx/data
   * replaces the job object on an upsert, so a real update still invalidates this.
   */
  private cachedJob: Job | null | undefined;
  private cachedVerdict: JobDecisionVerdict | null = null;

  /** In-flight raw-payload fetch, so a row destroyed mid-request stops writing to itself. */
  private readonly subscriptions = new Subscription();

  constructor(private decisionApi: DecisionApiService) {}

  get verdict(): JobDecisionVerdict {
    if (this.cachedVerdict === null || this.cachedJob !== this.job) {
      this.cachedJob = this.job;
      this.cachedVerdict = jobDecisionVerdict(this.job);
    }
    return this.cachedVerdict;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** True when the API recorded a verdict for this job at all. */
  get reported(): boolean {
    return this.verdict.reported;
  }

  /** True for a job type that calls the decision function (so "no verdict" is notable). */
  get isDecisionJob(): boolean {
    return isDecisionJobType(this.job?.type);
  }

  get filters(): DecisionFilterRow[] {
    return this.verdict.filters;
  }

  /** Translation key for one filter's state cell. */
  filterLabelKey(row: DecisionFilterRow): string {
    switch (row.state) {
      case 'failed':
        return 'decision.filter.failed';
      case 'not-requested':
        return 'decision.filter.notRequested';
      default:
        return 'decision.filter.ok';
    }
  }

  /** Colour for one filter's state cell — grey for "not requested", never red. */
  filterClass(row: DecisionFilterRow): string {
    switch (row.state) {
      case 'failed':
        return 'text-danger';
      case 'not-requested':
        return 'text-faint';
      default:
        return 'text-success';
    }
  }

  get rawUrl(): string {
    return this.job ? this.decisionApi.decisionUrl(this.job.id) : '';
  }

  /**
   * Fetch the archived payload and hand it to the user as a file.
   *
   * A download rather than a new tab: the endpoint needs the bearer token the HTTP
   * interceptor adds, which a browser-initiated navigation would not carry.
   */
  downloadRaw(): void {
    if (!this.job || this.loadingRaw) return;
    const jobId = this.job.id;
    this.loadingRaw = true;
    this.rawErrorKey = null;
    this.subscriptions.add(
      this.decisionApi.fetchDecision(jobId).subscribe({
        next: (payload) => {
          this.loadingRaw = false;
          saveAs(
            new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
            `job-${jobId}-decision.json`
          );
        },
        error: () => {
          this.loadingRaw = false;
          // Deliberately "could not be read", not "there is none": an unreachable store is
          // missing evidence about a job, never evidence that the job was fine.
          this.rawErrorKey = 'decision.raw.error';
        }
      })
    );
  }
}
