import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';

import { AddBotComponent } from './add-bot.component';
import { AgentService, ConfigurationService, CrawlerService, ProxyService } from '@app/entity/service';
import { Crawler } from '@app/crawler/model/crawler';

interface Item {
  id: number;
  name: string;
  description?: string | null;
}

/**
 * R1.5 (docs/specs/gui-finalisation.md): `getAll()` returns the API's first page, the newest
 * 15 across all researchers, so an older bot's setup showed blank and nothing older could be
 * picked. The bot's items are loaded by id, and each select has an API-backed search.
 */
describe('AddBotComponent (R1.5 — the whole Library is reachable)', () => {
  let fixture: ComponentFixture<AddBotComponent>;
  let component: AddBotComponent;
  let services: Record<'agent' | 'proxy' | 'configuration', ReturnType<typeof library>>;

  const NEWEST: Item[] = [
    { id: 901, name: 'newest identity' },
    { id: 900, name: 'Berlin exit', description: 'residential' }
  ];

  /** A list service over a cache: getByKey and getWithQuery add their answer to it. */
  function library(answer: (query?: unknown) => Item[] = () => []) {
    const cache = new BehaviorSubject<Item[]>([...NEWEST]);
    const join = (items: Item[]) =>
      cache.next([...cache.value.filter((c) => !items.some((i) => i.id === c.id)), ...items]);
    return {
      cache,
      entities$: cache.asObservable(),
      getAll: jasmine.createSpy('getAll'),
      getByKey: jasmine.createSpy('getByKey').and.callFake((id: number) => {
        const item = { id, name: `item ${id}` };
        join([item]);
        return of(item);
      }),
      getWithQuery: jasmine.createSpy('getWithQuery').and.callFake((query: unknown) => {
        const items = answer(query);
        join(items);
        return of(items);
      })
    };
  }

  async function create(bot: Crawler | null, proxyAnswer?: (q?: unknown) => Item[]): Promise<void> {
    services = { agent: library(), proxy: library(proxyAnswer), configuration: library() };
    await TestBed.configureTestingModule({
      imports: [AddBotComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { add: () => of({}), update: () => of({}) } },
        { provide: AgentService, useValue: services.agent },
        { provide: ProxyService, useValue: services.proxy },
        { provide: ConfigurationService, useValue: services.configuration }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddBotComponent);
    component = fixture.componentInstance;
    component.experimentId = 189;
    component.bot = bot;
    fixture.detectChanges();
  }

  const oldBot = {
    id: 4100,
    name: 'exp 189 bot',
    experiment_id: 189,
    agent_id: 12,
    proxy_id: null,
    configuration_id: 7
  } as unknown as Crawler;

  const optionsOf = (id: string): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll(`#${id} option`) as NodeListOf<HTMLOptionElement>)
      .slice(1)
      .map((o) => o.textContent!.trim());

  it("loads the bot's current items by id and shows them selected", async () => {
    await create(oldBot);
    fixture.detectChanges();

    expect(services.agent.getByKey).toHaveBeenCalledOnceWith(12);
    expect(services.configuration.getByKey).toHaveBeenCalledOnceWith(7);
    expect(services.proxy.getByKey).not.toHaveBeenCalled(); // the bot has none

    const agentSelect: HTMLSelectElement = fixture.nativeElement.querySelector('#bot-agent');
    expect(agentSelect.selectedOptions[0].textContent!.trim()).toBe('item 12');
  });

  it('loads nothing by id for a new bot', async () => {
    await create(null);

    expect(services.agent.getByKey).not.toHaveBeenCalled();
    expect(services.configuration.getByKey).not.toHaveBeenCalled();
  });

  it('searches the API after a pause, and adds what it finds to the options', fakeAsync(async () => {
    await create(null, () => [{ id: 3, name: 'Berlin old exit' }]);

    component.searchLibrary('proxy', 'Ber');
    component.searchLibrary('proxy', 'Berlin ');
    tick(250);
    fixture.detectChanges();

    expect(services.proxy.getWithQuery).toHaveBeenCalledOnceWith({ ['filter[search]']: 'Berlin' });
    expect(optionsOf('bot-proxy')).toEqual(['Berlin exit', 'Berlin old exit']);
  }));

  it('narrows the options to the term but keeps the selected item', fakeAsync(async () => {
    await create(null);
    component.form.patchValue({ proxy_id: 901 });

    component.searchLibrary('proxy', 'residential');
    tick(250);
    fixture.detectChanges();

    expect(optionsOf('bot-proxy')).toEqual(['newest identity', 'Berlin exit']);
  }));

  it('does not query for an empty term, and an empty result is not an empty Library', fakeAsync(async () => {
    await create(null);

    component.searchLibrary('agent', '   ');
    tick(250);
    expect(services.agent.getWithQuery).not.toHaveBeenCalled();

    component.searchLibrary('agent', 'nothing matches');
    tick(250);
    expect(await firstValueFrom(component.agents$)).toEqual([]);
    expect(await firstValueFrom(component.librariesReady$)).toBeTrue();
  }));
});
