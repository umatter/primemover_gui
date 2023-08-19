import { Crawler } from '@app/crawler/model/crawler';

export interface Agent {
  id: number | null;
  name: string;
  description: string;
  identification: string;
  multilogin_id: string;
  multilogin_profile: string;
  location: string;
  crawler: Crawler | null;
  preferences: any[] | null;
}
