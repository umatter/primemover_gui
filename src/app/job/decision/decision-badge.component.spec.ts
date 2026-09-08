import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { DecisionBadgeComponent } from './decision-badge.component';
import { Job } from '@app/job/model/Job';

/**
 * What the badge actually renders. `TranslateModule.forRoot()` with no translations
 * echoes the key back, so the assertions read as keys — which is also what makes a
 * missing key visible rather than silently blank.
 */
describe('DecisionBadgeComponent', () => {
  let fixture: ComponentFixture<DecisionBadgeComponent>;

  const job = (over: Partial<Job>): Job => ({ id: 1, type: 'lambdasingleselectjob', ...over }) as Job;

  const render = (value: Job): HTMLElement => {
    fixture.componentInstance.job = value;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionBadgeComponent, TranslateModule.forRoot()]
    }).compileComponents();
    fixture = TestBed.createComponent(DecisionBadgeComponent);
  });

  it('renders a red "Treatment lost" badge when the treatment was lost', () => {
    const el = render(job({ decision_treatment_lost: true, decision_degraded: true }));
    const badge = el.querySelector('[data-decision]') as HTMLElement;

    expect(badge.getAttribute('data-decision')).toBe('lost');
    expect(badge.textContent).toContain('decision.badge.treatmentLost');
    expect(badge.className).toContain('text-danger');
    expect(badge.className).not.toContain('text-warning');
  });

  it('renders an amber "Degraded" badge when degraded but not lost', () => {
    const el = render(job({ decision_degraded: true, decision_treatment_lost: false }));
    const badge = el.querySelector('[data-decision]') as HTMLElement;

    expect(badge.getAttribute('data-decision')).toBe('degraded');
    expect(badge.className).toContain('text-warning');
    expect(badge.className).not.toContain('text-danger');
  });

  it('renders a quiet grey "no verdict" mark on a lambda job with NULL columns', () => {
    const el = render(job({ decision_degraded: null, decision_treatment_lost: null }));
    const badge = el.querySelector('[data-decision]') as HTMLElement;

    expect(badge.getAttribute('data-decision')).toBe('unknown');
    expect(badge.textContent).toContain('decision.badge.noVerdict');
    expect(badge.className).toContain('text-muted');
    expect(badge.className).not.toContain('text-success');
  });

  it('renders NOTHING for a control crawler that correctly picked at random', () => {
    const el = render(
      job({
        decision_degraded: false,
        decision_treatment_lost: false,
        decision_selection_mode: 'random'
      })
    );
    expect(el.querySelector('[data-decision]')).toBeNull();
    expect(el.textContent?.trim()).toBe('');
  });

  it('renders nothing on a job type that never calls the decision function', () => {
    expect(render(job({ type: 'visitjob' })).querySelector('[data-decision]')).toBeNull();
  });

  it('names the failed filters, the LLM error type and the mode in the tooltip', () => {
    const el = render(
      job({
        decision_degraded: true,
        decision_treatment_lost: true,
        decision_selection_mode: 'random',
        decision_report: {
          filters: { mainstream_media: 'failed: IndexError: x', political: 'skipped' },
          llm: { available: false, error_type: 'APIConnectionError', error: 'reset' }
        }
      })
    );
    const tooltip = (el.querySelector('[data-decision]') as HTMLElement).getAttribute('title') ?? '';

    expect(tooltip).toContain('decision.tooltip.failedFilters');
    expect(tooltip).toContain('decision.tooltip.llmError');
    // The mode is present, and its key is the one that labels it as descriptive only.
    expect(tooltip).toContain('decision.tooltip.selectionMode');
  });

  it('announces the verdict and its explanation as one accessible name', () => {
    const el = render(job({ decision_treatment_lost: true }));
    const label = (el.querySelector('[data-decision]') as HTMLElement).getAttribute('aria-label') ?? '';

    expect(label).toContain('decision.badge.treatmentLost');
    expect(label).toContain('decision.badge.treatmentLostHint');
  });
});
