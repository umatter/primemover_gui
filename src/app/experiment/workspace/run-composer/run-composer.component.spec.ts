import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RunComposerComponent } from './run-composer.component';
import { BehaviorService, JobService, QueueService } from '@app/entity/service';
import { Job } from '@app/job/model/Job';

/**
 * Slice C acceptance (docs/specs/runs-and-bots.md §5):
 *  - adding a Job POSTs with queue_id + next order, AND its type-specific fields become
 *    Behaviours (POSTed with the new job_id).
 *  - a required type field blocks the add.
 *  - reorder / toggle-active / remove persist via PUT / PUT / DELETE.
 */
describe('RunComposerComponent (Slice C — compose job sequence)', () => {
  let component: RunComposerComponent;
  let fixture: ComponentFixture<RunComposerComponent>;
  let jobAdd: jasmine.Spy, jobUpdate: jasmine.Spy, jobDelete: jasmine.Spy, behaviorAdd: jasmine.Spy;

  const job = (over: Partial<Job>): Job => ({ id: 0, queue_id: 9, order: 0, active: 1, ...over } as Job);

  beforeEach(async () => {
    jobAdd = jasmine.createSpy('add').and.callFake((j: any) => of({ id: 100, ...j }));
    jobUpdate = jasmine.createSpy('update').and.callFake((j: any) => of(j));
    jobDelete = jasmine.createSpy('delete').and.returnValue(of(1));
    behaviorAdd = jasmine.createSpy('add').and.callFake((b: any) => of({ id: 500, ...b }));

    await TestBed.configureTestingModule({
      imports: [RunComposerComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        {
          provide: JobService,
          useValue: { entities$: of([]), loading$: of(false), getWithQuery: () => {}, add: jobAdd, update: jobUpdate, delete: jobDelete }
        },
        { provide: BehaviorService, useValue: { add: behaviorAdd } },
        { provide: QueueService, useValue: { getByKey: () => of({ id: 9, name: 'Run' }) } },
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: (k: string) => (k === 'runId' ? '9' : '1') }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RunComposerComponent);
    component = fixture.componentInstance;
    component.runId = 9;
  });

  it('adds a job with the next order and creates its type fields as behaviours', () => {
    component.jobs = [job({ id: 1, order: 1 })];
    component.addForm.patchValue({ type: 'visitjob' });
    component.onTypeChange(); // builds the visitjob fields (url required, captchaMode default 'never')
    component.addForm.patchValue({ name: 'Open home' });
    component.fieldsForm.patchValue({ url: 'https://youtube.com' });
    component.addJob();

    expect(jobAdd).toHaveBeenCalledTimes(1);
    expect(jobAdd.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ queue_id: 9, type: 'visitjob', name: 'Open home', order: 2, previous_job_id: 1 })
    );
    // url + captchaMode(default) become behaviours on job 100
    const behaviourArgs = behaviorAdd.calls.allArgs().map(([b]) => [b.name, b.value, b.job_id]);
    expect(behaviourArgs).toContain(['url', 'https://youtube.com', 100]);
    expect(behaviourArgs).toContain(['captchaMode', 'never', 100]);
  });

  it('blocks the add when a required type field is empty', () => {
    component.addForm.patchValue({ type: 'visitjob', name: 'Open home' });
    component.onTypeChange();
    component.fieldsForm.patchValue({ url: '' }); // required url missing
    component.addJob();
    expect(jobAdd).not.toHaveBeenCalled();
  });

  it('does not add a job when name/type are missing', () => {
    component.addForm.patchValue({ name: '', type: null });
    component.addJob();
    expect(jobAdd).not.toHaveBeenCalled();
    expect(component.addForm.touched).toBeTrue();
  });

  it('moves a job up by swapping order with its predecessor (two PUTs)', () => {
    const a = job({ id: 1, order: 1 });
    const b = job({ id: 2, order: 2 });
    component.jobs = [a, b];
    component.moveUp(b);

    expect(jobUpdate).toHaveBeenCalledTimes(2);
    const orders = jobUpdate.calls.allArgs().map(([j]) => [j.id, j.order]).sort();
    expect(orders).toEqual([[1, 2], [2, 1]]);
  });

  it('reorders by position even when orders currently collide (legacy duplicate orders)', () => {
    // both jobs have order=1 — swapping raw values would be a no-op; position-based renumber fixes it
    const a = job({ id: 1, order: 1 });
    const b = job({ id: 2, order: 1 });
    component.jobs = [a, b];
    component.moveUp(b); // b should become position 1, a position 2

    const puts = jobUpdate.calls.allArgs().map(([j]) => [j.id, j.order]);
    // a (was 1) must be renumbered to 2 so the two are now distinct and b sits first
    expect(puts).toContain([1, 2]);
    expect(component.jobs.map((j) => j.id)).toEqual([1, 2]); // pre-reload local state unchanged; server reload reflects new order
  });

  it('toggles active via PUT with the flipped value', () => {
    component.toggleActive(job({ id: 5, active: 1 }));
    expect(jobUpdate).toHaveBeenCalledWith(jasmine.objectContaining({ id: 5, active: 0 }));
  });

  it('removes a job via DELETE', () => {
    component.removeJob(job({ id: 7 }));
    expect(jobDelete).toHaveBeenCalledWith(7);
  });
});
