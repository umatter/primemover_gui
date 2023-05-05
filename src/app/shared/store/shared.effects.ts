import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { selectCurrentExperiment } from './shared.selectors';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { FileUploadService } from '../service/file-upload.service';
import { Router } from '@angular/router';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';

@Injectable()
export class SharedEffects {
  resetQueryFilterRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedActions.resetQueryFilterRequested),
      withLatestFrom(this.store.pipe(select(selectQueryFilter))),
      map(([action, filterList]) =>
        SharedActions.updateQueryFilter({
          updatedFilter: filterList.filter((filter) => filter.name !== action.filterName)
        })
      )
    )
  );

  crawlerSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedActions.crawlerSelection),
      switchMap((action) => {
        if (action.crawler?.experiment_id) {
          return this.experimentService.getByKey(action.crawler.experiment_id).pipe(
            map((experiment) => SharedActions.experimentSelection({ experiment })),
            catchError(() => of(SharedActions.experimentSelection({ experiment: null })))
          );
        }
        return of(SharedActions.experimentSelection({ experiment: null }));
      })
    )
  );

  queueSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedActions.queueSelection),
      switchMap((action) => {
        if (action.queue?.crawler_id) {
          return this.crawlerService.getByKey(action.queue.crawler_id).pipe(
            map((crawler) => SharedActions.crawlerSelection({ crawler })),
            catchError(() => of(SharedActions.crawlerSelection({ crawler: null })))
          );
        }
        return of(SharedActions.crawlerSelection({ crawler: null }));
      })
    )
  );

  experimentUpload$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.uploadFile),
      concatLatestFrom(() => this.store.pipe(select(selectCurrentExperiment))),
      switchMap(([action, currentExperiment]) => {
        return this.fileService.uploadExperiment(action.file, currentExperiment).pipe(
          map((response) => SharedActions.uploadFileSuccess(response)),
          catchError((error) => of(SharedActions.uploadFileFailure(error)))
        );
      }),
      tap(() => this.router.navigate(['/crawlers']))
    );
  });

  constructor(
    private actions$: Actions,
    private store: Store,
    private experimentService: ExperimentService,
    private crawlerService: CrawlerService,
    private fileService: FileUploadService,
    private router: Router
  ) {}
}
