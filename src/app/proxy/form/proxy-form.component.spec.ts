import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { ProxyFormComponent } from './proxy-form.component';
import { ProxyService } from '@app/entity/service';

/**
 * F6 (docs/specs/gui-finalisation.md): an http connection can carry credentials.
 * The API requires them for oxylabs/brightdata (`required_unless:type,http`) but allows
 * them for http, and an authenticated http proxy needs them -- the form hid the fields.
 */
describe('ProxyFormComponent (F6 — credentials)', () => {
  let fixture: ComponentFixture<ProxyFormComponent>;
  let component: ProxyFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProxyFormComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideMockStore({}),
        {
          provide: ProxyService,
          useValue: {
            getAll: () => {},
            setFilter: () => {},
            filteredEntities$: of([]),
            add: () => {},
            update: () => {}
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ProxyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const select = (type: string) => {
    component.type.setValue(type);
    component.onChangeProxyType();
    fixture.detectChanges();
  };

  it('offers username and password for an http connection, optional', () => {
    select('http');
    expect(fixture.nativeElement.querySelector('#username')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#password')).not.toBeNull();
    expect(component.username.hasError('required')).toBeFalse();
  });

  it('still requires them where the API does', () => {
    select('oxylabs');
    expect(component.username.hasError('required')).toBeTrue();
    expect(component.password.hasError('required')).toBeTrue();
  });
});
