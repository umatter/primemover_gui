import { DefaultDataServiceConfig, EntityMetadataMap } from '@ngrx/data';
import { resolveApiBaseUrl } from '@app/app-config';

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
    //sortComparer: sortById,
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
    //sortComparer: sortById,
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
    //sortComparer: sortById,
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
  // Same runtime resolution as AppConfig. ngrx-data builds every entity URL
  // from this root, so leaving it on the build-time environment would make
  // most of the app ignore the deployed API endpoint.
  root: resolveApiBaseUrl(),
  timeout: 30000,
  trailingSlashEndpoints: true
};
