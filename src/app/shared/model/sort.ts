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
  /**
   * Normalised severity ordering, resolved server-side.
   *
   * Sorting the raw `status_code` string sorts the *spelling*, so the 256 legacy `failed`
   * rows land in a different block from the 170 canonical `failure` ones and neither block
   * is next to `warning` — which is the pair a reader is looking for. `severity` asks the
   * API to order by the normalised code instead: success 0, skipped 1, running 2, unknown
   * 3, warning 4, failure 5.
   *
   * Note the rank has an `unknown` step that `orchestrator/status.py`'s `SEVERITY` map
   * does not: that map covers the five canonical codes only, and an unrecognised value has
   * no rank there at all. Placed between `running` and `warning`, an unrecognised status
   * sorts above every benign state and below the two that need attention — never silently
   * at the "everything is fine" end of the list.
   */
  'SEVERITY' = 'severity',
  'TYPE' = 'type'
}

export interface Sort {
  sortBy: SortBy;
  sortDirection: SortDirection;
}
