import { Subscription } from 'rxjs';

import { VisibilityService } from '@shared/service/visibility.service';

/**
 * The one piece of code that binds `document.hidden` to the polling gate — and, until this
 * file existed, the only piece of the liveness stack nothing executed. Every spec that
 * asserts "pause while the tab is hidden" (bot detail, the run composer) injects a
 * hand-driven `BehaviorSubject` in its place, so the service itself could have been
 * inverted or emptied and the suite would have stayed green while every screen polled only
 * while nobody was looking at it.
 *
 * Two properties, both load-bearing and both invisible to those stubs:
 *
 * - the **sense** of the mapping (`!document.hidden`, not `document.hidden`);
 * - the **`startWith`** contract: `visible$` must answer on subscribe, before any
 *   `visibilitychange` event fires. Without it `combineLatest` inside `livenessOn$` never
 *   emits, `livenessTicks` never opens a timer, and polling never starts at all.
 *
 * `document.hidden` is a read-only accessor on `Document.prototype`, so it is redefined on
 * the document instance and restored in a `finally` — a leaked override would make every
 * later spec in the run read a fake visibility.
 */
describe('VisibilityService', () => {
  let subscription: Subscription | null = null;

  /**
   * Run `body` with `document.hidden` forced to `hidden`.
   *
   * The override is an *own* property shadowing the prototype accessor, so deleting it in
   * the `finally` hands the real one back — including when the body throws, which is the
   * case that would otherwise poison every later spec in the run.
   */
  const withHidden = <T>(hidden: boolean, body: () => T): T => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    try {
      return body();
    } finally {
      delete (document as unknown as Record<string, unknown>)['hidden'];
    }
  };

  /** Swap the forced value mid-test and fire the event the browser would fire. */
  const setHidden = (hidden: boolean): void => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  afterEach(() => {
    subscription?.unsubscribe();
    subscription = null;
    delete (document as unknown as Record<string, unknown>)['hidden'];
  });

  const collect = (service: VisibilityService): boolean[] => {
    const seen: boolean[] = [];
    subscription = service.visible$.subscribe((visible) => seen.push(visible));
    return seen;
  };

  it('answers synchronously on subscribe, before any event fires', () => {
    withHidden(false, () => {
      const seen = collect(new VisibilityService());

      // Not `[]`: `livenessOn$` combines this with the active gate, so a stream that says
      // nothing until the user switches tabs is a stream that never starts a poll.
      expect(seen).toEqual([true]);
    });
  });

  it('reports a hidden tab as not visible', () => {
    withHidden(true, () => {
      expect(collect(new VisibilityService())).toEqual([false]);
    });
  });

  it('follows visibilitychange in the right direction', () => {
    withHidden(false, () => {
      const seen = collect(new VisibilityService());

      setHidden(true);
      setHidden(false);

      expect(seen).toEqual([true, false, true]);
    });
  });

  it('does not re-emit for an event that changed nothing', () => {
    withHidden(false, () => {
      const seen = collect(new VisibilityService());

      document.dispatchEvent(new Event('visibilitychange'));
      document.dispatchEvent(new Event('visibilitychange'));

      expect(seen).withContext('distinctUntilChanged keeps the poll gate from thrashing').toEqual([true]);
    });
  });
});
