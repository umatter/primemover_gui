import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';

import { Experiment } from '../model/experiment';
import { Crawler, crawlerDegradedRuns } from '@app/crawler/model/crawler';
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
  /** Recent runs that completed but degraded. 0 when the API does not report it. */
  warning: number;
  /**
   * False when the API sends no degradation count at all (an older API). The Degraded tile
   * is hidden then, rather than claiming a confident zero.
   */
  warningAvailable: boolean;
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
  isLoading$ = this.crawlerService.loading$;
  experimentId!: number;
  showAddBot = false;

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private store: Store,
    private experimentService: ExperimentService,
    private crawlerService: CrawlerService
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
    // `latest_queues_degraded` is the API's contract name (Crawler::$appends). Absent for
    // every bot => an API older than 2026-08-27: unknown, so the tile hides rather than
    // reporting a zero nobody asserted.
    const warningAvailable = bots.some((b) => crawlerDegradedRuns(b) !== null);
    const warning = bots.reduce((acc, b) => acc + (crawlerDegradedRuns(b) ?? 0), 0);
    return {
      total,
      succeeded,
      failed,
      warning,
      warningAvailable,
      succeededPct: total ? Math.round((succeeded / total) * 100) : 0,
      failedPct: total ? Math.round((failed / total) * 100) : 0
    };
  }

  /** Template-friendly degraded-run count for one bot (0 when the API does not send it). */
  botWarning(bot: Crawler): number {
    return crawlerDegradedRuns(bot) ?? 0;
  }

  botProgress(bot: Crawler): number {
    const total = bot.latest_queues_count || 0;
    return total ? Math.round(((bot.latest_queues_succeeded || 0) / total) * 100) : 0;
  }

  /**
   * `warning` sits between `failed` and `succeeded`: those runs finished, so calling them
   * "Succeeded" is what hid degraded treatment arms, but they are not failures either.
   */
  botState(bot: Crawler): 'idle' | 'running' | 'failed' | 'warning' | 'succeeded' {
    const total = bot.latest_queues_count || 0;
    // No runs in the window at all: 'idle', which also keeps every ratio below off a
    // zero denominator.
    if (!total) return 'idle';
    if ((bot.latest_queues_failed || 0) > 0) return 'failed';
    if (this.botWarning(bot) > 0) return 'warning';
    if ((bot.latest_queues_succeeded || 0) >= total) return 'succeeded';
    return 'running';
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
