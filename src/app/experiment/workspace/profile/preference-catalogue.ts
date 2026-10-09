/**
 * The preferences this GUI knows how to edit with more than a text box.
 *
 * Preferences are open-ended name → string pairs; anything not listed here stays
 * editable as free text and is never hidden or dropped. Sources:
 *  - `cookie_pref` is the one preference the runner reads itself
 *    (`primemover_runner … util/consent/ConsentPolicy`): JSON `{"accept_all": true|false}`.
 *    An unparseable value, or one without `accept_all`, is ignored by the runner with
 *    only a log line — so the GUI refuses to save one.
 *  - `location`, `cookie_pref`, `usage_type` defaults are the experiment designer's
 *    (`experiment_designer/spec/converter.py` `_ensure_preferences`).
 *  - `aversion_*`, `preference_*`, `order` are passed through to the YouTube decision
 *    function; numeric, range owned by that service.
 */

export type PreferenceKind = 'location' | 'cookie' | 'usageType' | 'weight' | 'text';

export type CookieMode = 'accept' | 'reject' | 'custom';

/**
 * The canonical vocabulary: what `primemover_py` validates (`only_search | only_direct |
 * both`) and the designer's default uses. The designer DOCS' plural forms are wrong.
 * Suggestions, not a closed list: a stored value outside it is shown as it is.
 */
export const USAGE_TYPE_SUGGESTIONS = ['only_search', 'only_direct', 'both'];

export const DEFAULT_PREFERENCES: ReadonlyArray<{ name: string; value: string }> = [
  { name: 'location', value: 'US-IL-CHICAGO' },
  { name: 'cookie_pref', value: '{"accept_all": true}' },
  { name: 'usage_type', value: 'only_search' }
];

const COOKIE_VALUES: Record<Exclude<CookieMode, 'custom'>, string> = {
  accept: '{"accept_all": true}',
  reject: '{"accept_all": false}'
};

export function isDecisionWeight(name: string): boolean {
  return name.startsWith('aversion_') || name.startsWith('preference_') || name === 'order';
}

export function preferenceKind(name: string): PreferenceKind {
  if (name === 'location') return 'location';
  if (name === 'cookie_pref') return 'cookie';
  if (name === 'usage_type') return 'usageType';
  if (isDecisionWeight(name)) return 'weight';
  return 'text';
}

/** Which preset a stored cookie_pref matches; anything else is 'custom'. */
export function cookieMode(value: string): CookieMode {
  const parsed = parseObject(value);
  if (parsed && Object.keys(parsed).length === 1 && typeof parsed['accept_all'] === 'boolean') {
    return parsed['accept_all'] ? 'accept' : 'reject';
  }
  return 'custom';
}

/** The exact string the designer emits for a preset. */
export function cookieValue(mode: Exclude<CookieMode, 'custom'>): string {
  return COOKIE_VALUES[mode];
}

/** An i18n key describing why a value cannot be saved, or null when it can. */
export function preferenceError(kind: PreferenceKind, value: string): string | null {
  if (kind === 'weight') {
    return value.trim() !== '' && Number.isFinite(Number(value)) ? null : 'workspace.profile.error.number';
  }
  if (kind === 'cookie') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      return 'workspace.profile.error.cookieJson';
    }
    const isObject = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
    return isObject && 'accept_all' in (parsed as object) ? null : 'workspace.profile.error.cookieKey';
  }
  return null;
}

/** The designer defaults whose names are not among `present`. */
export function missingDefaults(present: string[]): { name: string; value: string }[] {
  const have = new Set(present);
  return DEFAULT_PREFERENCES.filter((p) => !have.has(p.name)).map((p) => ({ ...p }));
}

function parseObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
