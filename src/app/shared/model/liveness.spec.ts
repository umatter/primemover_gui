import { fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { anyRunning, isRunningStatus, LIVENESS_POLL_MS, livenessOn$, livenessTicks } from './liveness';

/**
 * Polling, and the four ways it goes wrong.
 *
 * Nothing in this app refreshed before Phase 5 — a "Running" pill stayed running until
 * the user navigated away and back. The fix is a timer, and a timer in a single-page app
 * is a liability: one that runs when nothing is happening spends the API's time forever,
 * one that runs behind a hidden tab does it invisibly, and one that outlives its component
 * keeps a dead screen's callbacks alive for the rest of the session. These tests pin all
 * four properties.
 */
describe('liveness polling', () => {
  const INTERVAL = 100;

  describe('isRunningStatus / anyRunning', () => {
    it('recognises the canonical code and its legacy spellings', () => {
      expect(isRunningStatus('running')).toBeTrue();
      expect(isRunningStatus('processing')).withContext('alias table').toBeTrue();
      expect(isRunningStatus('in_progress')).toBeTrue();
      expect(isRunningStatus('RUNNING')).toBeTrue();
    });

    it('is false for every terminal state, and for the ones we cannot read', () => {
      for (const code of ['success', 'failure', 'failed', 'warning', 'skipped', 'skpped', 'cancelled', '', null]) {
        expect(isRunningStatus(code)).withContext(`status_code ${code}`).toBeFalse();
      }
    });

    /**
     * A run with no `status_code` but a `started_at` renders as "Running" on bot detail
     * and is deliberately NOT polled: "nothing has been reported" cannot be told apart
     * from "nothing ever will be", and rows in the live database really do sit that way
     * forever. Polling them would mean a screen refreshing every 15 s for the rest of the
     * session with nothing ever changing.
     */
    it('does not treat "no status at all" as running', () => {
      expect(anyRunning([{ status_code: '' }, { status_code: null }])).toBeFalse();
    });

    it('is true as soon as one item is running', () => {
      expect(anyRunning([{ status_code: 'success' }, { status_code: 'running' }])).toBeTrue();
      expect(anyRunning([{ status_code: 'success' }])).toBeFalse();
      expect(anyRunning([])).toBeFalse();
      expect(anyRunning(null)).toBeFalse();
    });
  });

  describe('livenessOn$', () => {
    it('is the AND of "something is running" and "the tab is visible"', () => {
      const active$ = new BehaviorSubject(false);
      const visible$ = new BehaviorSubject(true);
      const seen: boolean[] = [];
      const sub = livenessOn$(active$, visible$).subscribe((on) => seen.push(on));

      active$.next(true);
      visible$.next(false);
      visible$.next(true);
      active$.next(false);
      sub.unsubscribe();

      expect(seen).toEqual([false, true, false, true, false]);
    });

    it('does not re-emit when nothing changed', () => {
      const active$ = new BehaviorSubject(true);
      const visible$ = new BehaviorSubject(true);
      const seen: boolean[] = [];
      const sub = livenessOn$(active$, visible$).subscribe((on) => seen.push(on));

      active$.next(true);
      active$.next(true);
      sub.unsubscribe();

      expect(seen).toEqual([true]);
    });
  });

  describe('livenessTicks', () => {
    it('emits nothing while nothing is running', fakeAsync(() => {
      const active$ = new BehaviorSubject(false);
      const visible$ = new BehaviorSubject(true);
      let ticks = 0;
      const sub = livenessTicks(active$, visible$, INTERVAL).subscribe(() => ticks++);

      tick(INTERVAL * 10);
      expect(ticks).toBe(0);

      sub.unsubscribe();
    }));

    it('does not fire immediately — the view has just loaded its data', fakeAsync(() => {
      const active$ = new BehaviorSubject(true);
      const visible$ = new BehaviorSubject(true);
      let ticks = 0;
      const sub = livenessTicks(active$, visible$, INTERVAL).subscribe(() => ticks++);

      tick(INTERVAL - 1);
      expect(ticks).toBe(0);

      tick(1);
      expect(ticks).toBe(1);

      sub.unsubscribe();
    }));

    it('keeps ticking on the interval while a run is going', fakeAsync(() => {
      const active$ = new BehaviorSubject(true);
      const visible$ = new BehaviorSubject(true);
      let ticks = 0;
      const sub = livenessTicks(active$, visible$, INTERVAL).subscribe(() => ticks++);

      tick(INTERVAL * 3);
      expect(ticks).toBe(3);

      sub.unsubscribe();
    }));

    it('stops the moment nothing is running any more', fakeAsync(() => {
      const active$ = new BehaviorSubject(true);
      const visible$ = new BehaviorSubject(true);
      let ticks = 0;
      const sub = livenessTicks(active$, visible$, INTERVAL).subscribe(() => ticks++);

      tick(INTERVAL * 2);
      expect(ticks).toBe(2);

      active$.next(false);
      tick(INTERVAL * 10);
      expect(ticks).withContext('a finished run must not keep polling').toBe(2);

      sub.unsubscribe();
    }));

    it('pauses while the tab is hidden and resumes when it comes back', fakeAsync(() => {
      const active$ = new BehaviorSubject(true);
      const visible$ = new BehaviorSubject(true);
      let ticks = 0;
      const sub = livenessTicks(active$, visible$, INTERVAL).subscribe(() => ticks++);

      tick(INTERVAL);
      expect(ticks).toBe(1);

      visible$.next(false);
      tick(INTERVAL * 10);
      expect(ticks).withContext('a background tab must not poll').toBe(1);

      visible$.next(true);
      tick(INTERVAL);
      expect(ticks).toBe(2);

      sub.unsubscribe();
    }));

    it('leaves no timer behind once unsubscribed', fakeAsync(() => {
      const active$ = new BehaviorSubject(true);
      const visible$ = new BehaviorSubject(true);
      let ticks = 0;
      const sub = livenessTicks(active$, visible$, INTERVAL).subscribe(() => ticks++);

      tick(INTERVAL);
      expect(ticks).toBe(1);

      sub.unsubscribe();
      // fakeAsync fails the test on a pending periodic task at the end of the zone, so
      // this assertion is doubled: the counter stops, and the zone comes out clean.
      tick(INTERVAL * 10);
      expect(ticks).toBe(1);
    }));

    it('defaults to the 15 s the plan specifies', () => {
      expect(LIVENESS_POLL_MS).toBe(15000);
    });
  });
});
