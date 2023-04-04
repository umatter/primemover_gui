import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  DefaultDataService,
  DefaultDataServiceConfig,
  EntityCollectionServiceBase,
  EntityCollectionServiceElementsFactory,
  HttpUrlGenerator
} from '@ngrx/data';
import { Experiment } from '../experiment/model/experiment';
import { Crawler } from '../crawler/model/crawler';
import { Queue } from '../queue/model/queue';
import { Job } from '../job/model/Job';
import { Agent } from '../agent/model/agent';
import { Configuration } from '../config/model/config';
import { Proxy } from '../proxy/model/proxy';
import { Behavior } from '@app/behavior/behavior';

@Injectable()
export class ExperimentDataService extends DefaultDataService<Experiment> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Experiment', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class ExperimentService extends EntityCollectionServiceBase<Experiment> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Experiment', serviceElementsFactory);
  }
}

@Injectable()
export class CrawlerDataService extends DefaultDataService<Crawler> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Crawler', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class CrawlerService extends EntityCollectionServiceBase<Crawler> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Crawler', serviceElementsFactory);
  }
}

@Injectable()
export class QueueDataService extends DefaultDataService<Queue> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Queue', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class QueueService extends EntityCollectionServiceBase<Queue> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Queue', serviceElementsFactory);
  }
}

@Injectable()
export class JobDataService extends DefaultDataService<Job> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Job', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class JobService extends EntityCollectionServiceBase<Job> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Job', serviceElementsFactory);
  }
}

@Injectable()
export class AgentDataService extends DefaultDataService<Agent> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Agent', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class AgentService extends EntityCollectionServiceBase<Agent> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Agent', serviceElementsFactory);
  }
}

@Injectable()
export class ConfigurationDataService extends DefaultDataService<Configuration> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Configuration', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class ConfigurationService extends EntityCollectionServiceBase<Configuration> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Configuration', serviceElementsFactory);
  }
}

@Injectable()
export class ProxyDataService extends DefaultDataService<Proxy> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Proxy', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class ProxyService extends EntityCollectionServiceBase<Proxy> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Proxy', serviceElementsFactory);
  }
}

@Injectable()
export class BehaviorDataService extends DefaultDataService<Behavior> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator, config: DefaultDataServiceConfig) {
    super('Behavior', http, httpUrlGenerator, config);
  }
}

@Injectable({ providedIn: 'root' })
export class BehaviorService extends EntityCollectionServiceBase<Behavior> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Behavior', serviceElementsFactory);
  }
}
