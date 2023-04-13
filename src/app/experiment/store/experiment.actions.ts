import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { Experiment } from '../model/experiment';
import { ExperimentFormValues } from '../component/model/experiment-form-values';
import { HttpErrorResponse } from '@angular/common/http';

export const experimentsRequested = createAction('[Experiment] Collection requested');
export const experimentsSimpleListRequested = createAction('[Experiment] Simple list requested');
export const experimentsRequestFailed = createAction('[Experiment] Request failed', props<{ error: any }>());
export const experimentsRetrieved = createAction(
  '[Experiment] Collection retrieved',
  props<{ collection: DataCollection }>()
);
export const experimentsSimpleListRetrieved = createAction(
  '[Experiment] Simple list retrieved',
  props<{ list: any }>()
);
export const experimentResetRequested = createAction('[Experiment] Reset state requested');
export const currentExperimentResetRequested = createAction('[Experiment] Reset current requested');
export const completeExperimentCreateRequested = createAction('[Experiment] Complete create requested');
export const experimentPageRequested = createAction('[Experiment] Page requested', props<{ page: number }>());
export const experimentRequested = createAction('[Experiment] Record requested', props<{ experiment: Experiment }>());
export const experimentDeleteRequested = createAction(
  '[Experiment] Delete requested',
  props<{ experimentId: number }>()
);
export const updateExperimentCreateValues = createAction('[Experiment] Update', props<any>());
export const experimentCreateSuccess = createAction('[Experiment] Create success', props<any>());
export const experimentDeleteSuccess = createAction('[Experiment] Delete success', props<any>());
export const experimentCreateError = createAction('[Experiment] Create error', props<{ err: HttpErrorResponse }>());
export const experimentDeleteError = createAction('[Experiment] Delete error', props<{ err: HttpErrorResponse }>());
