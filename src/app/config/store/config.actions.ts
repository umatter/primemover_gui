import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { Configuration } from '../model/config';
import { ConfigurationFormValues } from '../component/model/config-form-values';
import { HttpErrorResponse } from '@angular/common/http';

export const configurationsRequested = createAction('[Configuration] Collection requested');
export const configurationsSimpleListRequested = createAction('[Configuration] Simple list requested');
export const configurationsRequestFailed = createAction('[Configuration] Request failed', props<{ error: any }>());
export const configurationsRetrieved = createAction(
  '[Configuration] Collection retrieved',
  props<{ collection: DataCollection }>()
);
export const configurationsSimpleListRetrieved = createAction(
  '[Configuration] Simple list retrieved',
  props<{ list: any }>()
);
export const configurationResetRequested = createAction('[Configuration] Reset state requested');
export const currentConfigurationResetRequested = createAction('[Configuration] Reset current requested');
export const completeConfigurationCreateRequested = createAction('[Configuration] Complete create requested');
export const configurationPageRequested = createAction('[Configuration] Page requested', props<{ page: number }>());
export const configurationRequested = createAction(
  '[Configuration] Record requested',
  props<{ configuration: Configuration }>()
);
export const configurationDeleteRequested = createAction(
  '[Configuration] Delete requested',
  props<{ configurationId: number }>()
);
export const updateConfigurationCreateValues = createAction('[Configuration] Update', props<ConfigurationFormValues>());
export const configurationCreateSuccess = createAction('[Configuration] Create success', props<any>());
export const configurationDeleteSuccess = createAction('[Configuration] Delete success', props<any>());
export const configurationCreateError = createAction(
  '[Configuration] Create error',
  props<{ err: HttpErrorResponse }>()
);
export const configurationDeleteError = createAction(
  '[Configuration] Delete error',
  props<{ err: HttpErrorResponse }>()
);
