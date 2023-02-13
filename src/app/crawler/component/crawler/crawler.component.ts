import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { currentExperimentResetRequested } from '../../../experiment/store/experiment.actions';
import { selectCurrentExperiment, selectExperimentsListData } from '../../../experiment/store/experiment.selectors';
import { crawlerDeleteRequested, crawlerPageRequested, crawlerRequested } from '../../store/crawler.actions';
import { fadeIn } from '../../../shared/animation/trigger';
import { selectCrawlersListData, selectCrawlersPagination, selectIsLoading } from '../../store/crawler.selectors';
import { Crawler } from '../../model/crawler';
import { Experiment } from '../../../experiment/model/experiment';
import { ConfirmationPrimeoverDialogComponent } from 'src/app/shared/dialog/primeover-dialog/confirmation-primeover-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-crawler',
  templateUrl: './crawler.component.html',
  animations: [fadeIn]
})
export class CrawlerComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  data$: Observable<any>;
  experiments$: Observable<any>;
  currentExperiment$: Observable<Experiment | null>;
  isLoading$: Observable<boolean>;
  experiment: any;

  constructor(private store: Store, public router: Router,private matDialog: MatDialog,
    private translate: TranslateService) {}

  ngOnInit() {
    this.data$ = this.store.pipe(select(selectCrawlersListData));
    this.experiments$ = this.store.pipe(select(selectExperimentsListData));
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(crawlerPageRequested({ page: page }));
  }

  selectCrawler(crawler: Crawler): void {
    this.store.dispatch(crawlerRequested(crawler));
    this.router.navigate(['queues']).then();
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectCrawlersPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }


  deleteCrawler(experiment: any): void {
    const confirmationDialog = this.matDialog.open(ConfirmationPrimeoverDialogComponent, {
      data: {
        title: experiment.name,
        description: this.translate.instant('confirmation-delete.experiment.experimentDeleteMSG', {
          experimentName: experiment.name,
          experiment:'crawler'
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
        const crawlerId = experiment.id;
        this.store.dispatch(crawlerDeleteRequested({ crawlerId }));
        confirmationDialog.close();
      }
    });
  }

  resetExperimentFilter(): void {
    this.store.dispatch(currentExperimentResetRequested());
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
