import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { Crawler } from '@app/crawler/model/crawler';
import { SetupChecklistComponent } from './setup-checklist.component';

/** F4c (docs/specs/gui-finalisation.md): what this bot still needs, and where to fix it. */
describe('SetupChecklistComponent (F4c)', () => {
  let fixture: ComponentFixture<SetupChecklistComponent>;
  let component: SetupChecklistComponent;

  const param = {
    id: 1,
    configuration_id: 5,
    pi: '0',
    psi: '0',
    kappa: '0',
    tau: '0',
    alpha: '1',
    beta: '0',
    search_terms: '[]',
    media_outlet_urls: '[]'
  };
  const complete = {
    id: 1,
    name: 'b',
    experiment_id: 1,
    agent_id: 1,
    proxy_id: 2,
    configuration_id: 5,
    configuration: { id: 5, name: 'p', params: [param] }
  } as unknown as Crawler;

  async function create(bot: Crawler, runCount: number | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [SetupChecklistComponent, TranslateModule.forRoot()]
    }).compileComponents();
    fixture = TestBed.createComponent(SetupChecklistComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('bot', bot);
    fixture.componentRef.setInput('runCount', runCount);
    fixture.detectChanges();
  }

  const item = (key: string) => fixture.nativeElement.querySelector(`[data-testid="setup-${key}"]`);

  it('collapses to a single "ready" line when everything is set', async () => {
    await create(complete, 2);
    expect(component.allDone).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-testid="setup-ready"]')).not.toBeNull();
  });

  it('lists what is missing and offers the one action that fixes each', async () => {
    const bot = { ...complete, proxy_id: null, configuration: { id: 5, name: 'p', params: [] } } as unknown as Crawler;
    await create(bot, 0);

    const fixes: string[] = [];
    component.fix.subscribe((f) => fixes.push(f));

    expect(item('connection').getAttribute('data-done')).toBe('false');
    expect(item('treatment').getAttribute('data-done')).toBe('false');
    expect(item('runs').getAttribute('data-done')).toBe('false');
    expect(item('identity').getAttribute('data-done')).toBe('true');

    item('connection').querySelector('button').click();
    item('treatment').querySelector('button').click();
    item('runs').querySelector('button').click();
    expect(fixes).toEqual(['editSetup', 'treatment', 'newRun']);
  });

  it('leaves the run item out when the run list is filtered — an empty filter proves nothing', async () => {
    await create(complete, null);
    expect(item('runs')).toBeNull();
    expect(component.allDone).toBeTrue();
  });

  it('does not claim a step it cannot see', async () => {
    const unembedded = { ...complete, configuration: undefined } as unknown as Crawler;
    await create(unembedded, 1);
    expect(item('treatment').getAttribute('data-done')).toBe('unknown');
    expect(component.allDone).toBeFalse();
  });

  it('does not offer to set up a treatment before there is a profile to hold it', async () => {
    const bare = {
      id: 14,
      name: 'b',
      experiment_id: 30,
      agent_id: null,
      proxy_id: null,
      configuration_id: null
    } as unknown as Crawler;
    await create(bare, 1);

    expect(item('treatment').getAttribute('data-done')).toBe('false');
    expect(item('treatment').querySelector('button')).toBeNull();
    expect(item('treatment').textContent).toContain('workspace.setup.afterProfile');
    expect(item('profile').querySelector('button')).not.toBeNull();
  });
});
