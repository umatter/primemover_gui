import { firstValueFrom } from 'rxjs';

import { TimezoneService } from './timezone.service';

/**
 * F6 (docs/specs/gui-finalisation.md): a run can be scheduled in UTC.
 * `Intl.supportedValuesOf('timeZone')` lists canonical location zones only — no "UTC" —
 * so the run form could not offer the zone most studies (and the e2e reference) use.
 */
describe('TimezoneService', () => {
  it('always offers UTC, first', async () => {
    const list = await firstValueFrom(new TimezoneService().getList());
    expect(list[0]).toBe('UTC');
    expect(list.filter((z) => z === 'UTC').length).toBe(1);
    expect(list.length).toBeGreaterThan(1);
  });

  it('gives UTC a +00:00 offset', async () => {
    const detail = await firstValueFrom(new TimezoneService().getDetail('UTC'));
    expect(JSON.stringify(detail)).toContain('+00:00');
  });
});
