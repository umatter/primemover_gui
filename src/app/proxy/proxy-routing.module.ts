import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { ProxyComponent } from './index/proxy.component';
import { ProxyFormComponent } from './form/proxy-form.component';
import { ProxyEditComponent } from '@app/proxy/edit/proxy-edit.component';

export const proxyRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { requiresLogin: true },
    children: [
      {
        path: '',
        component: ProxyComponent
      },
      {
        path: ':id/edit',
        component: ProxyEditComponent
      },
      {
        path: 'create',
        component: ProxyFormComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(proxyRoutes)],
  exports: [RouterModule]
})
export class ProxyRoutingModule {}
