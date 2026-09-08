import { of } from 'rxjs';

import { SupersedableQueryService, SupersedingQuery, SUPERSEDED_REASON } from '@shared/model/superseding-query';

/**
 * The list query that cannot be beaten by the one it replaced.
 *
 * `getWithQuery` merges its results into the shared ngrx/data collection and
 * `EntityEffects.persist$` runs on `mergeMap`, so two queries a second apart both land and
 * the collection becomes their union — a status chip reading "Success" over a table of
 * failures. `clearCache()` fires immediately and defends only the sequential case.
 *
 * ngrx/data's own answer is a correlation id: `persist$` races the response against a
 * `CANCEL_PERSIST` carrying the same id and the loser's success action is never dispatched.
 * These tests pin the two properties that makes the race safe — every query is identifiable,
 * and issuing one cancels its predecessor.
 */
describe('SupersedingQuery', () => {
  let service: jasmine.SpyObj<SupersedableQueryService<{ id: number }>>;
  let query: SupersedingQuery<{ id: number }>;

  const correlationIdOf = (call: number): unknown =>
    (service.getWithQuery.calls.argsFor(call)[1] as { correlationId?: unknown } | undefined)?.correlationId;

  beforeEach(() => {
    service = jasmine.createSpyObj<SupersedableQueryService<{ id: number }>>('QueueService', [
      'getWithQuery',
      'cancel'
    ]);
    service.getWithQuery.and.returnValue(of([]));
    query = new SupersedingQuery(service, 'runs');
  });

  it('tags every query with its own correlation id', () => {
    query.run({ a: 1 });
    query.run({ a: 2 });

    expect(service.getWithQuery.calls.count()).toBe(2);
    expect(correlationIdOf(0)).toBeTruthy();
    expect(correlationIdOf(1)).not.toBe(correlationIdOf(0));
  });

  it('cancels the previous query before issuing the next, so a superseded response cannot merge', () => {
    // Order matters: cancelling only after the replacement went out leaves a window in
    // which both are live, which is the bug.
    const order: string[] = [];
    service.getWithQuery.and.callFake(() => {
      order.push('query');
      return of([]);
    });
    service.cancel.and.callFake(() => void order.push('cancel'));

    query.run({ a: 1 });
    const first = correlationIdOf(0);
    query.run({ a: 2 });

    expect(service.cancel).toHaveBeenCalledOnceWith(first, SUPERSEDED_REASON);
    expect(order).toEqual(['query', 'cancel', 'query']);
  });

  it('cancels nothing when nothing has been asked for yet', () => {
    query.run({ a: 1 });

    expect(service.cancel).not.toHaveBeenCalled();
  });

  it('cancels the outstanding query on teardown, once', () => {
    query.run({ a: 1 });

    query.cancelInFlight();
    query.cancelInFlight();

    expect(service.cancel).toHaveBeenCalledTimes(1);
    expect(service.cancel).toHaveBeenCalledWith(correlationIdOf(0), SUPERSEDED_REASON);
  });

  it('does not re-cancel an id it has already cancelled when the next query goes out', () => {
    query.run({ a: 1 });
    query.cancelInFlight();
    service.cancel.calls.reset();

    query.run({ a: 2 });

    expect(service.cancel).not.toHaveBeenCalled();
  });
});
