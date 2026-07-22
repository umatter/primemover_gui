import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AddBotComponent } from './add-bot.component';
import {
  AgentService,
  ConfigurationService,
  CrawlerService,
  ProxyService
} from '@app/entity/service';

/**
 * Slice A acceptance (docs/specs/runs-and-bots.md §5):
 *  - a Crawler is POSTed with experiment_id = E.id and `created` is emitted.
 *  - an empty required Library block blocks submit (no POST).
 *  - a failed POST surfaces an error and keeps the panel open.
 */
describe('AddBotComponent (Slice A — add bot to experiment)', () => {
  let component: AddBotComponent;
  let fixture: ComponentFixture<AddBotComponent>;
  let crawlerAdd: jasmine.Spy;

  const listService = () => ({ entities$: of([]), getAll: jasmine.createSpy('getAll') });

  beforeEach(async () => {
    crawlerAdd = jasmine.createSpy('add').and.callFake((c: any) => of({ id: 99, ...c }));

    await TestBed.configureTestingModule({
      imports: [AddBotComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { add: crawlerAdd } },
        { provide: AgentService, useValue: listService() },
        { provide: ProxyService, useValue: listService() },
        { provide: ConfigurationService, useValue: listService() }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddBotComponent);
    component = fixture.componentInstance;
    component.experimentId = 7;
    fixture.detectChanges();
  });

  it('creates a bot scoped to the experiment and emits `created`', () => {
    const emitted: any[] = [];
    component.created.subscribe((b) => emitted.push(b));

    component.form.setValue({
      name: 'Bot A',
      description: '',
      agent_id: 1,
      proxy_id: 2,
      configuration_id: 3
    });
    component.save();

    expect(crawlerAdd).toHaveBeenCalledTimes(1);
    expect(crawlerAdd.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ experiment_id: 7, agent_id: 1, proxy_id: 2, configuration_id: 3, name: 'Bot A' })
    );
    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe(99);
  });

  it('does not POST when required Library blocks are missing', () => {
    component.form.patchValue({ name: 'Incomplete' }); // no agent/proxy/config
    component.save();
    expect(crawlerAdd).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('surfaces an error and keeps the panel open when the POST fails', () => {
    crawlerAdd.and.returnValue(throwError(() => new Error('boom')));
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.form.setValue({
      name: 'Bot A',
      description: '',
      agent_id: 1,
      proxy_id: 2,
      configuration_id: 3
    });
    component.save();

    expect(component.errorKey).toBeTruthy();
    expect(component.submitting).toBeFalse();
    expect(closed).not.toHaveBeenCalled();
  });
});
