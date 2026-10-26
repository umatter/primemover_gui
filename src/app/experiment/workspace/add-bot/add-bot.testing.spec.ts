import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AddBotComponent } from './add-bot.component';
import { AgentService, ConfigurationService, CrawlerService, ProxyService } from '@app/entity/service';
import { Crawler } from '@app/crawler/model/crawler';

/** F3 (docs/specs/gui-finalisation.md): marking a bot as a test bot. */
describe('AddBotComponent (F3 — test bot)', () => {
  let fixture: ComponentFixture<AddBotComponent>;
  let component: AddBotComponent;
  let add: jasmine.Spy;
  let update: jasmine.Spy;

  const list = () => ({ entities$: of([{ id: 1 }]), getAll: () => {}, getByKey: () => of({ id: 1 }) });

  async function create(bot: Crawler | null = null): Promise<void> {
    add = jasmine.createSpy('add').and.callFake((c: any) => of({ id: 99, ...c }));
    update = jasmine.createSpy('update').and.callFake((c: any) => of(c));
    await TestBed.configureTestingModule({
      imports: [AddBotComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { add, update } },
        { provide: AgentService, useValue: list() },
        { provide: ProxyService, useValue: list() },
        { provide: ConfigurationService, useValue: list() }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AddBotComponent);
    component = fixture.componentInstance;
    component.experimentId = 32;
    component.bot = bot;
    fixture.detectChanges();
  }

  it('is off by default and is sent on create', async () => {
    await create();
    expect(component.form.value.testing).toBeFalse();

    component.form.patchValue({ name: 'Probe', agent_id: 1, proxy_id: 1, configuration_id: 1, testing: true });
    component.save();

    expect(add.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ testing: true }));
  });

  it('prefills from an existing bot and is sent on update', async () => {
    await create({
      id: 18,
      name: 'Red',
      experiment_id: 32,
      agent_id: 1,
      proxy_id: 1,
      configuration_id: 1,
      testing: 1
    } as unknown as Crawler);

    expect(component.form.value.testing).toBeTrue();
    component.form.patchValue({ testing: false });
    component.save();

    expect(update.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ id: 18, testing: false }));
  });

  it('explains what a test bot is', async () => {
    await create();
    expect(fixture.nativeElement.textContent).toContain('workspace.addBotPanel.testingHint');
  });
});
