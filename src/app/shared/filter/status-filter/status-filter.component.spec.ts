import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { StatusFilterComponent } from './status-filter.component';
import { StatusFilterKey } from '@shared/model/status-filter';

/**
 * The chips as a control: what is announced, what is emitted, and whether it can be driven
 * without a mouse. A filter nobody can reach from the keyboard is a filter half the point
 * of this screen is missing.
 */
describe('StatusFilterComponent', () => {
  let fixture: ComponentFixture<StatusFilterComponent>;
  let element: HTMLElement;

  const chips = (): HTMLButtonElement[] =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('[data-status-filter]'));

  const chip = (key: StatusFilterKey): HTMLButtonElement =>
    element.querySelector<HTMLButtonElement>(`[data-status-filter="${key}"]`)!;

  const press = (key: string, from: StatusFilterKey): void => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    chip(from).dispatchEvent(event);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusFilterComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusFilterComponent);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('renders the seven chips in order', () => {
    expect(chips().map((button) => button.getAttribute('data-status-filter'))).toEqual([
      'all',
      'bad',
      'warning',
      'failure',
      'skipped',
      'running',
      'success'
    ]);
  });

  it('is a radio group: exactly one chip is checked', () => {
    expect(element.querySelector('[role="radiogroup"]')).not.toBeNull();
    expect(chips().every((button) => button.getAttribute('role') === 'radio')).toBeTrue();
    expect(chips().filter((button) => button.getAttribute('aria-checked') === 'true').length).toBe(1);
    expect(chip('all').getAttribute('aria-checked')).toBe('true');
  });

  it('emits the chosen key on click', () => {
    const seen: StatusFilterKey[] = [];
    fixture.componentInstance.selectedChange.subscribe((key: StatusFilterKey) => seen.push(key));

    chip('bad').click();
    fixture.detectChanges();

    expect(seen).toEqual(['bad']);
    expect(chip('bad').getAttribute('aria-checked')).toBe('true');
    expect(chip('all').getAttribute('aria-checked')).toBe('false');
  });

  it('does not re-emit when the active chip is clicked again', () => {
    const seen: StatusFilterKey[] = [];
    fixture.componentInstance.selectedChange.subscribe((key: StatusFilterKey) => seen.push(key));

    chip('all').click();
    fixture.detectChanges();

    expect(seen).toEqual([]);
  });

  it('makes the active chip obvious, and not by colour alone', () => {
    fixture.componentInstance.selected = 'bad';
    fixture.detectChanges();

    // aria-checked carries it for assistive tech; the fill and weight carry it visually.
    expect(chip('bad').getAttribute('aria-checked')).toBe('true');
    expect(chip('bad').className).toContain('font-semibold');
    expect(chip('bad').className).toContain('bg-warning');
    expect(chip('failure').className).not.toContain('font-semibold');
  });

  describe('keyboard', () => {
    it('gives the group a single tab stop, on the active chip', () => {
      fixture.componentInstance.selected = 'failure';
      fixture.detectChanges();

      expect(chips().filter((button) => button.getAttribute('tabindex') === '0').length).toBe(1);
      expect(chip('failure').getAttribute('tabindex')).toBe('0');
      expect(chip('all').getAttribute('tabindex')).toBe('-1');
    });

    it('keeps a tab stop even if `selected` names nothing in the list', () => {
      fixture.componentInstance.selected = 'nonsense' as StatusFilterKey;
      fixture.detectChanges();

      expect(chip('all').getAttribute('tabindex')).toBe('0');
    });

    it('moves focus with the arrow keys, wrapping at both ends', () => {
      chip('all').focus();

      press('ArrowRight', 'all');
      expect(document.activeElement).toBe(chip('bad'));

      press('ArrowLeft', 'bad');
      expect(document.activeElement).toBe(chip('all'));

      // wraps backwards from the first chip to the last
      press('ArrowLeft', 'all');
      expect(document.activeElement).toBe(chip('success'));

      // and forwards from the last back to the first
      press('ArrowRight', 'success');
      expect(document.activeElement).toBe(chip('all'));
    });

    it('jumps to the ends with Home and End', () => {
      chip('all').focus();

      press('End', 'all');
      expect(document.activeElement).toBe(chip('success'));

      press('Home', 'success');
      expect(document.activeElement).toBe(chip('all'));
    });

    /**
     * The bug this split exists for. Selection used to follow focus, so the only way to
     * reach the last chip was to select the five in between — six `selectedChange`
     * emissions, six `clearCache()` + `getWithQuery()` pairs, and six responses that
     * ngrx/data MERGES into one shared collection. The chip then read "Success" over a
     * table holding failures, warnings and skipped runs: the union of everything the
     * keyboard passed through. Arrow keys move; Space and Enter choose.
     */
    it('arrowing across the group selects nothing — the traversal fires no query', () => {
      const seen: StatusFilterKey[] = [];
      fixture.componentInstance.selectedChange.subscribe((key: StatusFilterKey) => seen.push(key));
      chip('all').focus();

      press('ArrowRight', 'all');
      press('ArrowRight', 'bad');
      press('ArrowRight', 'warning');
      press('ArrowRight', 'failure');
      press('ArrowRight', 'skipped');
      press('ArrowRight', 'running');

      expect(seen).withContext('five intermediate filters must not be queried on the way').toEqual([]);
      expect(fixture.componentInstance.selected).toBe('all');
      expect(document.activeElement).toBe(chip('success'));
    });

    it('commits the focused chip on Enter, and on Space, exactly once', () => {
      const seen: StatusFilterKey[] = [];
      fixture.componentInstance.selectedChange.subscribe((key: StatusFilterKey) => seen.push(key));
      chip('all').focus();

      press('ArrowRight', 'all');
      press('Enter', 'bad');
      expect(seen).toEqual(['bad']);
      expect(chip('bad').getAttribute('aria-checked')).toBe('true');

      press('ArrowRight', 'bad');
      press(' ', 'warning');
      expect(seen).toEqual(['bad', 'warning']);
    });

    it('keeps the single tab stop on the chip the keyboard is on, not the one still selected', () => {
      chip('all').focus();
      press('ArrowRight', 'all');
      press('ArrowRight', 'bad');

      // Tabbing away and back has to return to where the reader left the group.
      expect(chips().filter((button) => button.getAttribute('tabindex') === '0').length).toBe(1);
      expect(chip('warning').getAttribute('tabindex')).toBe('0');
      expect(chip('all').getAttribute('tabindex')).toBe('-1');
    });

    it('puts the tab stop back on the selection once a choice is committed', () => {
      chip('all').focus();
      press('ArrowRight', 'all');
      press('Enter', 'bad');

      expect(chip('bad').getAttribute('tabindex')).toBe('0');
    });

    it('ignores keys that are not navigation', () => {
      press('a', 'all');
      expect(fixture.componentInstance.selected).toBe('all');
      expect(document.activeElement).not.toBe(chip('bad'));
    });
  });

  it('describes each chip in its tooltip', () => {
    expect(chip('bad').getAttribute('title')).toBe('statusFilter.badHint');
    expect(chip('failure').getAttribute('title')).toBe('statusFilter.failureHint');
  });
});
