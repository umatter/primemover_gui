import { HttpErrorResponse } from '@angular/common/http';
import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';

export const initJobs = createAction('[Job] init');
export const jobsRequested = createAction('[Job] Data requested');
export const jobsRequestFailed = createAction('[Job] Request failed', props<{ error: any }>());
export const jobsRetrieved = createAction('[Job] Jobs retrieved', props<{ collection: DataCollection }>());
export const jobResetRequested = createAction('[Job] Reset state requested');
export const jobPageRequested = createAction('[Job] Page requested', props<{ page: number }>());
export const jobDeleteRequested = createAction('[Job] Delete requested', props<{ jobId: number }>());
export const jobDeleteError = createAction('[Job] Delete error', props<{ err: HttpErrorResponse }>());
export const jobDeleteSuccess = createAction('[Job] Delete success', props<any>());
