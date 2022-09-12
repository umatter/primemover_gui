import { PageLinks } from '../../core/pagination/page-links';
import { PageMeta } from '../../core/pagination/page-meta';

export type DataCollection = {
  data?: any[];
  links: PageLinks | null;
  meta: PageMeta | null;
};
