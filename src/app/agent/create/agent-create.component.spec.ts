import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';

import { AgentCreateComponent } from './agent-create.component';
import { AgentService } from '@app/entity/service';

/** F6 (docs/specs/gui-finalisation.md): a browser identity can be created from the GUI. */
describe('AgentCreateComponent (F6)', () => {
  let fixture: ComponentFixture<AgentCreateComponent>;
  let add: jasmine.Spy;
  let navigate: jasmine.Spy;

  async function create(add$: () => any = () => of({ id: 7 })): Promise<void> {
    add = jasmine.createSpy('add').and.callFake(add$);
    await TestBed.configureTestingModule({
      imports: [AgentCreateComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [provideRouter([]), provideMockStore({}), { provide: AgentService, useValue: { add } }]
    }).compileComponents();
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(AgentCreateComponent);
    fixture.detectChanges();
  }

  const form = () => fixture.debugElement.query((d) => d.name === 'app-agent-form').componentInstance.agentForm;

  it('offers identification as a choice of the values the API accepts', async () => {
    await create();
    const options = Array.from(fixture.nativeElement.querySelectorAll('select#identification option')).map(
      (o: any) => o.value
    );
    expect(options).toEqual(jasmine.arrayContaining(['chrome', 'firefox', 'multilogin', 'mlx']));
  });

  it('creates the identity with its Multilogin profile verbatim and returns to the list', async () => {
    await create();
    form().patchValue({
      name: 'E2E YouTube Agent',
      identification: 'mlx',
      location: 'US-IL-CHICAGO',
      multilogin_profile: '{\n  "browser_type": "mimic"\n}'
    });
    fixture.componentInstance.onSave(form().value);

    const sent = add.calls.mostRecent().args[0];
    expect(sent.id).toBeUndefined();
    expect(sent.multilogin_profile).toBe('{\n  "browser_type": "mimic"\n}');
    expect(sent.identification).toBe('mlx');
    expect(navigate).toHaveBeenCalledWith(['/agents']);
  });

  it('stays on the page with an error when the API refuses', async () => {
    await create(() => throwError(() => new Error('422')));
    form().patchValue({ name: 'x', identification: 'mlx' });
    fixture.componentInstance.onSave(form().value);
    fixture.detectChanges();

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="agent-create-error"]')).not.toBeNull();
  });
});
