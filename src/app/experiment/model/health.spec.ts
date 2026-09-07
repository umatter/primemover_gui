import {
  DEFAULT_HEALTH_WINDOW,
  ExperimentHealth,
  HEALTH_WINDOWS,
  HealthCounts,
  experimentHealthState,
  healthTone,
  healthWindowHours,
  normalizeExperimentHealth
} from './health';
import { experimentBadRuns } from './experiment';
import { Experiment } from './experiment';

/**
 * The health model decides what colour a researcher sees on the experiments grid before
 * they open anything. Two of its rules are the whole point of the change set and are
 * asserted here from several directions, because both have a natural, wrong, "simpler"
 * implementation:
 *
 *  - "needs attention" is `failure OR warning`, never `failure` alone;
 *  - missing data is UNKNOWN, never green. An API without `runs_bad_count`, a `/health`
 *    that 404s, a window with no runs and a run with an unrecognised status all resolve
 *    to the neutral state — none of them to `clean`.
 */
describe('experiment health model', () => {
  const counts = (over: Partial<HealthCounts> = {}): HealthCounts => ({
    total: 0,
    running: 0,
    success: 0,
    warning: 0,
    failure: 0,
    skipped: 0,
    unknown: 0,
    ...over
  });

  const health = (over: Partial<ExperimentHealth> = {}): ExperimentHealth => ({
    experiment_id: 42,
    window_hours: 24,
    bots: 3,
    runs: counts(),
    jobs: counts(),
    bad_runs: 0,
    bad_jobs: 0,
    treatment_lost_jobs: 0,
    degraded_jobs: 0,
    last_finished_at: null,
    ...over
  });

  describe('experimentHealthState — the four cases the card renders', () => {
    it('is red when the bad runs are driven by failure', () => {
      const state = experimentHealthState(
        health({ runs: counts({ total: 6, success: 4, failure: 2 }), bad_runs: 2 }),
        2
      );

      expect(state).toBe('failure');
    });

    it('is amber when the bad runs are driven by warning', () => {
      const state = experimentHealthState(
        health({ runs: counts({ total: 6, success: 5, warning: 1 }), bad_runs: 1 }),
        1
      );

      expect(state).toBe('warning');
    });

    it('is green only when runs exist and none of them is outstanding', () => {
      const state = experimentHealthState(health({ runs: counts({ total: 6, success: 6 }) }), 0);

      expect(state).toBe('clean');
    });

    it('is neutral grey against an API that does not append runs_bad_count', () => {
      // The undefined path is the one production takes today. It must never be green.
      const older = { id: 42 } as Experiment;

      expect(experimentBadRuns(older)).toBeNull();
      expect(experimentHealthState(null, experimentBadRuns(older))).toBe('unknown');
    });
  });

  describe('experimentHealthState — never green on missing or unrecognised data', () => {
    it('does not call a window with no runs "clean"', () => {
      expect(experimentHealthState(health({ runs: counts({ total: 0 }) }), 0)).toBe('unknown');
    });

    it('keeps a run with an unrecognised status out of the green', () => {
      const state = experimentHealthState(health({ runs: counts({ total: 4, success: 3, unknown: 1 }) }), 0);

      expect(state).withContext('unknown is unknown, not a success').toBe('unknown');
    });

    it('reports amber for a bad_runs the failure/warning buckets do not explain', () => {
      // A legacy spelling the server counted through the alias table and this GUI did not
      // model. Over-reporting "look at this" is the safe direction; under-reporting it is
      // the bug the warning status exists to fix.
      const state = experimentHealthState(health({ runs: counts({ total: 5, success: 5 }), bad_runs: 1 }), 1);

      expect(state).toBe('warning');
    });

    it('ranks failure above warning when both are present', () => {
      const state = experimentHealthState(
        health({ runs: counts({ total: 9, success: 5, warning: 3, failure: 1 }), bad_runs: 4 }),
        4
      );

      expect(state).toBe('failure');
    });
  });

  describe('experimentHealthState — with the count alone (health not loaded or 404)', () => {
    it('reports attention without inventing a driver', () => {
      expect(experimentHealthState(null, 3)).toBe('warning');
    });

    it('accepts a server-asserted zero as clean', () => {
      expect(experimentHealthState(null, 0)).toBe('clean');
    });

    it('treats a null count as unknown, not as zero', () => {
      expect(experimentHealthState(null, null)).toBe('unknown');
      expect(experimentHealthState(undefined, null)).toBe('unknown');
    });
  });

  describe('healthTone', () => {
    it('turns a clean strip red when a treatment was lost', () => {
      // Those runs finished green in every status field. A green strip would be the most
      // expensive lie on this screen.
      expect(healthTone('clean', 2)).toBe('danger');
    });

    it('leaves an ordinary clean strip green and an unknown one neutral', () => {
      expect(healthTone('clean', 0)).toBe('success');
      expect(healthTone('unknown', 0)).toBe('neutral');
      expect(healthTone('warning', 0)).toBe('warning');
      expect(healthTone('failure', 0)).toBe('danger');
    });
  });

  describe('the window selector', () => {
    it('maps 24h / 7d / all onto hours=24 / 168 / 720', () => {
      expect(healthWindowHours('24h')).toBe(24);
      expect(healthWindowHours('7d')).toBe(168);
      // 720 h is the endpoint's documented maximum, not the whole history.
      expect(healthWindowHours('all')).toBe(720);
    });

    it('offers exactly those three, defaulting to 24h', () => {
      expect(HEALTH_WINDOWS).toEqual(['24h', '7d', 'all']);
      expect(DEFAULT_HEALTH_WINDOW).toBe('24h');
      expect(healthWindowHours(null)).toBe(24);
    });
  });

  describe('normalizeExperimentHealth', () => {
    const payload = {
      experiment_id: 42,
      window_hours: 24,
      bots: 14,
      runs: { total: 10, running: 1, success: 6, warning: 2, failure: 1, skipped: 0, unknown: 0 },
      jobs: { total: 200, running: 4, success: 180, warning: 12, failure: 3, skipped: 1, unknown: 0 },
      bad_runs: 3,
      bad_jobs: 15,
      treatment_lost_jobs: 2,
      degraded_jobs: 12,
      last_finished_at: '2026-09-07T08:15:00Z'
    };

    it('reads the contract shape verbatim', () => {
      const parsed = normalizeExperimentHealth(payload)!;

      expect(parsed.runs.warning).toBe(2);
      expect(parsed.bad_runs).toBe(3);
      expect(parsed.treatment_lost_jobs).toBe(2);
      expect(parsed.last_finished_at).toBe('2026-09-07T08:15:00Z');
    });

    it('tolerates counts serialised as strings', () => {
      const parsed = normalizeExperimentHealth({
        ...payload,
        bad_runs: '3',
        runs: { ...payload.runs, warning: '2' }
      })!;

      expect(parsed.bad_runs).toBe(3);
      expect(parsed.runs.warning).toBe(2);
    });

    it('unwraps a resource-wrapped body', () => {
      expect(normalizeExperimentHealth({ data: payload })!.bad_runs).toBe(3);
    });

    it('falls back to failure + warning when bad_runs is absent', () => {
      const { bad_runs, ...withoutAggregate } = payload;

      expect(normalizeExperimentHealth(withoutAggregate)!.bad_runs).toBe(3);
    });

    it('rejects a body that is not a health payload rather than zeroing it out', () => {
      // A zeroed-out object would read as "nothing needs attention", which is exactly the
      // claim we are not entitled to make.
      expect(normalizeExperimentHealth({ message: 'Not Found' })).toBeNull();
      expect(normalizeExperimentHealth(null)).toBeNull();
      expect(normalizeExperimentHealth('nope')).toBeNull();
    });

    it('defaults a missing bucket to 0 without inventing a total', () => {
      const parsed = normalizeExperimentHealth({ runs: { total: 3, success: 3 }, jobs: {} })!;

      expect(parsed.runs.unknown).toBe(0);
      expect(parsed.runs.total).toBe(3);
      expect(parsed.jobs.total).toBe(0);
    });
  });

  describe('experimentBadRuns', () => {
    it('separates "we do not know" from "none"', () => {
      expect(experimentBadRuns({ id: 1 } as Experiment)).toBeNull();
      expect(experimentBadRuns({ id: 1, runs_bad_count: 0 } as Experiment)).toBe(0);
      expect(experimentBadRuns({ id: 1, runs_bad_count: 4 } as Experiment)).toBe(4);
    });

    it('tolerates a Laravel-stringified integer', () => {
      expect(experimentBadRuns({ id: 1, runs_bad_count: '4' as unknown as number } as Experiment)).toBe(4);
    });
  });
});
