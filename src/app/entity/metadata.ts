import { DefaultDataServiceConfig, EntityMetadataMap } from '@ngrx/data';
import { environment } from '@environments/environment';

export const filterBySearchTerm = (entities: { name: string }[], search: string) => {
  return entities.filter((entity) => -1 < entity.name.indexOf(search));
};

export function sortByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name);
}

const entityMetadata: EntityMetadataMap = {
  Experiment: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Crawler: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Queue: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Job: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Agent: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Proxy: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Configuration: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  },
  Behavior: {
    filterFn: filterBySearchTerm,
    sortComparer: sortByName,
    entityDispatcherOptions: {
      optimisticDelete: true
    }
  }
};

const pluralNames = {
  Experiment: 'Experiments',
  Crawler: 'Crawlers',
  Queue: 'Queues',
  Job: 'Jobs',
  Agent: 'Agents',
  Proxy: 'Proxies',
  Configuration: 'Configurations',
  Behavior: 'Behaviors'
};

export const entityConfig = {
  entityMetadata,
  pluralNames
};

export const defaultDataServiceConfig: DefaultDataServiceConfig = {
  root: environment.configService.apiBaseUrl,
  timeout: 3000,
  trailingSlashEndpoints: true
};
