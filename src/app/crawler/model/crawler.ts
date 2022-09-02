import { Experiment } from './experiment';

export interface Crawler {
  id: number;
  name: string;
  description: string;
  latest_queues_succeeded: number;
  latest_queues_failed: number;
  latest_queues_count: number;
  experiment: Experiment;
}
