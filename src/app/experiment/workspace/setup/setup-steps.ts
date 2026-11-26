import { Crawler } from '@app/crawler/model/crawler';

export type SetupStepKey = 'identity' | 'connection' | 'profile' | 'treatment';

/**
 * One thing a bot needs before its runs mean anything. `done` is null when the payload
 * cannot say — never a guessed false (a nag for something that is fine) or true.
 */
export interface SetupStep {
  key: SetupStepKey;
  done: boolean | null;
}

/** The four setup steps, read off the crawler payload alone (no extra requests). */
export function setupSteps(bot: Crawler): SetupStep[] {
  const configurationId = bot.configuration_id ?? bot.configuration?.id ?? null;
  return [
    { key: 'identity', done: Boolean(bot.agent_id ?? bot.agent?.id) },
    { key: 'connection', done: Boolean(bot.proxy_id ?? bot.proxy?.id) },
    { key: 'profile', done: configurationId !== null },
    { key: 'treatment', done: treatmentDone(bot, configurationId) }
  ];
}

/** "Ready" or how many steps are left; null when any step is unknown. */
export function readiness(bot: Crawler): { ready: boolean; left: number } | null {
  const steps = setupSteps(bot);
  if (steps.some((s) => s.done === null)) return null;
  const left = steps.filter((s) => !s.done).length;
  return { ready: left === 0, left };
}

function treatmentDone(bot: Crawler, configurationId: number | null): boolean | null {
  // No profile, no treatment: that is known, not unknown.
  if (configurationId === null) return false;
  // The profile is set but not embedded (or embedded without params): the payload cannot say.
  const params = bot.configuration?.params;
  if (params === undefined || params === null) return null;
  return params.length > 0;
}
