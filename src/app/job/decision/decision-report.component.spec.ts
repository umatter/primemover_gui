import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { DecisionReportComponent } from './decision-report.component';
import { DecisionApiService } from '@app/job/service/decision-api.service';
import { Job } from '@app/job/model/Job';

describe('DecisionReportComponent', () => {
  let fixture: ComponentFixture<DecisionReportComponent>;
  let fetchDecision: jasmine.Spy;

  const job = (over: Partial<Job>): Job => ({ id: 34226, type: 'lambdasingleselectjob', ...over }) as Job;

  const render = (value: Job): HTMLElement => {
    fixture.componentInstance.job = value;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    fetchDecision = jasmine.createSpy('fetchDecision').and.returnValue(of({ xpath: '//a' }));
    await TestBed.configureTestingModule({
      imports: [DecisionReportComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: DecisionApiService,
          useValue: {
            fetchDecision,
            decisionUrl: (id: number) => `http://localhost:8090/api/v1/jobs/${id}/decision`
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DecisionReportComponent);
  });

  it('renders a not-requested filter as "not requested", never as a failure', () => {
    const el = render(
      job({
        decision_degraded: false,
        decision_report: { filters: { already_watched: 'ok', political: 'skipped' } }
      })
    );
    const rows = Array.from(el.querySelectorAll('tbody tr')) as HTMLElement[];
    const political = rows.find((row) => row.textContent?.includes('political')) as HTMLElement;

    expect(political.textContent).toContain('decision.filter.notRequested');
    expect(political.textContent).not.toContain('decision.filter.failed');
    expect(political.innerHTML).withContext('grey, not red').toContain('text-faint');
    expect(political.innerHTML).not.toContain('text-danger');
  });

  it('renders a failed filter with its reason', () => {
    const el = render(
      job({
        decision_degraded: true,
        decision_report: { filters: { mainstream_media: 'failed: IndexError: list index out of range' } }
      })
    );
    const row = el.querySelector('tbody tr') as HTMLElement;

    expect(row.textContent).toContain('decision.filter.failed');
    expect(row.textContent).toContain('IndexError');
    expect(row.innerHTML).toContain('text-danger');
  });

  it('shows the llm block and the warnings list', () => {
    const el = render(
      job({
        decision_degraded: true,
        decision_report: {
          llm: { available: false, error_type: 'APIConnectionError', error: 'connection reset' },
          warnings: ['Aversion to mainstream media channels ignored']
        }
      })
    );

    expect(el.textContent).toContain('APIConnectionError');
    expect(el.textContent).toContain('decision.report.llmUnavailable');
    expect(el.textContent).toContain('Aversion to mainstream media channels ignored');
  });

  it('labels selection_mode as a description, not a verdict', () => {
    const el = render(job({ decision_degraded: false, decision_selection_mode: 'random' }));

    expect(el.textContent).toContain('decision.report.selectionModeHint');
    expect(el.textContent).withContext('a clean verdict says so').toContain('decision.report.clean');
    expect(el.textContent).not.toContain('decision.report.degraded');
  });

  it('says "no verdict recorded" for a lambda job with NULL columns — never "clean"', () => {
    const el = render(job({ decision_degraded: null, decision_treatment_lost: null }));

    expect(el.textContent).toContain('decision.report.noVerdictLambda');
    expect(el.textContent).not.toContain('decision.report.clean');
  });

  it('explains that a non-lambda job simply has no verdict to give', () => {
    const el = render(job({ type: 'visitjob' }));
    expect(el.textContent).toContain('decision.report.noVerdict');
  });

  it('leads with the treatment-lost line when the treatment was lost', () => {
    const el = render(job({ decision_treatment_lost: true, decision_degraded: true }));

    expect(el.textContent).toContain('decision.report.treatmentLost');
    expect(el.textContent).not.toContain('decision.report.clean');
  });

  it('offers the raw payload URL and fetches it rather than linking to it', () => {
    const el = render(job({ decision_degraded: false }));

    // A plain <a href> would send no bearer token and 401; the URL is shown for copying.
    expect(el.textContent).toContain('/api/v1/jobs/34226/decision');
    expect(el.querySelector('a[href*="decision"]')).toBeNull();

    (el.querySelector('button') as HTMLButtonElement).click();
    expect(fetchDecision).toHaveBeenCalledWith(34226);
  });

  it('reports a failed raw fetch as unreadable, not as an absent verdict', () => {
    fetchDecision.and.returnValue(throwError(() => new Error('404')));
    const el = render(job({ decision_degraded: false }));

    (el.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.rawErrorKey).toBe('decision.raw.error');
    expect(el.textContent).toContain('decision.raw.error');
  });
});
