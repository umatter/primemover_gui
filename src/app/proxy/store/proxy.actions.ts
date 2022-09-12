import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { Proxy } from '../model/proxy';
import { ProxyFormValues } from '../component/model/proxy-form-values';
import { HttpErrorResponse } from '@angular/common/http';

export const proxiesRequested = createAction('[Proxy] Collection requested');
export const proxiesSimpleListRequested = createAction('[Proxy] Simple list requested');
export const proxiesRequestFailed = createAction('[Proxy] Request failed', props<{ error: any }>());
export const proxiesRetrieved = createAction('[Proxy] Collection retrieved', props<{ collection: DataCollection }>());
export const proxiesSimpleListRetrieved = createAction('[Proxy] Simple list retrieved', props<{ list: any }>());
export const proxyResetRequested = createAction('[Proxy] Reset state requested');
export const currentProxyResetRequested = createAction('[Proxy] Reset current requested');
export const completeProxyCreateRequested = createAction('[Proxy] Complete create requested');
export const proxyPageRequested = createAction('[Proxy] Page requested', props<{ page: number }>());
export const proxyRequested = createAction('[Proxy] Record requested', props<{ proxy: Proxy }>());
export const proxyDeleteRequested = createAction(
  '[Proxy] Delete requested',
  props<{ proxyId: number }>()
);
export const updateProxyCreateValues = createAction('[Proxy] Update', props<ProxyFormValues>());
export const proxyCreateSuccess = createAction('[Proxy] Create success', props<any>());
export const proxyDeleteSuccess = createAction('[Proxy] Delete success', props<any>());
export const proxyCreateError = createAction('[Proxy] Create error', props<{ err: HttpErrorResponse }>());
export const proxyDeleteError = createAction('[Proxy] Delete error', props<{ err: HttpErrorResponse }>());
