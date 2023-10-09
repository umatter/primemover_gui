import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Crawler } from 'src/app/crawler/model/crawler';
import { Experiment } from 'src/app/experiment/model/experiment';
import { selectCurrentCrawler, selectCurrentExperiment, selectCurrentQueue } from '@shared/store/shared.selectors';
import { Queue } from '@app/queue/model/queue';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe, DatePipe, NgIf } from '@angular/common';
import { TimezoneDetail } from '@shared/service/timezone.service';
import { selectTimezoneDetail } from '@shared/store/shared.reducer';

@Component({
  selector: 'app-metadata',
  templateUrl: './metadata.component.html',
  imports: [TranslateModule, AsyncPipe, NgIf, DatePipe],
  standalone: true
})
export class MetadataComponent implements OnInit {
  timezoneDetail$: Observable<TimezoneDetail> = this.store.select(selectTimezoneDetail);
  currentExperiment$: Observable<Experiment>;
  currentCrawler$: Observable<Crawler>;
  currentQueue$: Observable<Queue>;
  multilogin: any;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.currentExperiment$ = this.store.select(selectCurrentExperiment);
    this.currentCrawler$ = this.store.select(selectCurrentCrawler);
    this.currentQueue$ = this.store.select(selectCurrentQueue);
  }

  multiLoginProfile(data: any): void {
    if (data) {
      this.multilogin = JSON.parse(JSON.parse(JSON.stringify(data)));
    }
  }
}
