import { createAction, props } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { Job } from '@app/job/model/Job';

export const initShared = createAction('[Shared] init');
export const clearQueryFilterRequested = createAction('[Shared] Clear query filter requested');
export const resetQueryFilterRequested = createAction('[Shared] Filter reset', props<{ filterName: string }>());
export const updateQueryFilter = createAction('[Shared] Filter update', props<{ updatedFilter: QueryFilter[] }>());
export const experimentSelection = createAction(
  '[Shared] Select experiment',
  props<{ experiment: Experiment | null }>()
);
export const crawlerSelection = createAction('[Shared] Select crawler', props<{ crawler: Crawler | null }>());
export const queueSelection = createAction('[Shared] Select queue', props<{ queue: Queue | null }>());
export const jobSelection = createAction('[Shared] Select job', props<{ job: Job | null }>());
export const requestPage = createAction('[Shared] Request page', props<{ page: number }>());
export const uploadFile = createAction('[Shared] Upload file', props<{ file: File }>());
export const uploadFileSuccess = createAction('[Shared] Upload completed', props<{ response: any }>());
export const uploadFileFailure = createAction('[Shared] Upload failed', props<{ error: any }>());
