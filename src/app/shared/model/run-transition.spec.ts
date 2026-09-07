import { Queue } from '@app/queue/model/queue';
import { runAlarmState, RunTransitionWatcher } from './run-transition';

/**
 * The rule that keeps a toast worth reading: alarm on the **change**, never on the state.
 *
 * These screens re-read the same run every 15 seconds. A notification keyed on "this run
 * is failed" would therefore appear four times a minute for as long as the screen is open,
 * and the reader would learn to dismiss it without looking — at which point the one that
 * matters is dismissed too.
 */
describe('RunTransitionWatcher', () => {
  const run = (over: Partial<Queue>): Queue => ({ id: 1, name: 'Run', ...over }) as Queue;

  describe('runAlarmState', () => {
    it('reads failure through the alias table, so a legacy "failed" row counts', () => {
      expect(runAlarmState(run({ status_code: 'failure' })).failure).toBeTrue();
      expect(runAlarmState(run({ status_code: 'failed' })).failure).toBeTrue();
      expect(runAlarmState(run({ status_code: 'success' })).failure).toBeFalse();
    });

    it('does not alarm on warning — that is a colour and a filter, not an interruption', () => {
      expect(runAlarmState(run({ status_code: 'warning' })).failure).toBeFalse();
      expect(runAlarmState(run({ status_code: 'warning' })).treatmentLost).toBeFalse();
    });

    it('alarms on treatment loss only when the count is positive', () => {
      expect(runAlarmState(run({ jobs_treatment_lost_count: 2 })).treatmentLost).toBeTrue();
      // Zero and absent both mean "nothing was asserted": the column is nullable.
      expect(runAlarmState(run({ jobs_treatment_lost_count: 0 })).treatmentLost).toBeFalse();
      expect(runAlarmState(run({})).treatmentLost).toBeFalse();
    });
  });

  describe('the first observation', () => {
    it('is a baseline, not an alarm — a run that was already failed is not news', () => {
      const watcher = new RunTransitionWatcher();

      expect(watcher.observe([run({ id: 5, status_code: 'failure' })])).toEqual([]);
    });

    it('is a baseline for treatment loss too', () => {
      const watcher = new RunTransitionWatcher();

      expect(watcher.observe([run({ id: 5, jobs_treatment_lost_count: 3 })])).toEqual([]);
    });
  });

  describe('a transition', () => {
    it('raises exactly one alarm when a run becomes failed', () => {
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 5, name: 'Morning run', status_code: 'running' })]);

      const raised = watcher.observe([run({ id: 5, name: 'Morning run', status_code: 'failure' })]);

      expect(raised).toEqual([{ runId: 5, runName: 'Morning run', kind: 'failure' }]);
    });

    it('raises nothing on repeated identical polls', () => {
      const watcher = new RunTransitionWatcher();
      const before = run({ id: 5, status_code: 'running' });
      const after = run({ id: 5, status_code: 'failure' });
      watcher.observe([before]);
      watcher.observe([after]);

      for (let poll = 0; poll < 5; poll++) {
        expect(watcher.observe([after]))
          .withContext(`poll ${poll}`)
          .toEqual([]);
      }
    });

    it('raises when a run loses its treatment, even though nothing else changed', () => {
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 7, status_code: 'success' })]);

      const raised = watcher.observe([run({ id: 7, status_code: 'success', jobs_treatment_lost_count: 1 })]);

      expect(raised.map((alarm) => alarm.kind)).toEqual(['treatmentLost']);
    });

    it('puts treatment loss first when a run raises both at once', () => {
      // A status column can tell you about the failure. Nothing else can tell you the
      // session produced control-arm data.
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 9, status_code: 'running' })]);

      const raised = watcher.observe([run({ id: 9, status_code: 'failure', jobs_treatment_lost_count: 4 })]);

      expect(raised.map((alarm) => alarm.kind)).toEqual(['treatmentLost', 'failure']);
    });

    it('alarms again after a recovery, because that is a new transition', () => {
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 5, status_code: 'running' })]);
      watcher.observe([run({ id: 5, status_code: 'failure' })]);
      watcher.observe([run({ id: 5, status_code: 'running' })]);

      expect(watcher.observe([run({ id: 5, status_code: 'failure' })]).length).toBe(1);
    });

    it('tracks runs independently', () => {
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 1, status_code: 'running' }), run({ id: 2, status_code: 'running' })]);

      const raised = watcher.observe([run({ id: 1, status_code: 'running' }), run({ id: 2, status_code: 'failure' })]);

      expect(raised.map((alarm) => alarm.runId)).toEqual([2]);
    });

    it('does not alarm on an unknown status — unknown is not an alarm and not a clearance', () => {
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 3, status_code: 'running' })]);

      expect(watcher.observe([run({ id: 3, status_code: 'cancelled' })])).toEqual([]);
    });
  });

  describe('reset', () => {
    it('forgets the baseline, so a different bot starts fresh', () => {
      const watcher = new RunTransitionWatcher();
      watcher.observe([run({ id: 5, status_code: 'running' })]);
      watcher.reset();

      expect(watcher.observe([run({ id: 5, status_code: 'failure' })]))
        .withContext('the first sighting after a reset is a baseline again')
        .toEqual([]);
    });
  });
});
