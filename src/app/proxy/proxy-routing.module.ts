import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/guards/auth.guard';
import { ProxyComponent } from './component/proxy/proxy.component';
import { ProxyCreateComponent } from './component/proxy-create/proxy-create.component';

const routes: Routes = [
  {
    path: '',
    component: ProxyComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: ProxyCreateComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProxyRoutingModule {}
