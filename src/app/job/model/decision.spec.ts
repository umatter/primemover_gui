import { Job } from '@app/job/model/Job';
import {
  decisionBadgeKind,
  decisionFilterState,
  hasDecisionReport,
  isDecisionJobType,
  jobDecisionVerdict
} from '@app/job/model/decision';

/**
 * The verdict rules, mirrored from `orchestrator/status.py` and
 * `docs/integration-contract.md` §7.3.
 *
 * The cases that matter most are the two quiet ones: a control crawler that correctly
 * picked at random must show **nothing**, and a job with no verdict must show "unknown"
 * rather than nothing — the first mistake buries the alarm in noise, the second reports
 * an unmeasured job as fine.
 */
describe('job decision verdict', () => {
  const job = (over: Partial<Job>): Job => ({ id: 1, type: 'lambdasingleselectjob', ...over }) as Job;

  describe('decisionFilterState', () => {
    it('reads "skipped" as NOT REQUESTED, never as a failure', () => {
      expect(decisionFilterState('skipped')).toBe('not-requested');
    });

    it('reads "ok" as applied and "failed: ..." as failed', () => {
      expect(decisionFilterState('ok')).toBe('ok');
      expect(decisionFilterState('failed: IndexError: list index out of range')).toBe('failed');
    });

    it('never reads an unrecognised value as ok — status.py errs towards being seen', () => {
      // `_FILTER_OK_STATES` in orchestrator/status.py is {"ok", "skipped", ""} and
      // everything outside it lands in `_failed_filters`. Classifying a word we cannot
      // read as `ok` would paint a seventh filter state, invented by some future decision
      // function, green on every job that carries it.
      expect(decisionFilterState('mystery')).toBe('failed');
      expect(decisionFilterState('FAILED: IndexError')).toBe('failed');
    });

    it('reads an absent value as ok, not as a failure', () => {
      // A filter the decision function never reported at all is not a casualty.
      expect(decisionFilterState(null)).toBe('ok');
      expect(decisionFilterState('')).toBe('ok');
      expect(decisionFilterState('   ')).toBe('ok');
    });

    it('keeps the raw text as the reason for a state it cannot classify', () => {
      const verdict = jobDecisionVerdict(job({ decision_report: { filters: { political: 'weird-new-state' } } }));
      expect(verdict.failedFilters.length).toBe(1);
      expect(verdict.failedFilters[0].reason).toBe('weird-new-state');
    });
  });

  describe('isDecisionJobType', () => {
    it('matches both spellings the stack uses for the lambda select job', () => {
      expect(isDecisionJobType('lambdasingleselectjob')).toBeTrue();
      expect(isDecisionJobType('lambdaselectjob')).toBeTrue();
    });

    it('does not match job types that never call the decision function', () => {
      expect(isDecisionJobType('visitjob')).toBeFalse();
      expect(isDecisionJobType('waitjob')).toBeFalse();
      expect(isDecisionJobType(undefined)).toBeFalse();
    });
  });

  describe('badge kind', () => {
    it('is "lost" when decision_treatment_lost is true', () => {
      expect(decisionBadgeKind(job({ decision_treatment_lost: true, decision_degraded: true }))).toBe('lost');
    });

    it('is "lost" even when decision_degraded is null — treatment_lost implies degraded', () => {
      expect(decisionBadgeKind(job({ decision_treatment_lost: true, decision_degraded: null }))).toBe('lost');
    });

    it('is "degraded" when degraded but not lost', () => {
      expect(decisionBadgeKind(job({ decision_degraded: true, decision_treatment_lost: false }))).toBe('degraded');
    });

    it('shows NOTHING for a control crawler that correctly picked at random', () => {
      // The whole point of `treatment_lost`: `selection_mode === 'random'` with nothing
      // requested is the *correct* output for a control bot, and 236 of 243 parameter
      // rows on the production box are control-arm. Branching on the mode alone would
      // paint ~82% of all lambda jobs as broken.
      const control = job({
        decision_degraded: false,
        decision_treatment_lost: false,
        decision_selection_mode: 'random',
        decision_report: {
          filters: {
            already_watched: 'ok',
            mainstream_media: 'skipped',
            children_entertainment: 'skipped',
            similar: 'skipped',
            political: 'skipped',
            fringe: 'skipped'
          }
        }
      });
      expect(decisionBadgeKind(control)).toBe('none');
      expect(jobDecisionVerdict(control).failedFilters).toEqual([]);
      expect(jobDecisionVerdict(control).notRequestedFilters.length).toBe(5);
    });

    it('is "unknown" for a lambda job with every decision column NULL', () => {
      expect(
        decisionBadgeKind(
          job({
            decision_degraded: null,
            decision_treatment_lost: null,
            decision_selection_mode: null,
            decision_report: null
          })
        )
      ).toBe('unknown');
    });

    it('is "unknown" for a lambda job whose decision fields are absent entirely', () => {
      // The API deployed today sends none of them; absence must not read as clean.
      expect(decisionBadgeKind(job({}))).toBe('unknown');
    });

    it('shows nothing on a job type that never calls the decision function', () => {
      expect(decisionBadgeKind(job({ type: 'visitjob' }))).toBe('none');
      expect(decisionBadgeKind(job({ type: 'waitjob', decision_degraded: null }))).toBe('none');
    });

    it('is not fooled by selection_mode alone', () => {
      // A mode with no verdict is still unknown: it describes how, never how well.
      const modeOnly = job({ decision_selection_mode: 'random' });
      expect(jobDecisionVerdict(modeOnly).reported).toBeFalse();
      expect(decisionBadgeKind(modeOnly)).toBe('unknown');
      expect(decisionBadgeKind(job({ type: 'visitjob', decision_selection_mode: 'random' }))).toBe('none');
    });
  });

  describe('verdict contents', () => {
    const degradedJob = job({
      decision_degraded: true,
      decision_treatment_lost: false,
      decision_selection_mode: 'llm',
      decision_report: {
        filters: {
          already_watched: 'ok',
          mainstream_media: 'failed: IndexError: list index out of range',
          children_entertainment: 'skipped'
        },
        llm: { available: false, error_type: 'APIConnectionError', error: 'connection reset' },
        warnings: ['Aversion to mainstream media channels ignored'],
        requested: ['mainstream_media'],
        applied: []
      }
    });

    it('separates failed filters from ones that were never requested', () => {
      const verdict = jobDecisionVerdict(degradedJob);
      expect(verdict.failedFilters.map((f) => f.name)).toEqual(['mainstream_media']);
      expect(verdict.notRequestedFilters.map((f) => f.name)).toEqual(['children_entertainment']);
    });

    it('keeps the failure reason off the raw filter value', () => {
      expect(jobDecisionVerdict(degradedJob).failedFilters[0].reason).toContain('IndexError');
    });

    it('carries the llm block and the warnings through', () => {
      const verdict = jobDecisionVerdict(degradedJob);
      expect(verdict.llm?.error_type).toBe('APIConnectionError');
      expect(verdict.warnings).toEqual(['Aversion to mainstream media channels ignored']);
    });

    it('orders the filters as the contract fixes them', () => {
      const verdict = jobDecisionVerdict(degradedJob);
      expect(verdict.filters.map((f) => f.name)).toEqual([
        'already_watched',
        'mainstream_media',
        'children_entertainment'
      ]);
    });

    it('parses decision_report when Laravel sends it as a JSON string', () => {
      const asString = job({
        decision_degraded: true,
        decision_report: JSON.stringify({ filters: { political: 'failed: ValueError: bad' } })
      });
      expect(jobDecisionVerdict(asString).failedFilters.map((f) => f.name)).toEqual(['political']);
    });

    it('treats an unparseable decision_report as absent rather than throwing', () => {
      const broken = job({ decision_degraded: false, decision_report: '{not json' });
      expect(() => jobDecisionVerdict(broken)).not.toThrow();
      expect(jobDecisionVerdict(broken).filters).toEqual([]);
    });

    it('derives degradation from a failed filter when the boolean columns are NULL', () => {
      const filtersOnly = job({
        decision_degraded: null,
        decision_treatment_lost: null,
        decision_report: { filters: { political: 'failed: ValueError: bad' } }
      });
      const verdict = jobDecisionVerdict(filtersOnly);
      expect(verdict.reported).withContext('a filters map is a report').toBeTrue();
      expect(verdict.degraded).toBeTrue();
      expect(decisionBadgeKind(filtersOnly)).toBe('degraded');
    });

    it('applies the two-term fallback when treatment_lost predates the column', () => {
      // degraded AND nothing requested applied — both terms, never the mode alone.
      expect(decisionBadgeKind(job({ decision_degraded: true, decision_selection_mode: 'random' }))).toBe('lost');
      expect(decisionBadgeKind(job({ decision_degraded: true, decision_selection_mode: 'llm' }))).toBe('degraded');
      expect(decisionBadgeKind(job({ decision_degraded: false, decision_selection_mode: 'random' }))).toBe('none');
    });
  });

  describe('hasDecisionReport', () => {
    it('is false for a job with nothing recorded', () => {
      expect(hasDecisionReport(job({}))).toBeFalse();
    });

    it('is true once any verdict is recorded, including a clean one', () => {
      expect(hasDecisionReport(job({ decision_degraded: false }))).toBeTrue();
    });
  });
});
