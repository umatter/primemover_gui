import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExperimentComponent } from './index/experiment.component';
import { ExperimentCreateComponent } from './create/experiment-create.component';
import { ExperimentUploadComponent } from './experiment-upload/experiment-upload.component';

export const experimentRroutes: Routes = [
  {
    path: '',
    component: ExperimentComponent
  },
  {
    path: 'create',
    component: ExperimentCreateComponent
  },
  {
    path: ':id/upload',
    component: ExperimentUploadComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(experimentRroutes)],
  exports: [RouterModule]
})
export class ExperimentRoutingModule {}
