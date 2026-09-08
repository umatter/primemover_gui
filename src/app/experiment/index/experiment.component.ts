import { Component, OnDestroy } from '@angular/core';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { select, Store } from '@ngrx/store';

import { NgxPaginationModule, PaginatePipeArgs } from 'ngx-pagination';
import { Router } from '@angular/router';
import { fadeIn } from '@shared/animation/trigger';
import { Experiment } from '../model/experiment';
import { ExperimentService } from '@app/entity/service';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { QueryFilterType, selectCurrentExperiment } from '@shared/store/shared.selectors';
import { selectIsLoading, selectQueryFilter } from '@shared/store/shared.reducer';
import { SharedActions } from '@shared/store/shared.actions';
import { LoadingSpinnerComponent } from '@shared/overlay/loading-spinner/loading-spinner.component';
import { AsyncPipe, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LinkSortableComponent } from '@shared/link/link-sortable/link-sortable.component';
import { ConfirmationModalComponent } from '@shared/dialog/confirmation-modal/confirmation-modal.component';
import { HeroiconTrashComponent } from '@shared/icon/heroicon-trash/heroicon-trash.component';
import { HeroiconClipboardDocumentComponent } from '@shared/icon/heroicon-clipboard-document/heroicon-clipboard-document.component';
import { HeroiconUploadComponent } from '@shared/icon/heroicon-upload/heroicon-upload.component';
import { ControlsComponent } from '@shared/pagination/controls/controls.component';
import { HeroiconDownloadArchiveComponent } from '@shared/icon/heroicon-download-archive/heroicon-download-archive.component';
import { SortBy } from '@shared/model/sort';
import { HealthStripComponent } from '@app/experiment/health/health-strip.component';

@Component({
  selector: 'app-experiment',
  templateUrl: './experiment.component.html',
  standalone: true,
  imports: [
    LoadingSpinnerComponent,
    AsyncPipe,
    TranslateModule,
    LinkSortableComponent,
    NgIf,
    ConfirmationModalComponent,
    DatePipe,
    HeroiconTrashComponent,
    NgClass,
    HeroiconClipboardDocumentComponent,
    HeroiconUploadComponent,
    ControlsComponent,
    NgForOf,
    NgxPaginationModule,
    HeroiconDownloadArchiveComponent,
    HealthStripComponent
  ],
  animations: [fadeIn]
})
export class ExperimentComponent implements OnDestroy {
  paginationConfig: PaginatePipeArgs;
  isLoading$ = this.entityService.loading$;
  entities$: Observable<Experiment[]> = this.entityService.entities$;
  experimentToDelete: Experiment | null = null;
  queryFilter$ = this.store.select(selectQueryFilter);
  currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
  pageMeta$ = this.entityService.pageMeta$;
  protected readonly SortBy = SortBy;
  private subscriptions = new Subscription();

  constructor(
    private store: Store,
    public router: Router,
    private entityService: ExperimentService,
    private apiService: ExperimentApiService
  ) {
    this.entities$ = entityService.entities$;

    this.getData();
    this.initPagination();
    this.initLoading(entityService.loading$, this.store.pipe(select(selectIsLoading)));
  }

  initLoading(...sources: Observable<boolean>[]): void {
    this.isLoading$ = combineLatest(sources).pipe(map((loadings) => loadings.some((loading) => loading)));
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

  openExperiment(experiment: Experiment): void {
    this.store.dispatch(SharedActions.experimentSelection({ experiment: experiment }));
    this.router.navigate(['experiments', experiment.id]).then();
  }

  deleteExperimentRequest(experiment: Experiment): void {
    this.experimentToDelete = experiment;
  }

  downloadExperimentData(experiment: Experiment): void | Boolean {
    this.store.dispatch(SharedActions.downloadExperimentData({ experiment }));
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
