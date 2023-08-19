import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '@shared/animation/trigger';
import { Experiment } from '../model/experiment';
import { ExperimentService } from '@app/entity/service';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { QueryFilterType, selectCurrentExperiment } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';
import { Meta } from '@shared/pagination/model';
import { saveAs } from 'file-saver';
import { selectQueryFilter } from '@shared/store/shared.reducer';
import { SharedActions } from '@shared/store/shared.actions';

@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  animations: [fadeIn]
})
export class ExperimentComponent implements OnDestroy {
  paginationConfig: PaginatePipeArgs;
  isLoading$: Observable<boolean>;
  entities$: Observable<Experiment[] | any>;
  experimentToDelete: Experiment | null = null;
  queryFilter$: Observable<QueryFilter[]>;
  currentExperiment$: Observable<Experiment>;
  pageMeta$: Observable<Meta>;

  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    public router: Router,
    private entityService: ExperimentService,
    private apiService: ExperimentApiService
  ) {
    this.entities$ = entityService.entities$;
    this.isLoading$ = this.entityService.loading$;
    this.pageMeta$ = entityService.pageMeta$;
    this.queryFilter$ = this.store.select(selectQueryFilter);
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));

    this.getData();
    this.initPagination();
  }

  getData(page: number = 1): void {
    this.store.dispatch(SharedActions.requestPage({ page }));

    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  initPagination(): void {
    this.subscriptions.add(
      this.pageMeta$.pipe().subscribe((meta) => {
        this.paginationConfig = this.apiService.getPaginateArgs(meta);
      })
    );
  }

  selectExperiment(experiment: Experiment): void {
    this.store.dispatch(SharedActions.experimentSelection({ experiment: experiment }));
  }

  selectAndUploadExperiment(experiment: Experiment): void {
    this.store.dispatch(SharedActions.experimentSelection({ experiment: experiment }));
    this.router.navigate(['experiments', experiment.id, 'upload']).then();
  }

  deleteExperimentRequest(experiment: Experiment): void {
    this.experimentToDelete = experiment;
  }

  downloadExperimentData(experiment: any): void | Boolean {
    this.apiService.download(experiment?.id).subscribe((response: any) => {
      saveAs(response, `${experiment.name}.zip`);
    });
  }

  onModalResponse(event: boolean): void {
    if (event && this.experimentToDelete) {
      this.subscriptions.add(
        this.entityService
          .delete(this.experimentToDelete.id)
          .pipe()
          .subscribe(() => {
            this.store.dispatch(SharedActions.experimentSelection({ experiment: null }));
            this.store.dispatch(SharedActions.resetQueryFilterRequested({ filterName: QueryFilterType.Experiment }));
            this.experimentToDelete = null;
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
