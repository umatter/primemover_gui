export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export enum SortBy {
  'NAME' = 'name',
  'CREATED' = 'created_at',
  'UPDATED' = 'updated_at',
  'ID' = 'id',
  'CRAWLER' = 'crawler_id',
  'QUEUE' = 'queue_id',
  'EXPERIMENT' = 'experiment_id',
  'PROCESSED' = 'processed',
  'PROCESSING' = 'processing',
  'REVIEWED' = 'reviewed',
  'STATUSCODE' = 'status_code',
  'TYPE' = 'type'
}

export interface Sort {
  sortBy: SortBy;
  sortDirection: SortDirection;
}
