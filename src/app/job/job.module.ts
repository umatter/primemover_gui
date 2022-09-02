import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobRoutingModule } from './job-routing.module';
import { JobComponent } from './component/job/job.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { jobReducer } from './store/job.reducer';
import { JobEffects } from './store/job.effects';
import { experimentReducer } from '../experiment/store/experiment.reducer';
import { crawlerReducer } from '../crawler/store/crawler.reducer';
import { queueReducer } from '../queue/store/queue.reducer';
import { QueueModule } from '../queue/queue.module';

@NgModule({
  declarations: [JobComponent],
  imports: [
    CommonModule,
    JobRoutingModule,
    StoreModule.forFeature('job', jobReducer),
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('queue', queueReducer),
    EffectsModule.forFeature([JobEffects]),
    NgxPaginationModule,
    SharedModule,
    QueueModule
  ]
})
export class JobModule {}
