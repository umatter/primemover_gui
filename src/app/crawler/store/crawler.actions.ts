import { createAction, props } from '@ngrx/store';
import { DataCollection } from '../../shared/model/data-collection';
import { Experiment } from '../../experiment/model/experiment';
import { Crawler } from '../model/crawler';
import { ExperimentFormValues } from '../../experiment/component/model/experiment-form-values';
import { HttpErrorResponse } from '@angular/common/http';
import { CrawlerFormValues } from '../model/crawler-form-values';

export const initCrawlers = createAction('[Crawler] init');
export const crawlersRequested = createAction('[Crawler] Data requested');
export const crawlersRequestFailed = createAction('[Crawler] Request failed', props<{ error: any }>());
export const crawlersRetrieved = createAction('[Crawler] Crawlers retrieved', props<{ collection: DataCollection }>());
export const crawlerResetRequested = createAction('[Crawler] Reset state requested');
export const crawlerPageRequested = createAction('[Crawler] Page requested', props<{ page: number }>());
export const crawlerRequested = createAction('[Crawler] Record requested', props<Crawler>());
export const currentCrawlerResetRequested = createAction('[Crawler] Reset current requested');
export const completeCrawlerCreateRequested = createAction('[Crawler] Complete create requested');

export const experimentDeleteRequested = createAction(
  '[Crawler] Delete requested',
  props<{ crawlerId: number }>()
);
export const updateCrawlerCreateValues = createAction('[Crawler] Update', props<CrawlerFormValues>());
export const experimentCreateSuccess = createAction('[Crawler] Create success', props<any>());
export const experimentDeleteSuccess = createAction('[Crawler] Delete success', props<any>());
export const experimentCreateError = createAction('[Crawler] Create error', props<{ err: HttpErrorResponse }>());
export const experimentDeleteError = createAction('[Crawler] Delete error', props<{ err: HttpErrorResponse }>());

export const experimentRequest = createAction('[Experiment] Data requested');
export const experimentsRetrieved = createAction('[Experiment] Crawlers retrieved', props<{ collection: any }>());
export const experimentRequestFailed = createAction('[Erawler] Request failed', props<{ error: any }>());

export const proxyRequest = createAction('[proxy] Data requested');
export const proxiesRetrieved = createAction('[proxy] proxy retrieved', props<{ proxy: any }>());
export const proxyRequestFailed = createAction('[proxy] Request failed', props<{ error: any }>());

export const agentRequest = createAction('[agent] Data requested');
export const agentsRetrieved = createAction('[agent] agent retrieved', props<{ agent: any }>());
export const agentRequestFailed = createAction('[agent] Request failed', props<{ error: any }>());

export const configRequest = createAction('[config] Data requested');
export const configsRetrieved = createAction('[config] config retrieved', props<{ config: any }>());
export const configRequestFailed = createAction('[config] Request failed', props<{ error: any }>());






