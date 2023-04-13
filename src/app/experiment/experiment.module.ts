import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentRoutingModule } from './experiment-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { ExperimentComponent } from './index/experiment.component';
import { ExperimentCreateComponent } from './create/experiment-create.component';
import { ExperimentDataService } from '../entity/service';
import { ExperimentUploadComponent } from './experiment-upload/experiment-upload.component';

@NgModule({
  declarations: [ExperimentComponent, ExperimentCreateComponent, ExperimentUploadComponent],
  imports: [CommonModule, ExperimentRoutingModule, NgxPaginationModule, SharedModule],
  providers: [ExperimentDataService]
})
export class ExperimentModule {}
