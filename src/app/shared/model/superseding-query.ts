import { Observable } from 'rxjs';
import { EntityActionOptions, QueryParams } from '@ngrx/data';

/** The reason recorded on a cancelled query, so it is identifiable in a devtools trace. */
export const SUPERSEDED_REASON = 'superseded by a newer query from the same screen';

/** The slice of an ngrx/data entity collection service this needs. */
export interface SupersedableQueryService<T> {
  getWithQuery(queryParams: QueryParams | string, options?: EntityActionOptions): Observable<T[]>;
  cancel(correlationId: unknown, reason?: string, options?: EntityActionOptions): void;
}

/**
 * A list query that cancels the one it replaces.
 *
 * `getWithQuery` **merges** its result into the shared entity collection rather than
 * replacing it (`queryManySuccess` upserts), and `EntityEffects.persist$` runs on
 * `mergeMap`, so nothing cancels anything by default. Two queries issued a few hundred
 * milliseconds apart therefore both land, in whatever order the network returns them, and
 * the collection ends up as their union: a screen whose status chip says "Success" over a
 * table holding failures. `clearCache()` defends the sequential case and does nothing at
 * all about the concurrent one — it fires immediately, long before either response.
 *
 * ngrx/data has the mechanism for this: a persist operation carrying a `correlationId` is
 * raced against `CANCEL_PERSIST` for the same id (`race(cancel$, data$)`), and the loser's
 * success action is never dispatched. So a superseded response cannot reach the reducer,
 * rather than reaching it and being untangled afterwards.
 *
 * Deliberately not a debounce. A debounce would collapse a fast traversal into one request
 * and still lose to a slow response from a chip chosen a minute ago; this is keyed on
 * "newer query exists", which is the actual predicate.
 */
export class SupersedingQuery<T> {
  private inFlight: string | null = null;
  private sequence = 0;

  /**
   * @param service the entity collection service to query through
   * @param label prefix for the correlation ids, so a trace names the screen that issued it
   */
  constructor(
    private readonly service: SupersedableQueryService<T>,
    private readonly label: string
  ) {}

  /** Cancel whatever this screen last asked for, then ask for `params` instead. */
  run(params: QueryParams | string): void {
    this.cancelInFlight();
    const correlationId = `${this.label}-${++this.sequence}`;
    this.inFlight = correlationId;
    this.service.getWithQuery(params, { correlationId });
  }

  /**
   * Cancel the outstanding query without issuing another — on teardown, so a response that
   * arrives after the screen has gone cannot repopulate a collection nobody is showing.
   *
   * Cancelling an id whose response already landed is a no-op beyond clearing the
   * collection's `loading` flag, which is why this needs no completion bookkeeping.
   */
  cancelInFlight(): void {
    const superseded = this.inFlight;
    if (superseded === null) return;
    this.inFlight = null;
    this.service.cancel(superseded, SUPERSEDED_REASON);
  }
}
