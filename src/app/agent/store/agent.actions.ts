import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { Agent } from '../model/agent';
import { AgentFormValues } from '../component/model/agent-form-values';
import { HttpErrorResponse } from '@angular/common/http';

export const agentsRequested = createAction('[Agent] Collection requested');
export const agentsSimpleListRequested = createAction('[Agent] Simple list requested');
export const agentsRequestFailed = createAction('[Agent] Request failed', props<{ error: any }>());
export const agentsRetrieved = createAction('[Agent] Collection retrieved', props<{ collection: DataCollection }>());
export const agentsSimpleListRetrieved = createAction('[Agent] Simple list retrieved', props<{ list: any }>());
export const agentResetRequested = createAction('[Agent] Reset state requested');
export const currentAgentResetRequested = createAction('[Agent] Reset current requested');
export const completeAgentCreateRequested = createAction('[Agent] Complete create requested');
export const agentPageRequested = createAction('[Agent] Page requested', props<{ page: number }>());
export const agentRequested = createAction('[Agent] Record requested', props<{ agent: Agent }>());
export const agentDeleteRequested = createAction(
  '[Agent] Delete requested',
  props<{ agentId: number }>()
);
export const updateAgentCreateValues = createAction('[Agent] Update', props<AgentFormValues>());
export const agentCreateSuccess = createAction('[Agent] Create success', props<any>());
export const agentDeleteSuccess = createAction('[Agent] Delete success', props<any>());
export const agentCreateError = createAction('[Agent] Create error', props<{ err: HttpErrorResponse }>());
export const agentDeleteError = createAction('[Agent] Delete error', props<{ err: HttpErrorResponse }>());


export const getAgetList = createAction('[Agent-List] Agent list requested');

