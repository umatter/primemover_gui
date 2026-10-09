import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AddBotComponent } from './add-bot.component';
import { AgentService, ConfigurationService, CrawlerService, ProxyService } from '@app/entity/service';
import { Crawler } from '@app/crawler/model/crawler';

/**
 * F4c (docs/specs/gui-finalisation.md): the add-bot panel doubles as "edit bot setup",
 * so a checklist item that says "missing" has somewhere to be fixed.
 */
describe('AddBotComponent (F4c — edit an existing bot)', () => {
  let fixture: ComponentFixture<AddBotComponent>;
  let component: AddBotComponent;
  let add: jasmine.Spy;
  let update: jasmine.Spy;

  const list = () => ({ entities$: of([{ id: 1 }]), getAll: () => {} });
  const existing = {
    id: 18,
    name: 'Red',
    description: 'right arm',
    experiment_id: 32,
    agent_id: 10,
    proxy_id: null,
    configuration_id: 18
  } as unknown as Crawler;

  async function create(update$ = (c: any) => of(c)): Promise<void> {
    add = jasmine.createSpy('add');
    update = jasmine.createSpy('update').and.callFake(update$);
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
    component.bot = existing;
    fixture.detectChanges();
  }

  it('prefills the form from the bot and says it is editing', async () => {
    await create();

    expect(component.form.value).toEqual(
      jasmine.objectContaining({
        name: 'Red',
        description: 'right arm',
        agent_id: 10,
        proxy_id: null,
        configuration_id: 18
      })
    );
    expect(fixture.nativeElement.textContent).toContain('workspace.addBotPanel.editTitle');
  });

  it('saves with an update, not a create, and emits the saved bot', async () => {
    await create();
    const saved: Crawler[] = [];
    component.saved.subscribe((b) => saved.push(b));

    component.form.patchValue({ proxy_id: 4 });
    component.save();

    expect(add).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ id: 18, experiment_id: 32, proxy_id: 4, agent_id: 10, configuration_id: 18 })
    );
    expect(saved.length).toBe(1);
  });

  it('keeps the panel open with an error when the update fails', async () => {
    await create(() => throwError(() => new Error('500')));

    component.form.patchValue({ proxy_id: 4 });
    component.save();

    expect(component.errorKey).toBe('workspace.addBotPanel.editError');
  });
});
