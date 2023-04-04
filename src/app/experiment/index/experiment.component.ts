import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '@shared/animation/trigger';
import { selectExperimentsPagination } from '../store/experiment.selectors';
import { Experiment } from '../model/experiment';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ExperimentService } from '@app/entity/service';
import { experimentSelection } from '@shared/store/shared.actions';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { selectCurrentExperiment, selectQueryFilter } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';

@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  animations: [fadeIn]
})
export class ExperimentComponent implements OnDestroy {
  paginationConfig: PaginatePipeArgs;
  isLoading$: Observable<boolean>;
  entities$: Observable<Experiment[]>;
  experimentToDelete: Experiment | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentExperiment$: Observable<Experiment>;

  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    public router: Router,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private entityService: ExperimentService,
    private apiService: ExperimentApiService
  ) {
    this.entities$ = entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));

    this.getData();

    //this.initPagination();
  }

  getData(page: number = 1): void {
    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.store
        .pipe(select(selectExperimentsPagination))
        .subscribe((paginatePipeArgs) => (this.paginationConfig = paginatePipeArgs))
    );
  }

  selectExperiment(experiment: Experiment): void {
    this.store.dispatch(experimentSelection({ experiment: experiment }));
  }

  deleteExperimentRequest(experiment: Experiment): void {
    this.experimentToDelete = experiment;
  }

  onModalResponse(event: boolean): void {
    if (event && this.experimentToDelete) {
      this.entityService.delete(this.experimentToDelete.id);
      this.store.dispatch(experimentSelection({ experiment: null }));
    }
    this.experimentToDelete = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
