import { Param } from './param';
import { Preference } from './preference';

export interface Configuration {
  id: number;
  name: string;
  description?: string | null;
  /** 0/1 from the API. Visible since umatter/primemover_api#87; older APIs omit it. */
  active?: number | boolean;
  /** Present when the configuration is read on its own (`GET configurations/{id}`). */
  preferences?: Preference[];
  /** The treatment. The runner uses the FIRST row; see treatment-model.ts. */
  params?: Param[];
  /** How many crawlers use this configuration (umatter/primemover_api#85). */
  crawlers_count?: number;
}
