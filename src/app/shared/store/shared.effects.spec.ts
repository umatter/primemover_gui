import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import * as fileSaver from 'file-saver';

import { SharedEffects } from './shared.effects';
import { SharedActions } from './shared.actions';
import { initialState } from './shared.reducer';
import { QueryFilterType } from './shared.selectors';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { FileUploadService } from '../service/file-upload.service';
import { JobApiService } from '@app/job/service/job-api.service';
import { ExperimentApiService } from '@app/experiment/service/experiment-api.service';
import { TimezoneService } from '@shared/service/timezone.service';

/**
 * Regression suite for the effect error paths.
 *
 * Every `it` below asserts two things, and the SECOND one is the point:
 *
 *   1. an HTTP failure produces the failure action, so the user is told; and
 *   2. the effect stream is STILL ALIVE afterwards and handles the next action.
 *
 * (2) is what the original bug broke. Each of these effects had its `catchError`
 * commented out, so the error escaped the inner pipe and reached the `Actions`
 * subscription itself. @ngrx/effects then resubscribes at most
 * `defaultEffectsErrorHandler` times (10) before dropping the effect for the rest of the
 * session: one failed download and downloading was dead until a page reload, silently.
 * A test that only checked "the failure action is dispatched" would pass on a pipe that
 * dies immediately afterwards, which is why every case dispatches a second, succeeding
 * action through the same subscription and expects it to be handled.
 */
describe('SharedEffects', () => {
  let effects: SharedEffects;
  let actions$: Subject<Action>;
  let fileService: jasmine.SpyObj<FileUploadService>;
  let jobApiService: jasmine.SpyObj<JobApiService>;
  let experimentApiService: jasmine.SpyObj<ExperimentApiService>;
  let timezoneService: jasmine.SpyObj<TimezoneService>;
  let experimentService: jasmine.SpyObj<ExperimentService>;
  let crawlerService: jasmine.SpyObj<CrawlerService>;
  let router: jasmine.SpyObj<Router>;
  let saveAsSpy: jasmine.Spy;

  const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error', error: 'boom' });
  const experiment: any = { id: 42, name: 'Political News' };
  const zip = (): HttpResponse<any> => new HttpResponse({ body: new Blob(['zip']) });

  /**
   * Subscribes once and records everything the effect emits, plus whether the stream
   * itself errored or completed. A live effect records neither.
   */
  const record = (effect$: Observable<Action>) => {
    const seen: Action[] = [];
    let errored: unknown = null;
    let completed = false;
    effect$.subscribe({
      next: (action) => seen.push(action),
      error: (error) => (errored = error ?? new Error('errored')),
      complete: () => (completed = true)
    });
    return {
      types: () => seen.map((action) => action.type),
      last: () => seen[seen.length - 1] as any,
      get errored() {
        return errored;
      },
      get completed() {
        return completed;
      }
    };
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    fileService = jasmine.createSpyObj<FileUploadService>('FileUploadService', [
      'uploadExperiment',
      'uploadCrawler'
    ]);
    jobApiService = jasmine.createSpyObj<JobApiService>('JobApiService', ['downloadReport']);
    experimentApiService = jasmine.createSpyObj<ExperimentApiService>('ExperimentApiService', ['download']);
    timezoneService = jasmine.createSpyObj<TimezoneService>('TimezoneService', ['getList', 'getDetail']);
    experimentService = jasmine.createSpyObj<ExperimentService>('ExperimentService', ['getByKey']);
    crawlerService = jasmine.createSpyObj<CrawlerService>('CrawlerService', ['getByKey']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    // file-saver hands the blob to the browser; stubbed so the suite never starts a real
    // download. The stub is also what lets the saveAs failure path be exercised below.
    saveAsSpy = spyOn(fileSaver, 'saveAs').and.stub();

    TestBed.configureTestingModule({
      providers: [
        SharedEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            shared: {
              ...initialState,
              queryFilter: [
                { name: QueryFilterType.Experiment, value: 42, entity: experiment },
                { name: QueryFilterType.Crawler, value: 7, entity: { id: 7, name: 'bot' } }
              ]
            }
          }
        }),
        { provide: FileUploadService, useValue: fileService },
        { provide: JobApiService, useValue: jobApiService },
        { provide: ExperimentApiService, useValue: experimentApiService },
        { provide: TimezoneService, useValue: timezoneService },
        { provide: ExperimentService, useValue: experimentService },
        { provide: CrawlerService, useValue: crawlerService },
        { provide: Router, useValue: router }
      ]
    });

    effects = TestBed.inject(SharedEffects);
  });

  describe('uploadExperimentRequested$', () => {
    const file = new File(['[]'], 'scenario.json');

    it('reports the failure, does not navigate away, and survives to handle the next upload', () => {
      const rec = record(effects.uploadExperimentRequested$);

      fileService.uploadExperiment.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.uploadExperimentRequested({ file }));

      expect(rec.types()).toEqual([SharedActions.uploadExperimentFailure.type]);
      expect(rec.last().error).toBe(httpError);
      // The failure notification renders on the upload page, so the user has to stay on it.
      expect(router.navigate).not.toHaveBeenCalled();

      fileService.uploadExperiment.and.returnValue(of({ ok: true }));
      actions$.next(SharedActions.uploadExperimentRequested({ file }));

      expect(rec.types()).toEqual([
        SharedActions.uploadExperimentFailure.type,
        SharedActions.uploadExperimentSuccess.type
      ]);
      expect(router.navigate).toHaveBeenCalledWith(['/crawlers']);
      expect(rec.errored).toBeNull();
      expect(rec.completed).toBeFalse();
    });
  });

  describe('uploadCrawlerRequested$', () => {
    const file = new File(['[]'], 'crawler.json');

    it('reports the failure and survives to handle the next upload', () => {
      const rec = record(effects.uploadCrawlerRequested$);

      fileService.uploadCrawler.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.uploadCrawlerRequested({ file }));

      expect(rec.types()).toEqual([SharedActions.uploadCrawlerFailure.type]);
      expect(router.navigate).not.toHaveBeenCalled();

      fileService.uploadCrawler.and.returnValue(of({ ok: true }));
      actions$.next(SharedActions.uploadCrawlerRequested({ file }));

      expect(rec.types()).toEqual([
        SharedActions.uploadCrawlerFailure.type,
        SharedActions.uploadCrawlerSuccess.type
      ]);
      expect(router.navigate).toHaveBeenCalledWith(['/queues']);
      expect(rec.errored).toBeNull();
    });
  });

  describe('downloadReport$', () => {
    const job: any = { id: 525, name: 'lambda_select' };

    it('reports the failure and survives to handle the next report download', () => {
      const rec = record(effects.downloadReport$);

      jobApiService.downloadReport.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.downloadFile({ job }));

      expect(rec.types()).toEqual([SharedActions.downloadFileFailure.type]);
      expect(saveAsSpy).not.toHaveBeenCalled();

      jobApiService.downloadReport.and.returnValue(of(zip()));
      actions$.next(SharedActions.downloadFile({ job }));

      expect(rec.types()).toEqual([
        SharedActions.downloadFileFailure.type,
        SharedActions.downloadFileSuccess.type
      ]);
      expect(saveAsSpy).toHaveBeenCalledTimes(1);
      expect(rec.errored).toBeNull();
    });

    it('turns a saveAs() failure into the failure action rather than killing the effect', () => {
      const rec = record(effects.downloadReport$);

      jobApiService.downloadReport.and.returnValue(of(zip()));
      saveAsSpy.and.throwError('download blocked');
      actions$.next(SharedActions.downloadFile({ job }));

      expect(rec.types()).toEqual([SharedActions.downloadFileFailure.type]);

      saveAsSpy.and.stub();
      actions$.next(SharedActions.downloadFile({ job }));

      expect(rec.types()).toEqual([
        SharedActions.downloadFileFailure.type,
        SharedActions.downloadFileSuccess.type
      ]);
      expect(rec.errored).toBeNull();
    });
  });

  describe('downloadExperimentData$', () => {
    it('reports the failure twice over (spinner + message) and survives', () => {
      const rec = record(effects.downloadExperimentData$);

      experimentApiService.download.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.downloadExperimentData({ experiment }));

      // downloadExperimentDataFailure only stops the spinner; apiFailure is what puts the
      // reason on screen, so both have to be dispatched.
      expect(rec.types()).toEqual([
        SharedActions.downloadExperimentDataFailure.type,
        SharedActions.apiFailure.type
      ]);

      experimentApiService.download.and.returnValue(of(zip()));
      actions$.next(SharedActions.downloadExperimentData({ experiment }));

      expect(rec.types()).toEqual([
        SharedActions.downloadExperimentDataFailure.type,
        SharedActions.apiFailure.type,
        SharedActions.downloadExperimentDataDone.type
      ]);
      expect(rec.errored).toBeNull();
    });
  });

  describe('downloadExperimentDataDone$', () => {
    const done = () => SharedActions.downloadExperimentDataDone({ experiment, response: zip() });

    it('dispatches the success action -- it used to be created and then thrown away', () => {
      const rec = record(effects.downloadExperimentDataDone$);

      actions$.next(done());

      // `{ dispatch: false }` made this effect's return value dead code, so the reducer
      // never saw the action that clears `isLoading`.
      expect(rec.types()).toEqual([SharedActions.downloadExperimentDataSuccess.type]);
      expect(saveAsSpy).toHaveBeenCalledTimes(1);
      expect(saveAsSpy.calls.mostRecent().args[1]).toBe('42 Political News.zip');
    });

    it('turns a saveAs() failure into a reported failure and survives to save the next archive', () => {
      const rec = record(effects.downloadExperimentDataDone$);

      saveAsSpy.and.throwError('download blocked');
      actions$.next(done());

      expect(rec.types()).toEqual([
        SharedActions.downloadExperimentDataFailure.type,
        SharedActions.apiFailure.type
      ]);

      saveAsSpy.and.stub();
      actions$.next(done());

      expect(rec.types()).toEqual([
        SharedActions.downloadExperimentDataFailure.type,
        SharedActions.apiFailure.type,
        SharedActions.downloadExperimentDataSuccess.type
      ]);
      expect(rec.errored).toBeNull();
      expect(rec.completed).toBeFalse();
    });
  });

  describe('timezoneListRequested$', () => {
    it('reports the failure and survives to handle the next request', () => {
      const rec = record(effects.timezoneListRequested$);

      timezoneService.getList.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.timezoneListRequested());

      expect(rec.types()).toEqual([SharedActions.timezoneListError.type]);

      timezoneService.getList.and.returnValue(of(['Europe/Zurich']));
      actions$.next(SharedActions.timezoneListRequested());

      expect(rec.types()).toEqual([SharedActions.timezoneListError.type, SharedActions.timezoneListSuccess.type]);
      expect(rec.errored).toBeNull();
    });
  });

  describe('timezoneDetailRequested$', () => {
    it('reports the failure and survives to handle the next request', () => {
      const rec = record(effects.timezoneDetailRequested$);

      timezoneService.getDetail.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.timezoneDetailRequested({ timezone: 'Nowhere/Nothing' }));

      expect(rec.types()).toEqual([SharedActions.timezoneDetailError.type]);

      timezoneService.getDetail.and.returnValue(of({ timezone: 'Europe/Zurich' } as any));
      actions$.next(SharedActions.timezoneDetailRequested({ timezone: 'Europe/Zurich' }));

      expect(rec.types()).toEqual([SharedActions.timezoneDetailError.type, SharedActions.timezoneDetailSuccess.type]);
      expect(rec.errored).toBeNull();
    });
  });

  describe('crawlerSelection$', () => {
    it('falls back to no experiment when the lookup fails, and survives', () => {
      const rec = record(effects.crawlerSelection$);
      const crawler: any = { id: 7, experiment_id: 42 };

      experimentService.getByKey.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.crawlerSelection({ crawler }));

      expect(rec.types()).toEqual([SharedActions.experimentSelection.type]);
      expect(rec.last().experiment).toBeNull();

      experimentService.getByKey.and.returnValue(of(experiment));
      actions$.next(SharedActions.crawlerSelection({ crawler }));

      expect(rec.last().experiment).toEqual(experiment);
      expect(rec.errored).toBeNull();
    });
  });

  describe('queueSelection$', () => {
    it('falls back to no crawler when the lookup fails, and survives', () => {
      const rec = record(effects.queueSelection$);
      const queue: any = { id: 845, crawler_id: 251 };
      const crawler: any = { id: 251, name: 'bot' };

      crawlerService.getByKey.and.returnValue(throwError(() => httpError));
      actions$.next(SharedActions.queueSelection({ queue }));

      expect(rec.types()).toEqual([SharedActions.crawlerSelection.type]);
      expect(rec.last().crawler).toBeNull();

      crawlerService.getByKey.and.returnValue(of(crawler));
      actions$.next(SharedActions.queueSelection({ queue }));

      expect(rec.last().crawler).toEqual(crawler);
      expect(rec.errored).toBeNull();
    });
  });
});
