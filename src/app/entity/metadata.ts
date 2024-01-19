import { DefaultDataServiceConfig, EntityMetadataMap } from '@ngrx/data';
import { environment } from '@environments/environment';

export const filterBySearchTerm = (entities: { name: string }[], search: string) => {
  return entities.filter((entity) => -1 < entity.name.indexOf(search));
};

export function sortByName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name);
}

export function sortById(a: { id: number }, b: { id: number }): number {
  return b.id - a.id;
}

const entityMetadata: EntityMetadataMap = {
  Experiment: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Crawler: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Queue: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Job: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Agent: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Proxy: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Configuration: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
    }
  },
  Behavior: {
    filterFn: filterBySearchTerm,
    sortComparer: sortById,
    entityDispatcherOptions: {
      optimisticDelete: true
    },
    additionalCollectionState: {
      pageMeta: null,
      pageLinks: null
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
  timeout: 30000,
  trailingSlashEndpoints: true
};
