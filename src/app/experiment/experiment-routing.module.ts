import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { ExperimentComponent } from './index/experiment.component';
import { ExperimentCreateComponent } from './create/experiment-create.component';

const routes: Routes = [
  {
    path: '',
    component: ExperimentComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: ExperimentCreateComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExperimentRoutingModule {}
