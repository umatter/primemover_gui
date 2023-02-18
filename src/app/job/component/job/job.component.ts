import { Component, OnDestroy, OnInit } from '@angular/core';
import { distinctUntilChanged, Observable, Subscription } from 'rxjs';
import { PaginatePipeArgs } from 'ngx-pagination';
import { select, Store } from '@ngrx/store';
import { currentQueueResetRequested } from '../../../queue/store/queue.actions';
import { Queue } from '../../../queue/model/queue';
import {
  selectCurrentQueue,
  selectIsLoading,
  selectJobsListData,
  selectJobsPagination
} from '../../store/job.selectors';
import { jobDeleteRequested, jobPageRequested, jobsRequested } from '../../store/job.actions';
import { Route, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationPrimeoverDialogComponent } from 'src/app/shared/dialog/primeover-dialog/confirmation-primeover-dialog.component';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html'
})
export class JobComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  data$: Observable<any>;
  currentQueue$: Observable<Queue | null>;
  isLoading$: Observable<boolean>;

  constructor(
    private store: Store,
    public router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.data$ = this.store.pipe(distinctUntilChanged(), select(selectJobsListData));
    this.currentQueue$ = this.store.pipe(select(selectCurrentQueue));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(jobPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectJobsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  resetQueueFilter(): void {
    this.store.dispatch(currentQueueResetRequested());
  }

  selectJob(proxy: any): void {
    // this.store.dispatch(jobsRequested({ proxy: proxy }));
    // TODO move redirect to effects
    this.router.navigate(['crawlers']).then();
  }

  deleteJobs(job: any): void {
    const confirmationDialog = this.matDialog.open(ConfirmationPrimeoverDialogComponent, {
      data: {
        title: job.name,
        description: this.translate.instant('confirmation-delete.experiment.experimentDeleteMSG', {
          experimentName: job.name,
          experiment: 'job'
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
        const jobId = job.id;
        this.store.dispatch(jobDeleteRequested({ jobId }));
        confirmationDialog.close();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
