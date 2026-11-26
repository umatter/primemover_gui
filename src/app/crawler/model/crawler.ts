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
   * as `warning` — finished, but degraded. Derived from the *jobs*, not from the run.
   *
   * Optional on purpose: the attribute is appended API-side in the same 2026-08-27
   * change that introduced the `warning` job status, and this GUI has to keep rendering
   * against an API that predates it. Absent means **unknown**, never "none", so read it
   * through {@link crawlerRunCount} rather than defaulting it to 0 at the call site.
   */
  latest_queues_degraded?: number;
  /**
   * Runs of this bot in the last 24h whose **own** `status_code` is `warning` — the run
   * completed but lost work (`DONE_JOBSWARNING`).
   *
   * This is a different question from {@link Crawler.latest_queues_degraded}, and the gap
   * between them is a real bug this field closes: a queue that reports `warning` while
   * none of its individual jobs did is counted by *neither* `latest_queues_succeeded` nor
   * `_failed` nor `_degraded`, so the workspace used to call such a bot "Running" forever.
   *
   * Not sent by the API deployed on ex63 today. Absent means **unknown**, never "none".
   */
  latest_queues_warning?: number;
  /**
   * Runs of this bot in the window that contain at least one job with
   * `decision_treatment_lost = true` — a bot configured to be treated that produced
   * control-arm data (contract §7.3).
   *
   * This is the alarm, and it is a different question from every other count here: those
   * describe whether the *run* completed, this one describes whether the *science* did.
   * A run can be `success` in every status field and still be listed here.
   *
   * Absent means **unknown** (an API that predates the column), and a reported `0` is not
   * a clean bill of health either — the underlying job column is nullable, so zero covers
   * both "no verdict was ever recorded" and "every verdict was fine". Only a positive
   * count asserts something.
   */
  latest_queues_treatment_lost?: number;
  experiment_id: number;
  agent_id?: number | null;
  proxy_id?: number | null;
  agent?: Agent | null;
  proxy?: Proxy | null;
  configuration_id?: number | null;
  configuration?: Configuration | null;
}

/** The appended run counts this GUI reads off a crawler, by short name. */
export type CrawlerRunCountKind = 'count' | 'succeeded' | 'failed' | 'warning' | 'degraded' | 'treatmentLost';

const RUN_COUNT_FIELDS: Readonly<Record<CrawlerRunCountKind, keyof Crawler>> = {
  count: 'latest_queues_count',
  succeeded: 'latest_queues_succeeded',
  failed: 'latest_queues_failed',
  warning: 'latest_queues_warning',
  degraded: 'latest_queues_degraded',
  treatmentLost: 'latest_queues_treatment_lost'
};

/**
 * One appended run count for a bot, or `null` when the API did not send it at all.
 *
 * `null` and `0` mean different things — "we don't know" versus "none" — and the
 * workspace's "Needs attention" tile hides itself on an all-`null` list rather than
 * claiming a confident zero that no API ever asserted. `Number()` rather than a bare cast
 * because Laravel has been known to serialise appended integer attributes as strings.
 */
export function crawlerRunCount(bot: Crawler | null | undefined, kind: CrawlerRunCountKind): number | null {
  if (!bot) return null;
  const value: unknown = (bot as unknown as Record<string, unknown>)[RUN_COUNT_FIELDS[kind]];
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Runs of this bot that finished but had degraded jobs, or `null` when not reported. */
export function crawlerDegradedRuns(bot: Crawler | null | undefined): number | null {
  return crawlerRunCount(bot, 'degraded');
}

/** Runs of this bot whose own status was `warning`, or `null` when not reported. */
export function crawlerWarningRuns(bot: Crawler | null | undefined): number | null {
  return crawlerRunCount(bot, 'warning');
}

/**
 * Runs of this bot that lost a treatment, or `null` when the API does not report it.
 *
 * Kept separate from every "needs attention" arithmetic on purpose: a lost treatment is
 * not a louder warning, it is a different claim — that the data from those runs cannot
 * answer the question the experiment was built to ask.
 */
export function crawlerTreatmentLostRuns(bot: Crawler | null | undefined): number | null {
  return crawlerRunCount(bot, 'treatmentLost');
}
