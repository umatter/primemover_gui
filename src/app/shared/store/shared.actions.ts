import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { QueryFilter } from '../model/query-filter';
import { Experiment } from '@app/experiment/model/experiment';
import { Crawler } from '@app/crawler/model/crawler';
import { Queue } from '@app/queue/model/queue';
import { Job } from '@app/job/model/Job';
import { TimezoneDetail } from '@shared/service/timezone.service';
import { HttpResponse, HttpResponseBase } from '@angular/common/http';
import { Sort } from '@shared/model/sort';

export const SharedActions = createActionGroup({
  source: 'Shared',
  events: {
    Init: emptyProps(),
    'Error Requested': props<{ error: any }>(),
    'Error Reset Requested': emptyProps(),
    'Clear Query Filter Requested': emptyProps(),
    'Reset Query Filter Requested': props<{ filterName: string }>(),
    'Update Query Filter': props<{ updatedFilter: QueryFilter[] }>(),
    'Sort Requested': props<{ sort: Sort }>(),
    'Experiment Selection': props<{ experiment: Experiment | null }>(),
    'Crawler Selection': props<{ crawler: Crawler | null }>(),
    'Queue Selection': props<{ queue: Queue | null }>(),
    'Job Selection': props<{ job: Job | null }>(),
    'Request Page': props<{ page: number }>(),
    'Upload experiment requested': props<{ file: File }>(),
    'Upload experiment success': props<{ response: any }>(),
    'Upload experiment failure': props<{ error: any }>(),
    'Upload crawler requested': props<{ file: File }>(),
    'Upload crawler success': props<{ response: any }>(),
    'Upload crawler failure': props<{ error: any }>(),
    'Download experiment data': props<{ experiment: Experiment }>(),
    'Download experiment data success': emptyProps(),
    'Download experiment data done': props<{ experiment: Experiment; response: HttpResponse<any> }>(),
    'Download experiment data failure': props<{ error: any }>(),
    'Download File': props<{ job: Job | null }>(),
    'Download File Success': emptyProps(),
    'Download File Failure': props<{ error: any }>(),
    'Timezone reset requested': emptyProps(),
    'Timezone list requested': emptyProps(),
    'Timezone list success': props<{ response: string[] }>(),
    'Timezone list error': props<{ error: any }>(),
    'Timezone detail requested': props<{ timezone: string }>(),
    'Timezone detail success': props<{ detail: TimezoneDetail }>(),
    'Timezone detail error': props<{ error: any }>(),
    'Api failure': props<{ error: HttpResponseBase | any }>(),
    'Client failure': props<{ error: HttpResponseBase | any }>(),
    'Empty failure': emptyProps(),
    'Loading done': emptyProps()
  }
});
