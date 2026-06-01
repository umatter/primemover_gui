import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';

import { Experiment } from '../model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { SharedActions } from '@shared/store/shared.actions';
import { fadeIn } from '@shared/animation/trigger';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { HeroiconUploadComponent } from '@shared/icon/heroicon-upload/heroicon-upload.component';
import { HeroiconDownloadArchiveComponent } from '@shared/icon/heroicon-download-archive/heroicon-download-archive.component';

interface RunSummary {
  total: number;
  succeeded: number;
  failed: number;
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
    HeroiconDownloadArchiveComponent
  ],
  animations: [fadeIn]
})
export class ExperimentWorkspaceComponent implements OnInit, OnDestroy {
  experiment$!: Observable<Experiment | undefined>;
  bots$!: Observable<Crawler[]>;
  summary$!: Observable<RunSummary>;
  isLoading$ = this.crawlerService.loading$;
  experimentId!: number;

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
        this.crawlerService.getWithQuery({ ['filter[experiment_id]']: String(id) });
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
    return {
      total,
      succeeded,
      failed,
      succeededPct: total ? Math.round((succeeded / total) * 100) : 0,
      failedPct: total ? Math.round((failed / total) * 100) : 0
    };
  }

  botProgress(bot: Crawler): number {
    const total = bot.latest_queues_count || 0;
    return total ? Math.round(((bot.latest_queues_succeeded || 0) / total) * 100) : 0;
  }

  botState(bot: Crawler): 'idle' | 'running' | 'failed' | 'succeeded' {
    const total = bot.latest_queues_count || 0;
    if (!total) return 'idle';
    if (bot.latest_queues_failed > 0) return 'failed';
    if ((bot.latest_queues_succeeded || 0) >= total) return 'succeeded';
    return 'running';
  }

  addBot(): void {
    this.router.navigate(['crawlers/create']).then();
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
