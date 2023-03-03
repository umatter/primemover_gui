import { Component, OnDestroy, OnInit } from '@angular/core';
import { fadeIn } from '../../../shared/animation/trigger';
import { Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { selectExperimentsListData } from '../../../experiment/store/experiment.selectors';
import { selectIsLoading, selectQueuesListData, selectQueuesPagination } from '../../store/queue.selectors';
import { queueDeleteRequested, queuePageRequested, queueRequested } from '../../store/queue.actions';
import { Crawler } from '../../../crawler/model/crawler';
import { selectCurrentCrawler } from '../../../crawler/store/crawler.selectors';
import { Queue } from '../../model/queue';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationPrimeoverDialogComponent } from 'src/app/shared/dialog/primeover-dialog/confirmation-primeover-dialog.component';
import { crawlerRequested } from 'src/app/crawler/store/crawler.actions';
import { ExperimentService } from 'src/app/experiment/service/experiment.service';
import { experimentRequested } from 'src/app/experiment/store/experiment.actions';

@Component({
  selector: 'app-queue',
  templateUrl: './queue.component.html',
  animations: [fadeIn]
})
export class QueueComponent implements OnInit, OnDestroy {
  paginationConfig: PaginatePipeArgs;
  data$: Observable<any>;
  experiments$: Observable<any>;
  currentCrawler$: Observable<Crawler | null>;
  isLoading$: Observable<boolean>;
  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    public router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private experimentService: ExperimentService,
  ) { }

  ngOnInit() {
    this.data$ = this.store.pipe(select(selectQueuesListData));
    this.experiments$ = this.store.pipe(select(selectExperimentsListData));
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(queuePageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectQueuesPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectQueue(queue: Queue): void {
    if (queue?.crawler?.experiment_id) {
      const experiment_id = queue?.crawler?.experiment_id
      this.experimentService.singleExperiment(experiment_id).subscribe(experiment => {
        const currentExperiment = {
          id: experiment.data.id,
          name: experiment.data.name,
        }
        this.store.dispatch(experimentRequested({ experiment: currentExperiment }));
      });
    }
    this.store.dispatch(queueRequested(queue));
    this.store.dispatch(crawlerRequested(queue.crawler));
    this.router.navigate(['jobs']).then();
  }

  deleteQueue(queue: any): void {
    const confirmationDialog = this.matDialog.open(ConfirmationPrimeoverDialogComponent, {
      data: {
        title: queue.name,
        description: this.translate.instant('confirmation-delete.experiment.experimentDeleteMSG', {
          experimentName: queue.name,
          experiment: 'queue'
        }),
        otherButtonName: this.translate.instant('confirmation-delete.experiment.otherButton'),
        cancelButtonName: this.translate.instant('confirmation-delete.experiment.cancelButton')
      },
      width: '550px'
    });
    confirmationDialog.componentInstance.event.subscribe((eventType: string) => {
      if (eventType === 'cancel') {
        confirmationDialog.close();
      } else {
        const queueId = queue.id;
        this.store.dispatch(queueDeleteRequested({ queueId }));
        confirmationDialog.close();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
