import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { Job } from '@app/job/model/Job';

export const SharedActions = createActionGroup({
  source: 'Shared',
  events: {
    Init: emptyProps(),
    'Error Requested': props<{ error: any }>(),
    'Error Reset Requested': emptyProps(),
    'Clear Query Filter Requested': emptyProps(),
    'Reset Query Filter Requested': props<{ filterName: string }>(),
    'Update Query Filter': props<{ updatedFilter: QueryFilter[] }>(),
    'Experiment Selection': props<{ experiment: Experiment | null }>(),
    'Crawler Selection': props<{ crawler: Crawler | null }>(),
    'Queue Selection': props<{ queue: Queue | null }>(),
    'Job Selection': props<{ job: Job | null }>(),
    'Request Page': props<{ page: number }>(),
    'Upload File': props<{ file: File }>(),
    'Upload File Success': props<{ response: any }>(),
    'Upload File Failure': props<{ error: any }>(),
    'Download File': props<{ job: Job | null }>(),
    'Download File Success': props<{response: any}>(),
    'Download File Failure': props<{error: any}>(),
  }
});
