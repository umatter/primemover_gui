import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrawlerRoutingModule } from './crawler-routing.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SharedModule } from '@shared/shared.module';
import { CrawlerComponent } from './index/crawler.component';
import { CrawlerCreateComponent } from './create/crawler-create.component';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { AgentModule } from '@app/agent/agent.module';
import { ConfigurationModule } from '@app/config/config.module';
import { ProxyModule } from '@app/proxy/proxy.module';
import { CrawlerUploadComponent } from './crawler-upload/crawler-upload.component';

@NgModule({
  declarations: [CrawlerComponent, CrawlerCreateComponent, CrawlerUploadComponent],
  imports: [
    CommonModule,
    CrawlerRoutingModule,
    NgxPaginationModule,
    SharedModule,
    MatProgressSpinnerModule,
    AgentModule,
    ConfigurationModule,
    ProxyModule
  ]
})
export class CrawlerModule {}
