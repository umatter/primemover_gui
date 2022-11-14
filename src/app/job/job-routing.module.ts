import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobComponent } from './component/job/job.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { JobCreateComponent } from './component/job-create/job-create.component';

const routes: Routes = [
  {
    path: '',
    component: JobComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: JobCreateComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobRoutingModule {}
