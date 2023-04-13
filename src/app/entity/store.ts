import { EntityDataService } from '@ngrx/data';
import { NgModule } from '@angular/core';
import {
  AgentDataService,
  BehaviorDataService,
  ConfigurationDataService,
  CrawlerDataService,
  ExperimentDataService,
  JobDataService,
  ProxyDataService,
  QueueDataService
} from './service';

@NgModule({
  imports: [],
  providers: [
    ExperimentDataService,
    CrawlerDataService,
    QueueDataService,
    JobDataService,
    AgentDataService,
    ProxyDataService,
    ConfigurationDataService,
    BehaviorDataService
  ]
})
export class EntityStoreModule {
  constructor(
    entityDataService: EntityDataService,
    experimentDataService: ExperimentDataService,
    crawlerDataService: CrawlerDataService,
    queueDataService: QueueDataService,
    jobDataService: JobDataService,
    agentDataService: AgentDataService,
    proxyDataService: ProxyDataService,
    configurationDataService: ConfigurationDataService,
    behaviorDataService: BehaviorDataService
  ) {
    entityDataService.registerService('Experiment', experimentDataService);
    entityDataService.registerService('Crawler', crawlerDataService);
    entityDataService.registerService('Queue', queueDataService);
    entityDataService.registerService('Job', jobDataService);
    entityDataService.registerService('Agent', agentDataService);
    entityDataService.registerService('Proxy', proxyDataService);
    entityDataService.registerService('Configuration', configurationDataService);
    entityDataService.registerService('Behavior', behaviorDataService);
  }
}
