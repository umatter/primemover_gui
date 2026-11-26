export interface Experiment {
  id: number;
  name: string;
  contact: string;
  description: string;
  /** Runner account that executes the study; null = the API's default runner. */
  runner_user_id?: number | null;
  created_at: string;
  updated_at: string;
  /**
   * Runs of this experiment in the health window that need attention: the contract's
   * `is_bad`, `failure OR warning`, counted server-side so a card can show its state
   * without one `/health` request per card.
   *
   * Optional because the API deployed today does not append it. **Absent means unknown**,
   * never "none" — read it through {@link experimentBadRuns} rather than defaulting it to
   * 0 at the call site, or an older API renders every study green.
   */
  runs_bad_count?: number;
  /** The experiment's own preferences; pmspec records a study's provenance here. */
  preferences?: { name: string; value?: string | null }[];
}

/** The preference pmspec writes on every upload of a study defined by a lock. */
export const LOCK_PREFERENCE = 'pmspec.lock_sha256';

/**
 * Whether a study's bots may be edited from the GUI (#72).
 *
 * `locked`: pmspec uploaded it from a lock, so its bots are the randomization record and
 * change only through pmspec (a runs lock with `updates:`). Each upload appends its own
 * set of `pmspec.*` rows, so presence is the test, never a single row.
 *
 * `unknown`: the experiment, or its preferences, could not be read. Treated as locked: a
 * bot edited by mistake in a running study is not undone by finding out afterwards.
 */
export type EditState = 'free' | 'locked' | 'unknown';

export function experimentEditState(experiment: Experiment | null | undefined): EditState {
  if (!experiment || !Array.isArray(experiment.preferences)) return 'unknown';
  return experiment.preferences.some((p) => p?.name === LOCK_PREFERENCE) ? 'locked' : 'free';
}

/**
 * `runs_bad_count` for an experiment, or `null` when the API did not send it.
 *
 * `null` and `0` are different claims — "we do not know" versus "nothing needs attention"
 * — and the health strip renders them differently on purpose. `Number()` rather than a
 * bare cast because Laravel has been known to serialise appended integer attributes as
 * strings.
 */
export function experimentBadRuns(experiment: Experiment | null | undefined): number | null {
  if (!experiment) return null;
  const value: unknown = (experiment as unknown as Record<string, unknown>)['runs_bad_count'];
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
