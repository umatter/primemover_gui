import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { QueueRoutingModule } from './queue-routing.module';
import { QueueComponent } from './index/queue.component';
import { StoreModule } from '@ngrx/store';
import { experimentReducer } from '../experiment/store/experiment.reducer';
import { EffectsModule } from '@ngrx/effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { queueReducer } from './store/queue.reducer';
import { QueueEffects } from './store/queue.effects';
import { crawlerReducer } from '../crawler/store/crawler.reducer';
import { StatusComponent } from './status/status.component';
import { QueueCreateComponent } from './create/queue-create.component';

@NgModule({
  declarations: [QueueComponent, StatusComponent, QueueCreateComponent],
  exports: [StatusComponent],
  imports: [
    CommonModule,
    QueueRoutingModule,
    StoreModule.forFeature('queue', queueReducer),
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('crawler', crawlerReducer),
    EffectsModule.forFeature([QueueEffects]),
    NgxPaginationModule,
    SharedModule
  ],
  providers: [DatePipe]
})
export class QueueModule {}
