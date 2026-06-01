import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '@core/auth/login/login.component';
import { LogoutComponent } from '@core/auth/logout/logout.component';
import { AuthGuard } from '@core/guards/auth.guard';
import { ForgotPasswordComponent } from '@core/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '@core/auth/reset-password/reset-password.component';
import { UserSettingComponent } from '@shared/layout/user-setting/user-setting.component';

const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'logout',
    component: LogoutComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'user/settings',
    component: UserSettingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'password/reset/:token',
    component: ResetPasswordComponent
  },
  {
    path: 'crawlers',
    loadChildren: () => import('./crawler/crawler-routing.module').then((m) => m.crawlerRoutes)
  },
  {
    path: 'experiments',
    loadChildren: () => import('./experiment/experiment-routing.module').then((mod) => mod.experimentRroutes),
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'library',
    loadComponent: () => import('./library/library.component').then((m) => m.LibraryComponent),
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'queues',
    loadChildren: () => import('./queue/queue-routing.module').then((m) => m.queueRoutes)
  },
  {
    path: 'jobs',
    loadChildren: () => import('./job/job-routing.module').then((m) => m.jobRoutes)
  },
  {
    path: 'agents',
    loadChildren: () => import('./agent/agent-routing.module').then((m) => m.agentRoutes)
  },
  { path: 'configurations', loadChildren: () => import('./config/config-routing.module').then((m) => m.configRoutes) },
  { path: 'proxies', loadChildren: () => import('./proxy/proxy-routing.module').then((m) => m.proxyRoutes) },
  {
    path: '**',
    component: LoginComponent,
    outlet: 'noLayout'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
