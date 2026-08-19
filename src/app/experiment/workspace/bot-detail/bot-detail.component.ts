import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { map, Observable, Subscription, switchMap } from 'rxjs';

import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { CrawlerService, QueueService } from '@app/entity/service';
import { QueueStatusEnum } from '@app/queue/status/status.enum';
import { fadeIn } from '@shared/animation/trigger';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { RunCreateComponent } from '../run-create/run-create.component';

export type RunState = 'scheduled' | 'running' | 'succeeded' | 'failed';

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

  /** Honest run state for the status pill (docs/specs/runs-and-bots.md Slice B). */
  runState(run: Queue): RunState {
    const code = (run.status_code || '').toString().toLowerCase();
    if (code === QueueStatusEnum.FAILURE) return 'failed';
    if (code === QueueStatusEnum.SUCCESS) return 'succeeded';
    if (code === QueueStatusEnum.RUNNING || run.started_at) return 'running';
    return 'scheduled';
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
