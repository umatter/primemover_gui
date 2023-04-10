import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExperimentComponent } from './index/experiment.component';
import { ExperimentCreateComponent } from './create/experiment-create.component';
import { ExperimentUploadComponent } from './experiment-upload/experiment-upload.component';

const routes: Routes = [
  {
    path: '',
    component: ExperimentComponent
  },
  {
    path: 'create',
    component: ExperimentCreateComponent
  },
  {
    path: 'upload',
    component: ExperimentUploadComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExperimentRoutingModule {}
