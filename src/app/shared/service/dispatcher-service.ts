import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Crawler } from 'src/app/crawler/model/crawler';
import { crawlerRequested } from 'src/app/crawler/store/crawler.actions';
import { Experiment } from 'src/app/experiment/model/experiment';
import { experimentRequested } from 'src/app/experiment/store/experiment.actions';

@Injectable({
    providedIn: 'root'
})
export class DispatcherService {


    constructor(private store: Store) { }


    dispatchExperiment(experiment: Experiment) {
        this.store.dispatch(experimentRequested(experiment));
    }

    dispatchCrawler(crawler:Crawler){
            this.store.dispatch(crawlerRequested(crawler));
    }



}
