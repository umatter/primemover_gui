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
  /**
   * Runs of this bot in the last 24h that contain at least one job the runner reported
   * as `warning` — finished, but degraded.
   *
   * Optional on purpose: the attribute is appended API-side in the same 2026-08-27
   * change that introduced the `warning` job status, and this GUI has to keep rendering
   * against an API that predates it. Absent means **unknown**, never "none", so read it
   * through {@link crawlerDegradedRuns} rather than defaulting it to 0 at the call site.
   */
  latest_queues_degraded?: number;
  experiment_id: number;
  agent?: Agent;
  proxy?: Proxy;
  configuration?: Configuration;
}

/**
 * Runs of this bot that finished but degraded, or `null` when the API did not send the
 * count at all.
 *
 * `null` and `0` mean different things — "we don't know" versus "none" — and the
 * workspace's Degraded tile hides itself on `null` rather than claiming a confident zero
 * that no API ever asserted. `Number()` rather than a bare cast because Laravel has been
 * known to serialise appended integer attributes as strings.
 */
export function crawlerDegradedRuns(bot: Crawler | null | undefined): number | null {
  if (!bot) return null;
  const value: unknown = bot.latest_queues_degraded;
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
