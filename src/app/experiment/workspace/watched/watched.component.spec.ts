import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { WatchedComponent } from './watched.component';
import { WatchedApiService } from './watched-api.service';

/** F3 (docs/specs/gui-finalisation.md): the bot's watch history. */
describe('WatchedComponent (F3 — watch history)', () => {
  let fixture: ComponentFixture<WatchedComponent>;
  let component: WatchedComponent;
  let watched: jasmine.Spy;

  async function create(answer: () => any): Promise<void> {
    watched = jasmine.createSpy('watched').and.callFake(answer);
    await TestBed.configureTestingModule({
      imports: [WatchedComponent, TranslateModule.forRoot()],
      providers: [{ provide: WatchedApiService, useValue: { watched } }]
    }).compileComponents();
    fixture = TestBed.createComponent(WatchedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('botId', 18);
    fixture.detectChanges();
  }

  const text = () => fixture.nativeElement.textContent as string;

  it('loads nothing until it is opened, and only once', async () => {
    await create(() => of(['b', 'a']));
    expect(watched).not.toHaveBeenCalled();

    component.onToggle(true);
    component.onToggle(false);
    component.onToggle(true);

    expect(watched).toHaveBeenCalledOnceWith(18);
  });

  it('lists the ids newest first, with the count', async () => {
    await create(() => of(['newest', 'older']));
    component.onToggle(true);
    fixture.detectChanges();

    expect(component.state).toBe('loaded');
    expect(component.ids).toEqual(['newest', 'older']);
    expect(text()).toContain('newest');
  });

  it('says nothing has been watched only when the API says so', async () => {
    await create(() => of([]));
    component.onToggle(true);
    fixture.detectChanges();

    expect(component.state).toBe('empty');
    expect(text()).toContain('workspace.watched.empty');
  });

  for (const status of [409, 404]) {
    it(`treats a ${status} as "not available here", never as "nothing watched"`, async () => {
      await create(() => throwError(() => new HttpErrorResponse({ status })));
      component.onToggle(true);
      fixture.detectChanges();

      expect(component.state).toBe('unavailable');
      expect(text()).toContain('workspace.watched.unavailable');
      expect(text()).not.toContain('workspace.watched.empty');
    });
  }

  it('reports any other failure as an error', async () => {
    await create(() => throwError(() => new HttpErrorResponse({ status: 500 })));
    component.onToggle(true);
    expect(component.state).toBe('error');
  });
});
