import { Component, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { Router } from '@angular/router';
import { fadeIn } from '@shared/animation/trigger';
import { Experiment } from '../model/experiment';
import { ExperimentService } from '@app/entity/service';
import { experimentSelection, requestPage, uploadFile } from '@shared/store/shared.actions';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { selectCurrentExperiment, selectQueryFilter, selectFile } from '@shared/store/shared.selectors';
import { QueryFilter } from '@shared/model/query-filter';

@Component({
  selector: 'app-experiment-upload',
  templateUrl: './experiment-upload.component.html',
  styleUrls: ['./experiment-upload.component.scss'],
  animations: [fadeIn]
})
export class ExperimentUploadComponent {
  isLoading$: Observable<boolean>;

  queryFilter$: Observable<QueryFilter[]>;
  selectExperimentId: Number | null = null;
  experiment: Experiment | null = null;
  experiments: Experiment[] | any;
  showLoader = false;
  errroMessage = '';
  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    public router: Router,
    private entityService: ExperimentService,
    private apiService: ExperimentApiService
  ) {
    entityService.entities$.subscribe((entity) => {
      this.experiments = entity;
    });

    this.isLoading$ = this.entityService.loading$;
    this.queryFilter$ = this.store.select(selectQueryFilter);

    this.store.pipe(select(selectCurrentExperiment)).subscribe((currentExperiment) => {
      if (currentExperiment) {
        this.selectExperimentId = currentExperiment.id;
      }
    });

    this.store.pipe(select(selectFile)).subscribe((state) => {
      this.showLoader = state.isUploading;
      this.errroMessage = state.uploadError?.message || '';
    });

    this.getData();
  }

  getData(page: number = 1): void {
    this.store.dispatch(requestPage({ page }));

    this.subscriptions.add(
      this.queryFilter$.pipe().subscribe(() => {
        this.entityService.clearCache();
        this.entityService.getWithQuery(this.apiService.getParams());
      })
    );
  }

  selectExperiment(e: any): void {
    const experiment = this.experiments.filter((exp: Experiment) => exp.id == e.target.value);
    this.store.dispatch(experimentSelection({ experiment: experiment[0] }));
  }

  upload(event: any) {
    this.store.dispatch(uploadFile({ file: <File>event.target.files[0] }));
    event.target.value = null;
  }
}
