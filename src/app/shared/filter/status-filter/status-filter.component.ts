import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { NgClass, NgForOf } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { StatusFilterKey, STATUS_FILTER_OPTIONS, StatusFilterOption } from '@shared/model/status-filter';

/**
 * The status filter chips: All | Needs attention | Warning | Failure | Skipped | Running |
 * Success.
 *
 * The component owns the *presentation* of the choice only. It deliberately does not know
 * what query parameters a choice sends — that is {@link statusFilterParams}, one function,
 * one place, so the "Needs attention" chip cannot drift into a client-assembled alias list
 * on one screen while staying `filter[bad]=1` on another.
 *
 * **Keyboard.** This is a radio group, not seven independent toggles: exactly one is
 * active and the choices are mutually exclusive, so it implements the ARIA radiogroup
 * pattern — roving tabindex (one Tab stop for the whole group), arrow keys to move between
 * chips, Home/End to jump to the ends, and Space/Enter from the native `<button>`. Moving
 * with an arrow key also selects, which is the pattern's behaviour and the right one here:
 * every chip is a cheap, reversible view change.
 */
@Component({
  selector: 'app-status-filter',
  templateUrl: './status-filter.component.html',
  standalone: true,
  imports: [NgForOf, NgClass, TranslateModule]
})
export class StatusFilterComponent {
  /** The active chip. */
  @Input() selected: StatusFilterKey = 'all';

  /** Optional label for the group, overriding the default "Status". i18n key. */
  @Input() labelKey = 'statusFilter.legend';

  @Output() selectedChange = new EventEmitter<StatusFilterKey>();

  readonly options = STATUS_FILTER_OPTIONS;

  @ViewChildren('chip') private chips!: QueryList<ElementRef<HTMLButtonElement>>;

  /**
   * Which chip carries the group's single Tab stop.
   *
   * Falls back to the first chip when `selected` names nothing in the list, so an
   * unexpected value cannot leave the whole group unreachable from the keyboard.
   */
  isTabStop(option: StatusFilterOption, index: number): boolean {
    const active = this.options.some((candidate) => candidate.key === this.selected);
    return active ? option.key === this.selected : index === 0;
  }

  select(key: StatusFilterKey): void {
    if (key === this.selected) return;
    this.selected = key;
    this.selectedChange.emit(key);
  }

  /** Arrow/Home/End navigation over the group, wrapping at both ends. */
  onKeydown(event: KeyboardEvent, index: number): void {
    const last = this.options.length - 1;
    let target: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = index === last ? 0 : index + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = index === 0 ? last : index - 1;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = last;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.focusChip(target);
    this.select(this.options[target].key);
  }

  private focusChip(index: number): void {
    this.chips?.toArray()[index]?.nativeElement?.focus();
  }

  /**
   * Classes for the active chip, tinted by what it selects.
   *
   * The severity colours are the same ones the status pill uses, so "Needs attention"
   * being amber and "Failure" red is one vocabulary rather than a second one invented for
   * the filter bar.
   */
  activeClass(key: StatusFilterKey): string {
    switch (key) {
      case 'bad':
      case 'warning':
        return 'border-warning bg-warning text-white';
      case 'failure':
        return 'border-danger bg-danger text-white';
      case 'success':
        return 'border-success bg-success text-white';
      case 'running':
        return 'border-info bg-info text-white';
      default:
        return 'border-brand bg-brand text-on-brand';
    }
  }
}
