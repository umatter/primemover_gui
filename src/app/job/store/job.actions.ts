import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';

export const initJobs = createAction('[Job] init');
export const jobsRequested = createAction('[Job] Data requested');
export const jobsRequestFailed = createAction('[Job] Request failed', props<{ error: any }>());
export const jobsRetrieved = createAction('[Job] Jobs retrieved', props<{ collection: DataCollection }>());
export const jobResetRequested = createAction('[Job] Reset state requested');
export const jobPageRequested = createAction('[Job] Page requested', props<{ page: number }>());
