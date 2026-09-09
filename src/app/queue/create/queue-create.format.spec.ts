import { DatePipe } from '@angular/common';

import { START_AT_FORMAT } from './queue-create.component';

/**
 * The queue-create form prefills `start_at` through this format when you pick an
 * existing run from the autocomplete, and `onSave()` posts the form value
 * straight back to the API.
 *
 * It used to be 'yyyy-MM-ddThh:mm'. Lowercase hh is Angular's 12-HOUR clock
 * (dateGetter(Hours, 2, -12) in @angular/common), so a run stored at 14:00
 * prefilled as 02:00 and saving rewrote it twelve hours earlier. Midnight was
 * the other way: 00:00 prefilled as 12:00. Only afternoon and midnight runs were
 * affected, and nothing errored -- the run simply moved.
 */
describe('queue-create start_at format', () => {
  const pipe = new DatePipe('en-US');

  const format = (iso: string) => pipe.transform(iso, START_AT_FORMAT);

  it('keeps an afternoon time in the 24-hour clock', () => {
    // The regression itself: this was '2026-08-01T02:00'.
    expect(format('2026-08-01T14:00:00')).toBe('2026-08-01T14:00');
  });

  it('keeps midnight at zero rather than turning it into noon', () => {
    expect(format('2026-08-01T00:00:00')).toBe('2026-08-01T00:00');
  });

  it('keeps late-evening times', () => {
    expect(format('2026-08-01T23:30:00')).toBe('2026-08-01T23:30');
  });

  it('leaves morning times alone, as it always did', () => {
    expect(format('2026-08-01T09:15:00')).toBe('2026-08-01T09:15');
  });

  it('produces exactly what a datetime-local input accepts', () => {
    expect(format('2026-08-01T14:00:00')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
