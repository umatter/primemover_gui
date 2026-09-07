import { Injectable } from '@angular/core';
import { distinctUntilChanged, fromEvent, map, Observable, shareReplay, startWith } from 'rxjs';

/**
 * Whether this tab is currently visible.
 *
 * Polling exists so a "Running" pill stops lying; polling a tab nobody is looking at only
 * spends the API's time and the box's. Every liveness stream in the app is gated on this
 * one observable, so "pause while hidden" is implemented once rather than remembered at
 * four call sites.
 *
 * A service rather than a bare `fromEvent(document, ...)` inside each component so that a
 * spec can drive visibility deterministically: `document.hidden` is read-only and the
 * event is not synthesisable without redefining the property on the global document,
 * which leaks between tests.
 */
@Injectable({ providedIn: 'root' })
export class VisibilityService {
  /** `true` while the tab is visible. Replays, so a late subscriber gets the current state. */
  readonly visible$: Observable<boolean> = fromEvent(document, 'visibilitychange').pipe(
    startWith(null),
    map(() => !document.hidden),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
