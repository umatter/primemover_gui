import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentRoutingModule } from './experiment-routing.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { experimentReducer } from './store/experiment.reducer';
import { ExperimentEffects } from './store/experiment.effects';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '../shared/shared.module';
import { crawlerReducer } from '../crawler/store/crawler.reducer';
import { queueReducer } from '../queue/store/queue.reducer';
import { ExperimentComponent } from './component/experiment/experiment.component';
import { ExperimentCreateComponent } from './component/experiment-create/experiment-create.component';

@NgModule({
  declarations: [ExperimentComponent, ExperimentCreateComponent],
  imports: [
    CommonModule,
    ExperimentRoutingModule,
    StoreModule.forFeature('experiment', experimentReducer),
    StoreModule.forFeature('crawler', crawlerReducer),
    StoreModule.forFeature('queue', queueReducer),
    EffectsModule.forFeature([ExperimentEffects]),
    NgxPaginationModule,
    SharedModule
  ]
})
export class ExperimentModule {}
