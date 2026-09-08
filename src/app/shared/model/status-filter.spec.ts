import {
  isStatusFilterKey,
  STATUS_FILTER_BAD_PARAM,
  STATUS_FILTER_OPTIONS,
  STATUS_FILTER_STATUS_PARAM,
  StatusFilterKey,
  statusFilterParams
} from '@shared/model/status-filter';
import { STATUS_ALIASES } from '@app/queue/status/status.enum';

/**
 * The chip → query-parameter mapping, which is the whole of what the GUI knows about
 * filtering by status.
 *
 * The assertions that matter are the negative ones. "Needs attention" must ask the API the
 * `is_bad` question rather than answer it: the moment the GUI sends its own list of codes,
 * that list is a second copy of the alias table — and a copy that is already wrong, since
 * the live `jobs` table holds 256 rows spelled `failed` beside 170 spelled `failure`, and
 * 277 legacy queues besides. A "Needs attention" view assembled here would show one of
 * those spellings and quietly drop the other.
 */
describe('status filter → query parameters', () => {
  it('sends nothing at all for "All", leaving the caller\'s other parameters alone', () => {
    expect(statusFilterParams('all')).toEqual({});
    expect(statusFilterParams(null)).toEqual({});
    expect(statusFilterParams(undefined)).toEqual({});
  });

  describe('"Needs attention"', () => {
    const params = statusFilterParams('bad');

    it('sends filter[bad]=1 — the predicate, asked server-side', () => {
      expect(params).toEqual({ [STATUS_FILTER_BAD_PARAM]: '1' });
    });

    it('does NOT send a status list, hand-built or otherwise', () => {
      expect(params[STATUS_FILTER_STATUS_PARAM]).toBeUndefined();
    });

    it('names no status code and no legacy alias anywhere in what it sends', () => {
      const sent = JSON.stringify(params);
      for (const alias of Object.keys(STATUS_ALIASES)) {
        expect(sent).not.toContain(alias);
      }
      for (const code of ['failure', 'warning']) {
        expect(sent).not.toContain(code);
      }
    });
  });

  describe('a single-status chip', () => {
    it('sends the canonical code only, and lets the API expand it', () => {
      expect(statusFilterParams('failure')).toEqual({ [STATUS_FILTER_STATUS_PARAM]: 'failure' });
      expect(statusFilterParams('warning')).toEqual({ [STATUS_FILTER_STATUS_PARAM]: 'warning' });
      expect(statusFilterParams('skipped')).toEqual({ [STATUS_FILTER_STATUS_PARAM]: 'skipped' });
      expect(statusFilterParams('running')).toEqual({ [STATUS_FILTER_STATUS_PARAM]: 'running' });
      expect(statusFilterParams('success')).toEqual({ [STATUS_FILTER_STATUS_PARAM]: 'success' });
    });

    it('never spells a legacy value: "Failure" asks for `failure`, not `failed`', () => {
      // The 256 `failed` rows must appear in this view, but the GUI is not what puts them
      // there — `statusVariants()` on the API is.
      expect(statusFilterParams('failure')[STATUS_FILTER_STATUS_PARAM]).toBe('failure');
      expect(statusFilterParams('skipped')[STATUS_FILTER_STATUS_PARAM]).not.toBe('skpped');
    });

    it('sends no filter[bad]', () => {
      expect(statusFilterParams('failure')[STATUS_FILTER_BAD_PARAM]).toBeUndefined();
    });
  });

  describe('the option list', () => {
    it('offers exactly All | Needs attention | Warning | Failure | Skipped | Running | Success', () => {
      expect(STATUS_FILTER_OPTIONS.map((option) => option.key)).toEqual([
        'all',
        'bad',
        'warning',
        'failure',
        'skipped',
        'running',
        'success'
      ]);
    });

    it('gives every chip a label key and a hint key', () => {
      for (const option of STATUS_FILTER_OPTIONS) {
        expect(option.labelKey).toBeTruthy();
        expect(option.hintKey).toBeTruthy();
      }
    });

    it('maps every chip to parameters without throwing', () => {
      for (const option of STATUS_FILTER_OPTIONS) {
        expect(() => statusFilterParams(option.key)).not.toThrow();
      }
    });
  });

  describe('isStatusFilterKey', () => {
    it('accepts the chips and rejects everything else', () => {
      expect(isStatusFilterKey('bad')).toBeTrue();
      expect(isStatusFilterKey('failure')).toBeTrue();
      // A legacy spelling is not a chip: the chips are canonical, the API does the rest.
      expect(isStatusFilterKey('failed')).toBeFalse();
      expect(isStatusFilterKey('unknown')).toBeFalse();
      expect(isStatusFilterKey('')).toBeFalse();
      expect(isStatusFilterKey(null)).toBeFalse();
    });
  });

  it('keeps "bad" and "all" out of the status parameter for every key it accepts', () => {
    const keys: StatusFilterKey[] = STATUS_FILTER_OPTIONS.map((option) => option.key);
    for (const key of keys) {
      const sent = statusFilterParams(key);
      expect(sent[STATUS_FILTER_STATUS_PARAM]).not.toBe('all');
      expect(sent[STATUS_FILTER_STATUS_PARAM]).not.toBe('bad');
    }
  });
});
