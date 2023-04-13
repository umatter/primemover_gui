import { QueryFilterType } from '@shared/store/shared.selectors';

export interface QueryFilter {
  name: QueryFilterType;
  value: any;
  entity?: any;
}
