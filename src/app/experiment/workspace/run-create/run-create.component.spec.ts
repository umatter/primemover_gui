import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { RunCreateComponent } from './run-create.component';
import { QueueService } from '@app/entity/service';
import { TimezoneService } from '@shared/service/timezone.service';

/**
 * Slice B acceptance (docs/specs/runs-and-bots.md §5):
 *  - a Queue is POSTed with crawler_id = B.id and a resolved timezone_utc_offset; `created` emits.
 *  - no start time chosen → submit is blocked (no POST).
 *  - a failed POST surfaces an error and keeps the panel open.
 */
describe('RunCreateComponent (Slice B — create & schedule a run)', () => {
  let component: RunCreateComponent;
  let fixture: ComponentFixture<RunCreateComponent>;
  let queueAdd: jasmine.Spy;

  beforeEach(async () => {
    queueAdd = jasmine.createSpy('add').and.callFake((q: any) => of({ id: 55, ...q }));

    await TestBed.configureTestingModule({
      imports: [RunCreateComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: QueueService, useValue: { add: queueAdd } },
        {
          provide: TimezoneService,
          useValue: {
            getList: () => of(['Europe/Berlin']),
            getDetail: () => of({ utc_offset: '+02:00', timezone: 'Europe/Berlin' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunCreateComponent);
    component = fixture.componentInstance;
    component.crawlerId = 42;
    fixture.detectChanges(); // triggers ngOnInit → resolves default-timezone offset
  });

  it('creates a run scoped to the bot with a resolved offset and emits `created`', () => {
    const emitted: any[] = [];
    component.created.subscribe((r) => emitted.push(r));

    component.form.patchValue({ name: 'Wave 1', start_at: '2026-08-01T09:00' });
    component.save();

    expect(queueAdd).toHaveBeenCalledTimes(1);
    expect(queueAdd.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({
        crawler_id: 42,
        name: 'Wave 1',
        start_at: '2026-08-01T09:00',
        timezone: 'Europe/Berlin',
        timezone_utc_offset: '+02:00'
      })
    );
    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe(55);
  });

  it('does not POST when the start time is missing', () => {
    component.form.patchValue({ name: 'No schedule', start_at: null });
    component.save();
    expect(queueAdd).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('surfaces an error and keeps the panel open when the POST fails', () => {
    queueAdd.and.returnValue(throwError(() => new Error('boom')));
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.form.patchValue({ name: 'Wave 1', start_at: '2026-08-01T09:00' });
    component.save();

    expect(component.errorKey).toBeTruthy();
    expect(component.submitting).toBeFalse();
    expect(closed).not.toHaveBeenCalled();
  });
});
