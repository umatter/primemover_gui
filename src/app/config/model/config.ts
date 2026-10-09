import { Preference } from './preference';

export interface Configuration {
  id: number;
  name: string;
  description?: string | null;
  /** 0/1 from the API. Visible since umatter/primemover_api#87; older APIs omit it. */
  active?: number | boolean;
  /** Present when the configuration is read on its own (`GET configurations/{id}`). */
  preferences?: Preference[];
}
