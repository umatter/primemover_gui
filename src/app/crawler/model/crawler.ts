import { Experiment } from './experiment';
import { Agent } from '@app/agent/model/agent';
import { Proxy } from '@app/proxy/model/proxy';
import { Configuration } from '@app/config/model/config';

export interface Crawler {
  experiment: Experiment;
  id: number;
  name: string;
  description: string;
  latest_queues_succeeded: number;
  latest_queues_failed: number;
  latest_queues_count: number;
  experiment_id: number;
  agent?: Agent;
  proxy?: Proxy;
  configuration?: Configuration;
}
