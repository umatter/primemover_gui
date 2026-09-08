import { Queue, queueJobRollup } from '@app/queue/model/queue';
import { QueueStatusEnum, statusOrUnknown } from '@app/queue/status/status.enum';

/**
 * What a run can newly become that a researcher should be interrupted for.
 *
 * Two things, and deliberately not more. `failure` is the run that died; `treatmentLost`
 * is the run that *finished* — often green in every status field — while producing
 * control-arm data from a bot configured to be treated, which is the one outcome no
 * amount of looking at a status column reveals.
 *
 * `warning` is not here. A degraded run is worth a colour and a filter, not an
 * interruption; toasting it would train the reader to dismiss the toast that matters.
 */
export type RunAlarmKind = 'failure' | 'treatmentLost';

/** One raised alarm, with enough identity for the toast to name the run. */
export interface RunAlarm {
  runId: number;
  runName: string;
  kind: RunAlarmKind;
}

/** The two alarm predicates evaluated for one run at one moment. */
export interface RunAlarmState {
  failure: boolean;
  treatmentLost: boolean;
}

/**
 * The alarm state of a run as the API describes it.
 *
 * `treatmentLost` is read off the run's job rollup, and **only a positive count counts**:
 * `decision_treatment_lost` is nullable, so a zero covers "no treatment was lost" and "no
 * verdict was ever recorded" alike. Absent means unknown, and unknown never raises an
 * alarm — nor does it clear one.
 */
export function runAlarmState(run: Queue | null | undefined): RunAlarmState {
  if (!run) return { failure: false, treatmentLost: false };
  return {
    failure: statusOrUnknown(run.status_code) === QueueStatusEnum.FAILURE,
    treatmentLost: (queueJobRollup(run, 'treatmentLost') ?? 0) > 0
  };
}

/**
 * Raises an alarm when a run *becomes* bad, and stays quiet while it merely *is* bad.
 *
 * The distinction is the whole point. This screen polls every 15 s, so a run that failed
 * an hour ago is observed over and over; a watcher that fired on the state rather than on
 * the change would put the same toast on screen four times a minute until the researcher
 * navigated away, and the next real alarm would be dismissed with the reflex the previous
 * two hundred taught.
 *
 * The **first** observation of a run is a baseline, never an alarm. A run that was
 * already failed when the screen opened is not news — the list is already showing it in
 * red — and toasting it would mean a toast on every navigation to every bot with a bad
 * run in its history.
 *
 * Recovery clears the memory: if a run somehow reports `failure` then `success` then
 * `failure` again, the second failure is a new transition and does toast.
 */
export class RunTransitionWatcher {
  private readonly seen = new Map<number, RunAlarmState>();

  /**
   * Record one observation of a run and return the alarms it newly raised.
   *
   * `treatmentLost` is returned before `failure` when a run raises both at once: a lost
   * treatment is the finding the reader cannot get anywhere else.
   */
  observeState(runId: number, runName: string, state: RunAlarmState): RunAlarm[] {
    const previous = this.seen.get(runId);
    this.seen.set(runId, state);
    if (!previous) return [];

    const raised: RunAlarm[] = [];
    if (state.treatmentLost && !previous.treatmentLost) {
      raised.push({ runId, runName, kind: 'treatmentLost' });
    }
    if (state.failure && !previous.failure) {
      raised.push({ runId, runName, kind: 'failure' });
    }
    return raised;
  }

  /** Observe a run as the API sent it. */
  observeRun(run: Queue | null | undefined): RunAlarm[] {
    if (!run || run.id === null || run.id === undefined) return [];
    return this.observeState(Number(run.id), (run.name ?? '').toString(), runAlarmState(run));
  }

  /** Observe a whole list; returns every alarm the list newly raised, in list order. */
  observe(runs: ReadonlyArray<Queue> | null | undefined): RunAlarm[] {
    return (runs ?? []).flatMap((run) => this.observeRun(run));
  }

  /** Forget everything — used when the screen switches to a different bot or run. */
  reset(): void {
    this.seen.clear();
  }
}
