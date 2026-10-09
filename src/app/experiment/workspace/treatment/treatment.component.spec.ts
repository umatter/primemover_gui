import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { Configuration } from '@app/config/model/config';
import { Param } from '@app/config/model/param';
import { TreatmentComponent } from './treatment.component';
import { TreatmentApiService } from './treatment-api.service';

/**
 * F2 acceptance (docs/specs/gui-finalisation.md §F2): the bot's Treatment panel.
 */
describe('TreatmentComponent (F2 — bot treatment / params)', () => {
  let fixture: ComponentFixture<TreatmentComponent>;
  let component: TreatmentComponent;
  let load: jasmine.Spy;
  let save: jasmine.Spy;
  let create: jasmine.Spy;

  // As the API stores it: weights as strings, lists as JSON strings.
  const param = (over: Partial<Param> = {}): Param => ({
    id: 8,
    configuration_id: 5,
    pi: '0',
    psi: '0',
    kappa: '0',
    tau: '0',
    alpha: '1',
    beta: '0.1',
    search_terms: '[{"term":"climate","pi":-0.2}]',
    media_outlet_urls: '[]',
    ...over
  });

  const configuration = (over: Partial<Configuration> = {}): Configuration => ({
    id: 5,
    name: 'arm A',
    crawlers_count: 1,
    params: [param()],
    ...over
  });

  async function create_(conf: Configuration = configuration()): Promise<void> {
    load = jasmine.createSpy('load').and.returnValue(of(conf));
    await TestBed.configureTestingModule({
      imports: [TreatmentComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: TreatmentApiService, useValue: { load, save, create } }]
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configurationId', conf.id);
    fixture.detectChanges();
  }

  const text = () => fixture.nativeElement.textContent as string;
  const testid = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);

  beforeEach(() => {
    // The API answers a PUT with the stored row: lists back as JSON strings.
    save = jasmine.createSpy('save').and.callFake((id: number, draft: any) =>
      of(
        param({
          id,
          ...draft,
          search_terms: JSON.stringify(draft.search_terms),
          media_outlet_urls: JSON.stringify(draft.media_outlet_urls)
        })
      )
    );
    create = jasmine.createSpy('create').and.returnValue(of(param({ id: 12, search_terms: '[]' })));
  });

  it('shows the arm: control when pi = psi = kappa = tau = 0', async () => {
    await create_();
    expect(component.arm).toBe('control');
    expect(testid('treatment-arm').textContent).toContain('workspace.treatment.arm.control');
  });

  it('shows the arm: treatment as soon as one of the four is not 0', async () => {
    await create_(configuration({ params: [param({ pi: '-0.5' })] }));
    expect(component.arm).toBe('treatment');
  });

  it('the control preset zeroes the four arm weights and nothing else, and previews the arm', async () => {
    await create_(configuration({ params: [param({ pi: '0.6', tau: '1', kappa: '2' })] }));
    expect(component.arm).toBe('treatment');

    component.applyControlPreset();

    expect(component.draft!.pi).toBe(0);
    expect(component.draft!.tau).toBe(0);
    expect(component.draft!.kappa).toBe(0);
    expect(component.draft!.alpha).toBe(1);
    expect(component.draft!.beta).toBe(0.1);
    expect(component.draft!.search_terms.length).toBe(1);
    expect(component.arm).toBe('control');
    expect(component.dirty).toBeTrue();
  });

  it('sends nothing for an untouched form', async () => {
    await create_();
    expect(component.canSave).toBeFalse();
    component.save();
    expect(save).not.toHaveBeenCalled();
  });

  it('saves the full row in one PUT and re-renders from the response', async () => {
    await create_();

    component.setWeight('pi', -0.4);
    component.save();

    expect(save).toHaveBeenCalledOnceWith(8, {
      pi: -0.4,
      psi: 0,
      kappa: 0,
      tau: 0,
      alpha: 1,
      beta: 0.1,
      search_terms: [{ term: 'climate', pi: -0.2 }],
      media_outlet_urls: []
    });
    expect(component.arm).toBe('treatment');
    expect(component.dirty).toBeFalse();
  });

  it('blocks save while a weight is invalid', async () => {
    await create_();
    component.setWeight('pi', 1.5);
    expect(component.errors['pi']).toBe('workspace.treatment.error.position');
    expect(component.canSave).toBeFalse();
  });

  it('saves outlet domains in the form the runner matches', async () => {
    await create_();
    component.addOutlet();
    component.draft!.media_outlet_urls[0] = { domain: 'https://www.CNBC.com/news', url: null, pi: -0.02 };
    component.save();

    expect(save.calls.mostRecent().args[1].media_outlet_urls).toEqual([{ domain: 'cnbc.com', url: null, pi: -0.02 }]);
  });

  it('appends pasted CSV rows and reports the lines it could not read', async () => {
    await create_();

    component.termsCsv = 'term,pi\nimmigration,0.5\nbroken';
    component.importTerms();

    expect(component.draft!.search_terms.map((t) => t.term)).toEqual(['climate', 'immigration']);
    expect(component.termsBadLines).toEqual([3]);
    expect(component.termsCsv).toBe('');

    // ... and the note goes once the result is saved, rather than outliving its paste.
    component.save();
    expect(component.termsBadLines).toEqual([]);
  });

  it('removes a list row', async () => {
    await create_();
    component.removeTerm(0);
    expect(component.draft!.search_terms).toEqual([]);
    expect(component.dirty).toBeTrue();
  });

  it('warns when other bots share the configuration', async () => {
    await create_(configuration({ crawlers_count: 3 }));
    expect(testid('treatment-shared').textContent).toContain('workspace.treatment.shared');
  });

  it('says which row it edits when there is more than one', async () => {
    await create_(configuration({ params: [param(), param({ id: 9, pi: '0.9' })] }));
    expect(component.paramId).toBe(8);
    expect(testid('treatment-multiple')).not.toBeNull();
  });

  it('offers to set up a treatment when there is no params row, in the control arm', async () => {
    await create_(configuration({ params: [] }));
    expect(component.arm).toBe('none');

    component.setUp();

    expect(create).toHaveBeenCalledOnceWith(5);
    expect(component.arm).toBe('control');
    expect(component.paramId).toBe(12);
  });

  it('keeps the edits and shows the API message when the save is refused', async () => {
    save.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { message: 'invalid', errors: { pi: ['The pi field must be between -1 and 1.'] } }
          })
      )
    );
    await create_();

    component.setWeight('psi', 2);
    component.save();
    fixture.detectChanges();

    expect(component.error).toBe('The pi field must be between -1 and 1.');
    expect(component.draft!.psi).toBe(2);
    expect(text()).toContain('The pi field must be between -1 and 1.');
  });
});
