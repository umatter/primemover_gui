import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Crawler } from 'src/app/crawler/model/crawler';
import { Experiment } from 'src/app/experiment/model/experiment';
import { selectCurrentCrawler, selectCurrentExperiment } from '@shared/store/shared.selectors';

@Component({
  selector: 'app-metadata',
  templateUrl: './metadata.component.html'
})
export class MetadataComponent implements OnInit {
  experiment: any;
  currentExperiment$: Observable<Experiment | null>;
  currentCrawler$: Observable<Crawler | null>;
  crawler: any;
  multilogin: any;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.currentExperiment$ = this.store.pipe(select(selectCurrentExperiment));
    this.currentCrawler$ = this.store.pipe(select(selectCurrentCrawler));

    this.currentExperiment$.subscribe((currentExperiment) => {
      this.experiment = currentExperiment;
    });

    this.currentCrawler$.subscribe((selectedCrawler: any) => {
      this.crawler = selectedCrawler;
    });
  }

  multiLoginProfile(data: any): void {
    if (data) {
      this.multilogin = JSON.parse(JSON.parse(JSON.stringify(data)));
    }
  }
}
