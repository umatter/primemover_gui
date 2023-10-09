import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { selectCurrentCrawler, selectCurrentExperiment } from './shared.selectors';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { FileUploadService } from '../service/file-upload.service';
import { Router } from '@angular/router';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';
import { JobApiService } from '@app/job/service/job-api.service';
import { TimezoneService } from '@shared/service/timezone.service';

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

  uploadExperimentRequested$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.uploadExperimentRequested),
      concatLatestFrom(() => this.store.pipe(select(selectCurrentExperiment))),
      switchMap(([action, currentExperiment]) => {
        return this.fileService.uploadExperiment(action.file, currentExperiment.id).pipe(
          map((response) => SharedActions.uploadExperimentSuccess(response)),
          catchError((error) => of(SharedActions.uploadExperimentFailure(error)))
        );
      }),
      tap(() => this.router.navigate(['/crawlers']))
    );
  });

  uploadCrawlerRequested$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.uploadCrawlerRequested),
      concatLatestFrom(() => this.store.pipe(select(selectCurrentCrawler))),
      switchMap(([action, currentCrawler]) => {
        return this.fileService.uploadCrawler(action.file, currentCrawler.id).pipe(
          map((response) => SharedActions.uploadCrawlerSuccess(response)),
          catchError((error) => of(SharedActions.uploadCrawlerFailure(error)))
        );
      }),
      tap(() => this.router.navigate(['/queues']))
    );
  });

  downloadReport$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.downloadFile),
      switchMap((action) => {
        return this.jobApiService.downloadReport(action.job.id).pipe(
          map((data: Blob) => {
            const blob = new Blob([data], { type: 'application/zip' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'job-' + action.job.id;
            document.body.appendChild(anchor);
            anchor.click();
            window.URL.revokeObjectURL(url);
            return SharedActions.downloadFileSuccess({ response: 'download report' });
          }),
          catchError((error) => of(SharedActions.downloadFileFailure({ error: 'download report' })))
        );
      })
    );
  });

  timezoneListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedActions.timezoneListRequested),
      switchMap(() => {
        return this.timezoneService.getList().pipe(
          map((response) => SharedActions.timezoneListSuccess({ response })),
          catchError((error) => of(SharedActions.timezoneListError(error)))
        );
      })
    )
  );

  timezoneDetailRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedActions.timezoneDetailRequested),
      switchMap((action) => {
        return this.timezoneService.getDetail(action.timezone).pipe(
          map((detail) => SharedActions.timezoneDetailSuccess({ detail })),
          catchError((error) => of(SharedActions.timezoneDetailError(error)))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private experimentService: ExperimentService,
    private crawlerService: CrawlerService,
    private fileService: FileUploadService,
    private router: Router,
    private jobApiService: JobApiService,
    private timezoneService: TimezoneService
  ) {}
}
