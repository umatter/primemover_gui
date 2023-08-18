import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { CrawlerComponent } from './index/crawler.component';
import { CrawlerCreateComponent } from './create/crawler-create.component';
import { CrawlerUploadComponent } from './crawler-upload/crawler-upload.component';

const routes: Routes = [
  {
    path: '',
    component: CrawlerComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: 'create',
    component: CrawlerCreateComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  },
  {
    path: ':id/upload',
    component: CrawlerUploadComponent,
    canActivate: [AuthGuard],
    data: { requiresLogin: true }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CrawlerRoutingModule {}
