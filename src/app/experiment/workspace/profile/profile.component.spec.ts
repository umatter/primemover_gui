import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { Configuration } from '@app/config/model/config';
import { ProfileComponent } from './profile.component';
import { ProfileApiService } from './profile-api.service';

/**
 * F1 acceptance (docs/specs/gui-finalisation.md §F1): the bot's Profile panel.
 */
describe('ProfileComponent (F1 — bot profile / preferences)', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let load: jasmine.Spy;
  let save: jasmine.Spy;

  const configuration = (): Configuration => ({
    id: 5,
    name: 'arm A',
    description: 'left-leaning',
    active: 1,
    preferences: [
      { id: 1, name: 'location', value: 'US-IL-CHICAGO', description: 'location', active: 1 },
      { id: 2, name: 'cookie_pref', value: '{"accept_all": true}', description: 'cookie_pref', active: 1 },
      { id: 3, name: 'preference_fringe_videos', value: '0', description: '...', active: 1 }
    ]
  });

  async function create(configurationId: number | null = 5): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [{ provide: ProfileApiService, useValue: { load, savePreferences: save } }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('configurationId', configurationId);
    fixture.detectChanges();
  }

  const row = (name: string) => component.rows.find((r) => r.name === name)!;

  beforeEach(() => {
    load = jasmine.createSpy('load').and.callFake(() => of(configuration()));
    save = jasmine.createSpy('savePreferences').and.callFake((_c: unknown, changed: any[]) =>
      of({
        ...configuration(),
        preferences: configuration().preferences!.map((p) => {
          const c = changed.find((x) => x.name === p.name);
          return c ? { ...p, value: c.value, active: c.active ? 1 : 0 } : p;
        })
      })
    );
  });

  it('shows every preference of the bot configuration', async () => {
    await create();

    expect(load).toHaveBeenCalledWith(5);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('location');
    expect(text).toContain('preference_fringe_videos');
    expect(component.rows.length).toBe(3);
  });

  it('splits the YouTube decision weights into their own group', async () => {
    await create();

    expect(component.generalRows.map((r) => r.name)).toEqual(['location', 'cookie_pref']);
    expect(component.decisionRows.map((r) => r.name)).toEqual(['preference_fringe_videos']);
  });

  it('sends nothing for an untouched form', async () => {
    await create();

    expect(component.canSave).toBeFalse();
    component.save();
    expect(save).not.toHaveBeenCalled();
  });

  it('saves only the changed rows, then re-renders from the response', async () => {
    await create();

    component.setValue(row('location'), 'CH-BE-BERN');
    expect(component.canSave).toBeTrue();
    component.save();

    expect(save).toHaveBeenCalledOnceWith(jasmine.objectContaining({ id: 5, name: 'arm A' }), [
      { name: 'location', value: 'CH-BE-BERN', description: 'location', active: true }
    ]);
    expect(row('location').value).toBe('CH-BE-BERN');
    expect(component.canSave).toBeFalse();
  });

  it('removes by deactivating — the API never deletes', async () => {
    await create();

    component.toggleActive(row('preference_fringe_videos'));
    component.save();

    expect(save.calls.mostRecent().args[1]).toEqual([
      { name: 'preference_fringe_videos', value: '0', description: '...', active: false }
    ]);
    expect(row('preference_fringe_videos').active).toBeFalse();
  });

  it('writes the runner form of cookie_pref from the mode select', async () => {
    await create();

    expect(row('cookie_pref').cookieMode).toBe('accept');
    component.setCookieMode(row('cookie_pref'), 'reject');

    expect(row('cookie_pref').value).toBe('{"accept_all": false}');
  });

  it('blocks save while a row is invalid', async () => {
    await create();

    component.setCookieMode(row('cookie_pref'), 'custom');
    component.setValue(row('cookie_pref'), '{"nope": 1}');
    expect(component.rowError(row('cookie_pref'))).toBe('workspace.profile.error.cookieKey');
    expect(component.canSave).toBeFalse();

    component.setValue(row('preference_fringe_videos'), 'lots');
    component.save();
    expect(save).not.toHaveBeenCalled();
  });

  it('adds a new preference, and refuses a name that is already set', async () => {
    await create();

    component.addForm.setValue({ name: 'location', value: 'X' });
    component.addPreference();
    expect(component.addError).toBe('workspace.profile.error.duplicate');
    expect(component.rows.length).toBe(3);

    component.addForm.setValue({ name: 'ideology', value: '0.3' });
    component.addPreference();
    expect(component.addError).toBeNull();
    expect(component.rows.length).toBe(4);

    component.save();
    expect(save.calls.mostRecent().args[1]).toEqual([
      { name: 'ideology', value: '0.3', description: 'ideology', active: true }
    ]);
  });

  it('offers only the designer defaults that are missing', async () => {
    await create();

    expect(component.missingDefaults.map((p) => p.name)).toEqual(['usage_type']);
    component.addDefaults();

    expect(row('usage_type').value).toBe('only_search');
    expect(component.missingDefaults).toEqual([]);
    expect(component.canSave).toBeTrue();
  });

  it('keeps the edits and shows the API message when the save fails', async () => {
    save.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { message: 'This action is unauthorized.' } }))
    );
    await create();

    component.setValue(row('location'), 'CH-BE-BERN');
    component.save();
    fixture.detectChanges();

    expect(component.error).toBe('This action is unauthorized.');
    expect(row('location').value).toBe('CH-BE-BERN');
    expect(component.canSave).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('This action is unauthorized.');
  });

  it('says so when the bot has no configuration, and loads nothing', async () => {
    await create(null);

    expect(load).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-testid="profile-none"]')).not.toBeNull();
  });
});
