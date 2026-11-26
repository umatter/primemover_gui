import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';

import { JobBehavioursComponent } from './job-behaviours.component';
import { BehaviorService } from '@app/entity/service';
import { Behavior } from '@app/behavior/behavior';
import { Job } from '@app/job/model/Job';

/**
 * F4b (docs/specs/gui-finalisation.md): the behaviours modal knows the job type's settings.
 */
describe('JobBehavioursComponent (F4b — schema-aware)', () => {
  let fixture: ComponentFixture<JobBehavioursComponent>;
  let component: JobBehavioursComponent;
  let behaviours$: BehaviorSubject<Behavior[]>;
  let add: jasmine.Spy;

  const beh = (over: Partial<Behavior>): Behavior =>
    ({ id: 1, name: '', value: 'v', description: '', active: true, job_id: 3, ...over }) as Behavior;

  async function create(type: string, existing: Behavior[]): Promise<void> {
    behaviours$ = new BehaviorSubject<Behavior[]>(existing);
    add = jasmine.createSpy('add').and.callFake((b: any) => of({ id: 200, ...b }));
    await TestBed.configureTestingModule({
      imports: [JobBehavioursComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: BehaviorService,
          useValue: {
            entities$: behaviours$.asObservable(),
            loading$: of(false),
            getWithQuery: () => {},
            add,
            update: (b: any) => of(b),
            delete: () => of(1)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobBehavioursComponent);
    component = fixture.componentInstance;
    component.job = { id: 3, name: 'Type query', type: 'entertextfieldjob' } as Job;
    component.job.type = type;
    fixture.detectChanges();
  }

  it("offers the type's unset settings, required first", async () => {
    await create('entertextfieldjob', [beh({ name: 'text' })]);

    expect(component.suggestions.map((f) => f.name)).toEqual([
      'selector',
      'selectionType',
      'appendReturn',
      'typingMode',
      'captchaMode'
    ]);
    expect(component.missingRequired).toEqual(['selector']);
  });

  it('picking a setting prefills its default and offers its options', async () => {
    await create('entertextfieldjob', []);

    component.pickField(component.suggestions.find((f) => f.name === 'typingMode')!);
    fixture.detectChanges();

    expect(component.addForm.value.name).toBe('typingMode');
    expect(component.addForm.value.value).toBe('SIMULATED_FIXINGTYPOS');
    expect(component.selectedField?.options).toContain('INSTANT');
    expect(fixture.nativeElement.querySelector('select#beh-value-select')).not.toBeNull();
  });

  it('typing a known name finds its schema field too', async () => {
    await create('handlealertjob', []);

    component.addForm.patchValue({ name: 'action' });
    component.onNameInput();

    expect(component.selectedField?.options).toEqual(['accept', 'dismiss']);
  });

  it('tags an existing behaviour the schema does not list, and keeps it', async () => {
    await create('visitjob', [beh({ id: 1, name: 'url' }), beh({ id: 2, name: 'colour' })]);

    expect(component.notInSchema(beh({ name: 'colour' }))).toBeTrue();
    expect(component.notInSchema(beh({ name: 'url' }))).toBeFalse();
    expect(fixture.nativeElement.querySelector('[data-testid="beh-unknown-colour"]')).not.toBeNull();
  });

  it('says nothing about an unknown job type, and still allows free names', async () => {
    await create('teleportjob', [beh({ name: 'anything' })]);

    expect(component.suggestions).toEqual([]);
    expect(component.notInSchema(beh({ name: 'anything' }))).toBeFalse();

    component.addForm.setValue({ name: 'freeform', value: '1', description: '' });
    component.addBehaviour();
    expect(add).toHaveBeenCalled();
  });

  it('updates the suggestions as behaviours are added', async () => {
    await create('visitjob', []);
    expect(component.missingRequired).toEqual(['url']);

    behaviours$.next([beh({ name: 'url' })]);
    fixture.detectChanges();

    expect(component.missingRequired).toEqual([]);
    expect(component.suggestions.map((f) => f.name)).toEqual(['captchaMode']);
  });
});
