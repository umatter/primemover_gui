import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { BotDetailComponent } from './bot-detail.component';
import { CrawlerService, QueueService } from '@app/entity/service';
import { Queue } from '@app/queue/model/queue';

/**
 * Slice B acceptance (docs/specs/runs-and-bots.md §5): a run's status is shown honestly —
 * scheduled / running / succeeded / failed.
 */
describe('BotDetailComponent (Slice B — run status)', () => {
  let component: BotDetailComponent;
  let fixture: ComponentFixture<BotDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: CrawlerService, useValue: { getByKey: () => of({ id: 1, name: 'Bot' }) } },
        {
          provide: QueueService,
          useValue: { entities$: of([]), loading$: of(false), getWithQuery: () => {} }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BotDetailComponent);
    component = fixture.componentInstance;
  });

  const run = (over: Partial<Queue>): Queue => ({ id: 1, crawler_id: 1, ...over } as Queue);

  it('maps a run with no start and no status to "scheduled"', () => {
    expect(component.runState(run({ status_code: '', started_at: '' }))).toBe('scheduled');
  });

  it('maps a started run to "running"', () => {
    expect(component.runState(run({ status_code: '', started_at: '2026-08-01T09:00:00Z' }))).toBe('running');
  });

  it('maps status_code success/failure to succeeded/failed', () => {
    expect(component.runState(run({ status_code: 'success' }))).toBe('succeeded');
    expect(component.runState(run({ status_code: 'failure' }))).toBe('failed');
  });
});
