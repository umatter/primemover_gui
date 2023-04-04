import { createAction, props } from '@ngrx/store';
import { Crawler } from '../model/crawler';
import { HttpErrorResponse } from '@angular/common/http';
import { CrawlerFormValues } from '../model/crawler-form-values';

export const initCrawlers = createAction('[Crawler] init');
export const crawlersRequested = createAction('[Crawler] Data requested');
export const crawlerResetRequested = createAction('[Crawler] Reset state requested');
export const crawlerPageRequested = createAction('[Crawler] Page requested', props<{ page: number }>());
export const crawlerRequested = createAction('[Crawler] Record requested', props<Crawler>());
export const currentCrawlerResetRequested = createAction('[Crawler] Reset current requested');
export const completeCrawlerCreateRequested = createAction('[Crawler] Complete create requested');

export const updateCrawlerCreateValues = createAction('[Crawler] Update', props<CrawlerFormValues>());
export const experimentCreateSuccess = createAction('[Crawler] Create success', props<any>());
export const experimentCreateError = createAction('[Crawler] Create error', props<{ err: HttpErrorResponse }>());
