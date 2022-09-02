import { createAction, props } from '@ngrx/store';
import { AppConfig } from '../../app-config';

export const setAppConfig = createAction('[App] set config', props<{ appConfig: AppConfig }>());
