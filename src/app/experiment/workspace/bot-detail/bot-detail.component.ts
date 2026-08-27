import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, Subscription, switchMap } from 'rxjs';

import { Crawler } from '@app/crawler/model/crawler';
import { hasQueueJobRollup, Queue, queueJobRollup } from '@app/queue/model/queue';
import { CrawlerService, QueueService } from '@app/entity/service';
import { normalizeStatus, QueueStatusEnum } from '@app/queue/status/status.enum';
import { fadeIn } from '@shared/animation/trigger';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { RunCreateComponent } from '../run-create/run-create.component';

export type RunState = 'scheduled' | 'running' | 'succeeded' | 'warning' | 'failed' | 'skipped';

/**
 * Slice B — Bot detail: lists a bot's Runs (Queues) with honest status and hosts the
 * "New run" panel. Deep-linkable at /experiments/:id/bots/:botId. Later slices add the
 * per-run Job composer (Slice C) reached from each run here.
 */
@Component({
  selector: 'app-bot-detail',
  templateUrl: './bot-detail.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgIf,
    NgForOf,
    NgClass,
    RouterLink,
    TranslateModule,
    LoadingSpinnerComponent,
    RunCreateComponent
  ],
  animations: [fadeIn]
})
export class BotDetailComponent implements OnInit, OnDestroy {
  bot$!: Observable<Crawler | undefined>;
  runs$!: Observable<Queue[]>;
  isLoading$ = this.queueService.loading$;

  experimentId!: number;
  botId!: number;
  showNewRun = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private crawlerService: CrawlerService,
    private queueService: QueueService
  ) {}

  ngOnInit(): void {
    this.bot$ = this.route.paramMap.pipe(
      switchMap((params) => {
        this.experimentId = Number(params.get('id'));
        this.botId = Number(params.get('botId'));
        this.loadRuns();
        return this.crawlerService.getByKey(this.botId);
      })
    );

    this.runs$ = this.queueService.entities$.pipe(
      map((queues) => queues.filter((q) => Number(q.crawler_id) === Number(this.botId)))
    );
  }

  private loadRuns(): void {
    this.queueService.getWithQuery({ ['filter[crawler]']: String(this.botId) });
  }

  /**
   * Honest run state for the status pill (docs/specs/runs-and-bots.md Slice B).
   *
   * `skipped` used to collapse into `scheduled`, which made a run the runner refused to
   * execute look identical to one that simply has not started yet. `warning` is the run
   * whose jobs completed but degraded — the API reports no `warning` on a queue, so it is
   * derived from the per-job rollup; that is the silent treatment-arm degradation this
   * screen has to stop hiding.
   *
   * The runner's own `status_code` is not the last word on a run that says `success`.
   * It reports the *joblist's* outcome, which is 'success' as soon as the list was worked
   * through — individually failed jobs do not change it. Queue 845 in the live database
   * is the case: status_code 'success', message 'done', and 22 of its 113 jobs failed.
   * A green "Succeeded" pill there is a lie about the data, so a failed job outranks the
   * queue's own verdict, and a merely degraded one escalates to 'warning'. Both are
   * checked before trusting `success`, failures first: a run with 22 failures and 3
   * degradations is a failure.
   */
  runState(run: Queue): RunState {
    const code = normalizeStatus(run.status_code);
    if (code === QueueStatusEnum.FAILURE) return 'failed';
    if (code === QueueStatusEnum.SKIPPED) return 'skipped';
    if (code === QueueStatusEnum.WARNING) return 'warning';
    if (code === QueueStatusEnum.SUCCESS) {
      if (this.failedJobs(run) > 0) return 'failed';
      if (this.degradedJobs(run) > 0) return 'warning';
      return 'succeeded';
    }
    if (code === QueueStatusEnum.RUNNING || run.started_at) return 'running';
    return 'scheduled';
  }

  /** The runner's diagnostic for this run, or '' (never the literal 'null'). */
  runMessage(run: Queue): string {
    return (run.status_message ?? '').toString().trim();
  }

  /** Jobs of this run that completed but degraded; 0 when the API sends no rollup. */
  degradedJobs(run: Queue): number {
    return queueJobRollup(run, 'warning') ?? 0;
  }

  /** Jobs of this run that failed outright; 0 when the API sends no rollup. */
  failedJobs(run: Queue): number {
    return queueJobRollup(run, 'failed') ?? 0;
  }

  /** Jobs of this run that succeeded outright; 0 when the API sends no rollup. */
  succeededJobs(run: Queue): number {
    return queueJobRollup(run, 'succeeded') ?? 0;
  }

  /** Jobs the runner never attempted; 0 when the API sends no rollup. */
  skippedJobs(run: Queue): number {
    return queueJobRollup(run, 'skipped') ?? 0;
  }

  /** Jobs attached to this run; 0 when the API sends no rollup. */
  totalJobs(run: Queue): number {
    return queueJobRollup(run, 'total') ?? 0;
  }

  /**
   * True when the API sent a job rollup for this run at all. The counts line is hidden
   * otherwise: against an older API every count reads 0, and "0/0 jobs succeeded" is a
   * claim the API never made.
   */
  hasJobCounts(run: Queue): boolean {
    return hasQueueJobRollup(run);
  }

  newRun(): void {
    this.showNewRun = true;
  }

  onRunCreated(): void {
    this.loadRuns();
    this.showNewRun = false;
  }

  onNewRunClosed(): void {
    this.showNewRun = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
