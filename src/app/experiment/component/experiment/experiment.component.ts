import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '../../../shared/animation/trigger';
import {
  experimentDeleteRequested,
  experimentPageRequested,
  experimentRequested
} from '../../store/experiment.actions';
import {
  selectExperimentsListData,
  selectExperimentsPagination,
  selectIsLoading
} from '../../store/experiment.selectors';
import { Experiment } from '../../model/experiment';

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

  constructor(private store: Store, public router: Router) {}

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

  deleteExperiment(experimentId: number): void {
    console.log(experimentId);
    this.store.dispatch(experimentDeleteRequested({ experimentId }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
