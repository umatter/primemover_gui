import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { catchError, concatMap, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { selectCurrentCrawler, selectCurrentExperiment } from './shared.selectors';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { FileUploadService } from '../service/file-upload.service';
import { Router } from '@angular/router';
import { SharedActions } from '@shared/store/shared.actions';
import { selectQueryFilter } from '@shared/store/shared.reducer';
import { JobApiService } from '@app/job/service/job-api.service';
import { TimezoneService } from '@shared/service/timezone.service';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { saveAs } from 'file-saver';


/**
 * Every HTTP call below is wrapped in its own inner `catchError`, on purpose.
 *
 * An error that escapes the inner pipe reaches the `Actions` subscription
 * itself: @ngrx/effects re-subscribes only a limited number of times
 * (`defaultEffectsErrorHandler`, 10 by default) and then the effect is dead for
 * the rest of the session -- that feature silently stops working until the user
 * reloads the page, with the failed action lost either way. Keeping the
 * `catchError` inside the `switchMap` confines the failure to one request and
 * turns it into a failure action the reducer can show.
 */
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
      withLatestFrom(this.store.pipe(select(selectCurrentExperiment))),
      switchMap(([action, currentExperiment]) => {
        return this.fileService.uploadExperiment(action.file, currentExperiment.id).pipe(
          map((response) => SharedActions.uploadExperimentSuccess({ response })),
          catchError((error) => of(SharedActions.uploadExperimentFailure({ error })))
        );
      }),
      // Only a successful upload may navigate away -- the failure notification
      // is rendered on the upload page the user is standing on.
      tap((result) => {
        if (result.type === SharedActions.uploadExperimentSuccess.type) {
          this.router.navigate(['/crawlers']);
        }
      })
    );
  });

  uploadCrawlerRequested$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.uploadCrawlerRequested),
      withLatestFrom(this.store.pipe(select(selectCurrentCrawler))),
      switchMap(([action, currentCrawler]) => {
        return this.fileService.uploadCrawler(action.file, currentCrawler.id).pipe(
          map((response) => SharedActions.uploadCrawlerSuccess({ response })),
          catchError((error) => of(SharedActions.uploadCrawlerFailure({ error })))
        );
      }),
      tap((result) => {
        if (result.type === SharedActions.uploadCrawlerSuccess.type) {
          this.router.navigate(['/queues']);
        }
      })
    );
  });

  downloadReport$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.downloadFile),
      switchMap((action) => {
        return this.jobApiService.downloadReport(action.job.id).pipe(
          map((data) => {
            saveAs(data.body, `${action.job.id} ${action.job.name}.zip`);
            return SharedActions.downloadFileSuccess();
          }),
          // Covers a failed request and a failed saveAs() alike; the reducer
          // handles downloadFileFailure with apiFailure, so the user sees it.
          catchError((error) => of(SharedActions.downloadFileFailure({ error })))
        );
      })
    );
  });

  downloadExperimentData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.downloadExperimentData),
      switchMap((action) => {
        return this.experimentApiService.download(action.experiment.id).pipe(
          map((response) => SharedActions.downloadExperimentDataDone({ experiment: action.experiment, response })),
          // downloadExperimentDataFailure only stops the spinner, so apiFailure
          // rides along to put the reason in front of the user who clicked.
          catchError((error) =>
            of(SharedActions.downloadExperimentDataFailure({ error }), SharedActions.apiFailure({ error }))
          )
        );
      })
    );
  });

  /**
   * Hands the downloaded archive to the browser.
   *
   * Three bugs, all the same shape as the ones fixed above:
   *
   * - `saveAs()` ran in a `map` on the OUTER `actions$` stream. A throw there (a blocked
   *   or unsupported download, a null body from a proxied 204) escapes to the `Actions`
   *   subscription, so @ngrx/effects tears the effect down after its resubscribe budget
   *   and downloading stops working for the rest of the session. `concatMap` into a
   *   per-action inner pipe keeps a failure confined to the one archive it belongs to.
   * - There was no `catchError` at all, so that throw was also invisible: the spinner set
   *   by `downloadExperimentData` never stopped and the user saw a page that just hung.
   * - `{ dispatch: false }` meant the `downloadExperimentDataSuccess` it carefully
   *   returned was dropped on the floor — and that action is what the reducer listens to
   *   to clear `isLoading`. Removing it makes the success path actually end the spinner.
   *
   * `concatMap`, not `switchMap`: two archives requested in quick succession must both be
   * saved, and a `switchMap` would cancel the first.
   */
  downloadExperimentDataDone$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(SharedActions.downloadExperimentDataDone),
      concatMap((action) =>
        of(action).pipe(
          map((done) => {
            saveAs(done.response.body, `${done.experiment.id} ${done.experiment.name}.zip`);
            return SharedActions.downloadExperimentDataSuccess();
          }),
          // Same pairing as the request half: the failure action stops the spinner,
          // apiFailure puts the reason in front of the user who clicked.
          catchError((error) =>
            of(SharedActions.downloadExperimentDataFailure({ error }), SharedActions.apiFailure({ error }))
          )
        )
      )
    );
  });

  timezoneListRequested$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SharedActions.timezoneListRequested),
      switchMap(() => {
        return this.timezoneService.getList().pipe(
          map((response) => SharedActions.timezoneListSuccess({ response })),
          catchError((error) => of(SharedActions.timezoneListError({ error })))
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
          catchError((error) => of(SharedActions.timezoneDetailError({ error })))
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
    private experimentApiService: ExperimentApiService,
    private timezoneService: TimezoneService
  ) {
  }
}
