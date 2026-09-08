import { combineLatest, distinctUntilChanged, EMPTY, map, Observable, switchMap, timer } from 'rxjs';

import { QueueStatusEnum, StatusCode, statusOrUnknown } from '@app/queue/status/status.enum';

/**
 * How often a view refreshes while something in it is running.
 *
 * 15 s is the plan's figure (`docs/proposals/gui-error-warning-surfacing.md`, Phase 5).
 * A run's jobs change state on the order of tens of seconds, so this is fast enough that
 * a finished run stops claiming to be running within one glance, and slow enough that a
 * researcher leaving a bot detail open all afternoon costs the API four requests a
 * minute rather than sixty.
 */
export const LIVENESS_POLL_MS = 15000;

/** True when this row's status normalises to `running`. */
export function isRunningStatus(code: StatusCode | number | null | undefined): boolean {
  return statusOrUnknown(code) === QueueStatusEnum.RUNNING;
}

/**
 * True when anything in `items` is running.
 *
 * Keyed on the **normalised `status_code`** and nothing else. A run with no status at all
 * but a `started_at` renders as "Running" on bot detail, and is deliberately *not* polled:
 * "nothing has been reported" cannot be told apart from "nothing will ever be reported",
 * and rows in the live database really do sit that way forever. Polling them would mean a
 * screen that refreshes every 15 s for the rest of the session with nothing ever changing
 * — which is precisely the leak this module is written to avoid.
 */
export function anyRunning(items: ReadonlyArray<{ status_code?: StatusCode | null }> | null | undefined): boolean {
  return (items ?? []).some((item) => isRunningStatus(item?.status_code));
}

/**
 * `true` while polling should be happening: something is running **and** the tab is visible.
 *
 * The AND lives here, once, so no call site can implement half of it.
 */
export function livenessOn$(active$: Observable<boolean>, visible$: Observable<boolean>): Observable<boolean> {
  return combineLatest([active$.pipe(distinctUntilChanged()), visible$.pipe(distinctUntilChanged())]).pipe(
    map(([active, visible]) => active && visible),
    distinctUntilChanged()
  );
}

/**
 * A tick every `intervalMs` while polling should be happening; nothing otherwise.
 *
 * One `timer` per view, swapped by `switchMap`: when the gate closes the timer is
 * unsubscribed rather than left running behind a flag, so the only way to keep a timer
 * alive is to keep the subscription alive — and that dies with the component's
 * `Subscription`. A leaked interval in a single-page app outlives the screen that created
 * it and is worse than no polling at all.
 *
 * The first tick is one interval away, not immediate: the view has just loaded its data,
 * and an instant re-fetch would double every navigation's request count for nothing.
 */
export function livenessTicks(
  active$: Observable<boolean>,
  visible$: Observable<boolean>,
  intervalMs: number = LIVENESS_POLL_MS
): Observable<number> {
  return livenessOn$(active$, visible$).pipe(switchMap((on) => (on ? timer(intervalMs, intervalMs) : EMPTY)));
}
