import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, firstValueFrom, Observable, of, throwError } from 'rxjs';

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

  let crawlerUpdate: jasmine.Spy;
  let crawlerAdd: jasmine.Spy;

  async function create(
    bot: Crawler | null,
    proxyAnswer?: (q?: unknown) => Item[],
    save: () => Observable<unknown> = () => of({})
  ): Promise<void> {
    services = { agent: library(), proxy: library(proxyAnswer), configuration: library() };
    crawlerUpdate = jasmine.createSpy('update').and.callFake(save);
    crawlerAdd = jasmine.createSpy('add').and.callFake(save);
    await TestBed.configureTestingModule({
      imports: [AddBotComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { add: crawlerAdd, update: crawlerUpdate } },
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
    expect(agentSelect.selectedOptions[0].textContent!.trim()).toBe('item 12 · #12');
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
    expect(optionsOf('bot-proxy')).toEqual(['Berlin exit · #900', 'Berlin old exit · #3']);
  }));

  it('keeps what the API found by a field the GUI does not match, e.g. a hostname', fakeAsync(async () => {
    await create(null, () => [{ id: 4, name: 'residential B' }]);

    component.searchLibrary('proxy', 'gate.multilogin.com');
    tick(250);
    fixture.detectChanges();

    expect(optionsOf('bot-proxy')).toEqual(['residential B · #4']);
  }));

  it('narrows the options to the term but keeps the selected item', fakeAsync(async () => {
    await create(null);
    component.form.patchValue({ proxy_id: 901 });

    component.searchLibrary('proxy', 'residential');
    tick(250);
    fixture.detectChanges();

    expect(optionsOf('bot-proxy')).toEqual(['newest identity · #901', 'Berlin exit · #900']);
  }));

  it('does not submit the form when Enter is pressed in a search box', async () => {
    await create(oldBot);
    const search: HTMLInputElement = fixture.nativeElement.querySelector('[data-testid="search-agent"]');

    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });
    search.dispatchEvent(enter);

    expect(enter.defaultPrevented).toBeTrue();
    expect(crawlerUpdate).not.toHaveBeenCalled();
  });

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

  // R1.6: since umatter/primemover_api#91 another study's item is a 422 on its field. ngrx-data
  // rejects with a DataServiceError whose `error` is the HttpErrorResponse.
  describe('a save the API refuses', () => {
    const refusal = (errors: Record<string, string[]>) => () =>
      throwError(() => ({ error: new HttpErrorResponse({ status: 422, error: { message: 'invalid', errors } }) }));
    const marked = () =>
      Array.from(fixture.nativeElement.querySelectorAll('[data-testid^="refused-"]') as NodeListOf<HTMLElement>).map(
        (el) => el.dataset['testid']
      );

    it('marks each refused setup field, on edit', async () => {
      await create(
        oldBot,
        undefined,
        refusal({
          configuration_id: ['The selected configuration id could not be found.'],
          agent_id: ['The selected agent id could not be found.']
        })
      );
      component.form.patchValue({ proxy_id: 900 }); // oldBot has none; the form requires one

      component.save();
      fixture.detectChanges();

      expect(marked()).toEqual(['refused-agent_id', 'refused-configuration_id']);
      expect(component.errorKey).toBe('workspace.addBotPanel.refusedError');
    });

    it('marks them on add too, and clears them on the next save', async () => {
      await create(null, undefined, refusal({ proxy_id: ['The selected proxy id could not be found.'] }));
      component.form.patchValue({ name: 'b', agent_id: 901, proxy_id: 900, configuration_id: 901 });

      component.save();
      fixture.detectChanges();
      expect(marked()).toEqual(['refused-proxy_id']);

      crawlerAdd.and.callFake(() => of({ id: 1 }));
      component.save();
      fixture.detectChanges();
      expect(marked()).toEqual([]);
    });

    it('keeps the generic message for any other failure', async () => {
      await create(oldBot, undefined, () =>
        throwError(() => ({ error: new HttpErrorResponse({ status: 500, error: { message: 'boom' } }) }))
      );
      component.form.patchValue({ proxy_id: 900 });

      component.save();
      fixture.detectChanges();

      expect(marked()).toEqual([]);
      expect(component.errorKey).toBe('workspace.addBotPanel.editError');
    });
  });
});
