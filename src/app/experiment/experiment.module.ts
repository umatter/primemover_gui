import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentRoutingModule } from './experiment-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ExperimentComponent } from './index/experiment.component';
import { ExperimentCreateComponent } from './create/experiment-create.component';
import { ExperimentDataService } from '../entity/service';
import { experimentReducer } from '@app/experiment/store/experiment.reducer';
import { ExperimentEffects } from '@app/experiment/store/experiment.effects';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

@NgModule({
  declarations: [ExperimentComponent, ExperimentCreateComponent],
  imports: [
    CommonModule,
    ExperimentRoutingModule,
    NgxPaginationModule,
    SharedModule,
    StoreModule.forFeature('experiment', experimentReducer),
    EffectsModule.forFeature([ExperimentEffects])
  ],
  providers: [ExperimentDataService]
})
export class ExperimentModule {}
