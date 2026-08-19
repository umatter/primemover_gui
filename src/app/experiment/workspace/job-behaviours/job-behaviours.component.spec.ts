import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { JobBehavioursComponent } from './job-behaviours.component';
import { BehaviorService } from '@app/entity/service';
import { Behavior } from '@app/behavior/behavior';
import { Job } from '@app/job/model/Job';

/**
 * Slice D acceptance (docs/specs/runs-and-bots.md §5):
 *  - adding a behaviour POSTs with job_id = J.id and is listed under the job.
 *  - required name/value block the add.
 *  - toggling active persists active=false via PUT.
 *  - removing a behaviour DELETEs it.
 */
describe('JobBehavioursComponent (Slice D — per-job behaviours)', () => {
  let component: JobBehavioursComponent;
  let fixture: ComponentFixture<JobBehavioursComponent>;
  let add: jasmine.Spy, update: jasmine.Spy, del: jasmine.Spy;

  const beh = (over: Partial<Behavior>): Behavior => ({ id: 0, name: '', value: '', active: true, job_id: 3, ...over } as Behavior);

  beforeEach(async () => {
    add = jasmine.createSpy('add').and.callFake((b: any) => of({ id: 200, ...b }));
    update = jasmine.createSpy('update').and.callFake((b: any) => of(b));
    del = jasmine.createSpy('delete').and.returnValue(of(1));

    await TestBed.configureTestingModule({
      imports: [JobBehavioursComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        {
          provide: BehaviorService,
          useValue: { entities$: of([]), loading$: of(false), getWithQuery: () => {}, add, update, delete: del }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobBehavioursComponent);
    component = fixture.componentInstance;
    component.job = { id: 3, name: 'Visit', type: 'visitjob' } as Job;
    fixture.detectChanges();
  });

  it('adds a behaviour scoped to the job', () => {
    component.addForm.setValue({ name: 'url', value: 'https://youtube.com', description: '' });
    component.addBehaviour();

    expect(add).toHaveBeenCalledTimes(1);
    expect(add.calls.mostRecent().args[0]).toEqual(
      jasmine.objectContaining({ job_id: 3, name: 'url', value: 'https://youtube.com', active: true })
    );
  });

  it('does not add when name/value are missing', () => {
    component.addForm.patchValue({ name: 'url', value: '' });
    component.addBehaviour();
    expect(add).not.toHaveBeenCalled();
    expect(component.addForm.touched).toBeTrue();
  });

  it('toggles active via PUT with the flipped value', () => {
    component.toggleActive(beh({ id: 9, active: true }));
    expect(update).toHaveBeenCalledWith(jasmine.objectContaining({ id: 9, active: false }));
  });

  it('removes a behaviour via DELETE', () => {
    component.removeBehaviour(beh({ id: 4 }));
    expect(del).toHaveBeenCalledWith(4);
  });
});
