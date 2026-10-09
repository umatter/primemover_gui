import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ConfigCreateComponent } from './config-create.component';
import { ConfigurationService } from '@app/entity/service';

/** F6 (docs/specs/gui-finalisation.md): a profile can be created from the GUI. */
describe('ConfigCreateComponent (F6)', () => {
  let fixture: ComponentFixture<ConfigCreateComponent>;
  let component: ConfigCreateComponent;
  let add: jasmine.Spy;

  async function create(add$: () => any = () => of({ id: 40, name: 'YouTube profile' })): Promise<void> {
    add = jasmine.createSpy('add').and.callFake(add$);
    await TestBed.configureTestingModule({
      imports: [ConfigCreateComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), { provide: ConfigurationService, useValue: { add } }]
    }).compileComponents();
    fixture = TestBed.createComponent(ConfigCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('asks for a name and nothing a profile does not have', async () => {
    await create();
    expect(Object.keys(component.form.controls)).toEqual(['name', 'description']);
    component.save();
    expect(add).not.toHaveBeenCalled();
  });

  it('creates the profile and says where it is edited', async () => {
    await create();
    component.form.setValue({ name: 'YouTube profile', description: 'e2e' });
    component.save();
    fixture.detectChanges();

    expect(add).toHaveBeenCalledOnceWith({ name: 'YouTube profile', description: 'e2e', active: 1 } as any);
    expect(component.created?.id).toBe(40);
    expect(fixture.nativeElement.querySelector('[data-testid="config-created"]')).not.toBeNull();
  });

  it('shows an error and keeps the form when the API refuses', async () => {
    await create(() => throwError(() => new Error('422')));
    component.form.setValue({ name: 'x', description: '' });
    component.save();
    fixture.detectChanges();

    expect(component.created).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="config-create-error"]')).not.toBeNull();
  });
});
