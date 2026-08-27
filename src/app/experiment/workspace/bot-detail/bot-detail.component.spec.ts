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

  it('maps the runner\'s "skpped" typo to skipped, not to scheduled', () => {
    expect(component.runState(run({ status_code: 'skpped' }))).toBe('skipped');
  });

  /**
   * The runner's status_code reports the JOBLIST's outcome: it says 'success' as soon as
   * the list was worked through, whatever became of the individual jobs. Queue 845 in the
   * live database is exactly that — status_code 'success', status_message 'done', and 22
   * of its 113 jobs failed. A green "Succeeded" pill there misrepresents the data.
   */
  describe('a run the runner called "success"', () => {
    it('escalates to failed when jobs failed (live queue 845: 22 of 113)', () => {
      const q845 = run({
        status_code: 'success',
        status_message: 'done',
        jobs_count: 113,
        jobs_succeeded_count: 69,
        jobs_warning_count: 0,
        jobs_failed_count: 22,
        jobs_skipped_count: 22
      });

      expect(component.runState(q845)).toBe('failed');
      expect(component.failedJobs(q845)).toBe(22);
      expect(component.succeededJobs(q845)).toBe(69);
      expect(component.totalJobs(q845)).toBe(113);
      expect(component.hasJobCounts(q845)).toBeTrue();
    });

    it('escalates to warning when jobs merely degraded', () => {
      expect(component.runState(run({ status_code: 'success', jobs_count: 10, jobs_warning_count: 3 }))).toBe(
        'warning'
      );
    });

    it('ranks a failure above a degradation', () => {
      expect(
        component.runState(run({ status_code: 'success', jobs_count: 10, jobs_warning_count: 3, jobs_failed_count: 1 }))
      ).toBe('failed');
    });

    it('stays succeeded when every job succeeded', () => {
      expect(
        component.runState(run({ status_code: 'success', jobs_count: 20, jobs_succeeded_count: 20 }))
      ).toBe('succeeded');
    });

    // An API older than the rollup sends no jobs_* fields at all. "Unknown" must not be
    // read as "22 failures", nor the counts line rendered as a confident 0/0.
    it('trusts the runner when the API sends no rollup', () => {
      const legacy = run({ status_code: 'success' });

      expect(component.runState(legacy)).toBe('succeeded');
      expect(component.hasJobCounts(legacy)).toBeFalse();
    });
  });
});
