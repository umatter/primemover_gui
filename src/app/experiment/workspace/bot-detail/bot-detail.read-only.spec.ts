import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, NEVER, Observable, of, throwError } from 'rxjs';

import { BotDetailComponent } from './bot-detail.component';
import { Crawler } from '@app/crawler/model/crawler';
import { CrawlerService, ExperimentService, QueueService } from '@app/entity/service';
import { Experiment, experimentEditState, LOCK_PREFERENCE } from '@app/experiment/model/experiment';
import { ProfileApiService } from '../profile/profile-api.service';
import { SetupChecklistComponent } from '../setup/setup-checklist.component';
import { TreatmentApiService } from '../treatment/treatment-api.service';
import { WatchedApiService } from '../watched/watched-api.service';

const lockRow = { name: LOCK_PREFERENCE, value: 'abc123' };

/**
 * #72: a study uploaded from a pmspec lock is its randomization record. Its bots are not
 * edited from the GUI: no Edit setup, no treatment or profile changes, no checklist fixes.
 */
describe('experimentEditState (#72)', () => {
  it('is free without a lock preference', () => {
    expect(experimentEditState({ id: 1, preferences: [{ name: 'pmspec.mode', value: 'real' }] } as Experiment)).toBe(
      'free'
    );
  });

  it('is locked with one, however many copies the runs uploads appended', () => {
    const preferences = Array.from({ length: 115 }, () => ({ ...lockRow }));
    expect(experimentEditState({ id: 1, preferences } as Experiment)).toBe('locked');
  });

  it('is unknown when the experiment or its preferences were not read', () => {
    expect(experimentEditState(undefined)).toBe('unknown');
    expect(experimentEditState(null)).toBe('unknown');
    expect(experimentEditState({ id: 1 } as Experiment)).toBe('unknown');
  });
});

describe('BotDetailComponent, read-only bots (#72)', () => {
  const render = (experiment$: Observable<unknown>): ComponentFixture<BotDetailComponent> => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [BotDetailComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        { provide: ProfileApiService, useValue: { load: () => NEVER, savePreferences: () => NEVER } },
        { provide: TreatmentApiService, useValue: { load: () => NEVER, save: () => NEVER, create: () => NEVER } },
        { provide: WatchedApiService, useValue: { watched: () => NEVER } },
        provideRouter([]),
        { provide: ExperimentService, useValue: { getByKey: () => experiment$ } },
        {
          provide: CrawlerService,
          useValue: { getByKey: () => of({ id: 1, name: 'Bot', configuration_id: 7 } as Crawler) }
        },
        {
          provide: QueueService,
          useValue: {
            entities$: of([]),
            loading$: of(false),
            getWithQuery: () => {},
            clearCache: () => {},
            cancel: () => {},
            errors$: EMPTY
          }
        },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => '1' }) } }
      ]
    });
    const f = TestBed.createComponent(BotDetailComponent);
    // As in bot-detail.component.spec.ts: keeps the route-wiring NG0100 (#73) out of these tests.
    f.componentInstance.experimentId = 1;
    f.componentInstance.botId = 1;
    f.detectChanges();
    return f;
  };

  const el = (f: ComponentFixture<BotDetailComponent>, testId: string): HTMLElement | null =>
    f.nativeElement.querySelector(`[data-testid="${testId}"]`);

  const fieldsetDisabled = (f: ComponentFixture<BotDetailComponent>, panel: string): boolean =>
    (el(f, `${panel}-fieldset`) as HTMLFieldSetElement).disabled;

  it('makes a lock-bound study read-only', () => {
    const f = render(of({ id: 1, preferences: [lockRow] }));

    expect(f.componentInstance.editState).toBe('locked');
    expect(el(f, 'bot-read-only')).not.toBeNull();
    expect(el(f, 'edit-setup')).toBeNull();
    expect(fieldsetDisabled(f, 'treatment')).toBeTrue();
    expect(fieldsetDisabled(f, 'profile')).toBeTrue();
  });

  it('leaves a study without a lock editable', () => {
    const f = render(of({ id: 1, preferences: [] }));

    expect(f.componentInstance.editState).toBe('free');
    expect(el(f, 'bot-read-only')).toBeNull();
    expect(el(f, 'edit-setup')).not.toBeNull();
    expect(fieldsetDisabled(f, 'treatment')).toBeFalse();
    expect(fieldsetDisabled(f, 'profile')).toBeFalse();
  });

  it('stays read-only while the experiment is loading', () => {
    const f = render(NEVER);

    expect(f.componentInstance.editState).toBe('unknown');
    expect(el(f, 'bot-read-only')).not.toBeNull();
    expect(el(f, 'edit-setup')).toBeNull();
  });

  it('stays read-only when the experiment cannot be read', () => {
    const f = render(throwError(() => new Error('500')));

    expect(f.componentInstance.editState).toBe('unknown');
    expect(el(f, 'edit-setup')).toBeNull();
    expect(fieldsetDisabled(f, 'treatment')).toBeTrue();
  });

  it('ignores the checklist edit fixes, but still offers a new run', () => {
    const f = render(of({ id: 1, preferences: [lockRow] }));
    const newRun = spyOn(f.componentInstance, 'newRun');

    f.componentInstance.onSetupFix('editSetup');
    f.componentInstance.onSetupFix('newRun');

    expect(f.componentInstance.showEditSetup).toBeFalse();
    expect(newRun).toHaveBeenCalled();
  });
});

describe('SetupChecklistComponent, read-only (#72)', () => {
  it('offers no edit fix, only a new run', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [SetupChecklistComponent, TranslateModule.forRoot()] });
    const checklist = TestBed.createComponent(SetupChecklistComponent).componentInstance;
    checklist.bot = { id: 1, name: 'Bot' } as Crawler;
    checklist.runCount = 0;

    expect(checklist.items.some((i) => i.fix === 'editSetup')).toBeTrue();

    checklist.readOnly = true;

    expect(checklist.items.filter((i) => i.fix !== null).map((i) => i.fix)).toEqual(['newRun']);
  });
});
