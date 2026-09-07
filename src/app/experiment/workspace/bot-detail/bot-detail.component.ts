import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, Observable, Subscription, switchMap } from 'rxjs';
import { EntityAction, EntityOp } from '@ngrx/data';

import { Crawler } from '@app/crawler/model/crawler';
import { hasQueueJobRollup, Queue, queueJobRollup } from '@app/queue/model/queue';
import { CrawlerService, QueueService } from '@app/entity/service';
import { isBadStatus, QueueStatusEnum, statusOrUnknown, UNKNOWN_STATUS } from '@app/queue/status/status.enum';
import { StatusMessageComponent } from '@app/queue/status/status-message.component';
import { fadeIn } from '@shared/animation/trigger';
import { StatusFilterComponent } from '@shared/filter/status-filter/status-filter.component';
import { anyRunning, livenessOn$, livenessTicks } from '@shared/model/liveness';
import { RunAlarm, RunTransitionWatcher } from '@shared/model/run-transition';
import { StatusFilterKey, statusFilterParams } from '@shared/model/status-filter';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { NotificationComponent } from '@shared/overlay/notification/notification.component';
import { VisibilityService } from '@shared/service/visibility.service';
import { RunCreateComponent } from '../run-create/run-create.component';

export type RunState = 'scheduled' | 'running' | 'succeeded' | 'warning' | 'failed' | 'skipped' | 'unknown';

/**
 * The bot-level treatment-loss alarm, counted over the runs this screen is showing.
 *
 * Counted from the listed runs rather than from the crawler's appended
 * `latest_queues_treatment_lost`, because the two describe different sets — the appended
 * count covers a rolling window (24h by default) while this list is whatever the run
 * query returned — and a headline that disagrees with the rows beneath it is worse than
 * no headline. The experiment workspace, which has no runs loaded, uses the appended
 * count instead.
 */
export interface TreatmentLostSummary {
  /** Runs with at least one treatment-lost job. */
  runs: number;
  /** Jobs across those runs whose treatment was lost. */
  jobs: number;
}

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
    NotificationComponent,
    RunCreateComponent,
    StatusFilterComponent,
    StatusMessageComponent
  ],
  animations: [fadeIn]
})
export class BotDetailComponent implements OnInit, OnDestroy {
  bot$!: Observable<Crawler | undefined>;
  runs$!: Observable<Queue[]>;
  /** Treatment-loss alarm over the listed runs. Zero-valued when nothing is reported. */
  treatmentLost$!: Observable<TreatmentLostSummary>;
  isLoading$ = this.queueService.loading$;

  /** True while at least one listed run reports `running`: the gate on polling. */
  active$!: Observable<boolean>;
  /** True while polling is actually happening — running **and** the tab is visible. */
  live$!: Observable<boolean>;

  /**
   * The last alarm this screen raised, or null. Rendered as a toast, and raised only when
   * a run *becomes* failed or treatment-lost — never for a run that was already bad when
   * the screen opened, which is the list's job to show, not a toast's.
   */
  alarm: RunAlarm | null = null;

  experimentId!: number;
  botId!: number;
  showNewRun = false;

  /**
   * The active status chip for the run list. Applied server-side, like every other chip in
   * the app, so it filters the whole run history of this bot rather than the page of it
   * that happens to be loaded.
   */
  statusFilter: StatusFilterKey = 'all';

  /**
   * Whether the one-shot "there are bad runs here, start with those" default has already
   * had its say. Set by the default itself and by any deliberate choice the user makes, so
   * a later refresh can never yank the list out from under them.
   */
  private autoFocusSettled = false;

  /** True while the current filter is the automatic one rather than the user's choice. */
  private autoFocused = false;

  /** The automatic filter is only ever un-done once; after that the screen stays put. */
  private autoFocusRolledBack = false;

  private subscriptions = new Subscription();
  private readonly transitions = new RunTransitionWatcher();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private crawlerService: CrawlerService,
    private queueService: QueueService,
    private visibility: VisibilityService
  ) {}

  ngOnInit(): void {
    this.bot$ = this.route.paramMap.pipe(
      switchMap((params) => {
        this.experimentId = Number(params.get('id'));
        const botId = Number(params.get('botId'));
        if (botId !== this.botId) {
          // A different bot: the previous one's alarm baseline says nothing about this one.
          this.botId = botId;
          this.transitions.reset();
          this.alarm = null;
        }
        this.loadRuns();
        return this.crawlerService.getByKey(this.botId);
      })
    );

    this.runs$ = this.queueService.entities$.pipe(
      map((queues) => queues.filter((q) => Number(q.crawler_id) === Number(this.botId)))
    );

    // One-shot default: open on the runs that need attention when this bot has any.
    // Deliberately keyed on the run's OWN status_code, the same predicate `filter[bad]`
    // applies server-side — not on `runState()`, which escalates a 'success' run with
    // failed jobs. Defaulting on the richer verdict would switch the view to a filter that
    // then excludes the very run that triggered it.
    this.subscriptions.add(
      this.runs$.subscribe((runs) => {
        if (this.autoFocusSettled || this.statusFilter !== 'all') return;
        if (!runs.some((run) => isBadStatus(run.status_code))) return;
        this.autoFocusSettled = true;
        this.autoFocused = true;
        this.statusFilter = 'bad';
        this.loadRuns();
      })
    );

    // Safety net for a mixed-version deploy. `filter[bad]` is new; an API that predates it
    // rejects the unknown filter outright (Spatie's default is a 400), and because this is
    // the one query the screen issues on its own, a researcher would be looking at an empty
    // run list they never asked for. A user-chosen chip is left alone — that error is theirs
    // to see — but the automatic one steps back to the unfiltered list, once.
    this.subscriptions.add(
      this.queueService.errors$
        .pipe(filter((action: EntityAction) => action?.payload?.entityOp === EntityOp.QUERY_MANY_ERROR))
        .subscribe(() => {
          if (!this.autoFocused || this.autoFocusRolledBack) return;
          this.autoFocusRolledBack = true;
          this.autoFocused = false;
          this.statusFilter = 'all';
          this.loadRuns();
        })
    );

    // Liveness. A run in flight changes state on the order of tens of seconds and nothing
    // in this app refreshed, so a "Running" pill stayed running until the user navigated
    // away and came back. Gated on the runs actually being running and on the tab being
    // visible, and torn down with `subscriptions` — a leaked interval in an SPA outlives
    // the screen that created it.
    this.active$ = this.runs$.pipe(map((runs) => anyRunning(runs)));
    this.live$ = livenessOn$(this.active$, this.visibility.visible$);
    this.subscriptions.add(livenessTicks(this.active$, this.visibility.visible$).subscribe(() => this.refreshRuns()));

    // Transitions only. This list is re-read every 15 s while something is running, so a
    // watcher keyed on "is bad" rather than "just became bad" would raise the same toast
    // on every tick until the reader learned to ignore all of them.
    this.subscriptions.add(
      this.runs$.subscribe((runs) => {
        const raised = this.transitions.observe(runs);
        if (raised.length) this.alarm = raised[0];
      })
    );

    this.treatmentLost$ = this.runs$.pipe(
      map((runs) =>
        runs.reduce(
          (acc: TreatmentLostSummary, run) => {
            const lost = this.treatmentLostJobs(run);
            return lost > 0 ? { runs: acc.runs + 1, jobs: acc.jobs + lost } : acc;
          },
          { runs: 0, jobs: 0 }
        )
      )
    );
  }

  /**
   * Load this bot's runs, honouring the status chip.
   *
   * `clearCache()` is required, not tidiness: `getWithQuery` merges into the shared Queue
   * collection rather than replacing it, so without it the runs a previous, wider query
   * left behind would keep showing under a narrower filter — a "Failures only" list with
   * successes in it.
   */
  private loadRuns(): void {
    this.queueService.clearCache();
    this.refreshRuns();
  }

  /**
   * Re-issue the current run query without dropping what is already on screen.
   *
   * The poll path, deliberately separate from {@link loadRuns}: `clearCache()` empties the
   * shared collection, so refreshing through it would blank the list for the length of a
   * round trip, every 15 seconds. Re-querying without it upserts the same rows in place.
   */
  private refreshRuns(): void {
    this.queueService.getWithQuery({
      ['filter[crawler]']: String(this.botId),
      ...statusFilterParams(this.statusFilter)
    });
  }

  /** Dismiss the toast. The run keeps its state; only the interruption goes away. */
  dismissAlarm(): void {
    this.alarm = null;
  }

  /** Body text key for the toast, by alarm kind. */
  get alarmBodyKey(): string {
    return this.alarm?.kind === 'treatmentLost' ? 'runAlarm.treatmentLostBody' : 'runAlarm.failureBody';
  }

  /** Title key for the toast, by alarm kind. */
  get alarmTitleKey(): string {
    return this.alarm?.kind === 'treatmentLost' ? 'runAlarm.treatmentLostTitle' : 'runAlarm.failureTitle';
  }

  /** A chip click. Also retires the one-shot default: the user has now chosen. */
  onStatusFilter(key: StatusFilterKey): void {
    this.autoFocusSettled = true;
    this.autoFocused = false;
    this.statusFilter = key;
    this.loadRuns();
  }

  /**
   * Honest run state for the status pill (docs/specs/runs-and-bots.md Slice B).
   *
   * `skipped` used to collapse into `scheduled`, which made a run the runner refused to
   * execute look identical to one that simply has not started yet. `warning` is the run
   * that completed but degraded — either the runner said so on the queue itself, or the
   * per-job rollup did; that is the silent treatment-arm degradation this screen has to
   * stop hiding.
   *
   * The runner's own `status_code` is not the last word on a run that says `success`.
   * It reports the *joblist's* outcome, which is 'success' as soon as the list was worked
   * through — individually failed jobs do not change it. Queue 845 in the live database
   * is the case: status_code 'success', message 'done', and 22 of its 113 jobs failed.
   * A green "Succeeded" pill there is a lie about the data, so a failed job outranks the
   * queue's own verdict, and a merely degraded one escalates to 'warning'. Both are
   * checked before trusting `success`, failures first: a run with 22 failures and 3
   * degradations is a failure.
   *
   * **Unknown is unknown.** An unrecognised `status_code` used to fall through to
   * `scheduled` — the one thing `docs/integration-contract.md` §3.4 forbids, because it
   * renders a run the API described in words we do not understand as one that has not
   * started. The API validates nothing on that field, so a runner typo or a sixth value
   * invented tomorrow lands here; it now renders as the same neutral grey "Unknown" the
   * shared `app-status` pill uses. `scheduled` is reserved for the one case that really
   * is scheduled: **no `status_code` at all and no `started_at`**.
   */
  runState(run: Queue): RunState {
    const raw = (run.status_code ?? '').toString().trim();
    // Absent is not the same question as unrecognised: nothing has been reported yet, so
    // the timestamps are the only evidence there is.
    if (!raw) return run.started_at ? 'running' : 'scheduled';

    switch (statusOrUnknown(raw)) {
      case QueueStatusEnum.FAILURE:
        return 'failed';
      case QueueStatusEnum.SKIPPED:
        return 'skipped';
      case QueueStatusEnum.WARNING:
        return 'warning';
      case QueueStatusEnum.RUNNING:
        return 'running';
      case QueueStatusEnum.SUCCESS:
        if (this.failedJobs(run) > 0) return 'failed';
        if (this.degradedJobs(run) > 0) return 'warning';
        return 'succeeded';
      case UNKNOWN_STATUS:
      default:
        return 'unknown';
    }
  }

  /**
   * Tailwind text colour for the run's diagnostic.
   *
   * A degraded run's message used to render in the same muted grey as a healthy one, so
   * the sentence explaining that a treatment did not apply looked like boilerplate. Amber
   * for `warning`, red for `failed`, muted otherwise — the same three-way split the shared
   * status pill uses, so the message and the pill can never disagree about severity.
   */
  runMessageClass(run: Queue): string {
    const state = this.runState(run);
    if (state === 'failed') return 'text-danger';
    if (state === 'warning') return 'text-warning';
    return 'text-muted';
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

  /**
   * Jobs of this run whose bot was treated and produced control-arm data.
   *
   * 0 covers both "none" and "no verdict was ever recorded" — the underlying column is
   * nullable — so this number is only ever rendered when it is positive. It is never
   * shown as a reassuring zero, and it is deliberately not folded into any "needs
   * attention" arithmetic: a lost treatment is a different claim from a lost job.
   */
  treatmentLostJobs(run: Queue): number {
    return queueJobRollup(run, 'treatmentLost') ?? 0;
  }

  /** Jobs of this run whose decision degraded without losing the treatment outright. */
  decisionDegradedJobs(run: Queue): number {
    return queueJobRollup(run, 'degraded') ?? 0;
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
