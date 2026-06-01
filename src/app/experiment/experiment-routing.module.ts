import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExperimentComponent } from './index/experiment.component';
import { ExperimentUploadComponent } from './experiment-upload/experiment-upload.component';
import { ExperimentWorkspaceComponent } from './workspace/experiment-workspace.component';
import { ExperimentWizardComponent } from './wizard/experiment-wizard.component';

export const experimentRroutes: Routes = [
  {
    path: '',
    component: ExperimentComponent
  },
  {
    path: 'create',
    component: ExperimentWizardComponent
  },
  {
    path: ':id/upload',
    component: ExperimentUploadComponent
  },
  {
    path: ':id',
    component: ExperimentWorkspaceComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(experimentRroutes)],
  exports: [RouterModule]
})
export class ExperimentRoutingModule {}
