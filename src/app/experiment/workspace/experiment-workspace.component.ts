import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, map, Observable, of, startWith, Subscription, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';

import { Experiment } from '../model/experiment';
import {
  DEFAULT_HEALTH_WINDOW,
  ExperimentHealth,
  HEALTH_WINDOWS,
  HealthWindowKey,
  healthWindowHours
} from '../model/health';
import { ExperimentHealthApiService } from '../service/experiment-health-api.service';
import { Crawler, crawlerDegradedRuns, crawlerTreatmentLostRuns, crawlerWarningRuns } from '@app/crawler/model/crawler';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { SharedActions } from '@shared/store/shared.actions';
import { fadeIn } from '@shared/animation/trigger';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { HeroiconUploadComponent } from '@shared/icon/heroicon-upload/heroicon-upload.component';
import { HeroiconDownloadArchiveComponent } from '@shared/icon/heroicon-download-archive/heroicon-download-archive.component';
import { AddBotComponent } from './add-bot/add-bot.component';

interface RunSummary {
  total: number;
  succeeded: number;
  failed: number;
  /**
   * Recent runs whose **own** `status_code` was `warning`: the run completed but lost
   * work. 0 when the API does not report it (`latest_queues_warning`, not yet deployed).
   */
  warning: number;
  /**
   * Recent runs that contain at least one `warning` job, derived API-side from the jobs
   * (`latest_queues_degraded`). 0 when the API does not report it.
   */
  degraded: number;
  /**
   * The "Needs attention" headline: `warning + degraded`.
   *
   * The two components overlap — a run that reports `warning` on the queue usually has
   * degraded jobs too — and the API sends no union count, so this sum can exceed the true
   * number of distinct runs. It is deliberately the *upper* bound rather than
   * `max(warning, degraded)`: under-reporting how much needs attention is the exact
   * failure the `warning` state was introduced to end, and the tile's tooltip names both
   * components so nobody has to guess at the composition. The exact figure needs a single
   * API-side count (`runs_bad_count`, contract §3.4) rather than arithmetic here.
   */
  needsAttention: number;
  /**
   * False when the API sends neither degradation count for any bot (an older API). The
   * tile hides itself then, rather than claiming a confident zero nobody asserted.
   */
  attentionAvailable: boolean;
  /**
   * Runs in the window that lost a treatment: a bot configured to be treated produced
   * control-arm data (`latest_queues_treatment_lost`, contract §7.3).
   *
   * Deliberately **not** part of `needsAttention`. It is not a louder warning, it is a
   * different claim — those runs may have finished green in every status field, and what
   * is wrong with them is that their observations cannot answer the experiment's
   * question. It is rendered as its own red alarm above the tiles, never summed into an
   * amber number where it would disappear.
   */
  treatmentLost: number;
  /**
   * False when no bot reports the count (an API that predates it). The alarm is hidden
   * then — and it is hidden at zero too, since the underlying job column is nullable and
   * a zero covers "no verdict was ever recorded".
   */
  treatmentLostAvailable: boolean;
  succeededPct: number;
  failedPct: number;
}

@Component({
  selector: 'app-experiment-workspace',
  templateUrl: './experiment-workspace.component.html',
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
    HeroiconUploadComponent,
    HeroiconDownloadArchiveComponent,
    AddBotComponent
  ],
  animations: [fadeIn]
})
export class ExperimentWorkspaceComponent implements OnInit, OnDestroy {
  experiment$!: Observable<Experiment | undefined>;
  bots$!: Observable<Crawler[]>;
  summary$!: Observable<RunSummary>;
  /**
   * Experiment-level health for the selected window, or `null` when it cannot be known
   * (an API without the endpoint). `null` falls back to the crawler-derived tiles below
   * rather than to an empty header — and never to a green one.
   */
  health$!: Observable<ExperimentHealth | null>;
  isLoading$ = this.crawlerService.loading$;
  experimentId!: number;
  showAddBot = false;

  /** The window chips: 24h / 7d / all -> hours=24 / 168 / 720. */
  readonly windows = HEALTH_WINDOWS;
  healthWindow: HealthWindowKey = DEFAULT_HEALTH_WINDOW;

  private readonly windowSelection$ = new BehaviorSubject<HealthWindowKey>(DEFAULT_HEALTH_WINDOW);
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private store: Store,
    private experimentService: ExperimentService,
    private crawlerService: CrawlerService,
    private healthService: ExperimentHealthApiService
  ) {}

  ngOnInit(): void {
    this.experiment$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = Number(params.get('id'));
        this.experimentId = id;
        this.crawlerService.getWithQuery({ ['filter[experiment]']: String(id) });
        return this.experimentService.getByKey(id);
      })
    );

    // Bots scoped to this experiment, regardless of what else is cached.
    this.bots$ = this.crawlerService.entities$.pipe(
      map((crawlers) => crawlers.filter((c) => Number(c.experiment_id) === Number(this.experimentId)))
    );

    this.summary$ = this.bots$.pipe(map((bots) => this.buildSummary(bots)));

    // Re-read health whenever the experiment or the selected window changes. `startWith`
    // so the header renders its fallback immediately instead of after the round trip.
    this.health$ = combineLatest([this.route.paramMap, this.windowSelection$]).pipe(
      switchMap(([params, window]) =>
        this.healthService.health(Number(params.get('id')), healthWindowHours(window)).pipe(startWith(null))
      )
    );

    this.subscriptions.add(
      this.experiment$.subscribe((experiment) => {
        if (experiment) {
          this.store.dispatch(SharedActions.experimentSelection({ experiment }));
        }
      })
    );
  }

  buildSummary(bots: Crawler[]): RunSummary {
    const total = bots.reduce((acc, b) => acc + (b.latest_queues_count || 0), 0);
    const succeeded = bots.reduce((acc, b) => acc + (b.latest_queues_succeeded || 0), 0);
    const failed = bots.reduce((acc, b) => acc + (b.latest_queues_failed || 0), 0);
    // `latest_queues_degraded` / `latest_queues_warning` are the API's contract names
    // (Crawler::$appends). Absent for every bot => an API that predates them: unknown, so
    // the tile hides rather than reporting a zero nobody asserted.
    const attentionAvailable = bots.some((b) => crawlerDegradedRuns(b) !== null || crawlerWarningRuns(b) !== null);
    const degraded = bots.reduce((acc, b) => acc + (crawlerDegradedRuns(b) ?? 0), 0);
    const warning = bots.reduce((acc, b) => acc + (crawlerWarningRuns(b) ?? 0), 0);
    const treatmentLostAvailable = bots.some((b) => crawlerTreatmentLostRuns(b) !== null);
    const treatmentLost = bots.reduce((acc, b) => acc + (crawlerTreatmentLostRuns(b) ?? 0), 0);
    return {
      total,
      succeeded,
      failed,
      warning,
      degraded,
      needsAttention: warning + degraded,
      attentionAvailable,
      treatmentLost,
      treatmentLostAvailable,
      succeededPct: total ? Math.round((succeeded / total) * 100) : 0,
      failedPct: total ? Math.round((failed / total) * 100) : 0
    };
  }

  /** Runs of this bot with at least one degraded job (0 when the API does not send it). */
  botDegraded(bot: Crawler): number {
    return crawlerDegradedRuns(bot) ?? 0;
  }

  /** Runs of this bot whose own status was `warning` (0 when the API does not send it). */
  botWarning(bot: Crawler): number {
    return crawlerWarningRuns(bot) ?? 0;
  }

  /**
   * Runs of this bot that produced control-arm data while configured to be treated.
   *
   * 0 when the API does not report it, and 0 is never rendered: the column is nullable,
   * so it cannot distinguish "no treatment was lost" from "no verdict exists".
   */
  botTreatmentLost(bot: Crawler): number {
    return crawlerTreatmentLostRuns(bot) ?? 0;
  }

  /**
   * Runs of this bot a human should look at. Same upper-bound caveat as
   * {@link RunSummary.needsAttention}: the two counts can describe the same run.
   *
   * Treatment-lost runs are **not** added in. They get their own red marker; folding the
   * alarm into an amber sum is how it would stop being an alarm.
   */
  botNeedsAttention(bot: Crawler): number {
    return this.botWarning(bot) + this.botDegraded(bot);
  }

  /**
   * The counts behind a bot's pill, as display strings.
   *
   * A count the API does not send reads as an em dash, not as `0`: the pill's tooltip is
   * exactly where a confident zero would be believed. `inProgress` is the remainder of
   * `latest_queues_count` once succeeded, warning and failed are taken out — runs that are
   * still going, or skipped, or carrying a status nobody here recognises; the API sends no
   * breakdown finer than that, and it is clamped at zero so an inconsistent rollup cannot
   * render a negative.
   *
   * The window is the API's own fixed 24 h crawler window, which is **not** the window the
   * header selector controls — the crawler endpoint takes no `hours` parameter — so the
   * label says "24 h" explicitly rather than letting the two be confused.
   */
  botCounts(bot: Crawler): Record<string, string | number> {
    const total = bot.latest_queues_count || 0;
    const succeeded = bot.latest_queues_succeeded || 0;
    const failed = bot.latest_queues_failed || 0;
    const accounted = succeeded + failed + (crawlerWarningRuns(bot) ?? 0);
    return {
      total,
      succeeded,
      failed,
      warning: this.countLabel(crawlerWarningRuns(bot)),
      degraded: this.countLabel(crawlerDegradedRuns(bot)),
      treatmentLost: this.countLabel(crawlerTreatmentLostRuns(bot)),
      inProgress: Math.max(total - accounted, 0)
    };
  }

  /** A count, or an em dash when the API never reported it. */
  private countLabel(value: number | null): string {
    return value === null ? '—' : String(value);
  }

  botProgress(bot: Crawler): number {
    const total = bot.latest_queues_count || 0;
    return total ? Math.round(((bot.latest_queues_succeeded || 0) / total) * 100) : 0;
  }

  /**
   * `warning` sits between `failed` and `succeeded`: those runs finished, so calling them
   * "Succeeded" is what hid degraded treatment arms, but they are not failures either.
   *
   * The `running` fall-through used to be a trap. A run whose **own** `status_code` is
   * `warning` is counted by none of `latest_queues_succeeded`, `_failed` or (before this
   * change) `_degraded` — that last one is derived from the jobs, and a queue can report
   * `warning` with no `warning` job at all. So `succeeded >= total` was never reached and
   * the bot showed a pulsing blue "Running" pill forever, for a run that had finished
   * hours earlier in a state the researcher most needed to see. `latest_queues_warning`
   * closes that: a run is "accounted for" once it lands in succeeded, warning or failed.
   *
   * The field is absent on the API deployed today, which reads as 0 here — the same
   * behaviour as before this change, never worse.
   */
  botState(bot: Crawler): 'idle' | 'running' | 'failed' | 'warning' | 'succeeded' {
    const total = bot.latest_queues_count || 0;
    // No runs in the window at all: 'idle', which also keeps every ratio below off a
    // zero denominator.
    if (!total) return 'idle';
    const succeeded = bot.latest_queues_succeeded || 0;
    const failed = bot.latest_queues_failed || 0;
    const warning = this.botWarning(bot);
    if (failed > 0) return 'failed';
    if (warning > 0 || this.botDegraded(bot) > 0) return 'warning';
    if (succeeded + warning + failed >= total) return 'succeeded';
    return 'running';
  }

  /** Switch the health window. `hours` is resolved once, in the model's table. */
  setWindow(window: HealthWindowKey): void {
    if (window === this.healthWindow) return;
    this.healthWindow = window;
    this.windowSelection$.next(window);
  }

  /** The `hours` value the current chip sends — 24 / 168 / 720. */
  get windowHours(): number {
    return healthWindowHours(this.healthWindow);
  }

  /**
   * Runs in the window the health endpoint could not classify.
   *
   * Rendered as its own tile whenever it is non-zero and never added to `success`: an
   * unrecognised `status_code` is *unknown*, and the one thing the contract forbids is
   * quietly counting it as fine.
   */
  unknownRuns(health: ExperimentHealth | null): number {
    return health?.runs.unknown ?? 0;
  }

  addBot(): void {
    this.showAddBot = true;
  }

  onBotCreated(): void {
    // The @ngrx/data store already holds the new crawler; make sure this
    // experiment's scoped list reflects it, then close the panel.
    this.crawlerService.getWithQuery({ ['filter[experiment]']: String(this.experimentId) });
    this.showAddBot = false;
  }

  onAddBotClosed(): void {
    this.showAddBot = false;
  }

  uploadData(experiment: Experiment): void {
    this.router.navigate(['experiments', experiment.id, 'upload']).then();
  }

  downloadData(experiment: Experiment): void {
    this.store.dispatch(SharedActions.downloadExperimentData({ experiment }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
