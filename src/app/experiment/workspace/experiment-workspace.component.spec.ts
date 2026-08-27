import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ExperimentWorkspaceComponent } from './experiment-workspace.component';
import { CrawlerService, ExperimentService } from '@app/entity/service';
import { Crawler } from '@app/crawler/model/crawler';

/**
 * The workspace's Degraded tile, per-bot badge and amber progress bar all read ONE API
 * attribute: `latest_queues_degraded`, appended by the Laravel Crawler model alongside
 * `latest_queues_succeeded` / `_failed` / `_count`. Verified against the live API on
 * 2026-08-27; the whole feature is dead pixels if this name drifts, which is what these
 * tests pin down.
 */
describe('ExperimentWorkspaceComponent (degraded runs)', () => {
  let component: ExperimentWorkspaceComponent;
  let fixture: ComponentFixture<ExperimentWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: {} }),
        {
          provide: ExperimentService,
          useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) }
        },
        {
          provide: CrawlerService,
          useValue: { entities$: of([]), loading$: of(false), getWithQuery: () => {} }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExperimentWorkspaceComponent);
    component = fixture.componentInstance;
  });

  /**
   * Recorded verbatim from the live API on 2026-08-27:
   *   GET /api/v1/crawlers?filter[experiment]=42  ->  200
   * Four of experiment 42's fourteen bots, with the four `latest_queues_*` attributes
   * exactly as the Laravel Crawler model appends them. This is the shape the tile has to
   * read; if `latest_queues_degraded` is ever renamed API-side, the DOM tests below go
   * red instead of the tile quietly going blank.
   */
  const LIVE_CRAWLERS_EXP42 = [
    { id: 251, latest_queues_succeeded: 1, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 },
    { id: 250, latest_queues_succeeded: 1, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 },
    { id: 249, latest_queues_succeeded: 1, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 },
    { id: 248, latest_queues_succeeded: 0, latest_queues_failed: 0, latest_queues_degraded: 0, latest_queues_count: 1 }
  ];

  const bot = (over: Partial<Crawler>): Crawler =>
    ({
      id: 1,
      name: 'bot',
      experiment_id: 42,
      latest_queues_count: 0,
      latest_queues_succeeded: 0,
      latest_queues_failed: 0,
      ...over
    }) as Crawler;

  describe('against an API that reports degradation', () => {
    it('reads the count off latest_queues_degraded', () => {
      expect(component.botWarning(bot({ latest_queues_count: 4, latest_queues_degraded: 3 }))).toBe(3);
    });

    it('sums the tile across bots and marks it available', () => {
      const summary = component.buildSummary([
        bot({ id: 1, latest_queues_count: 4, latest_queues_succeeded: 4, latest_queues_degraded: 3 }),
        bot({ id: 2, latest_queues_count: 2, latest_queues_succeeded: 1, latest_queues_failed: 1, latest_queues_degraded: 0 })
      ]);

      expect(summary.warningAvailable).toBeTrue();
      expect(summary.warning).toBe(3);
      expect(summary.total).toBe(6);
      expect(summary.succeeded).toBe(5);
      expect(summary.failed).toBe(1);
    });

    // Laravel has been known to serialise appended integer attributes as strings.
    it('tolerates the count arriving as a string', () => {
      expect(component.botWarning(bot({ latest_queues_degraded: '2' as unknown as number }))).toBe(2);
    });

    it('shows the tile at a confident zero', () => {
      const summary = component.buildSummary([bot({ latest_queues_count: 3, latest_queues_degraded: 0 })]);

      expect(summary.warningAvailable).toBeTrue();
      expect(summary.warning).toBe(0);
    });

    it('puts a degraded bot between succeeded and failed', () => {
      expect(
        component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 3, latest_queues_degraded: 1 }))
      ).toBe('warning');
      // A failed run still outranks a degraded one.
      expect(
        component.botState(
          bot({ latest_queues_count: 3, latest_queues_succeeded: 2, latest_queues_failed: 1, latest_queues_degraded: 1 })
        )
      ).toBe('failed');
      expect(component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 3, latest_queues_degraded: 0 }))).toBe(
        'succeeded'
      );
    });
  });

  describe('against an API that predates the attribute', () => {
    it('hides the tile rather than claiming a zero the API never sent', () => {
      const summary = component.buildSummary([bot({ latest_queues_count: 3, latest_queues_succeeded: 3 })]);

      expect(summary.warningAvailable).toBeFalse();
      expect(summary.warning).toBe(0);
    });

    it('does not turn a healthy bot amber', () => {
      expect(component.botState(bot({ latest_queues_count: 3, latest_queues_succeeded: 3 }))).toBe('succeeded');
    });
  });

  /**
   * The tile is the thing that was dead: it read an attribute the API did not send, so it
   * rendered `undefined` (or, once guarded, hid itself forever). These drive the real
   * template over the real payload shape.
   */
  describe('the Degraded tile, rendered', () => {
    /** Boots the component with a crawler list, as the API would deliver it. */
    const renderWith = (crawlers: unknown[]): ComponentFixture<ExperimentWorkspaceComponent> => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ExperimentWorkspaceComponent, TranslateModule.forRoot(), NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideMockStore({ initialState: {} }),
          { provide: ExperimentService, useValue: { getByKey: () => of({ id: 42, name: 'Political News' }) } },
          {
            provide: CrawlerService,
            useValue: { entities$: of(crawlers), loading$: of(false), getWithQuery: () => {} }
          },
          { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '42' }) } }
        ]
      });
      const f = TestBed.createComponent(ExperimentWorkspaceComponent);
      f.detectChanges();
      return f;
    };

    /** The stat tile whose label is `key`. Translations are unloaded here, so the
     *  TranslatePipe echoes the key back and it can be matched on directly. */
    const tile = (f: ComponentFixture<unknown>, key: string): HTMLElement | undefined =>
      Array.from(f.nativeElement.querySelectorAll('section div.bg-surface') as NodeListOf<HTMLElement>).find((el) =>
        el.textContent?.includes(key)
      );

    const tileValue = (f: ComponentFixture<unknown>, key: string): string | undefined =>
      tile(f, key)
        ?.querySelector('p:nth-of-type(2)')
        ?.textContent?.trim();

    it('renders a real number -- not "undefined" -- from the live payload', () => {
      const f = renderWith(LIVE_CRAWLERS_EXP42.map((c) => ({ ...c, experiment_id: 42, name: 'bot' })));

      expect(tile(f, 'workspace.stat.degraded')).withContext('Degraded tile is present').toBeDefined();
      expect(tileValue(f, 'workspace.stat.degraded')).toBe('0');
      expect(f.nativeElement.textContent).not.toContain('undefined');
      expect(f.nativeElement.textContent).not.toContain('NaN');
      // sanity: the neighbouring tiles agree with the same payload
      expect(tileValue(f, 'workspace.stat.runs')).toBe('4');
      expect(tileValue(f, 'workspace.stat.succeeded')).toBe('3');
      expect(tileValue(f, 'workspace.stat.failed')).toBe('0');
    });

    it('counts degraded runs when the API reports some', () => {
      const f = renderWith([
        { ...LIVE_CRAWLERS_EXP42[0], experiment_id: 42, name: 'treated bot', latest_queues_degraded: 2 },
        { ...LIVE_CRAWLERS_EXP42[1], experiment_id: 42, name: 'control bot' }
      ]);

      expect(tileValue(f, 'workspace.stat.degraded')).toBe('2');
      // The bot badge escalates too, and the progress bar goes amber rather than green.
      expect(f.nativeElement.textContent).toContain('workspace.state.warning');
      expect(f.nativeElement.querySelector('.bg-warning')).not.toBeNull();
    });

    it('hides the tile entirely against an API that does not send the attribute', () => {
      const f = renderWith(
        LIVE_CRAWLERS_EXP42.map(({ latest_queues_degraded, ...rest }) => ({
          ...rest,
          experiment_id: 42,
          name: 'bot'
        }))
      );

      expect(tile(f, 'workspace.stat.degraded')).toBeUndefined();
      expect(f.nativeElement.textContent).not.toContain('undefined');
      // the rest of the summary is unaffected
      expect(tileValue(f, 'workspace.stat.runs')).toBe('4');
    });
  });

  describe('a bot with no runs in the window', () => {
    it('is idle and does not divide by zero', () => {
      const idle = bot({});

      expect(component.botState(idle)).toBe('idle');
      expect(component.botProgress(idle)).toBe(0);
    });

    it('leaves the summary percentages at zero rather than NaN', () => {
      const summary = component.buildSummary([bot({})]);

      expect(summary.total).toBe(0);
      expect(summary.succeededPct).toBe(0);
      expect(summary.failedPct).toBe(0);
    });

    it('survives an experiment with no bots at all', () => {
      const summary = component.buildSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.succeededPct).toBe(0);
      expect(summary.warningAvailable).toBeFalse();
    });
  });
});
