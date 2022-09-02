import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { Queue } from '../model/queue';

export const initQueues = createAction('[Queue] init');
export const queuesRequested = createAction('[Queue] Data requested');
export const queuesRequestFailed = createAction('[Queue] Request failed', props<{ error: any }>());
export const queuesRetrieved = createAction('[Queue] Queues retrieved', props<{ collection: DataCollection }>());
export const queueResetRequested = createAction('[Queue] Reset state requested');
export const queuePageRequested = createAction('[Queue] Page requested', props<{ page: number }>());
export const queueRequested = createAction('[Queue] Record requested', props<Queue>());
export const currentQueueResetRequested = createAction('[Queue] Reset current requested');
