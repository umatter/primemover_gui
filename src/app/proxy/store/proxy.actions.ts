import { createAction, props } from '@ngrx/store';
import { DataCollection } from '@shared/model/data-collection';
import { Proxy } from '../model/proxy';

export const proxiesRetrieved = createAction('[Proxy] Collection retrieved', props<{ collection: DataCollection }>());
export const proxiesSimpleListRetrieved = createAction('[Proxy] Simple list retrieved', props<{ list: any }>());
export const proxyResetRequested = createAction('[Proxy] Reset state requested');
export const currentProxyResetRequested = createAction('[Proxy] Reset current requested');
export const completeProxyCreateRequested = createAction('[Proxy] Complete create requested');
export const proxyPageRequested = createAction('[Proxy] Page requested', props<{ page: number }>());
export const proxyRequested = createAction('[Proxy] Record requested', props<{ proxy: Proxy }>());
export const updateProxyCreateValues = createAction('[Proxy] Update', props<Proxy>());
