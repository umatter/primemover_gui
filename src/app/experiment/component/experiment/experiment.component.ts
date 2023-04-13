import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '../../../shared/animation/trigger';
import {
  experimentDeleteRequested,
  experimentDownloadRequested,
  experimentPageRequested,
  experimentRequested
} from '../../store/experiment.actions';
import {
  selectExperimentsListData,
  selectExperimentsPagination,
  selectIsLoading
} from '../../store/experiment.selectors';
import { Experiment } from '../../model/experiment';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationPrimeoverDialogComponent } from 'src/app/shared/dialog/primeover-dialog/confirmation-primeover-dialog.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  animations: [fadeIn]
})
export class ExperimentComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  paginationConfig: PaginatePipeArgs;
  experimentsData$: Observable<any>;
  isLoading$: Observable<boolean>;

  constructor(
    private store: Store,
    public router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.experimentsData$ = this.store.pipe(select(selectExperimentsListData));
    this.isLoading$ = this.store.pipe(select(selectIsLoading));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(experimentPageRequested({ page: page }));
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectExperimentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectExperiment(experiment: Experiment): void {
    this.store.dispatch(experimentRequested({ experiment: experiment }));
    // TODO move redirect to effects
    this.router.navigate(['crawlers']).then();
  }

  deleteExperiment(experiment: any): void {
    const confirmationDialog = this.matDialog.open(ConfirmationPrimeoverDialogComponent, {
      data: {
        title: experiment.name,
        description: this.translate.instant('confirmation-delete.experiment.experimentDeleteMSG', {
          experimentName: experiment.name,
          experiment: 'experiment'
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
        const experimentId = experiment.id;
        // this.store.dispatch(experimentDeleteRequested({ experimentId }));
        confirmationDialog.close();
      }
    });
  }

 

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
